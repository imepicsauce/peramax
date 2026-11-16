import { useAppMotion } from "../hooks/useAppMotion";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { budgetWarnings, periodRange } from "../lib/finance";
import type { Expense, Plan } from "../lib/types";

export function BudgetWarnings({
  expenses,
  plan,
  today,
  onPlan,
}: {
  expenses: Expense[];
  plan: Plan;
  today: string;
  onPlan: () => void;
}) {
  const warnings = budgetWarnings(expenses, plan, today);
  const [dismissed, setDismissed] = useState("");
  const reduce = useAppMotion();
  // Ignore amount changes within the same warning stage; new stages/periods resurface.
  const warningKey = JSON.stringify(
    warnings.map((warning) => [
      warning.key,
      warning.title,
      periodRange(
        today,
        warning.key === "allowance"
          ? plan.frequency
          : warning.key === "daily"
            ? "day"
            : "week",
      ).start,
    ]),
  );
  const hasWarnings = warnings.length > 0;
  useEffect(() => {
    if (!hasWarnings) setDismissed("");
  }, [hasWarnings]);
  const visible = hasWarnings && dismissed !== warningKey;
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="budget-heads-up"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reduce ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ overflow: "hidden" }}
          >
            <section className="budget-warnings" aria-label="Budget warnings">
              <div className="budget-warning-heading">
                <strong>Spending heads-up</strong>
                <div className="budget-warning-actions">
                  <button className="textbutton" onClick={onPlan}>
                    Review plan
                  </button>
                  <button
                    className="budget-warning-dismiss"
                    aria-label="Dismiss spending heads-up"
                    onClick={() => setDismissed(warningKey)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning.key} className={warning.severity}>
                    <span aria-hidden="true">!</span>
                    <div>
                      <strong>{warning.title}</strong>
                      <p>{warning.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
