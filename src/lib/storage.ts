import {
  categories,
  payments,
  emptyState,
  type AppState,
  type Expense,
  type Plan,
  type SavingsGoal,
} from "./types";
import { isDate, MAX_CENTAVOS } from "./finance";
import { demoExpenses } from "./demo";
export const STORAGE_KEY = "peramax-react-v1";
const validMoney = (v: unknown, zero = false): v is number =>
  typeof v === "number" &&
  Number.isSafeInteger(v) &&
  v >= (zero ? 0 : 1) &&
  v <= MAX_CENTAVOS;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object";
export function isExpense(v: unknown): v is Expense {
  return (
    object(v) &&
    typeof v.id === "string" &&
    validMoney(v.amount) &&
    categories.includes(v.category as never) &&
    payments.includes(v.payment as never) &&
    isDate(v.date) &&
    typeof v.note === "string" &&
    (v.demo === undefined || typeof v.demo === "boolean")
  );
}
export function isPlan(v: unknown): v is Plan {
  return (
    object(v) &&
    (v.frequency === "day" || v.frequency === "week" || v.frequency === "month") &&
    (v.weeklySaving == null || (object(v.weeklySaving) && validMoney(v.weeklySaving.amount) && isDate(v.weeklySaving.start) && new Date(v.weeklySaving.start + "T12:00:00Z").getUTCDay() === 1)) &&
    ["allowance", "daily", "weekly"].every(
      (k) => v[k] === null || validMoney(v[k]),
    )
  );
}
export function isGoal(v: unknown): v is SavingsGoal {
  return (
    object(v) &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= 60 &&
    validMoney(v.target) &&
    validMoney(v.saved, true) &&
    (v.date === "" || isDate(v.date))
  );
}
export function isState(v: unknown): v is AppState {
  return (
    object(v) &&
    v.schemaVersion === 1 &&
    Array.isArray(v.expenses) &&
    v.expenses.every(isExpense) &&
    isPlan(v.plan) &&
    (v.goal === null || isGoal(v.goal))
  );
}
/** Replace this repository with an authenticated remote implementation later. */
export interface Repository {
  load(today: string): {
    state: AppState;
    warning: string;
    canPersist: boolean;
  };
  save(state: AppState): void;
}
export function browserRepository(storage: Storage): Repository {
  return {
    load(today) {
      try {
        const current = storage.getItem(STORAGE_KEY);
        if (current !== null) {
          const state: unknown = JSON.parse(current);
          if (!isState(state)) throw new Error("Invalid stored state");
          return { state, warning: "", canPersist: true };
        }
        const expensesRaw = storage.getItem("peramax-v1"),
          planRaw = storage.getItem("peramax-plan-v1"),
          goalRaw = storage.getItem("peramax-savings-goal-v1");
        const state = emptyState();
        if (expensesRaw !== null) {
          const entries: unknown = JSON.parse(expensesRaw);
          if (!Array.isArray(entries) || !entries.every(isExpense))
            throw new Error("Invalid legacy expenses");
          state.expenses = entries;
        } else if (planRaw === null && goalRaw === null)
          state.expenses = demoExpenses(today);
        if (planRaw !== null) {
          const plan: unknown = JSON.parse(planRaw);
          if (!isPlan(plan)) throw new Error("Invalid legacy plan");
          state.plan = plan;
        }
        if (goalRaw !== null) {
          const goal: unknown = JSON.parse(goalRaw);
          if (goal !== null && !isGoal(goal))
            throw new Error("Invalid legacy goal");
          state.goal = goal;
        }
        return { state, warning: "", canPersist: true };
      } catch {
        return {
          state: emptyState(),
          warning:
            "Saved data could not be read. Existing storage is untouched; changes in this session will not persist.",
          canPersist: false,
        };
      }
    },
    save(state) {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
  };
}
