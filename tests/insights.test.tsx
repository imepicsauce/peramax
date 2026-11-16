import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Insights } from "../src/features/Reports";
import type { Expense } from "../src/lib/types";
const expenses: Expense[] = [
  { id: "a", date: "2026-11-16", amount: 3000, category: "Food", payment: "GCash", note: "Lunch" },
  { id: "b", date: "2026-11-20", amount: 2000, category: "Pamasahe", payment: "Cash", note: "Jeep" },
  { id: "c", date: "2026-11-21", amount: 1000, category: "Food", payment: "Cash", note: "Snack" },
];
const props = { today: "2026-11-16", entries: expenses, start: "2026-11-16", end: "2026-11-22", period: "week" as const, onEdit: vi.fn() };
it("selects a weekly bar, shows only its entries and amount, and supports editing and clearing", async () => {
  const user = userEvent.setup(); const onEdit = vi.fn();
  render(<Insights {...props} onEdit={onEdit} />);
  const bar = screen.getByRole("button", { name: /Monday.*₱30.00/ });
  await user.click(bar);
  expect(bar).toHaveAttribute("aria-pressed", "true");
  const panel = screen.getByRole("region", { name: "Selected bar expenses" });
  expect(within(panel).getByRole("status")).toHaveTextContent("₱30.00 · 1 expense");
  expect(within(panel).queryByRole("button", { name: "Edit Jeep" })).not.toBeInTheDocument();
  await user.click(within(panel).getByRole("button", { name: "Edit Lunch" }));
  expect(onEdit).toHaveBeenCalledWith(expenses[0]);
  await user.click(within(panel).getByRole("button", { name: "Clear selection" }));
  expect(screen.queryByRole("region", { name: "Selected bar expenses" })).not.toBeInTheDocument();
  expect(bar).toHaveFocus();
});
it("includes both boundaries of monthly buckets and resets selection when the period changes", async () => {
  const user = userEvent.setup();
  const view = render(<Insights {...props} period="month" start="2026-11-01" end="2026-11-30" />);
  await user.click(screen.getByRole("button", { name: /Nov 16 – Nov 20.*₱50.00/ }));
  const panel = screen.getByRole("region", { name: "Selected bar expenses" });
  expect(within(panel).getByRole("button", { name: "Edit Lunch" })).toBeInTheDocument();
  expect(within(panel).getByRole("button", { name: "Edit Jeep" })).toBeInTheDocument();
  expect(within(panel).queryByRole("button", { name: "Edit Snack" })).not.toBeInTheDocument();
  view.rerender(<Insights {...props} period="day" start="2026-11-16" end="2026-11-16" entries={[expenses[0]]} />);
  expect(screen.queryByRole("region", { name: "Selected bar expenses" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Food · Nov 16.*₱30.00/ }));
  expect(screen.getByRole("button", { name: "Edit Lunch" })).toBeInTheDocument();
});
it("supports keyboard selection, repeated taps, and zero-expense bars", async () => {
  const user = userEvent.setup(); render(<Insights {...props} />);
  const bar = screen.getByRole("button", { name: /Tuesday.*₱0.00/ });
  bar.focus(); await user.keyboard("{Enter}");
  expect(bar).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("No expenses in this bar.")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(bar).toHaveAttribute("aria-pressed", "false");
  await user.click(bar); await user.click(bar);
  expect(screen.queryByRole("region", { name: "Selected bar expenses" })).not.toBeInTheDocument();
});
