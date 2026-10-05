-- READ ONLY. Run only after 0013 succeeded. All booleans must be true.
-- Exact candidate-definition comparisons fail closed on drift; no row data is returned.
with relation as (
  select * from pg_class where oid = to_regclass('public.observation_comments')
), attributes as (
  select a.*, regexp_replace(replace(lower(coalesce(pg_get_expr(d.adbin, d.adrelid), '')), 'public.', ''),
    '[[:space:]()]', '', 'g') as default_rule
  from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = to_regclass('public.observation_comments') and a.attnum > 0 and not a.attisdropped
), policies as (
  select policyname, cmd, permissive, roles,
    replace(regexp_replace(replace(lower(coalesce(qual, '')), 'public.', ''),
      '[[:space:]()]|::text', '', 'g'), 'asuid', '') as using_rule,
    replace(regexp_replace(replace(lower(coalesce(with_check, '')), 'public.', ''),
      '[[:space:]()]|::text', '', 'g'), 'asuid', '') as check_rule
  from pg_policies where schemaname = 'public' and tablename = 'observation_comments'
), constraints as (
  select c.*, regexp_replace(lower(coalesce(pg_get_expr(c.conbin, c.conrelid), '')),
    '[[:space:]()]|::text', '', 'g') as rule
  from pg_constraint c where c.conrelid = to_regclass('public.observation_comments')
), indexes as (
  select i.*, ic.relname, am.amname,
    array(select a.attname::text from unnest(i.indkey) with ordinality k(attnum, position)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum order by k.position) as columns
  from pg_index i join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam
  where i.indrelid = to_regclass('public.observation_comments')
), table_acl as (
  select acl.* from relation r, lateral aclexplode(coalesce(r.relacl, acldefault('r', r.relowner))) acl
)
select
  exists (select 1 from relation where relkind = 'r' and relrowsecurity) as comments_table_rls,
  (select count(*) = 7 from attributes) and not exists (
    select 1 from (values ('id','uuid',true), ('observation_id','uuid',true),
      ('author_id','uuid',false), ('author_display_name','text',false),
      ('kind','text',true), ('body','text',true), ('created_at','timestamp with time zone',true)) expected(name,type_name,required)
    where not exists (select 1 from attributes a where a.attname = expected.name
      and format_type(a.atttypid,a.atttypmod) = expected.type_name and a.attnotnull = expected.required)
  ) as expected_columns_and_nullability,
  exists (select 1 from attributes where attname = 'id' and default_rule = 'gen_random_uuid')
    and exists (select 1 from constraints where contype = 'p' and convalidated
      and conkey = array[(select attnum from attributes where attname = 'id')]) as generated_primary_id,
  exists (select 1 from attributes where attname = 'author_id' and default_rule = 'auth.uid') as server_author_default,
  exists (select 1 from attributes where attname = 'created_at' and default_rule = 'now') as server_timestamp_default,
  exists (select 1 from constraints where contype = 'f' and convalidated and confdeltype = 'c'
    and confrelid = to_regclass('public.observations')
    and conkey = array[(select attnum from attributes where attname = 'observation_id')]
    and confkey = array[(select attnum from pg_attribute where attrelid = to_regclass('public.observations') and attname = 'id')]) as observation_fk_cascade,
  exists (select 1 from constraints where contype = 'f' and convalidated and confdeltype = 'n'
    and confrelid = to_regclass('public.profiles')
    and conkey = array[(select attnum from attributes where attname = 'author_id')]
    and confkey = array[(select attnum from pg_attribute where attrelid = to_regclass('public.profiles') and attname = 'id')]) as author_fk_set_null,
  exists (select 1 from constraints where contype = 'c' and convalidated
    and rule = 'kind=anyarray[''comment'',''identification'']') as kind_check_exact,
  exists (select 1 from constraints where contype = 'c' and convalidated
    and rule = 'char_lengthbody>=1andchar_lengthbody<=1000andbody~''[^[:space:]]''') as body_check_exact,
  exists (select 1 from indexes where relname = 'observation_comments_observation_created_id_idx'
    and indisvalid and indisready and amname = 'btree' and indpred is null
    and columns = array['observation_id','created_at','id']
    and (indoption[0] & 1) = 0 and (indoption[1] & 1) = 1 and (indoption[2] & 1) = 1) as deterministic_page_index,
  exists (select 1 from indexes where relname = 'observation_comments_author_idx'
    and indisvalid and indisready and indpred is null and columns = array['author_id']) as author_index,
  exists (select 1 from policies where policyname = 'Public can read comments on approved observations'
    and cmd = 'SELECT' and permissive = 'PERMISSIVE'
    and roles @> array['anon','authenticated']::name[] and cardinality(roles) = 2
    and using_rule = 'existsselect1fromobservationsowhereo.id=observation_comments.observation_idando.status=''approved'''
    and check_rule = '') as public_read_approved_parent_exact,
  exists (select 1 from policies where policyname = 'Admins can read all observation comments'
    and cmd = 'SELECT' and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'is_admin' and check_rule = '') as admin_read_exact,
  exists (select 1 from policies where policyname = 'Users can create own comments on approved observations'
    and cmd = 'INSERT' and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = '' and check_rule = 'author_id=selectauth.uidandexistsselect1fromobservationsowhereo.id=observation_comments.observation_idando.status=''approved''') as self_insert_approved_parent_exact,
  exists (select 1 from policies where policyname = 'Authors and admins can delete observation comments'
    and cmd = 'DELETE' and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'author_id=selectauth.uidoris_admin' and check_rule = '') as self_or_admin_delete_exact,
  (select count(*) = 4 from policies) and not exists (select 1 from policies where cmd in ('ALL','UPDATE')) as no_extra_or_update_policy,
  coalesce(has_table_privilege('anon', to_regclass('public.observation_comments'), 'SELECT'), false) as anon_select_granted,
  not coalesce(has_any_column_privilege('anon', to_regclass('public.observation_comments'), 'INSERT'), true)
    and not coalesce(has_table_privilege('anon', to_regclass('public.observation_comments'), 'DELETE'), true) as anon_writes_denied,
  not coalesce(has_table_privilege('authenticated', to_regclass('public.observation_comments'), 'INSERT'), true)
    and not exists (select 1 from attributes where has_column_privilege('authenticated', attrelid, attnum, 'INSERT')
      is distinct from (attname in ('observation_id','kind','body')))
    and (select count(*) = 7 from attributes) as insert_columns_exact_no_spoof,
  not coalesce(has_any_column_privilege('authenticated', to_regclass('public.observation_comments'), 'UPDATE'), true)
    and not coalesce(has_any_column_privilege('anon', to_regclass('public.observation_comments'), 'UPDATE'), true) as all_client_updates_denied,
  coalesce(has_table_privilege('authenticated', to_regclass('public.observation_comments'), 'DELETE'), false) as authenticated_delete_granted,
  not exists (select 1 from table_acl where grantee = 0) as no_public_table_grant,
  (select count(*) = 1 from table_acl where grantee = (select oid from pg_roles where rolname = 'anon')
    and privilege_type = 'SELECT' and not is_grantable)
    and not exists (select 1 from table_acl where grantee = (select oid from pg_roles where rolname = 'anon')
      and (privilege_type <> 'SELECT' or is_grantable)) as anon_direct_acl_exact,
  (select count(*) = 2 from table_acl where grantee = (select oid from pg_roles where rolname = 'authenticated')
    and privilege_type in ('SELECT','DELETE') and not is_grantable)
    and not exists (select 1 from table_acl where grantee = (select oid from pg_roles where rolname = 'authenticated')
      and (privilege_type not in ('SELECT','DELETE') or is_grantable)) as authenticated_direct_table_acl_exact,
  exists (select 1 from pg_trigger t where t.tgrelid = to_regclass('public.observation_comments')
    and t.tgname = 'observation_comments_prepare' and t.tgenabled = 'O' and not t.tgisinternal
    and t.tgtype = 7 and t.tgfoid = to_regprocedure('public.prepare_observation_comment()')) as before_insert_row_trigger_exact,
  exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.prepare_observation_comment()')
    and p.prosecdef and p.prorettype = 'trigger'::regtype and p.proowner = (select relowner from relation)
    and (p.proconfig = array['search_path=""'] or p.proconfig = array['search_path='])
    and md5(replace(p.prosrc, E'\r\n', E'\n')) = '8621d585697b131825480bedc209bd90') as reviewed_author_trim_nickname_trigger_body,
  not coalesce(has_function_privilege('anon', to_regprocedure('public.prepare_observation_comment()'), 'EXECUTE'), true)
    and not coalesce(has_function_privilege('authenticated', to_regprocedure('public.prepare_observation_comment()'), 'EXECUTE'), true) as trigger_not_directly_callable;
