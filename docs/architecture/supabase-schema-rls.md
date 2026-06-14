# Supabase Schema, RLS, Storage, and Admin Policy Draft

## Scope

This document is a planning draft for a future Supabase implementation. It does not add a Supabase client, migration, repository, environment file, dependency, or runtime behavior.

The current app remains a design-only React starter with static sample data and a mock repository.

## Goals

- Store biodiversity observation records in Supabase Postgres.
- Keep newly submitted observations private from public screens until review.
- Use `pending` for unreviewed submissions.
- Show only `approved` observations in public screens.
- Keep `rejected` observations hidden from public screens.
- Treat images as optional for the MVP.
- Leave room for a future admin approval flow.
- Keep the frontend away from service role keys and privileged credentials.

## Proposed Table: `public.observations`

| Column | Type | Nullable | Default | Constraints | TypeScript mapping |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key | `Observation.id` |
| `name` | `text` | No | None | `char_length(trim(name)) > 0`, suggested max length | `Observation.name`, `CreateObservationInput.name` |
| `scientific_name` | `text` | Yes | `null` | Suggested max length | `Observation.scientificName` |
| `taxon` | `text` | No | None | Check constraint matching `Taxon` union | `Observation.taxon` |
| `location` | `text` | No | None | `char_length(trim(location)) > 0`, suggested max length | `Observation.location` |
| `observed_date` | `date` | No | None | Date-only observation date | `Observation.date` |
| `description` | `text` | Yes | `null` | Suggested max length | `Observation.description` |
| `latitude` | `double precision` | No | None | `between -90 and 90` | `Observation.coords.lat` |
| `longitude` | `double precision` | No | None | `between -180 and 180` | `Observation.coords.lng` |
| `image_url` | `text` | Yes | `null` | Optional URL/path to storage object | `Observation.imageUrl` |
| `status` | `text` | No | `'pending'` | Check constraint for DB statuses | `Observation.status` |
| `created_at` | `timestamptz` | No | `now()` | Server-side creation timestamp | Future metadata |
| `updated_at` | `timestamptz` | No | `now()` | Maintained by trigger | Future metadata |

### Mapping Notes

- Keep the app-facing `location` field for now. The DB can also use `location`, so no immediate UI migration is required.
- Keep the app-facing `date` field for now. The DB should use `observed_date` to make the meaning explicit.
- Repository mapping can convert `observed_date` to `Observation.date`.
- Repository mapping can convert `latitude` and `longitude` into `Observation.coords`.
- `image_url` should remain nullable because images are optional in the MVP.
- Public create payloads should not include `image_url`; Storage integration should populate it in a later step.
- Public create payloads should not include `id`, `status`, `created_at`, or `updated_at`.
- `status` should use the DB default of `'pending'` for public submissions.
- `updated_at` should be `not null default now()` and maintained by the update trigger.
- `scientific_name` and `description` should be nullable at the DB level even if current mock UI still renders them as strings.

## Status Design

### Option A: DB only uses `pending`, `approved`, `rejected`

Pros:

- Matches the real moderation lifecycle.
- Keeps database values focused on production behavior.
- Avoids leaking mock/sample state into the production schema.
- Works well with public read policy: `status = 'approved'`.

Cons:

- The current app type includes `sample`, so repository mapping needs to handle mock-only data separately.
- Seed/demo rows inserted into Supabase need a real status, probably `approved`.

### Option B: DB also includes `sample`

Pros:

- Matches the current `ObservationStatus` TypeScript union directly.
- Seed data can be imported without deciding whether it is approved production data.

Cons:

- `sample` is an app/mock concept, not a production moderation state.
- Public policies become less clear.
- Future admin UI may need special cases.

### Recommendation

Use only `pending`, `approved`, and `rejected` in the database.

Keep `sample` as a frontend/mock-only status until the mock data is removed or migrated. If static sample rows are imported into Supabase for a demo, insert them as `approved`.

## Taxon Design

The current `Taxon` union should remain the source of app-facing labels:

```text
식물
포유류
조류
곤충
양서/파충류
균류
기타
```

For the first MVP, store `taxon` as `text` with a check constraint:

```sql
taxon in ('식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타')
```

This keeps the DB simple and matches the existing TypeScript union. A Postgres enum could be introduced later, but a check constraint is easier to adjust during early MVP iterations.

## Coordinates Design

Store coordinates as two numeric columns:

- `latitude double precision`
- `longitude double precision`

