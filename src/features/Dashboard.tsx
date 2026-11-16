import { appEase, progressDuration } from "../lib/motion";
import { useAppMotion } from "../hooks/useAppMotion";
import { motion } from "motion/react";
import {
  money,
  planSummary,
  formatDate,
  weeklySavingSummary,
} from "../lib/finance";
import type { Expense, Plan } from "../lib/types";
export function Dashboard({
  expenses,
  plan,
  today,
  onPlan,
  onAdd,
  onFindPlan,
}: {
  expenses: Expense[];
  plan: Plan;
  today: string;
  onPlan: () => void;
  onAdd?: () => void;
  onFindPlan?: () => void;
}) {
  const info = planSummary(expenses, plan, today),
    reduce = useAppMotion(),
    saving = weeklySavingSummary(expenses, plan, today);
  return (
    <section className="money-home">
      <div className="allowance-card">
        {onFindPlan && (
          <button
            type="button"
            className="allowance-guide"
            aria-label="Highlight My plan in the header"
            onClick={onFindPlan}
          />
        )}
        <div className="balance-heading">
          <span>
            {plan.frequency === "week"
              ? "THIS WEEK’S ALLOWANCE"
              : plan.frequency === "month"
                ? "THIS MONTH’S ALLOWANCE"
                : "TODAY’S ALLOWANCE"}
          </span>
        </div>
        <p className="balance-label">
          {info.left !== null && info.left < 0
            ? "Over your allowance"
            : "Allowance left"}
        </p>
        {info.left === null ? (
          <button className="setup-allowance" onClick={onPlan}>
            Set your allowance
          </button>
        ) : (
          <strong
            className={
              "available-balance" + (info.left === null ? " unconfigured" : "")
            }
          >
            {info.left === null
              ? "Set your allowance"
              : money(Math.abs(info.left))}
          </strong>
        )}
        {(info.left === null ||
          info.left <= 0 ||
          (plan.allowance !== null &&
            info.spent * 5 >= plan.allowance * 4)) && (
          <p className="balance-hint">
            {info.left === null
              ? "Add an allowance in your plan."
              : info.left < 0
                ? "Expenses exceed your allowance."
                : info.left === 0
                  ? "Allowance used up."
                  : plan.allowance !== null &&
                      info.spent * 5 >= plan.allowance * 4
                    ? "Allowance is low · 20% or less remaining."
                    : "Allowance minus expenses."}
          </p>
        )}
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
            style={{ width: "100%", transformOrigin: "left center" }}
            animate={{
              scaleX: plan.allowance
                ? Math.min(1, info.spent / plan.allowance)
                : 0,
            }}
            transition={{
              duration: reduce ? 0 : progressDuration,
              ease: appEase,
            }}
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
        {onAdd && (
          <button className="log-expense" onClick={onAdd}>
            Log expense
          </button>
        )}
      </div>
      <section className="plan-overview restored-limits">
        <div className="sectionhead">
          <h2>Spending limits</h2>
          <button className="textbutton" onClick={onPlan}>
            Edit plan
          </button>
        </div>
        <div className="limit-grid">
          {info.limits.map((limit) => {
            const left =
              limit.limit === null ? null : limit.limit - limit.spent;
            const ratio = limit.limit ? limit.spent / limit.limit : 0;
            return (
              <button
                type="button"
                onClick={onPlan}
                key={limit.key}
                className={
                  "limit-card" +
                  (left !== null && left <= 0
                    ? " exceeded"
                    : ratio >= 0.8
                      ? " nearing"
                      : "")
                }
              >
                <div className="limit-top">
                  <span>{limit.title}</span>
                  <span>
                    {left === null
                      ? "Not set"
                      : left < 0
                        ? "Over limit"
                        : left === 0
                          ? "Limit reached"
                          : ratio >= 0.8
                            ? "Nearly reached"
                            : "On track"}
                  </span>
                </div>
                <div className="limit-amount">
                  <strong>
                    {money(left === null ? limit.spent : Math.abs(left))}
                  </strong>
                  <span>
                    {left === null
                      ? "spent"
                      : left < 0
                        ? "over limit"
                        : "left to spend"}
                  </span>
                </div>
                <div className="track">
                  <motion.div
                    initial={false}
                    style={{ width: "100%", transformOrigin: "left center" }}
                    animate={{ scaleX: Math.min(1, ratio) }}
                    transition={{
                      duration: reduce ? 0 : progressDuration,
                      ease: appEase,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className="weekly-saving-card">
          <h3>Weekly saving goal</h3>
          {saving ? (
            <>
              <p className="saving-status">
                {saving.status} · {formatDate(saving.start)} –{" "}
                {formatDate(saving.end)}
              </p>
              <div className="saving-inline">
                <strong>{money(saving.amount)}</strong>
                <span>to keep unspent</span>
              </div>
              <p className="help">
                {saving.left === null
                  ? "Set your allowance in My plan."
                  : `${money(saving.left)} ${saving.finished ? "left at week’s end" : "left so far"}.`}
                {plan.frequency === "month"
                  ? " Based on this week’s share of monthly allowance."
                  : ""}
              </p>
            </>
          ) : (
            <button className="textbutton" onClick={onPlan}>
              Set a weekly goal
            </button>
          )}
        </div>
      </section>
    </section>
  );
}
