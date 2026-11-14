import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { budgetWarnings } from "../src/lib/finance";
import { emptyPlan, type Expense } from "../src/lib/types";
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
    expect(screen.queryByText("Spending heads-up")).not.toBeInTheDocument();
  });
});
