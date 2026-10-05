-- Phase 32 candidate. Manual review/apply only. No taxonomy/Storage/Auth policy changes.
begin;

create table public.observation_comments (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  author_display_name text,
  kind text not null check (kind in ('comment', 'identification')),
  body text not null check (char_length(body) between 1 and 1000 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);

create index observation_comments_observation_created_id_idx
  on public.observation_comments (observation_id, created_at desc, id desc);
create index observation_comments_author_idx on public.observation_comments (author_id);

-- Capture only a safe display-name snapshot without opening a public profiles directory.
create function public.prepare_observation_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  display_value text;
begin
  if auth.uid() is null or new.author_id is distinct from auth.uid() then
    raise exception 'Comment author must match the authenticated user' using errcode = '42501';
  end if;
  -- Unicode whitespace list matches JavaScript trim; body remains plain text.
  new.body := btrim(new.body, E' \t\n\r\f\013' || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
  select p.display_name into display_value from public.profiles p where p.id = auth.uid();
  new.author_display_name := case
    when display_value is null or btrim(display_value) = '' or position('@' in display_value) > 0 then null
    else left(btrim(display_value), 80) end;
  return new;
end;
$$;
revoke all on function public.prepare_observation_comment() from public, anon, authenticated;
create trigger observation_comments_prepare
before insert on public.observation_comments
for each row execute function public.prepare_observation_comment();

alter table public.observation_comments enable row level security;
revoke all on public.observation_comments from public, anon, authenticated;
grant select on public.observation_comments to anon, authenticated;
grant insert (observation_id, kind, body) on public.observation_comments to authenticated;
grant delete on public.observation_comments to authenticated;
-- No UPDATE or client-provided author/name/id/timestamp privileges.

create policy "Public can read comments on approved observations"
on public.observation_comments for select to anon, authenticated
using (exists (select 1 from public.observations o where o.id = observation_id and o.status = 'approved'));

-- Admin-only read supports deletion even after an observation becomes non-public.
-- Public repository queries still explicitly restrict the joined observation to approved.
create policy "Admins can read all observation comments"
on public.observation_comments for select to authenticated using (public.is_admin());

create policy "Users can create own comments on approved observations"
on public.observation_comments for insert to authenticated
with check (author_id = (select auth.uid()) and exists (
  select 1 from public.observations o where o.id = observation_id and o.status = 'approved'
));

create policy "Authors and admins can delete observation comments"
on public.observation_comments for delete to authenticated
using (author_id = (select auth.uid()) or public.is_admin());

commit;
