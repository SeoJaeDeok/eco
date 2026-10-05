-- READ ONLY. Run before 0012 in the intended Dashboard SQL Editor.
-- Every returned boolean must be true. Stop on false/null/error; do not rerun migration.
-- No application rows, identities or configuration values are returned.
with policies as (
  select policyname, cmd, permissive, roles,
    replace(regexp_replace(replace(lower(coalesce(qual, '')), 'public.', ''),
      '[[:space:]()]|::text', '', 'g'), 'asuid', '') as using_rule
  from pg_policies where schemaname = 'public' and tablename = 'observations'
), helper as (
  select p.*, l.lanname,
    regexp_replace(lower(p.prosrc), '[[:space:]();]', '', 'g') as source_rule
  from pg_proc p join pg_language l on l.oid = p.prolang
  where p.oid = to_regprocedure('public.is_admin()')
)
select
  exists (select 1 from pg_class where oid = to_regclass('public.observations')
    and relkind = 'r' and relrowsecurity) as observations_table_rls,
  exists (select 1 from helper where prosecdef and provolatile = 's'
    and lanname = 'sql' and prorettype = 'boolean'::regtype
    and proconfig @> array['search_path=public']
    and source_rule = 'selectexistsselect1frompublic.profileswhereprofiles.id=auth.uidandprofiles.role=''admin''') as admin_helper_matches_reviewed_body,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.is_admin()'), 'EXECUTE'), false) as admin_helper_callable,
  not coalesce(has_function_privilege('anon', to_regprocedure('public.is_admin()'), 'EXECUTE'), true) as admin_helper_not_public,
  exists (select 1 from pg_roles where rolname = 'anon' and not rolbypassrls and not rolsuper) as anon_cannot_bypass_rls,
  exists (select 1 from pg_roles where rolname = 'authenticated' and not rolbypassrls and not rolsuper) as authenticated_cannot_bypass_rls,
  exists (select 1 from policies where policyname = 'Public can read approved observations'
    and cmd = 'SELECT' and permissive = 'PERMISSIVE'
    and roles @> array['anon','authenticated']::name[] and cardinality(roles) = 2
    and using_rule = 'status=''approved''') as approved_public_select_exact,
  exists (select 1 from policies where policyname = 'Admins can read all observations'
    and cmd = 'SELECT' and roles = array['authenticated']::name[]
    and using_rule = 'is_admin') as admin_select_preserved,
  (select count(*) = 2 from policies where cmd in ('SELECT','ALL')) as no_extra_select_policy,
  exists (select 1 from policies where policyname = 'Admins can delete observations'
    and cmd = 'DELETE' and permissive = 'PERMISSIVE'
    and roles = array['authenticated']::name[] and using_rule = 'is_admin') as baseline_admin_delete_exact,
  (select count(*) = 1 from policies where cmd in ('DELETE','ALL')) as no_extra_delete_policy,
  not exists (select 1 from policies where policyname = 'Owners can delete own observations') as owner_policy_name_available,
  not coalesce(has_table_privilege('authenticated', to_regclass('public.observations'), 'DELETE'), true) as baseline_delete_ungranted,
  not coalesce(has_table_privilege('anon', to_regclass('public.observations'), 'DELETE'), true) as anon_delete_denied,
  coalesce(has_table_privilege('anon', to_regclass('public.observations'), 'SELECT'), false) as anon_read_granted,
  exists (select 1 from pg_attribute where attrelid = to_regclass('public.observations')
    and attname = 'observer_id' and atttypid = 'uuid'::regtype and not attisdropped) as owner_uuid_column,
  exists (select 1 from pg_attribute where attrelid = to_regclass('public.observations')
    and attname = 'status' and atttypid = 'text'::regtype and attnotnull and not attisdropped) as status_text_column;
