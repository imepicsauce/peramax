import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "./components/Icon";
import { PwaControls } from "./components/PwaControls";
import { PointerGlow } from "./components/PointerGlow";
import { Sheet } from "./components/Sheet";
import { Dashboard } from "./features/Dashboard";
import { ExpenseForm } from "./features/ExpenseForm";
import { PlanForm } from "./features/PlanForm";
import { GoalForm, AddSavingsForm, SavingsHub } from "./features/Savings";
import {
  Insights,
  PeriodPicker,
  Summary,
  Transactions,
} from "./features/Reports";
import { useLedger } from "./hooks/useLedger";
import { useToday } from "./hooks/useToday";
import { useScrollMorph } from "./hooks/useScrollMorph";
import {
  categories,
  type Category,
  type Expense,
  type Period,
  type Screen,
} from "./lib/types";
import { expensesInRange, movePeriod, periodRange } from "./lib/finance";
type Modal =
  | { type: "expense"; expense?: Expense }
  | { type: "plan" | "savings" | "goal" | "add-savings" | "demo" }
  | null;
export default function App() {
  const today = useToday(),
    { state, update, warning } = useLedger(today),
    reduce = useReducedMotion();
  const [screen, setScreen] = useState<Screen>("home"),
    [period, setPeriod] = useState<Period>("week"),
    [anchor, setAnchor] = useState(today),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<Category | "">(""),
    [modal, setModal] = useState<Modal>(null),
    [notice, setNotice] = useState<{ text: string; undo?: () => void } | null>(
      null,
    );
  const main = useRef<HTMLElement>(null);
  useScrollMorph(main);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const range = periodRange(anchor, period),
    entries = expensesInRange(state.expenses, range.start, range.end);
  const sorted = useMemo(
    () => [...entries].reverse().sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );
  const filtered = sorted.filter(
    (e) =>
      (!filter || e.category === filter) &&
      (e.note + " " + e.category + " " + e.payment)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function navigate(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function closeSheet() {
    setModal(
      modal?.type === "goal" || modal?.type === "add-savings"
        ? { type: "savings" }
        : null,
    );
  }
  function saveExpense(expense: Expense) {
    update((s) => ({
      ...s,
      expenses: s.expenses.some((e) => e.id === expense.id)
        ? s.expenses.map((e) => (e.id === expense.id ? expense : e))
        : [...s.expenses, expense],
    }));
    setAnchor(expense.date);
    setModal(null);
    setNotice({ text: "Expense saved." });
  }
  function deleteExpense(id: string) {
    const removed = state.expenses.find((e) => e.id === id);
    if (!removed) return;
    const index = state.expenses.findIndex((e) => e.id === id);
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
    setModal(null);
    setNotice({
      text: "Expense deleted.",
      undo: () => {
        update((s) => {
          if (s.expenses.some((e) => e.id === id)) return s;
          const expenses = [...s.expenses];
          expenses.splice(Math.min(index, expenses.length), 0, removed);
          return { ...s, expenses };
        });
        setNotice(null);
      },
    });
  }
  const title =
    modal?.type === "expense"
      ? modal.expense
        ? "Edit expense"
        : "Add expense"
      : modal?.type === "plan"
        ? "Your plan"
        : modal?.type === "savings"
          ? "Savings"
          : modal?.type === "goal"
            ? state.goal
              ? "Edit savings goal"
              : "New savings goal"
            : modal?.type === "add-savings"
              ? "Add savings"
              : "Remove demo expenses";
  const hasDemo = state.expenses.some((e) => e.demo);
  return (
    <>
      <div className="shell">
        <PointerGlow blocked={modal !== null} />
        <header>
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Peramax home"
          >
            peramax<span>.</span>
          </button>
          <span className="desktop-context">Personal ledger</span>
          <div className="header-actions">
            <button
              className="header-savings"
              onClick={() => setModal({ type: "savings" })}
              aria-haspopup="dialog"
            >
              <Icon name="target" />
              <span>Savings</span>
            </button>
            <button
              className="header-plan"
              onClick={() => setModal({ type: "plan" })}
              aria-haspopup="dialog"
            >
              <Icon name="wallet" />
              <span>My plan</span>
            </button>
          </div>
        </header>
        <main ref={main}>
          <div className="pagehead">
            <h1>
              {
                { home: "Home", activity: "Activity", insights: "Insights" }[
                  screen
                ]
              }
            </h1>
          </div>
          {warning && (
            <p className="warning storage-warning" role="alert">
              {warning}
            </p>
          )}
          <motion.div
            key={screen}
            className={`screen-content screen-${screen}`}
            initial={reduce ? false : { opacity: 0.5, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            {screen === "home" && (
              <Dashboard
                expenses={state.expenses}
                plan={state.plan}
                today={today}
                onPlan={() => setModal({ type: "plan" })}
              />
            )}
            <PeriodPicker
              period={period}
              start={range.start}
              end={range.end}
              onPeriod={setPeriod}
              onMove={(direction) =>
                setAnchor((a) => movePeriod(a, period, direction))
              }
              onToday={() => setAnchor(today)}
            />
            {screen !== "activity" && (
              <Summary
                entries={entries}
                period={period}
                start={range.start}
                end={range.end}
                today={today}
              />
            )}
            {screen === "insights" ? (
              <Insights
                entries={entries}
                period={period}
                start={range.start}
                end={range.end}
                today={today}
              />
            ) : (
              <section className="transactions">
                <div className="sectionhead">
                  <h2>
                    {screen === "activity" ? "Transactions" : "Recent activity"}{" "}
                    <span className="count">{entries.length}</span>
                  </h2>
                  {screen === "home" && (
                    <button
                      className="textbutton"
                      onClick={() => navigate("activity")}
                    >
                      View all ↗
                    </button>
                  )}
                </div>
                {screen === "activity" && (
                  <div className="filters">
                    <input
                      aria-label="Search transactions"
                      placeholder="Search notes, categories, or payment…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <select
                      aria-label="Filter category"
                      value={filter}
                      onChange={(e) =>
                        setFilter(e.target.value as Category | "")
                      }
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Transactions
                  entries={screen === "home" ? sorted.slice(0, 8) : filtered}
                  today={today}
                  onEdit={(expense) => setModal({ type: "expense", expense })}
                />
              </section>
            )}
          </motion.div>
          <PwaControls blocked={modal !== null} />
          <footer>
            <span>
              {hasDemo ? "Includes demo expenses · " : " "}Saved on this device
            </span>
            {hasDemo && (
              <button
                className="textbutton"
                onClick={() => setModal({ type: "demo" })}
              >
                Remove demo expenses
              </button>
            )}
            <span>Philippine peso · Asia/Manila</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="desktop-nav-brand" aria-hidden="true">
          peramax<span>.</span>
        </div>
        {(["home", "activity", "add", "plan", "insights"] as const).map(
          (item) => (
            <button
              key={item}
              className={
                "nav" +
                (item === "add" ? " nav-add" : "") +
                (item === screen ? " active" : "")
              }
              aria-label={item === "add" ? "Add expense" : undefined}
              aria-current={item === screen ? "page" : undefined}
              aria-haspopup={
                item === "add" || item === "plan" ? "dialog" : undefined
              }
              onClick={() =>
                item === "add"
                  ? setModal({ type: "expense" })
                  : item === "plan"
                    ? setModal({ type: "plan" })
                    : navigate(item)
              }
            >
              {item === screen && (
                <motion.span
                  className="nav-pill"
                  layoutId="nav-pill"
                  transition={{ duration: reduce ? 0 : 0.26 }}
                />
              )}
              <i>
                <Icon
                  name={
                    {
                      home: "home",
                      activity: "list",
                      add: "plus",
                      plan: "wallet",
                      insights: "chart",
                    }[item] as IconName
                  }
                />
              </i>
              <span>
                {
                  {
                    home: "Home",
                    activity: "Activity",
                    add: "Add",
                    plan: "Plan",
                    insights: "Insights",
                  }[item]
                }
              </span>
            </button>
          ),
        )}
        <div className="desktop-nav-footer">PHP · Asia/Manila</div>
      </nav>
      <Sheet
        open={modal !== null}
        title={title}
        screenKey={
          modal?.type === "expense"
            ? `expense-${modal.expense?.id || "new"}`
            : modal?.type || "closed"
        }
        onClose={closeSheet}
      >
        {modal?.type === "expense" ? (
          <ExpenseForm
            expense={modal.expense}
            today={today}
            onSave={saveExpense}
            onDelete={deleteExpense}
          />
        ) : modal?.type === "plan" ? (
          <PlanForm
            plan={state.plan}
            onSave={(plan) => {
              update((s) => ({ ...s, plan }));
              setModal(null);
              setNotice({ text: "Plan saved." });
            }}
          />
        ) : modal?.type === "savings" ? (
          <SavingsHub
            goal={state.goal}
            today={today}
            onEdit={() => setModal({ type: "goal" })}
            onAdd={() => setModal({ type: "add-savings" })}
          />
        ) : modal?.type === "goal" ? (
          <GoalForm
            goal={state.goal}
            onSave={(goal) => {
              update((s) => ({ ...s, goal }));
              setModal({ type: "savings" });
            }}
            onRemove={() => {
              update((s) => ({ ...s, goal: null }));
              setModal({ type: "savings" });
            }}
          />
        ) : modal?.type === "add-savings" && state.goal ? (
          <AddSavingsForm
            goal={state.goal}
            onAdd={(amount) => {
              update((s) => ({
                ...s,
                goal: s.goal
                  ? { ...s.goal, saved: s.goal.saved + amount }
                  : null,
              }));
              setModal({ type: "savings" });
            }}
          />
        ) : modal?.type === "demo" ? (
          <div>
            <p>
              Remove the example expenses? Your own entries, plan, and savings
              goal will stay.
            </p>
            <div className="dialogactions">
              <button className="secondary" onClick={() => setModal(null)}>
                Keep them
              </button>
              <button
                className="primary"
                onClick={() => {
                  update((s) => ({
                    ...s,
                    expenses: s.expenses.filter((e) => !e.demo),
                  }));
                  setModal(null);
                  setNotice({ text: "Demo expenses removed." });
                }}
              >
                Remove examples
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>
      {notice && (
        <motion.div
          className="toast"
          role="status"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{notice.text}</span>
          {notice.undo && <button onClick={notice.undo}>Undo</button>}
        </motion.div>
      )}
    </>
  );
}
