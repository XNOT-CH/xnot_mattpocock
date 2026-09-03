-- Household finance tracker schema
-- Decisions this maps to: see GitHub issues #2-#7 on XNOT-CH/xnot_mattpocock

create extension if not exists "pgcrypto";

-- ── households ────────────────────────────────────────────────
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Separate logins, shared household data, equal permissions for all members (issue #2)
create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Invite-by-link join flow (issue #2)
create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Flat category list, preset + custom, shared across the household (issue #3)
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

-- Manual entry only; amount/category/date required, note/receipt optional (issue #7)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  occurred_on date not null,
  note text,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- Monthly reminders only; user still enters the transaction by hand (issue #4)
create table recurring_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2),
  label text not null,
  day_of_month smallint not null check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Per-category monthly budget, in-app alerts only (issue #6)
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  unique (household_id, category_id, month)
);

-- ── row level security ───────────────────────────────────────
alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_reminders enable row level security;
alter table budgets enable row level security;

create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create policy "members can read their household" on households
  for select using (is_household_member(id));

create policy "members can read their membership rows" on household_members
  for select using (is_household_member(household_id));

create policy "members can create memberships for themselves" on household_members
  for insert with check (user_id = auth.uid());

create policy "members can read invites for their household" on household_invites
  for select using (is_household_member(household_id));

create policy "members can create invites for their household" on household_invites
  for insert with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can read categories" on categories
  for select using (household_id is null or is_household_member(household_id));

create policy "members can manage custom categories" on categories
  for insert with check (is_household_member(household_id));

create policy "members can read transactions" on transactions
  for select using (is_household_member(household_id));

create policy "members can write transactions" on transactions
  for insert with check (is_household_member(household_id) and user_id = auth.uid());

create policy "members can update their household's transactions" on transactions
  for update using (is_household_member(household_id));

create policy "members can delete their household's transactions" on transactions
  for delete using (is_household_member(household_id));

create policy "members can read recurring reminders" on recurring_reminders
  for select using (is_household_member(household_id));

create policy "members can manage recurring reminders" on recurring_reminders
  for all using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members can read budgets" on budgets
  for select using (is_household_member(household_id));

create policy "members can manage budgets" on budgets
  for all using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- ── preset categories (household_id null = global template) ───
insert into categories (household_id, name, type, is_preset) values
  (null, 'อาหาร', 'expense', true),
  (null, 'ที่อยู่อาศัย', 'expense', true),
  (null, 'ค่าเดินทาง', 'expense', true),
  (null, 'สาธารณูปโภค', 'expense', true),
  (null, 'สุขภาพ', 'expense', true),
  (null, 'ช้อปปิ้ง', 'expense', true),
  (null, 'บันเทิง', 'expense', true),
  (null, 'การศึกษา', 'expense', true),
  (null, 'ผ่อนชำระ/หนี้สิน', 'expense', true),
  (null, 'อื่นๆ', 'expense', true),
  (null, 'เงินเดือน', 'income', true),
  (null, 'รายได้เสริม', 'income', true),
  (null, 'อื่นๆ', 'income', true);
