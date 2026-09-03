-- Budgets and the home page's monthly summary become personal: each
-- household member tracks their own income/expense/budget, not the
-- household total. Add user_id and re-scope the unique constraint and RLS.

alter table budgets add column user_id uuid references auth.users(id);

update budgets b
set user_id = (
  select hm.user_id from household_members hm
  where hm.household_id = b.household_id
  limit 1
)
where user_id is null;

alter table budgets alter column user_id set not null;

alter table budgets drop constraint budgets_household_id_category_id_month_key;
alter table budgets add constraint budgets_household_id_user_id_category_id_month_key
  unique (household_id, user_id, category_id, month);

drop policy "members can read budgets" on budgets;
drop policy "members can manage budgets" on budgets;

create policy "members can read their own budgets" on budgets
  for select using (user_id = auth.uid());

create policy "members can manage their own budgets" on budgets
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_household_member(household_id));