Basic global constraints should always be applied:

- `latitude between -90 and 90`
- `longitude between -180 and 180`

### Campus Bounds: DB Constraint vs App Validation

Strict DB check constraint:

- Pros: impossible to store out-of-bounds observations.
- Cons: campus boundaries may change, legitimate nearby observations may be rejected, and correction requires schema migration.

App validation plus admin review:

- Pros: easier to tune, safer for MVP, and lets admins decide edge cases.
- Cons: bad coordinates can still be inserted if the client is bypassed.

### Recommendation

Use only global coordinate constraints in the DB for the MVP. Add campus-range validation in the app and rely on admin review before public approval. If spam or bad coordinates become a real issue, add a stricter DB constraint or a trigger after the accepted campus boundary is defined.

## RLS Policy Draft

RLS should be enabled on `public.observations`. Supabase policies should make public UI queries safe even when the frontend uses an anon key.

### Public Select

Policy:

- Role: `anon`, optionally `authenticated`
- Operation: `select`
- Condition: `status = 'approved'`

Purpose:

- Public screens can only see approved observations.
- Pending and rejected submissions stay hidden.

Risk:

- Approved rows become public data. Do not store private submitter contact details in this table unless a separate privacy model exists.

### Public Insert

Policy:

- Role: `anon`, optionally `authenticated`
- Operation: `insert`
- Check: inserted rows must have `status = 'pending'`
- Payload: public clients should omit `status`; the DB default should set it to `'pending'`
- Column grants: public clients should only be able to insert `name`, `scientific_name`, `taxon`, `location`, `observed_date`, `description`, `latitude`, and `longitude`

Purpose:

- Allow public submissions without exposing approve/reject powers.
- Ensure submitted observations cannot publish themselves.
- Prevent public clients from directly inserting `id`, `status`, `image_url`, `created_at`, or `updated_at`.

Risk:

- Unauthenticated submissions can be spammed.
- Text content and image paths can be abusive or malicious.
- Client-side validation is not enough for production abuse prevention.
- Column grants reduce accidental or malicious field injection, but they do not replace abuse controls.

### Public Update

Policy:

- Role: `anon`
- Operation: `update`
- Recommendation: no policy

Purpose:

- Public users cannot edit observations after submission.

Risk:

- Users also cannot fix typos without a later authenticated ownership model.

### Public Delete

Policy:

- Role: `anon`
- Operation: `delete`
- Recommendation: no policy

Purpose:

- Public users cannot remove observations.

Risk:

- Deletion/correction requests need an admin process.

### Admin Select

Policy:

- Role: `authenticated`
- Operation: `select`
- Condition: current user is admin.

Purpose:

- Admin review UI can see pending, approved, and rejected observations.

Risk:

- Admin detection must be reliable and not based on user-editable metadata.

### Admin Update

Policy:

- Role: `authenticated`
- Operation: `update`
- Condition: current user is admin.
- Check: resulting status remains one of `pending`, `approved`, `rejected`.

Purpose:

- Admins can approve or reject observations.

Risk:

- A broad admin update policy also allows admins to edit other fields. If the product needs strict approve/reject-only behavior, use a dedicated RPC or stricter column grants later.

### Admin Delete

Policy:

- Role: `authenticated`
- Operation: `delete`
- Condition: current user is admin.

Purpose:

- Admins can remove abusive or invalid data if the product allows deletion.

Risk:

- Deletes are destructive. Soft delete or audit logging may be better before production.

## Public Insert Risk Notes

Allowing login-free submissions is convenient for an MVP but creates real risk:

- Spam submissions.
- Abusive text in `name`, `location`, or `description`.
- Malicious image uploads if storage is enabled.
- Excessive storage or database usage.
- Automated requests bypassing client validation.

MVP tradeoff:

- Allow public pending inserts only if admin approval is in place before public display.
- Keep images optional and consider delaying public image uploads.
- Add basic client validation first.
- Defer CAPTCHA, rate limiting, server-side validation, and abuse moderation until the first real deployment plan.
- If the app becomes public beyond a small demo, add stronger anti-abuse controls before allowing anonymous uploads.

## Storage Policy Draft

### Bucket Candidate

```text
observation-images
```

Images are optional for the MVP. It is acceptable to implement text/coordinate submissions first and add image upload later.

### Public Bucket vs Private Bucket

Public bucket:

