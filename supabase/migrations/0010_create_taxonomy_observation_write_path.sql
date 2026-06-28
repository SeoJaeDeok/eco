-- Phase 24E-1: trusted taxonomy-linked observation create path.
-- MANUAL APPLY REQUIRED. Codex must not apply this migration remotely.
--
-- Scope:
-- - Add a narrow SECURITY DEFINER RPC for authenticated users to create an
--   approved observation with verified taxonomy linkage.
-- - Keep browser clients unable to write taxonomy columns through direct table
--   INSERT/UPDATE.
-- - Keep existing legacy observation create/edit compatibility unchanged.
--
-- Non-goals:
-- - No observation data backfill.
-- - No taxonomy data change.
-- - No Storage policy change.
-- - No Auth, Admin, Kakao, Vercel, or UI change.
-- - No edit-time taxonomy relinking path yet.

begin;

-- ---------------------------------------------------------------------------
-- Preflight checks
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.observations') is null then
    raise exception 'Phase 24E preflight failed: public.observations does not exist.';
  end if;

  if to_regclass('public.profiles') is null then
    raise exception 'Phase 24E preflight failed: public.profiles does not exist.';
  end if;

  if to_regclass('public.taxa') is null then
    raise exception 'Phase 24E preflight failed: public.taxa does not exist. Apply 0007 first.';
  end if;

  if to_regclass('public.taxonomy_name_resolutions') is null then
    raise exception 'Phase 24E preflight failed: public.taxonomy_name_resolutions does not exist. Apply 0007 first.';
  end if;

  if to_regprocedure('auth.uid()') is null then
    raise exception 'Phase 24E preflight failed: auth.uid() does not exist.';
  end if;

  if to_regprocedure('public.guard_observation_edit_fields()') is null then
    raise exception 'Phase 24E preflight failed: public.guard_observation_edit_fields() is missing.';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.observations'::regclass
      and tgname = 'observations_guard_edit_fields'
      and not tgisinternal
  ) then
    raise exception 'Phase 24E preflight failed: observations_guard_edit_fields trigger is missing.';
  end if;

  if to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
  ) is not null then
    raise exception 'Phase 24E preflight failed: create_observation_with_verified_taxonomy already exists.';
  end if;

  if not (
    has_table_privilege('anon', 'public.taxa', 'SELECT')
    and has_table_privilege('authenticated', 'public.taxa', 'SELECT')
  ) then
    raise exception 'Phase 24E preflight failed: public taxa read access is missing.';
  end if;

  if (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) then
    raise exception 'Phase 24E preflight failed: browser taxonomy cache access is broader than expected.';
  end if;

  if (
    has_column_privilege('anon', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
  ) then
    raise exception 'Phase 24E preflight failed: direct browser taxonomy observation column write is unexpectedly granted.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------

-- This mirrors the lookup-key intent of the TypeScript normalizer closely
-- enough for DB verification: trim, collapse whitespace, and lowercase. The
-- trusted resolver remains authoritative for GBIF matching and taxonomy cache
-- writes.
create function public.normalize_taxonomy_input_key(input_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(input_value),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

comment on function public.normalize_taxonomy_input_key(text) is
  'Internal helper for comparing reported scientific names with trusted taxonomy cache inputs.';

revoke all on function public.normalize_taxonomy_input_key(text) from public;

-- ---------------------------------------------------------------------------
-- Trusted create RPC
-- ---------------------------------------------------------------------------

create function public.create_observation_with_verified_taxonomy(
  p_name text,
  p_reported_scientific_name text,
  p_taxon_id uuid,
  p_location text,
  p_observed_date date,
  p_latitude double precision,
  p_longitude double precision,
  p_description text default null,
  p_image_path text default null,
  p_image_mime_type text default null,
  p_image_size_bytes integer default null
)
returns public.observations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_display_name text;
  v_observer_display_name text;
  v_taxon public.taxa%rowtype;
  v_resolution public.taxonomy_name_resolutions%rowtype;
  v_normalized_input text;
  v_match_type text;
  v_confidence integer;
  v_project_taxon text;
  v_observation public.observations%rowtype;
begin
  if v_user_id is null then
    raise exception 'authenticated user is required for taxonomy-linked observation create';
  end if;

  if p_name is null or pg_catalog.char_length(pg_catalog.btrim(p_name)) = 0 then
    raise exception 'observation name is required';
  end if;

  if p_location is null or pg_catalog.char_length(pg_catalog.btrim(p_location)) = 0 then
    raise exception 'observation location is required';
  end if;

  if p_reported_scientific_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_reported_scientific_name)) = 0
    or pg_catalog.char_length(pg_catalog.btrim(p_reported_scientific_name)) > 200
    or p_reported_scientific_name ~ '[[:cntrl:]]'
  then
    raise exception 'a valid verified scientific name is required';
  end if;

  if p_latitude is null or p_latitude < -90 or p_latitude > 90 then
    raise exception 'latitude is out of range';
  end if;

  if p_longitude is null or p_longitude < -180 or p_longitude > 180 then
    raise exception 'longitude is out of range';
  end if;

  if (p_description is not null and pg_catalog.char_length(pg_catalog.btrim(p_description)) = 0) then
    raise exception 'description cannot be blank when present';
  end if;

  if (
    (p_image_path is null and (p_image_mime_type is not null or p_image_size_bytes is not null))
    or (p_image_path is not null and (p_image_mime_type is null or p_image_size_bytes is null))
  ) then
    raise exception 'image metadata must be complete when an image path is present';
  end if;

  if p_image_path is not null then
    if p_image_path !~* (
      '^observations/' || v_user_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    ) then
      raise exception 'image path must belong to the authenticated observer';
    end if;

    if p_image_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
      raise exception 'image MIME type is not allowed';
    end if;

    if p_image_size_bytes is null or p_image_size_bytes < 0 or p_image_size_bytes > 20971520 then
      raise exception 'image size is out of range';
    end if;
  end if;

  select p.display_name
    into v_profile_display_name
  from public.profiles p
  where p.id = v_user_id;

  if not found then
    raise exception 'observer profile is required';
  end if;

  v_observer_display_name := pg_catalog.nullif(pg_catalog.btrim(v_profile_display_name), '');
  if v_observer_display_name is not null
    and v_observer_display_name ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    v_observer_display_name := null;
  end if;

  select t.*
    into v_taxon
  from public.taxa t
  where t.id = p_taxon_id;

  if not found then
    raise exception 'accepted taxon was not found in the trusted cache';
  end if;

  v_normalized_input := public.normalize_taxonomy_input_key(p_reported_scientific_name);

  select r.*
    into v_resolution
  from public.taxonomy_name_resolutions r
  where r.source = v_taxon.source
    and r.source_checklist_key = v_taxon.source_checklist_key
    and r.normalized_input = v_normalized_input
    and r.taxon_id = v_taxon.id;

  if not found then
    raise exception 'verified taxonomy resolution is required before observation create';
  end if;

  v_match_type := v_resolution.match_type;
  v_confidence := v_resolution.confidence;

  v_project_taxon := case
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.class_name, ''))) = 'insecta' then '곤충'
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.class_name, ''))) = 'aves' then '조류'
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.class_name, ''))) = 'mammalia' then '포유류'
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.class_name, ''))) in ('amphibia', 'reptilia') then '양서/파충류'
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.kingdom_name, ''))) = 'plantae' then '식물'
    when pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(v_taxon.kingdom_name, ''))) = 'fungi' then '균류'
    else '기타'
  end;

  insert into public.observations (
    name,
    scientific_name,
    taxon,
    location,
    observed_date,
    description,
    latitude,
    longitude,
    image_path,
    image_mime_type,
    image_size_bytes,
    status,
    observer_id,
    observer_display_name,
    taxon_id,
    taxonomy_match_type,
    taxonomy_confidence,
    taxonomy_verified_at
  )
  values (
    pg_catalog.btrim(p_name),
    pg_catalog.btrim(p_reported_scientific_name),
    v_project_taxon,
    pg_catalog.btrim(p_location),
    p_observed_date,
    pg_catalog.nullif(pg_catalog.btrim(p_description), ''),
    p_latitude,
    p_longitude,
    p_image_path,
    p_image_mime_type,
    p_image_size_bytes,
    'approved',
    v_user_id,
    v_observer_display_name,
    v_taxon.id,
    v_match_type,
    v_confidence,
    now()
  )
  returning * into v_observation;

  return v_observation;
