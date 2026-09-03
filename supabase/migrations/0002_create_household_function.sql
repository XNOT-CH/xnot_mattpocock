-- Households have no client-facing INSERT policy: creating a household then
-- reading it back (Prefer: return=representation) needs the SELECT policy
-- to pass too, which requires membership that doesn't exist yet — a
-- chicken-and-egg RLS deadlock. Bundle household creation and the creator's
-- membership into one security-definer function instead.

create or replace function create_household(household_name text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household households;
begin
  insert into households (name) values (household_name)
  returning * into new_household;

  insert into household_members (household_id, user_id)
  values (new_household.id, auth.uid());

  return new_household;
end;
$$;

revoke all on function create_household(text) from public;
grant execute on function create_household(text) to authenticated;
