-- READ ONLY. First finish 0012-post-apply with all true.
-- Every boolean here should be true; false includes already-applied/colliding objects.
select
  exists (select 1 from pg_class where oid = to_regclass('public.observations')
    and relkind = 'r' and relrowsecurity) as observations_table_rls,
  exists (select 1 from pg_class where oid = to_regclass('public.profiles')
    and relkind = 'r' and relrowsecurity) as profiles_table_rls,
  exists (select 1 from pg_class where oid = to_regclass('auth.users') and relkind = 'r') as auth_users_exist,
  to_regprocedure('auth.uid()') is not null as auth_uid_exists,
  to_regprocedure('gen_random_uuid()') is not null as uuid_default_exists,
  exists (select 1 from pg_proc where oid = to_regprocedure('public.is_admin()')
    and prosecdef and prorettype = 'boolean'::regtype) as existing_admin_helper,
  exists (select 1 from pg_constraint where conrelid = to_regclass('public.profiles')
    and confrelid = to_regclass('auth.users') and contype = 'f' and convalidated
    and confdeltype = 'c') as existing_profile_auth_fk,
  exists (select 1 from pg_attribute where attrelid = to_regclass('public.profiles')
    and attname = 'display_name' and atttypid = 'text'::regtype and not attisdropped) as nickname_column_exists,
  exists (select 1 from pg_constraint where conrelid = to_regclass('public.observations') and contype = 'p' and convalidated) as observation_primary_key,
  exists (select 1 from pg_constraint where conrelid = to_regclass('public.profiles') and contype = 'p' and convalidated) as profile_primary_key,
  coalesce(has_table_privilege('authenticated', to_regclass('public.observations'), 'DELETE'), false) as previous_delete_grant_present,
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'observations'
    and policyname = 'Owners can delete own observations' and cmd = 'DELETE') as previous_owner_policy_present,
  to_regclass('public.observation_comments') is null as comments_table_absent,
  to_regtype('public.observation_comments') is null as comments_row_type_absent,
  not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'observation_comments') as comment_policies_absent,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'prepare_observation_comment') as trigger_function_name_available,
  to_regclass('public.observation_comments_pkey') is null as primary_index_name_available,
  to_regclass('public.observation_comments_observation_created_id_idx') is null as paging_index_name_available,
  to_regclass('public.observation_comments_author_idx') is null as author_index_name_available;
