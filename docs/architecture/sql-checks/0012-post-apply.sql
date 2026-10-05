-- READ ONLY. Run only after 0012 succeeded. Every boolean should be true.
-- Catalog/privilege checks are not live role-session deletion tests.
with policies as (
  select policyname, cmd, permissive, roles,
    replace(regexp_replace(replace(lower(coalesce(qual, '')), 'public.', ''),
      '[[:space:]()]|::text', '', 'g'), 'asuid', '') as using_rule,
    replace(regexp_replace(replace(lower(coalesce(with_check, '')), 'public.', ''),
      '[[:space:]()]|::text', '', 'g'), 'asuid', '') as check_rule
  from pg_policies where schemaname = 'public' and tablename = 'observations'
)
select
  exists (select 1 from pg_class where oid = to_regclass('public.observations')
    and relkind = 'r' and relrowsecurity) as observations_table_rls,
  coalesce(has_table_privilege('authenticated', to_regclass('public.observations'), 'DELETE'), false) as authenticated_delete_granted,
  not coalesce(has_table_privilege('anon', to_regclass('public.observations'), 'DELETE'), true) as anon_delete_denied,
  exists (select 1 from policies where policyname = 'Owners can delete own observations'
    and cmd = 'DELETE' and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'status=''approved''andobserver_id=selectauth.uid'
    and check_rule = '') as approved_owner_delete_exact,
  exists (select 1 from policies where policyname = 'Admins can delete observations'
    and cmd = 'DELETE' and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
    and using_rule = 'status=''approved''andis_admin' and check_rule = '') as approved_admin_delete_exact,
  (select count(*) = 2 from policies where cmd in ('DELETE','ALL')) as no_other_delete_or_all_policy,
  exists (select 1 from policies where policyname = 'Public can read approved observations'
    and cmd = 'SELECT' and roles @> array['anon','authenticated']::name[] and cardinality(roles) = 2
    and using_rule = 'status=''approved''') as approved_public_select_preserved,
  exists (select 1 from policies where policyname = 'Admins can read all observations'
    and cmd = 'SELECT' and roles = array['authenticated']::name[] and using_rule = 'is_admin') as admin_read_preserved,
  (select count(*) = 2 from policies where cmd in ('SELECT','ALL')) as no_private_owner_select_added,
  exists (select 1 from policies where policyname = 'Owners can update own approved observation content'
    and cmd = 'UPDATE' and roles = array['authenticated']::name[]
    and using_rule = 'observer_id=auth.uidandstatus=''approved'''
    and check_rule = 'observer_id=auth.uidandstatus=''approved''andimage_urlisnull') as owner_update_preserved,
  exists (select 1 from policies where policyname = 'Admins can update observations'
    and cmd = 'UPDATE' and roles = array['authenticated']::name[] and using_rule = 'is_admin'
    and check_rule = 'is_adminandstatus=anyarray[''pending'',''approved'',''rejected'']andimage_urlisnull') as admin_update_preserved,
  (select count(*) = 2 from policies where cmd in ('UPDATE','ALL')) as no_extra_update_policy;
