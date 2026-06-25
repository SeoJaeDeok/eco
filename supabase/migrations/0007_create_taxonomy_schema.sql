-- Taxonomy schema and RLS migration candidate for Phase 24B.
-- MANUAL APPLY REQUIRED. NOT AUTO-APPLIED BY THIS SESSION.
--
-- Goals:
-- - Add an accepted terminal taxonomy cache with flattened lineage columns.
-- - Add a small server-only successful name-resolution cache.
-- - Add nullable observation taxonomy linkage columns without backfilling.
-- - Keep existing observations valid when taxonomy linkage is absent.
-- - Allow public reads of accepted taxonomy data.
-- - Prevent browser clients from inserting or changing authoritative taxonomy data.
--
-- Non-goals:
-- - No Supabase Edge Function implementation.
-- - No GBIF request or remote network request.
-- - No historical observation rewrite or taxonomy backfill.
-- - No new public taxonomy write path.
-- - No service-role key usage or documentation.

begin;

-- ---------------------------------------------------------------------------
-- Preflight checks
-- ---------------------------------------------------------------------------

do $$
declare
  required_column text;
begin
  if to_regclass('public.observations') is null then
    raise exception 'Phase 24B taxonomy migration requires public.observations';
  end if;

  if to_regclass('public.profiles') is null then
    raise exception 'Phase 24B taxonomy migration requires public.profiles';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'display_name'
  ) then
    raise exception 'Phase 24B taxonomy migration requires public.profiles.display_name';
  end if;

  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Phase 24B taxonomy migration requires public.set_updated_at()';
  end if;

  if to_regprocedure('public.guard_observation_edit_fields()') is null then
    raise exception 'Phase 24B taxonomy migration requires public.guard_observation_edit_fields() from migration 0004';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'observations_guard_edit_fields'
      and tgrelid = 'public.observations'::regclass
      and not tgisinternal
  ) then
    raise exception 'Phase 24B taxonomy migration requires observations_guard_edit_fields trigger from migration 0004';
  end if;

  foreach required_column in array array[
    'id',
    'name',
    'scientific_name',
    'taxon',
    'location',
    'observed_date',
    'description',
    'latitude',
    'longitude',
    'image_url',
    'status',
    'created_at',
    'updated_at',
    'image_path',
    'image_mime_type',
    'image_size_bytes',
    'observer_id',
    'observer_display_name'
  ]
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'observations'
        and column_name = required_column
    ) then
      raise exception 'Phase 24B taxonomy migration requires public.observations.%', required_column;
    end if;
  end loop;

  if to_regclass('public.taxa') is not null then
    raise exception 'Refusing to create taxonomy schema because public.taxa already exists';
  end if;

  if to_regclass('public.taxonomy_name_resolutions') is not null then
    raise exception 'Refusing to create taxonomy schema because public.taxonomy_name_resolutions already exists';
  end if;

  foreach required_column in array array[
    'taxon_id',
    'taxonomy_match_type',
    'taxonomy_confidence',
    'taxonomy_verified_at'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'observations'
        and column_name = required_column
    ) then
      raise exception 'Refusing to add public.observations.% because it already exists', required_column;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Authenticated users can create own approved observations'
  ) then
    raise exception 'Phase 24B taxonomy migration requires the authenticated approved-create observation policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
  ) then
    raise exception 'Phase 24B taxonomy migration requires the public approved-only observation read policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Owners can update own approved observation content'
  ) then
    raise exception 'Phase 24B taxonomy migration requires the owner observation update policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Admins can update observations'
  ) then
    raise exception 'Phase 24B taxonomy migration requires the admin observation update policy';
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname in (
      'taxa_source_identity_key',
      'taxa_required_text_not_blank',
      'taxa_optional_text_not_blank',
      'taxa_classification_json_object',
      'taxonomy_name_resolutions_source_input_key',
      'taxonomy_name_resolutions_required_text_not_blank',
      'taxonomy_name_resolutions_confidence_check',
      'taxonomy_name_resolutions_issues_json_array',
      'taxonomy_name_resolutions_success_match_type_check',
      'observations_taxonomy_confidence_check',
      'observations_taxonomy_match_type_not_blank',
      'observations_taxonomy_linkage_complete_check'
    )
  ) then
    raise exception 'Refusing to create taxonomy schema because an expected constraint name already exists';
  end if;

  if exists (
    select 1
    from pg_class
    where relname in (
      'taxa_accepted_scientific_name_lower_idx',
      'taxa_canonical_name_lower_idx',
      'taxa_kingdom_key_idx',
      'taxa_phylum_key_idx',
      'taxa_class_key_idx',
      'taxa_order_key_idx',
      'taxa_family_key_idx',
      'taxa_genus_key_idx',
      'taxa_species_key_idx',
      'taxonomy_name_resolutions_taxon_id_idx',
      'observations_taxon_id_idx'
    )
  ) then
    raise exception 'Refusing to create taxonomy schema because an expected index name already exists';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname in (
      'taxa_set_updated_at',
      'taxonomy_name_resolutions_set_updated_at'
    )
      and not tgisinternal
  ) then
    raise exception 'Refusing to create taxonomy schema because an expected trigger name already exists';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Accepted terminal taxonomy cache
