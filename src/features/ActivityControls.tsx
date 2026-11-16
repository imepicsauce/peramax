import { appEase } from "../lib/motion";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAppMotion } from "../hooks/useAppMotion";
import {
  categories,
  payments,
  type Category,
  type Payment,
  type Expense,
} from "../lib/types";
import { money, sumExpenses } from "../lib/finance";
export function ActivityControls({
  query,
  onQuery,
  category,
  onCategory,
  payment,
  onPayment,
  sort,
  onSort,
  entries,
  matching,
  onClear,
}: {
  query: string;
  onQuery: (value: string) => void;
  category: Category | "";
  onCategory: (value: Category | "") => void;
  payment: Payment | "";
  onPayment: (value: Payment | "") => void;
  sort: string;
  onSort: (value: string) => void;
  entries: Expense[];
  matching: Expense[];
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const reduce = useAppMotion();
  const count =
    Number(Boolean(category)) +
    Number(Boolean(payment)) +
    Number(sort !== "newest");
  const active = Boolean(category || payment || query.trim());
  function close() {
    setExpanded(false);
    toggle.current?.focus();
  }
  return (
    <div className="activity-controls">
      <div className="activity-search-row">
        <input
          aria-label="Search transactions"
          placeholder="Search expenses…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <button
          ref={toggle}
          type="button"
          className="activity-filter-toggle"
          aria-expanded={expanded}
          aria-controls="activity-filter-panel"
          onClick={() => setExpanded((value) => !value)}
        >
          Filters{count > 0 && <span className="filter-count">{count}</span>}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: appEase }}
            style={{ overflow: "hidden" }}
          >
            <section
              id="activity-filter-panel"
              className="activity-filter-panel"
              aria-label="Transaction filters"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  close();
                }
              }}
            >
              <div className="activity-filter-fields">
                <label>
                  Category
                  <select
                    aria-label="Filter category"
                    value={category}
                    onChange={(e) =>
                      onCategory(e.target.value as Category | "")
                    }
                  >
                    <option value="">All categories</option>
                    {categories.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Paid with
                  <select
                    aria-label="Filter payment method"
                    value={payment}
                    onChange={(e) => onPayment(e.target.value as Payment | "")}
                  >
                    <option value="">All payment methods</option>
                    {payments.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sort by
                  <select
                    aria-label="Sort transactions"
                    value={sort}
                    onChange={(e) => onSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="payment">Payment method</option>
                  </select>
                </label>
              </div>
              <div className="activity-panel-actions">
                <button
                  type="button"
                  className="textbutton"
                  onClick={() => {
                    onClear();
                    onSort("newest");
                  }}
                >
                  Reset
                </button>
                <button type="button" className="secondary" onClick={close}>
                  Done
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      {(active || sort !== "newest") && (
        <div className="active-filter-row" aria-label="Active filters">
          {category && (
            <button
              onClick={() => onCategory("")}
              aria-label={`Remove category filter ${category}`}
            >
              {category} <span aria-hidden="true">×</span>
            </button>
          )}
          {payment && (
            <button
              onClick={() => onPayment("")}
              aria-label={`Remove payment filter ${payment}`}
            >
              {payment} <span aria-hidden="true">×</span>
            </button>
          )}
          {sort !== "newest" && (
            <button onClick={() => onSort("newest")} aria-label="Reset sorting">
              {sort === "payment" ? "By payment" : "Oldest first"}{" "}
              <span aria-hidden="true">×</span>
            </button>
          )}
          {active && (
            <button className="clear-filter-action" onClick={onClear}>
              Clear filters
            </button>
          )}
        </div>
      )}
      <div className="activity-payment-heading">
        <span title="Totals for the selected period, before filters">
          Payment totals · period
        </span>
      </div>
      <span id="payment-totals-scope" className="sr-only">
        Totals for the selected period before category, payment, and search
        filters.
      </span>
      <section
        className="payment-totals"
        aria-label="Expenses by payment method"
        aria-describedby="payment-totals-scope"
      >
        {payments.map((value) => (
          <button
            key={value}
            aria-pressed={payment === value}
            onClick={() => onPayment(payment === value ? "" : value)}
          >
            <span>{value}</span>
            <strong>
              {money(
                sumExpenses(entries.filter((entry) => entry.payment === value)),
              )}
            </strong>
          </button>
        ))}
      </section>
      <div className="activity-results" role="status">
        <span>
          {matching.length} {matching.length === 1 ? "expense" : "expenses"}
          {active ? " matched" : " this period"}
        </span>
        <strong>{money(sumExpenses(matching))}</strong>
      </div>
    </div>
  );
}
