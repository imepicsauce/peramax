import { motion, useReducedMotion } from "motion/react";
import { money, planSummary, formatDate, weeklySavingSummary } from "../lib/finance";
import type { Expense, Plan } from "../lib/types";
export function Dashboard({
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
  const info = planSummary(expenses, plan, today),
    reduce = useReducedMotion(),
    saving = weeklySavingSummary(expenses, plan, today);
  return (
    <section className="money-home">
      <div className="allowance-card">
        <div className="balance-heading">
          <span>
            {plan.frequency === "week"
              ? "THIS WEEK’S ALLOWANCE"
              : plan.frequency === "month" ? "THIS MONTH’S ALLOWANCE" : "TODAY’S ALLOWANCE"}
          </span>
          <button onClick={onPlan}>Manage ↗</button>
        </div>
        <p className="balance-label">
          {info.left !== null && info.left < 0
            ? "Over your allowance"
            : "Allowance left"}
        </p>
        <strong
          className={
            "available-balance" + (info.left === null ? " unconfigured" : "")
          }
        >
          {info.left === null
            ? "Set your allowance"
            : money(Math.abs(info.left))}
        </strong>
        <p className="balance-hint">
          {info.left === null
            ? "Add an allowance in your plan."
            : info.left < 0
              ? "Expenses exceed your allowance."
              : "Allowance minus expenses."}
        </p>
        <div className="balance-split">
          <div>
            <span>Allowance</span>
            <strong>
              {plan.allowance === null ? "Not set" : money(plan.allowance)}
            </strong>
          </div>
          <div>
            <span>Expenses</span>
            <strong>{money(info.spent)}</strong>
          </div>
        </div>
        <div className="allowance-track" aria-hidden="true">
          <motion.div
            initial={false}
            animate={{
              width: `${plan.allowance ? Math.min(100, (info.spent / plan.allowance) * 100) : 0}%`,
            }}
            transition={{ duration: reduce ? 0 : 0.4 }}
          />
        </div>
        <div className="balance-legend">
          <span>● Spent</span>
          <span>○ Allowance left</span>
        </div>
        <p className="balance-dates">
          {plan.frequency !== "day"
            ? `${formatDate(info.start)} – ${formatDate(info.end, { month: "short", day: "numeric", year: "numeric" })}${plan.frequency === "week" ? " · Mon–Sun" : ""}`
            : formatDate(today, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
        </p>
      </div>
      <section>
        <div className="weekly-saving-card">
          <div className="sectionhead">
            <h2>Weekly saving goal</h2>
            <button className="textbutton" onClick={onPlan}>{saving ? "Edit ↗" : "Set goal ↗"}</button>
          </div>
          {saving ? <>
            <p className="saving-status">{saving.status} · {formatDate(saving.start)} – {formatDate(saving.end, { month: "short", day: "numeric", year: "numeric" })}</p>
            <strong className="saving-value">{money(saving.amount)}</strong>
            <p className="help">to keep unspent by Sunday</p>
            <div className="balance-split">
              <div><span>Week’s allowance</span><strong>{saving.budget === null ? "Not set" : money(saving.budget)}</strong></div>
              <div><span>{saving.finished ? "Unspent" : "Unspent now"}</span><strong>{saving.left === null ? "Not set" : money(saving.left)}</strong></div>
            </div>
            <p className="help">{saving.left === null ? "Set your allowance in My plan." : saving.finished ? "Based on logged expenses for this week." : today < saving.start ? "Your goal starts on Monday." : saving.left >= saving.amount ? `${money(saving.left - saving.amount)} available to spend while keeping your goal.` : `${money(saving.amount - saving.left)} below your savings target.`}</p>
            {plan.frequency === "month" && <p className="help">Monthly allowance prorated by calendar days.</p>}
          </> : <p className="help">Choose how much of your allowance to keep unspent this week.</p>}
        </div>
        <div className="sectionhead">
          <h2>Spending limits</h2>
          <button className="textbutton" onClick={onPlan}>
            Set limits ↗
          </button>
        </div>
        <div className="limit-grid">
          {info.limits.map((limit) => {
            const left =
                limit.limit === null ? null : limit.limit - limit.spent,
              ratio = limit.limit ? limit.spent / limit.limit : 0;
            return (
              <button
                key={limit.key}
                className={
                  "limit-card" + (left !== null && left <= 0 ? " exceeded" : ratio >= 0.8 ? " nearing" : "")
                }
                onClick={onPlan}
              >
                <div className="limit-top">
                  <span>{limit.title}</span>
                  <span>
                    {left === null
                      ? "Set limit ↗"
                      : left < 0
                        ? "Over limit"
                        : left === 0 ? "Limit reached" : ratio >= 0.8
                          ? "Getting close"
                          : "On track"}
                  </span>
                </div>
                <div className="limit-amount">
                  <strong>
                    {money(left === null ? limit.spent : Math.abs(left))}
                  </strong>
                  <span>
                    {left === null
                      ? "spent · no limit set"
                      : left < 0
                        ? "over your limit"
                        : "left to spend"}
                  </span>
                </div>
                <div className="track">
                  <motion.div
                    initial={false}
                    animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                    transition={{ duration: reduce ? 0 : 0.4 }}
                  />
                </div>
                <p>
                  {money(limit.spent)} spent
                  {limit.limit !== null
                    ? " of " + money(limit.limit)
                    : ""} · {limit.key === "daily" ? "Today" : "Mon–Sun"}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}