-- ---------------------------------------------------------------------------

create table public.taxa (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_checklist_key text not null,
  source_taxon_key text not null,
  accepted_scientific_name text not null,
  canonical_name text,
  terminal_rank text not null,
  taxonomic_status text not null,
  kingdom_key text,
  kingdom_name text,
  phylum_key text,
  phylum_name text,
  class_key text,
  class_name text,
  order_key text,
  order_name text,
  family_key text,
  family_name text,
  genus_key text,
  genus_name text,
  species_key text,
  species_name text,
  classification_json jsonb not null default '{}'::jsonb,
  resolved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint taxa_source_identity_key
    unique (source, source_checklist_key, source_taxon_key),
  constraint taxa_required_text_not_blank
    check (
      char_length(trim(source)) > 0
      and char_length(trim(source_checklist_key)) > 0
      and char_length(trim(source_taxon_key)) > 0
      and char_length(trim(accepted_scientific_name)) > 0
      and char_length(trim(terminal_rank)) > 0
      and char_length(trim(taxonomic_status)) > 0
    ),
  constraint taxa_optional_text_not_blank
    check (
      (canonical_name is null or char_length(trim(canonical_name)) > 0)
      and (kingdom_key is null or char_length(trim(kingdom_key)) > 0)
      and (kingdom_name is null or char_length(trim(kingdom_name)) > 0)
      and (phylum_key is null or char_length(trim(phylum_key)) > 0)
      and (phylum_name is null or char_length(trim(phylum_name)) > 0)
      and (class_key is null or char_length(trim(class_key)) > 0)
      and (class_name is null or char_length(trim(class_name)) > 0)
      and (order_key is null or char_length(trim(order_key)) > 0)
      and (order_name is null or char_length(trim(order_name)) > 0)
      and (family_key is null or char_length(trim(family_key)) > 0)
      and (family_name is null or char_length(trim(family_name)) > 0)
      and (genus_key is null or char_length(trim(genus_key)) > 0)
      and (genus_name is null or char_length(trim(genus_name)) > 0)
      and (species_key is null or char_length(trim(species_key)) > 0)
      and (species_name is null or char_length(trim(species_name)) > 0)
    ),
  constraint taxa_classification_json_object
    check (jsonb_typeof(classification_json) = 'object')
);

comment on table public.taxa is
  'Accepted terminal taxonomy cache. Source keys are text because GBIF/COL XR keys are not guaranteed numeric.';
comment on column public.taxa.classification_json is
  'Compact normalized classification data only; do not store large raw provider responses or credentials.';

create trigger taxa_set_updated_at
before update on public.taxa
for each row
execute function public.set_updated_at();

create index taxa_accepted_scientific_name_lower_idx
  on public.taxa (lower(accepted_scientific_name));

create index taxa_canonical_name_lower_idx
  on public.taxa (lower(canonical_name))
  where canonical_name is not null;

create index taxa_kingdom_key_idx
  on public.taxa (kingdom_key)
  where kingdom_key is not null;

create index taxa_phylum_key_idx
  on public.taxa (phylum_key)
  where phylum_key is not null;

create index taxa_class_key_idx
  on public.taxa (class_key)
  where class_key is not null;

create index taxa_order_key_idx
  on public.taxa (order_key)
  where order_key is not null;

create index taxa_family_key_idx
  on public.taxa (family_key)
  where family_key is not null;

create index taxa_genus_key_idx
  on public.taxa (genus_key)
  where genus_key is not null;

create index taxa_species_key_idx
  on public.taxa (species_key)
  where species_key is not null;

alter table public.taxa enable row level security;

revoke all on public.taxa from anon, authenticated;

