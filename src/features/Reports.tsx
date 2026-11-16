import { useEffect, useState } from "react";
import { appEase, progressDuration } from "../lib/motion";
import { useAppMotion } from "../hooks/useAppMotion";
import { motion } from "motion/react";
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
  const reduce = useAppMotion();
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
                transition={{ duration: reduce ? 0 : 0.2, ease: appEase }}
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
  emptyMessage = "No expenses for this period.",
}: {
  entries: Expense[];
  today: string;
  onEdit: (entry: Expense) => void;
  emptyMessage?: string;
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
            aria-describedby={`expense-details-${entry.id}`}
          >
            <span className="sr-only" id={`expense-details-${entry.id}`}>
              {money(entry.amount)} · {entry.category} · {entry.payment} ·{" "}
              {formatDate(entry.date, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
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
                    <span className="mobile-payment"> · {entry.payment}</span>
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
        <p className="empty">{emptyMessage}</p>
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
  onEdit,
}: {
  entries: Expense[];
  period: Period;
  start: string;
  end: string;
  today: string;
  onEdit: (expense: Expense) => void;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const reduce = useAppMotion(),
    total = sumExpenses(entries),
    breakdown = categories
      .map((name) => ({
        name,
        value: sumExpenses(entries.filter((e) => e.category === name)),
      }))
      .filter((e) => e.value)
      .sort((a, b) => b.value - a.value);
  const scope = `${period}:${start}:${end}`;
  useEffect(() => { setSelection(null); }, [scope]);
  const buckets: { key: string; label: string; title: string; entries: Expense[]; value: number; current: boolean }[] = [];
  if (period === "day")
    categories.forEach((name) =>
      buckets.push({
        key: `${scope}:${name}`,
        title: `${name} · ${formatDate(start)}`,
        entries: entries.filter(e => e.category === name),
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
        key: `${scope}:${from}`,
        title: from === to ? formatDate(from, { weekday: "long", month: "short", day: "numeric" }) : `${formatDate(from)} – ${formatDate(to)}`,
        entries: entries.filter(e => e.date >= from && e.date <= to),
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
  const selected = buckets.find(bucket => bucket.key === selection);
  const chartMoney = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value / 100);
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
          role="group"
          aria-label={buckets
            .map((b) => `${b.label}: ${money(b.value)}`)
            .join(", ")}
        >
          <div className="axis">
            <span title={money(max)}>{chartMoney(max)}</span>
            <span title={money(max / 2)}>{chartMoney(max / 2)}</span>
            <span>₱0</span>
          </div>
          <div className="bars">
            {buckets.map((b) => (
              <button type="button" className={`barwrap bar-select${selected && selected.key !== b.key ? " bar-muted" : ""}`} key={b.key}
                aria-label={`${b.title}: ${money(b.value)}`}
                aria-pressed={selected?.key === b.key}
                aria-controls="insights-expenses"
                onClick={() => setSelection(selection === b.key ? null : b.key)}
                onKeyDown={event => { if (event.key === "Escape") setSelection(null); }}
              >
                <motion.div
                  className={"bar" + (b.current || selected?.key === b.key ? " dark" : "")}
                  style={{ height: "100%", transformOrigin: "center bottom" }}
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: b.value / max }}
                  transition={{
                    duration: reduce ? 0 : progressDuration,
                    ease: appEase,
                  }}
                />
                <span className="barvalue" title={money(b.value)}>
                  {b.value ? chartMoney(b.value) : ""}
                </span>
                <small>{b.label}</small>
              </button>
            ))}
          </div>
        </div>
        <div id="insights-expenses">
          {selected && <motion.section className="bar-expenses" aria-label="Selected bar expenses" key={selected.key}
            initial={reduce ? false : { opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.16, ease: appEase }}>
            <div className="sectionhead"><h3>{selected.title}</h3><button className="textbutton" onClick={() => { setSelection(null); document.querySelector<HTMLButtonElement>('.bar-select[aria-pressed="true"]')?.focus(); }}>Clear selection</button></div>
            <p className="bar-selection-total" role="status">{money(selected.value)} · {selected.entries.length} {selected.entries.length === 1 ? "expense" : "expenses"}</p>
            <Transactions entries={[...selected.entries].reverse().sort((a,b) => b.date.localeCompare(a.date))} today={today} onEdit={onEdit} emptyMessage="No expenses in this bar." />
          </motion.section>}
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
                  animate={{ scaleX: b.value / total }}
                  transition={{
                    duration: reduce ? 0 : progressDuration,
                    ease: appEase,
                  }}
                  style={{
                    width: "100%",
                    transformOrigin: "left center",
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
