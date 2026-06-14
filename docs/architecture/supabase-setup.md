# Supabase Setup Guide

This guide describes how to apply the draft Supabase schema for the eco-map observation repository. It is a setup note only. It does not run a migration, create a local Supabase project, create `.env.local`, or connect the active app to a real database.

## Purpose

The goal is to prepare a real Supabase project for the future `supabaseObservationRepository` flow:

- public users can read only `approved` observations
- public users can create only `pending` observations
- admins can review, approve, reject, update, or delete observations
- images remain optional and Storage is left for a later phase
- the frontend uses only the Supabase anon key, never the service role key

## Apply The SQL Draft

1. Create a Supabase project.
2. Open the Supabase dashboard.
3. Go to SQL Editor.
4. Open [0001_create_observation_schema.sql](../../supabase/migrations/0001_create_observation_schema.sql).
5. Review the SQL before running it.
6. Run the SQL in the Supabase SQL Editor.
7. Confirm that these tables exist:
   - `public.profiles`
   - `public.observations`
8. Confirm that Row Level Security is enabled for both tables.

Do not use the Supabase service role key in frontend code. Keep RLS enabled.

## Environment Setup

The app still defaults to the mock repository without `.env.local`.

When you intentionally want to test Supabase, copy `.env.example` to `.env.local` locally and fill only local/deployment environment values:

```text
VITE_OBSERVATION_REPOSITORY=supabase
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_STORAGE_BUCKET=observation-images
```

Do not commit `.env.local`, `.env`, production env files, API keys, tokens, or service role keys.

## First Admin Setup

The migration does not open public profile insert/update policies. This keeps profile role changes out of the public client.

Recommended bootstrap flow:

1. Create a user in Supabase Auth.
2. Copy that user's Auth user id.
3. In SQL Editor, insert or update the matching profile row as `admin`.

Example with placeholders only:

```sql
insert into public.profiles (id, role)
values ('00000000-0000-0000-0000-000000000000', 'admin')
on conflict (id) do update
set
  role = 'admin',
  updated_at = now();
```

Replace the UUID with the real Supabase Auth user id in your local Supabase project. Do not commit real user ids unless they are intentional public test fixtures.

## RLS Behavior To Expect

Public read:

- `anon` and `authenticated` can select only rows where `status = 'approved'`.
- If there are no approved rows, public lists will look empty.

Public insert:

- `anon` and `authenticated` can insert rows only when the final row has `status = 'pending'`.
- The client cannot publish a row by inserting `approved`.

Admin access:

- authenticated users with `public.profiles.role = 'admin'` can read all observations.
- admins can update and delete observations.
- admin detection uses `public.is_admin()` to avoid profile policy recursion.

Profiles:

- authenticated users can read their own profile.
- admins can read all profiles.
- public insert/update/delete for profiles is intentionally not opened in this draft.

## Testing Order

Before adding real data to the active app, keep the default mock path working:

```bash
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

Then test in two modes:

1. Without `.env.local`
   - app should use the mock repository
   - no Supabase URL or anon key is required
   - lists should show sample observations

2. With local Supabase env values
   - set `VITE_OBSERVATION_REPOSITORY=supabase`
   - set `VITE_SUPABASE_URL`
   - set `VITE_SUPABASE_ANON_KEY`
   - run the app locally
   - public lists should show only approved Supabase observations

For insert testing, remember that pending rows may not be selectable by the public repository after insert because public select is limited to `approved`.

## Troubleshooting

### Missing Env Error

If `VITE_OBSERVATION_REPOSITORY=supabase` is set but `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, the Supabase repository will throw a clear missing env error when a repository method runs.

Fix:

- confirm `.env.local` exists locally
- confirm the variable names match `.env.example`
- restart the Vite dev server after changing env values

### Empty Observation List

An empty list can be correct if all rows are `pending` or `rejected`.

Fix:

- insert or update at least one observation with `status = 'approved'`
- confirm the row passes the taxon/status/coordinate constraints
- confirm RLS is enabled and policies exist

### Pending Insert Is Not Returned By Public Select

This is expected. The public repository inserts pending observations, but public select policies expose only approved rows. A pending row should become visible only after admin approval.

### Invalid Taxon Error

The DB check constraint accepts only:

```text
식물
포유류
조류
곤충
양서/파충류
균류
기타
```

The app `Taxon` union and DB constraint should stay in sync.

### First Admin Cannot See All Rows

Check:

- the user is signed in
- `public.profiles.id` matches the Auth user id
- `public.profiles.role = 'admin'`
- the `public.is_admin()` function exists
- RLS policies were created successfully

### Public Insert Spam Risk

Anonymous public insert is convenient for a small MVP but can be abused.

Before public deployment, consider:

- CAPTCHA or bot protection
- rate limiting
- server-side validation
- stricter text length constraints
- moderation tooling
- disabling anonymous inserts and requiring login

## Storage Status

Storage is intentionally not configured by `0001_create_observation_schema.sql`.

Image upload should be handled in a later step after deciding:

- public vs private bucket
- approved image visibility
- signed URL strategy
- file size limits
- allowed MIME types
- cleanup of rejected/pending images

Until then, `image_url` remains nullable and image uploads remain out of scope.
