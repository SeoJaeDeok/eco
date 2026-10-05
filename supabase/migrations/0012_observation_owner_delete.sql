-- Phase 29 candidate. Manual review/apply only; no remote execution by Codex.
-- Existing public SELECT and owner/admin UPDATE policies are unchanged.
begin;

revoke delete on public.observations from anon;
grant delete on public.observations to authenticated;

create policy "Owners can delete own observations"
on public.observations for delete to authenticated
using (status = 'approved' and observer_id = (select auth.uid()));

-- Narrow the existing admin DELETE policy to the confirmed approved-only MVP.
-- Without this change, restoring the table grant would also enable hidden-row deletion.
alter policy "Admins can delete observations" on public.observations
using (status = 'approved' and public.is_admin());

-- Reuse public.is_admin(); SELECT/UPDATE and private owner visibility are unchanged.
-- Storage policies are deliberately unchanged.
commit;
