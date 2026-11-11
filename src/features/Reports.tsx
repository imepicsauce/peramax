import { motion, useReducedMotion } from "motion/react";
import {
  categories,
  type Category,
  type Expense,
  type Period,
} from "../lib/types";
import {
  elapsedDays,
  formatDate,
  money,
  shiftDate,
  sumExpenses,
} from "../lib/finance";
import { Icon, type IconName } from "../components/Icon";
export function PeriodPicker({
  period,
  start,
  end,
  onPeriod,
  onMove,
  onToday,
}: {
  period: Period;
  start: string;
  end: string;
  onPeriod: (period: Period) => void;
  onMove: (n: number) => void;
  onToday: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="toolbar">
      <div className="segments" aria-label="Reporting period">
        {(["day", "week", "month"] as const).map((p) => (
          <button
            key={p}
            aria-pressed={p === period}
            className={p === period ? "selected" : ""}
            onClick={() => onPeriod(p)}
          >
            {p === period && (
              <motion.span
                className="segment-pill"
                layoutId="period-pill"
                transition={{ duration: reduce ? 0 : 0.24 }}
              />
            )}
            <span>{p[0].toUpperCase() + p.slice(1)}</span>
          </button>
        ))}
      </div>
      <div className="datecontrol">
        <button aria-label="Previous period" onClick={() => onMove(-1)}>
          ‹
        </button>
        <button
          className="date-label"
          aria-label="Return to current period"
          title="Return to current period"
          onClick={onToday}
        >
          {period === "day"
            ? formatDate(start, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : period === "month"
              ? formatDate(start, { month: "long", year: "numeric" })
              : `${formatDate(start)} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`}
        </button>
        <button aria-label="Next period" onClick={() => onMove(1)}>
          ›
        </button>
      </div>
    </div>
  );
}
export function Summary({
  entries,
  period,
  start,
  end,
  today,
}: {
  entries: Expense[];
  period: Period;
  start: string;
  end: string;
  today: string;
}) {
  const total = sumExpenses(entries),
    top = categories
      .map((name) => ({
        name,
        value: sumExpenses(entries.filter((e) => e.category === name)),
      }))
      .sort((a, b) => b.value - a.value)[0];
  return (
    <section className="summary">
      <div className="total">
        <span className="eyebrow">
          TOTAL SPENT <span>{period.toUpperCase()}</span>
        </span>
        <strong className="bigamount">{money(total)}</strong>
      </div>
      <div className="metric">
        <span>Daily average</span>
        <strong>
          {money(Math.round(total / elapsedDays(start, end, today)))}
        </strong>
      </div>
      <div className="metric">
        <span>Top category</span>
        <strong>{total ? top.name : "—"}</strong>
      </div>
    </section>
  );
}
const categoryIcon: Record<Category, IconName> = {
  Food: "food",
  Pamasahe: "ride",
  Groceries: "bag",
  "Load / data": "phone",
  Bills: "bill",
  Others: "other",
};
export function Transactions({
  entries,
  today,
  onEdit,
}: {
  entries: Expense[];
  today: string;
  onEdit: (entry: Expense) => void;
}) {
  return (
    <div className="rows">
      {entries.length > 0 && (
        <div className="transaction-columns" aria-hidden="true">
          <span>Expense</span>
          <span>Date</span>
          <span>Payment</span>
          <span>Amount</span>
        </div>
      )}
      {entries.length ? (
        entries.map((entry) => (
          <button
            className="transaction"
            key={entry.id}
            onClick={() => onEdit(entry)}
            aria-label={`Edit ${entry.note || entry.category}`}
          >
            <span className="expense-name">
              <span className="expenseicon">
                <Icon name={categoryIcon[entry.category]} />
              </span>
              <span>
                <strong>{entry.note || entry.category}</strong>
                <small>
                  {entry.category}
                  <span className="mobile-transaction-date">
                    {" "}
                    · {entry.date === today ? "Today" : formatDate(entry.date)}
                  </span>
                </small>
              </span>
            </span>
            <span className="transaction-date">
              {entry.date === today
                ? "Today"
                : formatDate(entry.date, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
            </span>
            <span className="transaction-payment">{entry.payment}</span>
            <strong className="expenseamount">{money(entry.amount)}</strong>
          </button>
        ))
      ) : (
        <p className="empty">No expenses for this period.</p>
      )}
    </div>
  );
}
export function Insights({
  entries,
  period,
  start,
  end,
  today,
}: {
  entries: Expense[];
  period: Period;
  start: string;
  end: string;
  today: string;
}) {
  const reduce = useReducedMotion(),
    total = sumExpenses(entries),
    breakdown = categories
      .map((name) => ({
        name,
        value: sumExpenses(entries.filter((e) => e.category === name)),
      }))
      .filter((e) => e.value)
      .sort((a, b) => b.value - a.value);
  const buckets: { label: string; value: number; current: boolean }[] = [];
  if (period === "day")
    categories.forEach((name) =>
      buckets.push({
        label: name === "Load / data" ? "Load" : name,
        value: sumExpenses(entries.filter((e) => e.category === name)),
        current: false,
      }),
    );
  else {
    let dates: string[] = [];
    for (let day = start; day <= end; day = shiftDate(day, 1)) dates.push(day);
    const step = period === "month" ? Math.ceil(dates.length / 6) : 1;
    for (let i = 0; i < dates.length; i += step) {
      const from = dates[i],
        to = dates[Math.min(dates.length - 1, i + step - 1)];
      buckets.push({
        label:
          period === "week"
            ? formatDate(from, { weekday: "short" })
            : `${i + 1}–${Math.min(dates.length, i + step)}`,
        value: sumExpenses(
          entries.filter((e) => e.date >= from && e.date <= to),
        ),
        current: today >= from && today <= to,
      });
    }
  }
  const max = Math.max(10000, ...buckets.map((b) => b.value)) * 1.25;
  return (
    <>
      <section className="chartsection">
        <div className="sectionhead">
          <h2>Spending rhythm</h2>
          <span className="legend">● Expenses</span>
        </div>
        <div
          className="chart"
          role="img"
          aria-label={buckets
            .map((b) => `${b.label}: ${money(b.value)}`)
            .join(", ")}
        >
          <div className="axis">
            <span>{money(max)}</span>
            <span>{money(max / 2)}</span>
            <span>₱0</span>
          </div>
          <div className="bars">
            {buckets.map((b) => (
              <div className="barwrap" key={b.label}>
                <motion.div
                  className={"bar" + (b.current ? " dark" : "")}
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: `${(b.value / max) * 100}%` }}
                  transition={{ duration: reduce ? 0 : 0.35 }}
                >
                  <span className="barvalue">
                    {b.value ? money(b.value).replace(".00", "") : ""}
                  </span>
                </motion.div>
                <small>{b.label}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="breakdown">
        <h2>Where it went</h2>
        {breakdown.length ? (
          breakdown.map((b, i) => (
            <div className="categoryrow" key={b.name}>
              <div>
                <span>{b.name}</span>
                <strong>{money(b.value)}</strong>
              </div>
              <div className="track">
                <motion.div
                  initial={false}
                  animate={{ width: `${(b.value / total) * 100}%` }}
                  transition={{ duration: reduce ? 0 : 0.4 }}
                  style={{
                    background: [
                      "#1d392b",
                      "#546044",
                      "#879580",
                      "#b2bca5",
                      "#6f8069",
                    ][i % 5],
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="empty">Your categories will appear here.</p>
        )}
      </section>
    </>
  );
}