grant select (
  id,
  source,
  source_checklist_key,
  source_taxon_key,
  accepted_scientific_name,
  canonical_name,
  terminal_rank,
  taxonomic_status,
  kingdom_key,
  kingdom_name,
  phylum_key,
  phylum_name,
  class_key,
  class_name,
  order_key,
  order_name,
  family_key,
  family_name,
  genus_key,
  genus_name,
  species_key,
  species_name,
  classification_json,
  resolved_at,
  updated_at
) on public.taxa to anon, authenticated;

create policy "Public can read accepted taxa"
on public.taxa
for select
to anon, authenticated
using (true);

-- No anon/authenticated INSERT, UPDATE, or DELETE policy is created for taxa.
-- Future authoritative writes must go through a trusted server path reviewed in
-- Phase 24D; no service-role secret may be exposed to frontend code.

-- ---------------------------------------------------------------------------
-- Server-only successful name-resolution cache
-- ---------------------------------------------------------------------------

create table public.taxonomy_name_resolutions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_checklist_key text not null,
  normalized_input text not null,
  reported_scientific_name text not null,
  taxon_id uuid not null references public.taxa(id) on delete restrict,
  match_type text not null,
  confidence integer,
  synonym boolean not null default false,
  requires_confirmation boolean not null default false,
  issues_json jsonb not null default '[]'::jsonb,
  resolved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint taxonomy_name_resolutions_source_input_key
    unique (source, source_checklist_key, normalized_input),
  constraint taxonomy_name_resolutions_required_text_not_blank
    check (
      char_length(trim(source)) > 0
      and char_length(trim(source_checklist_key)) > 0
      and char_length(trim(normalized_input)) > 0
      and char_length(trim(reported_scientific_name)) > 0
      and char_length(trim(match_type)) > 0
    ),
  constraint taxonomy_name_resolutions_confidence_check
    check (confidence is null or confidence between 0 and 100),
  constraint taxonomy_name_resolutions_issues_json_array
    check (jsonb_typeof(issues_json) = 'array'),
  constraint taxonomy_name_resolutions_success_match_type_check
    check (upper(trim(match_type)) not in ('NONE', 'NO_MATCH', 'HIGHERRANK', 'AMBIGUOUS'))
);

comment on table public.taxonomy_name_resolutions is
  'Server-only cache for successful accepted name resolutions. Do not cache no-match, timeout, rate-limit, 5xx, or malformed responses.';
comment on column public.taxonomy_name_resolutions.requires_confirmation is
  'Records whether this match category normally requires user confirmation; confirmed variants may be cached only after explicit confirmation.';

create trigger taxonomy_name_resolutions_set_updated_at
before update on public.taxonomy_name_resolutions
for each row
execute function public.set_updated_at();

create index taxonomy_name_resolutions_taxon_id_idx
  on public.taxonomy_name_resolutions (taxon_id);

alter table public.taxonomy_name_resolutions enable row level security;

revoke all on public.taxonomy_name_resolutions from anon, authenticated;

-- No anon/authenticated SELECT, INSERT, UPDATE, or DELETE policy is created for
-- taxonomy_name_resolutions. It is a trusted-server cache, not a public alias
-- directory.

-- ---------------------------------------------------------------------------
-- Observation taxonomy linkage
-- ---------------------------------------------------------------------------

alter table public.observations
  add column taxon_id uuid references public.taxa(id) on delete restrict,
  add column taxonomy_match_type text,
  add column taxonomy_confidence integer,
  add column taxonomy_verified_at timestamptz;

alter table public.observations
  add constraint observations_taxonomy_confidence_check
    check (taxonomy_confidence is null or taxonomy_confidence between 0 and 100),
  add constraint observations_taxonomy_match_type_not_blank
    check (taxonomy_match_type is null or char_length(trim(taxonomy_match_type)) > 0),
  add constraint observations_taxonomy_linkage_complete_check
    check (
      (
        taxon_id is null
        and taxonomy_match_type is null
        and taxonomy_confidence is null
        and taxonomy_verified_at is null
      )
      or (
        taxon_id is not null
        and taxonomy_match_type is not null
        and taxonomy_verified_at is not null
      )
    );

create index observations_taxon_id_idx
  on public.observations (taxon_id)
  where taxon_id is not null;

comment on column public.observations.scientific_name is
  'User-entered/reported scientific name. Existing rows are not rewritten by Phase 24B.';
