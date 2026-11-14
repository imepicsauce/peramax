import { budgetWarnings } from "../lib/finance";
import type { Expense, Plan } from "../lib/types";

export function BudgetWarnings({ expenses, plan, today, onPlan }: {
  expenses: Expense[]; plan: Plan; today: string; onPlan: () => void;
}) {
  const warnings = budgetWarnings(expenses, plan, today);
  return <div role="status" aria-live="polite" aria-atomic="true">
    {warnings.length > 0 && <section className="budget-warnings" aria-label="Budget warnings">
      <div className="budget-warning-heading"><strong>Spending heads-up</strong>
        <button className="textbutton" onClick={onPlan}>Review plan ↗</button>
      </div>
      <ul>{warnings.map(warning => <li key={warning.key} className={warning.severity}>
        <span aria-hidden="true">!</span>
        <div><strong>{warning.title}</strong><p>{warning.detail}</p></div>
      </li>)}</ul>
    </section>}
  </div>;
}