end;
$$;

comment on function public.create_observation_with_verified_taxonomy(
  text,
  text,
  uuid,
  text,
  date,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
) is
  'Authenticated RPC for creating an approved observation with taxonomy linkage verified against trusted taxonomy cache rows. Browser clients still cannot directly write taxonomy columns.';

revoke all on function public.create_observation_with_verified_taxonomy(
  text,
  text,
  uuid,
  text,
  date,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
) from public;

grant execute on function public.create_observation_with_verified_taxonomy(
  text,
  text,
  uuid,
  text,
  date,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
) to authenticated;

-- ---------------------------------------------------------------------------
-- Postcondition checks
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.normalize_taxonomy_input_key(text)') is null then
    raise exception 'Phase 24E postcondition failed: normalize_taxonomy_input_key is missing.';
  end if;

  if to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
  ) is null then
    raise exception 'Phase 24E postcondition failed: create_observation_with_verified_taxonomy is missing.';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'EXECUTE'
  ) then
    raise exception 'Phase 24E postcondition failed: authenticated cannot execute taxonomy-linked create RPC.';
  end if;

  if has_function_privilege(
    'anon',
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'EXECUTE'
  ) then
    raise exception 'Phase 24E postcondition failed: anon can execute taxonomy-linked create RPC.';
  end if;

  if (
    has_column_privilege('anon', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
  ) then
    raise exception 'Phase 24E postcondition failed: direct browser taxonomy observation column write is unexpectedly granted.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
      and cmd = 'SELECT'
  ) then
    raise exception 'Phase 24E postcondition failed: approved-only public observation policy is missing.';
  end if;
end $$;

commit;
