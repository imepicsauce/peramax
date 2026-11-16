import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { budgetWarnings } from "../src/lib/finance";
import { emptyPlan, type Expense } from "../src/lib/types";
import { Dashboard } from "../src/features/Dashboard";
import { BudgetWarnings } from "../src/components/BudgetWarnings";

const entry = (amount: number, date = "2026-11-14"): Expense => ({ id: "one", amount, date, category: "Food", payment: "Cash", note: "" });
const plan = { ...emptyPlan, allowance: 10000, daily: 10000, weekly: 10000 };
describe("budget warnings", () => {
  it("warns at exactly 80%, distinguishes exhaustion and overspending, and ignores unset budgets", () => {
    expect(budgetWarnings([entry(7999)], plan, "2026-11-14")).toEqual([]);
    expect(budgetWarnings([entry(8000)], plan, "2026-11-14")).toHaveLength(3);
    expect(budgetWarnings([entry(10000)], plan, "2026-11-14").map(x => x.title)).toEqual(["Allowance used up", "Daily limit reached", "Weekly limit reached"]);
    expect(budgetWarnings([entry(10001)], plan, "2026-11-14")[0].detail).toBe("₱0.01 over this week.");
    expect(budgetWarnings([entry(20000)], emptyPlan, "2026-11-14")).toEqual([]);
  });
  it("uses each budget's calendar period and clears on rollover", () => {
    const monthly = { ...plan, frequency: "month" as const };
    expect(budgetWarnings([entry(8000, "2026-11-01")], monthly, "2026-11-14").map(x => x.key)).toEqual(["allowance"]);
    expect(budgetWarnings([entry(8000)], plan, "2026-11-15").map(x => x.key)).toEqual(["allowance", "weekly"]);
    expect(budgetWarnings([entry(8000)], plan, "2026-11-16")).toEqual([]);
    expect(budgetWarnings([entry(8000)], monthly, "2026-12-01")).toEqual([]);
  });
  it("updates visible warnings after expense edits and lets users review their plan", async () => {
    let opened = false;
    const props = { plan, today: "2026-11-14", onPlan: () => { opened = true; } };
    const view = render(<BudgetWarnings {...props} expenses={[]} />);
    expect(screen.queryByText("Allowance is low")).not.toBeInTheDocument();
    view.rerender(<BudgetWarnings {...props} expenses={[entry(8000)]} />);
    expect(screen.getByText("Allowance is low")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Daily limit nearly reached");
    await userEvent.click(screen.getByRole("button", { name: /Review plan/ }));
    expect(opened).toBe(true);
    view.rerender(<BudgetWarnings {...props} expenses={[entry(7000)]} />);
    await waitFor(() => expect(screen.queryByText("Spending heads-up")).not.toBeInTheDocument());
  });
});

it("dismisses the banner without hiding card warnings and resurfaces at new stages or periods", async () => {
  const user = userEvent.setup();
  const fixture = (amount: number, today = "2026-11-14") => <>
    <BudgetWarnings expenses={[entry(amount, today)]} plan={plan} today={today} onPlan={() => {}} />
    <Dashboard expenses={[entry(amount, today)]} plan={plan} today={today} onPlan={() => {}} />
  </>;
  const view = render(fixture(8000));
  await user.click(screen.getByRole("button", { name: "Dismiss spending heads-up" }));
  await waitFor(() => expect(screen.queryByText("Spending heads-up")).not.toBeInTheDocument());
  expect(screen.getAllByText("Nearly reached")).toHaveLength(2);
  expect(screen.getByText(/Allowance is low ·/)).toBeInTheDocument();
  view.rerender(fixture(8500));
  expect(screen.queryByText("Spending heads-up")).not.toBeInTheDocument();
  view.rerender(fixture(10001));
  expect(screen.getByText("Spending heads-up")).toBeInTheDocument();
  expect(screen.getAllByText("Over limit")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Dismiss spending heads-up" }));
  await waitFor(() => expect(screen.queryByText("Spending heads-up")).not.toBeInTheDocument());
  view.rerender(fixture(10001, "2026-11-15"));
  expect(screen.getByText("Spending heads-up")).toBeInTheDocument();
});
