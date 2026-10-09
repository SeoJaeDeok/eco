-- READ ONLY: Storage configuration and policy metadata, no object/application rows.
-- Run once in SQL Editor. gate.* should be true; info.* are numbers, not PASS gates.
-- Extra policies or alternate deparsing require review, never automatic changes.
-- No business function, signing, upload, object listing or deletion is executed.
with
relations as (
  select c.*, n.nspname from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where (n.nspname='storage' and c.relname in ('buckets','objects'))
    or (n.nspname='public' and c.relname='observations')
),
clients as (
  select * from pg_catalog.pg_roles where rolname in ('anon','authenticated')
),
bucket_prerequisite as (
  select exists(select 1 from relations where nspname='storage' and relname='buckets' and relkind='r')
    and (select count(*)=5 from pg_catalog.pg_attribute
      where attrelid=to_regclass('storage.buckets') and attnum>0 and not attisdropped
        and attname in ('id','name','public','file_size_limit','allowed_mime_types'))
    and coalesce(pg_catalog.has_table_privilege(current_user,to_regclass('storage.buckets'),'SELECT'),false)
    as ready
),
bucket_xml as (
  select case when ready then pg_catalog.query_to_xml($bucket$
    select count(*) as bucket_count,
      bool_and(name='observation-images' and public=false) as private_name,
      bool_and(allowed_mime_types @> array['image/jpeg','image/png','image/webp']::text[]
        and cardinality(allowed_mime_types)=3) as mime_exact,
      max(file_size_limit) as limit_bytes
    from storage.buckets where id='observation-images'
  $bucket$,true,false,'') else null end as value from bucket_prerequisite
),
bucket as (
  select ((xpath('/table/row/bucket_count/text()',value))[1]::text)::bigint as bucket_count,
    (xpath('/table/row/private_name/text()',value))[1]::text='true' as private_name,
    (xpath('/table/row/mime_exact/text()',value))[1]::text='true' as mime_exact,
    ((xpath('/table/row/limit_bytes/text()',value))[1]::text)::bigint as limit_bytes
  from bucket_xml
),
policies as (
  select p.*, x.oid as policy_oid
  from pg_catalog.pg_policies p
  join pg_catalog.pg_namespace n on n.nspname=p.schemaname
  join pg_catalog.pg_class c on c.relnamespace=n.oid and c.relname=p.tablename
  join pg_catalog.pg_policy x on x.polrelid=c.oid and x.polname=p.policyname
  where (p.schemaname='storage' and p.tablename='objects')
    or (p.schemaname='public' and p.tablename='observations')
),
applicable as (
  select p.*, r.rolname as client_role from policies p cross join clients r
  where 'public'=any(p.roles) or exists(
    select 1 from pg_catalog.pg_roles grantee where grantee.rolname=any(p.roles)
      and pg_catalog.pg_has_role(r.oid,grantee.oid,'USAGE'))
),
-- Keep quoted strings byte-for-byte, including regex parentheses and escapes.
-- Remove only grouping parentheses/text casts/schema qualifiers outside strings.
-- Expected rules contain AND only; no OR/group-precedence equivalence is assumed.
expressions as (
  select p.policy_oid,e.kind,e.source from policies p
  cross join lateral (values ('using',coalesce(p.qual,'')),('check',coalesce(p.with_check,''))) e(kind,source)
),
tokens as (
  select e.policy_oid,e.kind,t.position,t.parts[1] as token
  from expressions e cross join lateral regexp_matches(e.source,
    $token$('(?:[^']|'')*'|"(?:[^"]|"")*"|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+|::|~\*|\|\||[^[:space:]])$token$,
    'g') with ordinality t(parts,position)
),
neighbors as (
  select *,lag(token) over(partition by policy_oid,kind order by position) as previous,
    lead(token) over(partition by policy_oid,kind order by position) as following from tokens
),
rules as (
  select e.policy_oid,e.kind,coalesce(string_agg(
    case when left(t.token,1) in ('''','"') then t.token else lower(t.token) end,
    '' order by t.position) filter(where
      t.token not in ('(',')') and not (t.token='::' and t.following='text')
      and not (t.token='text' and t.previous='::')
      and not (t.token in ('public','storage') and t.following='.')
      and not (t.token='.' and t.previous in ('public','storage'))),'') as rule
  from expressions e left join neighbors t using(policy_oid,kind) group by e.policy_oid,e.kind
),
expected(schema_name,policy_name,command,role_names,using_rule,check_rule) as (values
  ('storage','Public can read approved observation images','SELECT',array['anon','authenticated']::name[],
    $rule$bucket_id='observation-images'andexistsselect1fromobservationswhereobservations.status='approved'andobservations.image_path=objects.name$rule$,''),
  ('storage','Admins can read observation images','SELECT',array['authenticated']::name[],
    $rule$bucket_id='observation-images'andis_admin$rule$,''),
  ('storage','Authenticated users can upload own observation images','INSERT',array['authenticated']::name[],
    '',$rule$bucket_id='observation-images'andname~*'^observations/'||auth.uid||'/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'$rule$),
  ('public','Public can read approved observations','SELECT',array['anon','authenticated']::name[],
    $rule$status='approved'$rule$,''),
  ('public','Admins can read all observations','SELECT',array['authenticated']::name[],
    'is_admin','')
),
helper as (
  select p.*,l.lanname from pg_catalog.pg_proc p
  join pg_catalog.pg_language l on l.oid=p.prolang
  where p.oid=to_regprocedure('public.is_admin()')
),
checks(check_name,passed) as (
  select 'gate.bucket_metadata_readable',(select ready from bucket_prerequisite)
  union all select 'gate.one_expected_bucket',bucket_count=1 from bucket
  union all select 'gate.bucket_private',bucket_count=1 and private_name from bucket
  union all select 'gate.bucket_mime_exact',bucket_count=1 and mime_exact from bucket
  union all select 'gate.bucket_matches_app_twenty_mib',bucket_count=1 and limit_bytes=20971520 from bucket
  union all select 'gate.objects_rls_enabled',exists(select 1 from relations
    where oid=to_regclass('storage.objects') and relkind='r' and relrowsecurity)
  union all select 'gate.buckets_rls_enabled',exists(select 1 from relations
    where oid=to_regclass('storage.buckets') and relkind='r' and relrowsecurity)
  union all select 'gate.observations_rls_enabled',exists(select 1 from relations
    where oid=to_regclass('public.observations') and relkind='r' and relrowsecurity)
  union all select 'gate.browser_roles_present_no_bypass',count(*)=2 and bool_and(not rolsuper and not rolbypassrls)
    from clients
  union all select 'gate.clients_not_storage_table_owner',(select count(*)=2 from relations
    where nspname='storage' and relname in ('objects','buckets')) and not exists(
      select 1 from relations c cross join clients r where c.nspname='storage'
        and pg_catalog.pg_has_role(r.oid,c.relowner,'USAGE'))
  union all select 'gate.storage_schema_usage.'||r.rolname,
    coalesce(pg_catalog.has_schema_privilege(r.oid,to_regnamespace('storage'),'USAGE'),false) from clients r
  union all select 'gate.object_read_privilege.'||r.rolname,
    coalesce(pg_catalog.has_table_privilege(r.oid,to_regclass('storage.objects'),'SELECT'),false) from clients r
  union all select 'gate.approved_reference_columns_readable.'||r.rolname,
    (select count(*)=2 and bool_and(pg_catalog.has_column_privilege(r.oid,a.attrelid,a.attnum,'SELECT'))
      from pg_catalog.pg_attribute a where a.attrelid=to_regclass('public.observations')
        and a.attname in ('status','image_path') and a.attnum>0 and not a.attisdropped) from clients r
  union all select 'gate.authenticated_upload_table_privilege',exists(select 1 from clients r
    where r.rolname='authenticated'
      and pg_catalog.has_table_privilege(r.oid,to_regclass('storage.objects'),'INSERT'))
  union all select 'gate.policy_exact.'||e.policy_name,exists(
    select 1 from policies p join rules u on u.policy_oid=p.policy_oid and u.kind='using'
    join rules c on c.policy_oid=p.policy_oid and c.kind='check'
    where p.schemaname=e.schema_name and p.policyname=e.policy_name and p.cmd=e.command
      and p.permissive='PERMISSIVE' and p.roles @> e.role_names
      and cardinality(p.roles)=cardinality(e.role_names)
      and u.rule collate "C"=e.using_rule collate "C" and c.rule collate "C"=e.check_rule collate "C")
    from expected e
  union all select 'gate.anon_only_approved_storage_read',(select count(*)=1 from applicable
    where schemaname='storage' and client_role='anon')
  union all select 'gate.authenticated_only_three_storage_policies',(select count(*)=3 from applicable
    where schemaname='storage' and client_role='authenticated')
  union all select 'gate.no_browser_storage_update_delete_policy',not exists(
    select 1 from applicable where schemaname='storage' and cmd in ('UPDATE','DELETE','ALL'))
  union all select 'gate.no_anon_storage_insert_policy',not exists(
    select 1 from applicable where schemaname='storage' and client_role='anon' and cmd in ('INSERT','ALL'))
  union all select 'gate.no_browser_bucket_management_policy',not exists(
    select 1 from pg_catalog.pg_policies p cross join clients r
    where p.schemaname='storage' and p.tablename='buckets' and p.cmd in ('INSERT','UPDATE','DELETE','ALL')
      and ('public'=any(p.roles) or exists(select 1 from pg_catalog.pg_roles g
        where g.rolname=any(p.roles) and pg_catalog.pg_has_role(r.oid,g.oid,'USAGE'))))
  union all select 'gate.observation_read_policy_inventory.'||r.rolname,
    (select count(*) from applicable where schemaname='public' and client_role=r.rolname and cmd in ('SELECT','ALL'))
      = case when r.rolname='anon' then 1 else 2 end from clients r
  union all select 'gate.image_policy_references_public_observations',exists(
    select 1 from policies p join pg_catalog.pg_depend d on d.classid='pg_policy'::regclass and d.objid=p.policy_oid
    where p.schemaname='storage' and p.policyname='Public can read approved observation images'
      and d.refclassid='pg_class'::regclass and d.refobjid=to_regclass('public.observations'))
  union all select 'gate.no_unreviewed_policy_functions',not exists(
    select 1 from policies p join pg_catalog.pg_depend d on d.classid='pg_policy'::regclass and d.objid=p.policy_oid
    join pg_catalog.pg_proc f on d.refclassid='pg_proc'::regclass and d.refobjid=f.oid
    join pg_catalog.pg_namespace n on n.oid=f.pronamespace
    where (p.schemaname='storage' or p.cmd in ('SELECT','ALL')) and n.nspname<>'pg_catalog'
      and f.oid not in (to_regprocedure('public.is_admin()'),to_regprocedure('auth.uid()')))
  union all select 'gate.admin_helper_reviewed_definition',exists(select 1 from helper
    where lanname='sql' and prosecdef and provolatile='s' and not proisstrict
      and prorettype=to_regtype('boolean') and not proretset and prokind='f'
      and proconfig=array['search_path=public']
      and md5(replace(prosrc,E'\r\n',E'\n'))='a48a3b72d94a37a286c216626640ca56')
  union all select 'gate.admin_helper_authenticated_execute',exists(
    select 1 from helper h join clients r on r.rolname='authenticated'
    where pg_catalog.has_function_privilege(r.oid,h.oid,'EXECUTE'))
  union all select 'gate.admin_helper_no_anon_or_public_execute',exists(select 1 from helper h
    where not exists(select 1 from clients r where r.rolname='anon'
      and pg_catalog.has_function_privilege(r.oid,h.oid,'EXECUTE'))
      and not exists(select 1 from pg_catalog.aclexplode(coalesce(h.proacl,pg_catalog.acldefault('f',h.proowner))) a
        where a.grantee=0 and a.privilege_type='EXECUTE'))
  union all select 'gate.auth_uid_callable_for_upload',exists(select 1 from clients r
    where r.rolname='authenticated' and pg_catalog.has_function_privilege(r.oid,to_regprocedure('auth.uid()'),'EXECUTE'))
  union all select 'gate.db_image_size_matches_twenty_mib',exists(select 1 from pg_catalog.pg_constraint c
    where c.conrelid=to_regclass('public.observations') and c.conname='observations_image_size_bytes_check'
      and c.contype='c' and c.convalidated and regexp_replace(lower(pg_catalog.pg_get_expr(c.conbin,c.conrelid)),
        '[[:space:]()]','','g')='image_size_bytesisnullorimage_size_bytes>=0andimage_size_bytes<=20971520')
  union all select 'gate.db_image_mime_matches_app',exists(select 1 from pg_catalog.pg_constraint c
    where c.conrelid=to_regclass('public.observations') and c.conname='observations_image_mime_type_check'
      and c.contype='c' and c.convalidated and regexp_replace(replace(lower(pg_catalog.pg_get_expr(c.conbin,c.conrelid)),
        '::text',''),'[[:space:]()]','','g')=
        $rule$image_mime_typeisnullorimage_mime_type=anyarray['image/jpeg','image/png','image/webp']$rule$)
),
numbers(check_name,observed_value) as (
  select 'info.bucket_limit_bytes',limit_bytes from bucket
  union all select 'info.bucket_count',bucket_count from bucket
  union all select 'info.browser_storage_update_delete_policies',count(*) from applicable
    where schemaname='storage' and cmd in ('UPDATE','DELETE','ALL')
  union all select 'info.object_delete_table_grant.'||r.rolname,
    case when pg_catalog.has_table_privilege(r.oid,to_regclass('storage.objects'),'DELETE') then 1::bigint else 0::bigint end
    from clients r
)
select check_name,coalesce(passed,false) as passed,null::bigint as observed_value from checks
union all select check_name,null::boolean,observed_value from numbers
order by check_name;
