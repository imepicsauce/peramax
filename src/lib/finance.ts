import type { Expense, Period, Plan } from "./types";
export const MAX_CENTAVOS = 9_999_999_900;
export const money = (centavos: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    centavos / 100,
  );
export const amountInput = (centavos: number | null) =>
  centavos === null ? "" : (centavos / 100).toFixed(2);
export function parseAmount(text: string, allowZero = false): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(text.trim()))
    throw new Error("Enter a valid amount with up to two decimal places.");
  const [pesos, cents = ""] = text.trim().split(".");
  const value = Number(pesos) * 100 + Number(cents.padEnd(2, "0"));
  if (
    !Number.isSafeInteger(value) ||
    value < (allowZero ? 0 : 1) ||
    value > MAX_CENTAVOS
  )
    throw new Error(
      "Amount must be " +
        (allowZero ? "zero or more" : "greater than zero") +
        " and at most ₱99,999,999.",
    );
  return value;
}
export function todayInManila(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}
export const dateObject = (value: string) => new Date(value + "T12:00:00Z");
export function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(dateObject(value).valueOf()) &&
    dateObject(value).toISOString().slice(0, 10) === value
  );
}
export function shiftDate(value: string, days: number): string {
  const date = dateObject(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) =>
  dateObject(value).toLocaleDateString("en-PH", {
    ...options,
    timeZone: "UTC",
  });
export function periodRange(anchor: string, period: Period) {
  if (period === "day") return { start: anchor, end: anchor };
  if (period === "week") {
    const start = shiftDate(
      anchor,
      -((dateObject(anchor).getUTCDay() + 6) % 7),
    );
    return { start, end: shiftDate(start, 6) };
  }
  const start = anchor.slice(0, 7) + "-01",
    next = dateObject(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: shiftDate(next.toISOString().slice(0, 10), -1) };
}
export function movePeriod(
  anchor: string,
  period: Period,
  direction: number,
): string {
  if (period !== "month")
    return shiftDate(anchor, direction * (period === "week" ? 7 : 1));
  const date = dateObject(anchor.slice(0, 7) + "-01");
  date.setUTCMonth(date.getUTCMonth() + direction);
  return date.toISOString().slice(0, 10);
}
export const expensesInRange = (
  entries: Expense[],
  start: string,
  end: string,
) => entries.filter((entry) => entry.date >= start && entry.date <= end);
export const sumExpenses = (entries: Expense[]) =>
  entries.reduce((sum, entry) => sum + entry.amount, 0);
export function planSummary(entries: Expense[], plan: Plan, today: string) {
  const week = periodRange(today, "week"),
    range = periodRange(today, plan.frequency);
  const spent = sumExpenses(expensesInRange(entries, range.start, range.end));
  return {
    ...range,
    spent,
    left: plan.allowance === null ? null : plan.allowance - spent,
    limits: [
      {
        key: "daily" as const,
        title: "Daily limit",
        limit: plan.daily,
        spent: sumExpenses(expensesInRange(entries, today, today)),
      },
      {
        key: "weekly" as const,
        title: "Weekly limit",
        limit: plan.weekly,
        spent: sumExpenses(expensesInRange(entries, week.start, week.end)),
      },
    ],
  };
}
export function elapsedDays(start: string, end: string, today: string) {
  const cutoff = today < start ? start : today > end ? end : today;
  return Math.max(
    1,
    Math.round(
      (dateObject(cutoff).valueOf() - dateObject(start).valueOf()) / 86400000,
    ) + 1,
  );
}
