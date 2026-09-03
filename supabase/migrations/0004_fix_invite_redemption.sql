-- household_invites' SELECT policy requires membership to read a row, but
-- redeeming an invite happens BEFORE the user is a member — the same
-- chicken-and-egg RLS problem create_household() works around. Bundle the
-- lookup, expiry check, and membership insert into one security-definer
-- function so a non-member can redeem a token without needing broader read
-- access to other households' invites.

create or replace function join_household_by_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite household_invites;
begin
  select * into target_invite from household_invites where token = invite_token;

  if not found then
    raise exception 'ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ';
  end if;

  if target_invite.expires_at is not null and target_invite.expires_at < now() then
    raise exception 'ลิงก์เชิญหมดอายุแล้ว';
  end if;

  insert into household_members (household_id, user_id)
  values (target_invite.household_id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  return target_invite.household_id;
end;
$$;

revoke all on function join_household_by_invite(text) from public;
grant execute on function join_household_by_invite(text) to authenticated;
