-- Phase 22C candidate: raise observation image metadata DB limit to 20 MiB.
-- Manual apply required. Codex did not apply this migration remotely.
-- Scope: only public.observations.observations_image_size_bytes_check.

begin;

do $$
declare
  current_definition text;
begin
  if to_regclass('public.observations') is null then
    raise exception
      'Phase 22C preflight failed: public.observations does not exist.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'observations'
      and column_name = 'image_size_bytes'
  ) then
    raise exception
      'Phase 22C preflight failed: public.observations.image_size_bytes does not exist.';
  end if;

  select pg_get_constraintdef(pg_constraint.oid)
  into current_definition
  from pg_constraint
  where conrelid = 'public.observations'::regclass
    and conname = 'observations_image_size_bytes_check'
    and contype = 'c';

  if current_definition is null then
    raise exception
      'Phase 22C preflight failed: observations_image_size_bytes_check was not found.';
  end if;

  if current_definition like '%20971520%' then
    return;
  end if;

  if current_definition not like '%5242880%' then
    raise exception
      'Phase 22C preflight failed: unexpected observations_image_size_bytes_check definition: %',
      current_definition;
  end if;

  alter table public.observations
    drop constraint observations_image_size_bytes_check;

  alter table public.observations
    add constraint observations_image_size_bytes_check
    check (
      image_size_bytes is null
      or (
        image_size_bytes >= 0
        and image_size_bytes <= 20971520
      )
    );
end $$;

commit;
