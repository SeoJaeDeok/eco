-- READ ONLY. Run after separately authorized manual 0014 application.
-- Every result must be true. Stop on false/null/error; do not repeat migration or GRANT.
-- Direct and effective anon EXECUTE must both be absent; authenticated stays permitted.
-- Same reviewed helper and public-policy checks as precheck; no policy changes are expected.
-- The known owner default grant is intentionally NOT a gate and remains out of scope.
with helper as (
  select p.*, l.lanname,
    regexp_replace(lower(p.prosrc), '[[:space:]();]', '', 'g') as source_rule
  from pg_proc p join pg_language l on l.oid = p.prolang
  where p.oid = to_regprocedure('public.is_admin()')
), function_acl as (
  select a.* from helper h
  cross join lateral aclexplode(coalesce(h.proacl, acldefault('f', h.proowner))) a
), policies as (
  select p.*, x.oid as policy_oid,
    lower(replace(concat_ws(' ', p.qual, p.with_check), '"', '')) as expressions,
    regexp_replace(replace(replace(lower(coalesce(p.qual, '')), 'public.', ''), 'storage.', ''),
      '[[:space:]()]|::text', '', 'g') as using_rule,
    regexp_replace(lower(coalesce(p.with_check, '')), '[[:space:]()]|::text', '', 'g') as check_rule
  from pg_policies p
  join pg_namespace n on n.nspname = p.schemaname
  join pg_class c on c.relnamespace = n.oid and c.relname = p.tablename
  join pg_policy x on x.polrelid = c.oid and x.polname = p.policyname
), anon_policies as (
  select * from policies p
  where 'public' = any(p.roles) or exists (
    select 1 from pg_roles r
    where r.rolname = any(p.roles) and pg_has_role('anon', r.oid, 'USAGE')
  )
), policy_functions as (
  select distinct p.policy_oid, f.oid, n.nspname
  from anon_policies p
  join pg_depend d on d.classid = 'pg_policy'::regclass and d.objid = p.policy_oid
  join pg_proc f on d.refclassid = 'pg_proc'::regclass and d.refobjid = f.oid
  join pg_namespace n on n.oid = f.pronamespace
)
select
  exists (select 1 from helper where pronargs = 0 and prokind = 'f'
    and prorettype = 'boolean'::regtype and not proretset
    and pg_get_function_identity_arguments(oid) = '') as exact_is_admin_signature,
  (select count(*) = 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin') as no_unexpected_overload,
  exists (select 1 from helper where lanname = 'sql' and prosecdef and provolatile = 's'
    and proconfig = array['search_path=public']
    and source_rule = 'selectexistsselect1frompublic.profileswhereprofiles.id=auth.uidandprofiles.role=''admin''') as reviewed_helper_definition,
  not exists (select 1 from function_acl where grantee = 0
    and privilege_type = 'EXECUTE') as public_direct_execute_absent,
  not coalesce(has_function_privilege('public', to_regprocedure('public.is_admin()'), 'EXECUTE'), true) as public_effective_execute_absent,
  not exists (select 1 from function_acl a join pg_roles r on r.oid = a.grantee
    where r.rolname = 'anon' and a.privilege_type = 'EXECUTE') as anon_direct_execute_absent,
  not coalesce(has_function_privilege('anon', to_regprocedure('public.is_admin()'), 'EXECUTE'), true) as anon_effective_execute_absent,
  exists (select 1 from function_acl a join pg_roles r on r.oid = a.grantee
    where r.rolname = 'authenticated' and a.privilege_type = 'EXECUTE') as authenticated_direct_execute_present,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.is_admin()'), 'EXECUTE'), false) as authenticated_effective_execute_present,
  exists (select 1 from pg_roles where rolname = 'anon'
    and not rolbypassrls and not rolsuper) as anon_cannot_bypass_rls,
  exists (select 1 from pg_roles where rolname = 'authenticated'
    and not rolbypassrls and not rolsuper) as authenticated_cannot_bypass_rls,
  exists (select 1 from helper h join pg_roles r on r.rolname = 'anon'
    where h.proowner <> r.oid) as anon_is_not_helper_owner,
  not exists (select 1 from function_acl a join pg_roles r on r.oid = a.grantee
    where r.rolname <> 'anon' and a.privilege_type = 'EXECUTE'
      and pg_has_role('anon', r.oid, 'USAGE')) as anon_has_no_inherited_execute,
  not exists (select 1 from function_acl a join pg_roles r on r.oid = a.grantor
    where r.rolname = 'anon') as no_anon_granted_dependent_acl,
  not exists (select 1 from anon_policies p where expressions ~ 'is_admin[[:space:]]*[(]'
    or exists (select 1 from policy_functions f where f.policy_oid = p.policy_oid
      and f.oid = (select oid from helper))) as anon_policies_do_not_call_helper,
  not exists (select 1 from policy_functions where nspname <> 'pg_catalog'
    and oid <> (select oid from helper)) as no_unreviewed_anon_policy_functions,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.oid <> (select oid from helper)
      and p.prokind in ('f','p') and p.prorettype not in ('trigger'::regtype,'event_trigger'::regtype)
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass
        and d.objid = p.oid and d.deptype = 'e')) as no_unreviewed_public_callable_functions,
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v','m')
      and has_table_privilege('anon', c.oid, 'SELECT')) as no_unreviewed_public_readable_views,
  exists (select 1 from pg_class where oid = to_regclass('public.observations')
    and relkind = 'r' and relrowsecurity) as observations_rls_preserved,
  exists (select 1 from pg_class where oid = to_regclass('storage.objects')
    and relkind = 'r' and relrowsecurity) as image_objects_rls_preserved,
  exists (select 1 from policies where schemaname = 'public' and tablename = 'observations'
    and policyname = 'Public can read approved observations' and cmd = 'SELECT'
    and permissive = 'PERMISSIVE' and roles @> array['anon','authenticated']::name[]
    and cardinality(roles) = 2 and using_rule = 'status=''approved''' and check_rule = '') as approved_observation_select_preserved,
  (select count(*) = 1 from anon_policies where schemaname = 'public'
    and tablename = 'observations' and cmd in ('SELECT','ALL')) as no_extra_anon_observation_select,
  exists (select 1 from policies where schemaname = 'public' and tablename = 'observations'
    and policyname = 'Admins can read all observations' and cmd = 'SELECT'
    and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'is_admin' and check_rule = '') as admin_observation_select_preserved,
  exists (select 1 from policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Public can read approved observation images' and cmd = 'SELECT'
    and permissive = 'PERMISSIVE' and roles @> array['anon','authenticated']::name[]
    and cardinality(roles) = 2 and check_rule = ''
    and using_rule = 'bucket_id=''observation-images''andexistsselect1fromobservationswhereobservations.status=''approved''andobservations.image_path=objects.name') as approved_image_select_preserved,
  (select count(*) = 1 from anon_policies where schemaname = 'storage'
    and tablename = 'objects' and cmd in ('SELECT','ALL')) as no_extra_anon_image_select,
  exists (select 1 from policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Admins can read observation images' and cmd = 'SELECT'
    and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'bucket_id=''observation-images''andis_admin' and check_rule = '') as admin_image_select_preserved,
  coalesce(has_table_privilege('anon', to_regclass('public.observations'), 'SELECT'), false)
    and coalesce(has_table_privilege('authenticated', to_regclass('public.observations'), 'SELECT'), false) as observation_read_grants_preserved,
  coalesce(has_table_privilege('anon', to_regclass('storage.objects'), 'SELECT'), false)
    and coalesce(has_table_privilege('authenticated', to_regclass('storage.objects'), 'SELECT'), false) as image_read_grants_preserved;
