export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  household_id: string | null;
  name: string;
  type: TransactionType;
  icon: string | null;
  is_preset: boolean;
};

export type Transaction = {
  id: string;
  household_id: string;
  category_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  occurred_on: string;
  note: string | null;
  receipt_url: string | null;
  created_at: string;
};

export type Household = {
  id: string;
  name: string;
  created_at: string;
};

export type RecurringReminder = {
  id: string;
  household_id: string;
  category_id: string;
  type: TransactionType;
  amount: number | null;
  label: string;
  day_of_month: number;
  is_active: boolean;
};

export type Budget = {
  id: string;
  household_id: string;
  category_id: string;
  month: string;
  amount: number;
};