- Pros: simplest public image rendering, CDN-friendly, easy `image_url` handling.
- Cons: any uploaded object can be publicly accessible if the URL is known. Pending/rejected image privacy does not match the observation approval policy.

Private bucket:

- Pros: better match for pending/approved visibility. All reads can be controlled by Storage RLS policies or signed URLs.
- Cons: more implementation work. Public approved images need a safe URL strategy, such as signed URLs, an approved-only object policy, or moving approved images to a public path/bucket.

### Recommendation

For the first real image upload phase, prefer a private bucket if moderation privacy matters.

For a very small MVP, a public bucket can be acceptable only if the team accepts that pending image files may be reachable by URL and if upload paths are not exposed in public UI until approval.

Because images are optional, the safest MVP path is:

1. Implement observation rows without image upload.
2. Add private `observation-images` storage after the approval flow is understood.
3. Decide whether approved images are served through signed URLs, an approved-only read policy, or a separate public approved path.

### Upload Path Candidates

```text
pending/{uuid}.jpg
observations/{observation_id}/{filename}
```

`observations/{observation_id}/{filename}` is better once the observation row exists first. It creates a clear relationship between the DB record and the object path.

`pending/{uuid}.jpg` is simpler for direct upload-before-insert flows but requires later cleanup or path migration after rejection.

### File Limits

Suggested MVP limits:

- Max file size: 5 MB.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.

Image compression can be deferred. If uploads become common or mobile-first, add client-side compression before upload in a later phase.

## Admin Authorization Model

### Option A: `profiles.role = 'admin'`

Pros:

- Explicit and queryable from RLS policies.
- Easy to audit in a table.
- Works well with an admin UI.
- Avoids user-editable metadata.

Cons:

- Requires a `profiles` table and a way to bootstrap the first admin.
- Needs RLS for the profiles table too.

### Option B: `auth.users` metadata

Pros:

- Keeps role data near the auth user.
- `raw_app_meta_data` is not user-editable and can be used for authorization claims.

Cons:

- Updating app metadata requires privileged admin operations.
- JWT claims can be stale until token refresh.
- It is less visible to non-auth specialists than a simple project table.
- `raw_user_meta_data` must not be used for authorization because users can update it.

### Option C: `admin_emails` allowlist table

Pros:

- Simple bootstrap for a small project.
- Easy to inspect and change.
- Does not require a full profiles model.

Cons:

- Relies on stable verified email identity.
- Email changes and multiple providers need care.
- Less flexible than role-based profiles if more roles appear.

### Option D: Separate server API with service role

Pros:

- Strong control over admin actions.
- Service role key stays server-side.
- Can add rate limiting, audit logging, and validation.

Cons:

- Adds server/API infrastructure.
- Explicitly out of scope for the current design-only phase.
- More complex than needed for the first Supabase MVP.

### Recommendation

Use Supabase Auth plus `public.profiles.role = 'admin'` for the first admin-capable MVP.

If the project needs a faster bootstrap before a full profile table exists, `admin_emails` can be used as a temporary allowlist. Do not use user-editable metadata for authorization.

## SQL Draft

This SQL is a planning draft, not an applied migration. Review it in a Supabase project before running it.

```sql
-- Optional if gen_random_uuid() is not already available in the project.
create extension if not exists pgcrypto;

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scientific_name text,
  taxon text not null,
  location text not null,
  observed_date date not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  image_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint observations_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint observations_name_length
    check (char_length(name) <= 120),
  constraint observations_scientific_name_length
    check (scientific_name is null or char_length(scientific_name) <= 160),
  constraint observations_location_not_empty
    check (char_length(trim(location)) > 0),
  constraint observations_location_length
    check (char_length(location) <= 160),
  constraint observations_description_length
    check (description is null or char_length(description) <= 2000),
  constraint observations_taxon_check
    check (taxon in ('식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타')),
  constraint observations_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint observations_latitude_check
    check (latitude between -90 and 90),
  constraint observations_longitude_check
    check (longitude between -180 and 180)
);

create index observations_status_created_at_idx
  on public.observations (status, created_at desc);

create index observations_taxon_status_idx
  on public.observations (taxon, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger observations_set_updated_at
before update on public.observations
for each row
execute function public.set_updated_at();

-- Minimal admin profile model candidate.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_role_check
    check (role in ('user', 'admin'))
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.observations enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.observations from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.observations to anon, authenticated;
grant insert (
  name,
  scientific_name,
  taxon,
  location,
  observed_date,
  description,
  latitude,
  longitude
) on public.observations to anon, authenticated;
grant update, delete on public.observations to authenticated;

create policy "Public can read approved observations"
on public.observations
for select
to anon, authenticated
using (status = 'approved');

create policy "Public can create pending observations"
on public.observations
for insert
to anon, authenticated
with check (status = 'pending');

create policy "Admins can read all observations"
on public.observations
for select
to authenticated
using (public.is_admin());

create policy "Admins can update observations"
on public.observations
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'approved', 'rejected')
);

-- Candidate only. Prefer soft delete or audit logging before production.
create policy "Admins can delete observations"
on public.observations
for delete
to authenticated
using (public.is_admin());
```

