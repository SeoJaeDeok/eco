-- Eco map observation image Storage migration candidate.
-- Review in a Supabase project before applying.
--
-- Scope:
-- - Adds image_path and image metadata columns to public.observations.
-- - Creates or updates a private observation-images Storage bucket.
-- - Adds read policies for admin review and approved public image display.
--
-- Non-scope:
-- - Does not implement frontend upload helpers.
-- - Does not expose pending/rejected observations publicly.
-- - Does not select an upload policy. See commented candidate policies below.
-- - Does not include rollback SQL. Rollback is documented in
--   docs/architecture/supabase-storage-setup.md.

alter table public.observations
  add column if not exists image_path text,
  add column if not exists image_mime_type text,
  add column if not exists image_size_bytes integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_path_format_check'
  ) then
    alter table public.observations
      add constraint observations_image_path_format_check
      check (
        image_path is null
        or (
          char_length(trim(image_path)) > 0
          and image_path !~* '^(https?:|blob:|data:)'
          and (
            image_path ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
            or image_path ~* '^observations/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_mime_type_check'
  ) then
    alter table public.observations
      add constraint observations_image_mime_type_check
      check (
        image_mime_type is null
        or image_mime_type in ('image/jpeg', 'image/png', 'image/webp')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_size_bytes_check'
  ) then
    alter table public.observations
      add constraint observations_image_size_bytes_check
      check (
        image_size_bytes is null
        or (image_size_bytes >= 0 and image_size_bytes <= 5242880)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_metadata_complete_check'
  ) then
    alter table public.observations
      add constraint observations_image_metadata_complete_check
      check (
        image_path is null
        or (image_mime_type is not null and image_size_bytes is not null)
      );
  end if;
end $$;

create index if not exists observations_image_path_idx
  on public.observations (image_path)
  where image_path is not null;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'observation-images',
  'observation-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read observation images" on storage.objects;
create policy "Admins can read observation images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'observation-images'
  and public.is_admin()
);

drop policy if exists "Public can read approved observation images" on storage.objects;
create policy "Public can read approved observation images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'observation-images'
  and exists (
    select 1
    from public.observations
    where observations.status = 'approved'
      and observations.image_path = storage.objects.name
  )
);

-- Upload policy candidates are intentionally not active in this migration.
-- Before enabling upload in 16C, choose exactly one upload model and review
-- the corresponding insert grant for public.observations image metadata.

-- Candidate A: anonymous/public pending image upload.
-- Apply only if anonymous image upload is explicitly approved.
--
-- grant insert (
--   image_path,
--   image_mime_type,
--   image_size_bytes
-- ) on public.observations to anon, authenticated;
--
-- drop policy if exists "Public can upload pending observation images" on storage.objects;
-- create policy "Public can upload pending observation images"
-- on storage.objects
-- for insert
-- to anon, authenticated
-- with check (
--   bucket_id = 'observation-images'
--   and name ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
-- );

-- Candidate B: authenticated-only pending image upload.
-- Apply instead of Candidate A if image upload should require login.
--
-- grant insert (
--   image_path,
--   image_mime_type,
--   image_size_bytes
-- ) on public.observations to authenticated;
--
-- drop policy if exists "Authenticated users can upload pending observation images" on storage.objects;
-- create policy "Authenticated users can upload pending observation images"
-- on storage.objects
-- for insert
-- to authenticated
-- with check (
--   bucket_id = 'observation-images'
--   and name ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
-- );
