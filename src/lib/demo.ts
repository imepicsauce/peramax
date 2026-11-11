import { shiftDate } from "./finance";
import type { Expense } from "./types";
export function demoExpenses(today: string): Expense[] {
  const examples: Omit<Expense, "id" | "date" | "demo">[] = [
    {
      note: "Lunch at the carinderia",
      category: "Food",
      amount: 9500,
      payment: "Cash",
    },
    {
      note: "Jeep to work",
      category: "Pamasahe",
      amount: 1500,
      payment: "Cash",
    },
    { note: "Iced coffee", category: "Food", amount: 12000, payment: "GCash" },
    {
      note: "Weekly groceries",
      category: "Groceries",
      amount: 64500,
      payment: "GCash",
    },
    {
      note: "Mobile data",
      category: "Load / data",
      amount: 9900,
      payment: "Maya",
    },
    {
      note: "Dinner with friends",
      category: "Food",
      amount: 28000,
      payment: "GCash",
    },
    {
      note: "Tricycle home",
      category: "Pamasahe",
      amount: 3500,
      payment: "Cash",
    },
  ];
  return Array.from({ length: 31 }, (_, day) =>
    Array.from({ length: day === 0 ? 3 : 1 + (day % 3) }, (_, index) => ({
      ...examples[(day + index) % examples.length],
      id: `demo-${day}-${index}`,
      date: shiftDate(today, -day),
      demo: true,
    })),
  ).flat();
}