### Storage SQL Draft

This draft assumes a future `observation-images` bucket. Exact bucket settings can also be configured through the Supabase dashboard.

```sql
-- Candidate bucket setup. Keep private by default if moderation privacy matters.
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
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Candidate upload policy for authenticated admins only.
-- For anonymous public uploads, write a separate policy after abuse controls are chosen.
create policy "Admins can upload observation images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'observation-images'
  and public.is_admin()
);

create policy "Admins can read observation images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'observation-images'
  and public.is_admin()
);
```

For public image reads tied to approved observations, a later policy can reference a stable object path stored on the observation row. Do not finalize that policy until the image path strategy is chosen.

## TypeScript Impact

### Separate DB Row Type From App Type

Keep `Observation` as the app-facing type and introduce a separate Supabase row type later:

```ts
interface SupabaseObservationRow {
  id: string;
  name: string;
  scientific_name: string | null;
  taxon: Taxon;
  location: string;
  observed_date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

Repository mapping should convert this row into the existing `Observation` shape:

- `scientific_name` -> `scientificName`
- `observed_date` -> `date`
- `latitude` and `longitude` -> `coords`
- `image_url` -> `imageUrl`

### `CreateObservationInput` vs Insert Payload

`CreateObservationInput` is a UI/domain input. The Supabase insert payload should be narrower and DB-shaped:

- It should not include `imageFile`.
- It should not include `imagePreviewUrl`.
- It should not include `id`, `status`, `image_url`, `created_at`, or `updated_at`.
- It should rely on the DB default `status = 'pending'`.
- It should leave `image_url` for a later Storage upload/update flow.
- It should split `coords` into `latitude` and `longitude`.
- It should map optional blank strings to `null` where appropriate.

### Field Naming

Keep app fields as `location` and `date` for the first implementation to avoid a UI-wide migration.

Use DB field `observed_date` because it is clearer than `date` at the table level.

Consider a later app migration to:

- `locationName`
- `observedAt`

Do that only as a dedicated type migration after the repository layer is stable.

### Status Optionality

Keep `Observation.status` optional while mock data and design-only screens still coexist.

After Supabase becomes the primary data source, make `status` required in production-facing types and keep `sample` only in mock/demo-specific types if needed.

## Future Implementation Order

1. Add `.env.example` placeholders only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET`
2. Add a Supabase client module.
3. Add `supabaseObservationRepository.ts`.
4. Convert `ObservationRepository` methods to async if needed.
5. Add repository row-to-domain mapping helpers.
6. Add `App.tsx` loading and error states.
7. Keep `UploadMockPage` visually identical while changing submit to repository create.
8. Keep image upload out of the first persistence pass unless explicitly approved.
9. Add image upload after storage path and bucket visibility are finalized.
10. Add admin approval UI after auth and admin role model are finalized.
11. Add spam/rate-limit/CAPTCHA or server-side validation if anonymous public submissions are opened beyond a small MVP.

## Open Questions

- Will the MVP allow submissions without login?
- Should images be required, optional, or delayed entirely?
- How will the first admin account be created?
- Where will admins see pending submissions?
- Should observations outside the campus area be allowed?
- How should malicious submissions and spam be handled?
- Should operation stay strictly inside free-tier limits?
- Should rejected observations be retained for audit or eventually deleted?
- Should public submitters be able to edit or withdraw their own pending submissions?
- Should approved image files be public URLs or signed/private URLs?

## References

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase API security and RLS reminder: https://supabase.com/docs/guides/api/securing-your-api
- Supabase Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage downloads and public buckets: https://supabase.com/docs/guides/storage/serving/downloads
- Supabase Auth users: https://supabase.com/docs/guides/auth/users
