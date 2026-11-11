export const categories = [
  "Food",
  "Pamasahe",
  "Groceries",
  "Load / data",
  "Bills",
  "Others",
] as const;
export const payments = [
  "Cash",
  "GCash",
  "Maya",
  "Bank transfer",
  "Card",
] as const;
export type Category = (typeof categories)[number];
export type Payment = (typeof payments)[number];
export type Period = "day" | "week" | "month";
export type Screen = "home" | "activity" | "insights";
/** All amounts are integer centavos, never fractional pesos. */
export interface Expense {
  id: string;
  amount: number;
  category: Category;
  payment: Payment;
  date: string;
  note: string;
  demo?: boolean;
}
export interface Plan {
  allowance: number | null;
  frequency: "day" | "week";
  daily: number | null;
  weekly: number | null;
}
export interface SavingsGoal {
  name: string;
  target: number;
  saved: number;
  date: string;
}
export interface AppState {
  schemaVersion: 1;
  expenses: Expense[];
  plan: Plan;
  goal: SavingsGoal | null;
}
export const emptyPlan: Plan = {
  allowance: null,
  frequency: "week",
  daily: null,
  weekly: null,
};
export const emptyState = (): AppState => ({
  schemaVersion: 1,
  expenses: [],
  plan: { ...emptyPlan },
  goal: null,
});
