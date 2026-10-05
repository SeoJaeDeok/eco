-- Phase 29 candidate. Manual review/apply only; no remote execution by Codex.
-- Existing public SELECT and owner/admin UPDATE policies are unchanged.
begin;

revoke delete on public.observations from anon;
grant delete on public.observations to authenticated;

create policy "Owners can delete own observations"
on public.observations for delete to authenticated
using (observer_id = (select auth.uid()));

-- Reuse the existing 0001 admin policy and public.is_admin(), without widening SELECT.
-- Non-approved owner rows remain inaccessible through the current public read path.
-- Storage policies are deliberately unchanged.
commit;
