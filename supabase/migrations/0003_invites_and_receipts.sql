-- Invite/member management page needs to revoke invites (issue #2 follow-up)
create policy "members can delete invites for their household" on household_invites
  for delete using (is_household_member(household_id));

-- Members can set their own display name (issue #2 follow-up)
create policy "members can update their own membership" on household_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── receipt photo storage ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Objects are stored as `${household_id}/${filename}`; RLS checks the
-- household_id folder segment against membership (issue #7)
create policy "members can upload receipts for their household"
on storage.objects for insert
with check (
  bucket_id = 'receipts'
  and is_household_member((storage.foldername(name))[1]::uuid)
);

create policy "members can read receipts for their household"
on storage.objects for select
using (
  bucket_id = 'receipts'
  and is_household_member((storage.foldername(name))[1]::uuid)
);

create policy "members can delete receipts for their household"
on storage.objects for delete
using (
  bucket_id = 'receipts'
  and is_household_member((storage.foldername(name))[1]::uuid)
);