comment on column public.observations.taxon_id is
  'Nullable accepted taxonomy relation. Existing and legacy observations may remain null.';
comment on column public.observations.taxonomy_match_type is
  'Official resolver match type recorded by the trusted taxonomy resolution flow.';
comment on column public.observations.taxonomy_confidence is
  'Resolver confidence when provided by the authoritative source; null is allowed.';
comment on column public.observations.taxonomy_verified_at is
  'Timestamp when the trusted taxonomy resolution flow verified the observation taxonomy.';

-- Keep current frontend creates/edits compatible while preventing forged
-- taxonomy metadata from browser clients.
revoke insert (
  taxon_id,
  taxonomy_match_type,
  taxonomy_confidence,
  taxonomy_verified_at
) on public.observations from anon, authenticated;

revoke update (
  taxon_id,
  taxonomy_match_type,
  taxonomy_confidence,
  taxonomy_verified_at
) on public.observations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Protected observation field guard
-- ---------------------------------------------------------------------------
-- This extends the existing 0004 guard. It intentionally does not introduce a
-- trusted server bypass yet. Phase 24D must design that path explicitly.

create or replace function public.guard_observation_edit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.observer_id is distinct from old.observer_id then
    raise exception 'observer_id cannot be changed by the observation edit flow';
  end if;

  if new.observer_display_name is distinct from old.observer_display_name then
    raise exception 'observer_display_name cannot be changed by the observation edit flow';
  end if;

  if new.image_path is distinct from old.image_path then
    raise exception 'image_path cannot be changed by the observation edit flow';
  end if;

  if new.image_mime_type is distinct from old.image_mime_type then
    raise exception 'image_mime_type cannot be changed by the observation edit flow';
  end if;

  if new.image_size_bytes is distinct from old.image_size_bytes then
    raise exception 'image_size_bytes cannot be changed by the observation edit flow';
  end if;

  if new.image_url is distinct from old.image_url then
    raise exception 'image_url cannot be changed by the observation edit flow';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'created_at cannot be changed by the observation edit flow';
  end if;

  if new.taxon_id is distinct from old.taxon_id then
    raise exception 'taxon_id cannot be changed by the direct observation edit flow';
  end if;

  if new.taxonomy_match_type is distinct from old.taxonomy_match_type then
    raise exception 'taxonomy_match_type cannot be changed by the direct observation edit flow';
  end if;

  if new.taxonomy_confidence is distinct from old.taxonomy_confidence then
    raise exception 'taxonomy_confidence cannot be changed by the direct observation edit flow';
  end if;

  if new.taxonomy_verified_at is distinct from old.taxonomy_verified_at then
    raise exception 'taxonomy_verified_at cannot be changed by the direct observation edit flow';
  end if;

  if old.taxon_id is not null and new.scientific_name is distinct from old.scientific_name then
    raise exception 'scientific_name cannot be changed while taxonomy linkage is attached by the direct observation edit flow';
  end if;

  if new.status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid observation status';
  end if;

  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'only admins can change observation status';
  end if;

  if not public.is_admin() then
    if auth.uid() is null then
      raise exception 'authenticated owner is required for observation edit';
    end if;

    if old.observer_id is null or old.observer_id <> auth.uid() then
      raise exception 'only the observation owner can edit this observation';
    end if;

    if old.status <> 'approved' or new.status <> 'approved' then
      raise exception 'owners can edit approved observations only';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_observation_edit_fields() from public;

drop trigger if exists observations_guard_edit_fields on public.observations;
create trigger observations_guard_edit_fields
before update on public.observations
for each row
execute function public.guard_observation_edit_fields();

-- ---------------------------------------------------------------------------
-- Observation RLS
-- ---------------------------------------------------------------------------

alter table public.observations enable row level security;

-- Preserve the existing authenticated approved-create behavior, but require
-- taxonomy linkage metadata to remain absent until Phase 24D/E adds a trusted
-- resolver-backed create/update path.
drop policy if exists "Authenticated users can create own approved observations" on public.observations;
create policy "Authenticated users can create own approved observations"
on public.observations
for insert
to authenticated
with check (
  observer_id = auth.uid()
  and status = 'approved'
  and image_url is null
  and (
    observer_display_name is null
    or observer_display_name = (
      select profiles.display_name
      from public.profiles
      where profiles.id = auth.uid()
    )
  )
  and taxon_id is null
  and taxonomy_match_type is null
  and taxonomy_confidence is null
  and taxonomy_verified_at is null
);

commit;
