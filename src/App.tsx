import { useBlurPreference } from "./hooks/useBlurPreference";
import { ActivityControls } from "./features/ActivityControls";
import { useAppMotion } from "./hooks/useAppMotion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, type IconName } from "./components/Icon";
import { PwaControls } from "./components/PwaControls";
import { PointerGlow } from "./components/PointerGlow";
import { Sheet } from "./components/Sheet";
import { BudgetWarnings } from "./components/BudgetWarnings";
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
  type Payment,
  type Category,
  type Expense,
  type Period,
  type Screen,
} from "./lib/types";
import { More } from "./features/More";
import { demoExpenses } from "./lib/demo";
import {
  expensesInRange,
  movePeriod,
  periodRange,
  planSummary,
  money,
} from "./lib/finance";
type Modal =
  | { type: "expense"; expense?: Expense }
  | { type: "plan" | "savings" | "goal" | "add-savings" | "demo" }
  | null;
export default function App() {
  const blurDisabled = useBlurPreference();
  useEffect(() => {
    document.documentElement.classList.toggle("no-blur", blurDisabled);
  }, [blurDisabled]);
  const today = useToday(),
    { state, update, warning } = useLedger(today),
    reduce = useAppMotion();
  const [screen, setScreen] = useState<Screen>("home"),
    [period, setPeriod] = useState<Period>("week"),
    [anchor, setAnchor] = useState(today),
    [query, setQuery] = useState(""),
    [paymentFilter, setPaymentFilter] = useState<Payment | "">(""),
    [sort, setSort] = useState("newest"),
    [filter, setFilter] = useState<Category | "">(""),
    [modal, setModal] = useState<Modal>(null),
    [notice, setNotice] = useState<{ text: string; undo?: () => void } | null>(
      null,
    );
  const main = useRef<HTMLElement>(null);
  const planButton = useRef<HTMLButtonElement>(null);
  const [planHighlight, setPlanHighlight] = useState(0);
  useEffect(() => {
    if (!planHighlight) return;
    const timer = setTimeout(() => setPlanHighlight(0), 2800);
    const dismissOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        planButton.current?.contains(target) ||
        target.closest(".allowance-guide")
      )
        return;
      setPlanHighlight(0);
    };
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlanHighlight(0);
    };
    document.addEventListener("click", dismissOutside, true);
    document.addEventListener("keydown", dismissEscape);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", dismissOutside, true);
      document.removeEventListener("keydown", dismissEscape);
    };
  }, [planHighlight]);
  function findPlan() {
    setPlanHighlight((value) => value + 1);
    planButton.current?.focus({ preventScroll: true });
  }
  useScrollMorph(main);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.undo ? 15000 : 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const range = periodRange(anchor, period),
    entries = expensesInRange(state.expenses, range.start, range.end);
  const sorted = useMemo(
    () => [...entries].reverse().sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );
  const filtered = sorted
    .filter(
      (e) =>
        (!filter || e.category === filter) &&
        (!paymentFilter || e.payment === paymentFilter) &&
        (e.note + " " + e.category + " " + e.payment)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "payment"
        ? a.payment.localeCompare(b.payment) || b.date.localeCompare(a.date)
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  const hasFilters = Boolean(filter || paymentFilter || query.trim());
  function clearFilters() {
    setFilter("");
    setPaymentFilter("");
    setQuery("");
  }
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
    const nextExpenses = state.expenses.some((e) => e.id === expense.id)
      ? state.expenses.map((e) => (e.id === expense.id ? expense : e))
      : [...state.expenses, expense];
    const balance = planSummary(nextExpenses, state.plan, today);
    const periodLabel = {
      day: "today",
      week: "this week",
      month: "this month",
    }[state.plan.frequency];
    update((s) => ({
      ...s,
      lastPayment: expense.payment,
      expenses: s.expenses.some((e) => e.id === expense.id)
        ? s.expenses.map((e) => (e.id === expense.id ? expense : e))
        : [...s.expenses, expense],
    }));
    setAnchor(expense.date);
    setModal(null);
    setNotice({
      text: `${money(expense.amount)} saved${balance.left === null ? "." : ` · ${money(Math.abs(balance.left))} ${balance.left < 0 ? "over allowance" : "left"} ${periodLabel}.`}`,
    });
  }
  function deleteExpense(id: string) {
    const removed = state.expenses.find((e) => e.id === id);
    if (!removed) return;
    const index = state.expenses.findIndex((e) => e.id === id);
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
    setModal(null);
    setNotice({
      text: `${money(removed.amount)} expense deleted.`,
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
        ? "My plan"
        : modal?.type === "savings"
          ? "Savings"
          : modal?.type === "goal"
            ? state.goal
              ? "Edit savings goal"
              : "New savings goal"
            : modal?.type === "add-savings"
              ? "Add savings"
              : "Remove demo expenses";
  const recent = [...state.expenses]
    .reverse()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
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
          <span className="desktop-context">Everyday spending</span>
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
              ref={planButton}
              onClick={() => {
                setPlanHighlight(0);
                setModal({ type: "plan" });
              }}
              aria-haspopup="dialog"
            >
              <Icon name="wallet" />
              <span>My plan</span>
              {planHighlight > 0 && (
                <span
                  key={planHighlight}
                  className="plan-attention"
                  aria-hidden="true"
                >
                  <motion.span
                    className="plan-locator"
                    initial={reduce ? false : { opacity: 0.9, scale: 1 }}
                    animate={
                      reduce
                        ? { opacity: 1, scale: 1 }
                        : { opacity: [0.9, 0.7, 0], scale: [1, 1.07, 1.16] }
                    }
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.75, repeat: 2, ease: "easeOut" }
                    }
                  />
                  <motion.span
                    className="plan-hint"
                    initial={reduce ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                  >
                    Edit your allowance here
                  </motion.span>
                </span>
              )}
            </button>
          </div>
        </header>
        <main ref={main}>
          <div className="pagehead">
            <h1>
              {
                {
                  home: "Home",
                  activity: "Activity",
                  insights: "Insights",
                  more: "More",
                }[screen]
              }
            </h1>
          </div>
          {hasDemo && (
            <div className="demo-notice">
              <span>You’re viewing example expenses.</span>
              <button
                className="textbutton"
                onClick={() => setModal({ type: "demo" })}
              >
                Remove examples
              </button>
            </div>
          )}
          {warning && (
            <p className="warning storage-warning" role="alert">
              {warning}
            </p>
          )}
          <BudgetWarnings
            expenses={state.expenses}
            plan={state.plan}
            today={today}
            onPlan={() => setModal({ type: "plan" })}
          />
          <motion.div
            key={screen}
            className={`screen-content screen-${screen}`}
            initial={reduce ? false : { opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
          >
            {screen === "more" ? (
              <More />
            ) : (
              <>
                {screen === "home" && (
                  <Dashboard
                    expenses={state.expenses}
                    plan={state.plan}
                    today={today}
                    onPlan={() => setModal({ type: "plan" })}
                    onFindPlan={findPlan}
                    onAdd={() => setModal({ type: "expense" })}
                  />
                )}
                {screen !== "home" && (
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
                )}
                {screen === "insights" && (
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
                    onEdit={expense => setModal({ type: "expense", expense })}
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
                        {screen === "activity"
                          ? "Transactions"
                          : "Recent activity"}{" "}
                        <span className="count">
                          {screen === "home"
                            ? `${recent.length} of ${state.expenses.length}`
                            : filtered.length}
                        </span>
                      </h2>
                      {screen === "home" && (
                        <button
                          className="textbutton"
                          onClick={() => {
                            clearFilters();
                            setPeriod("month");
                            setAnchor(recent[0]?.date ?? today);
                            navigate("activity");
                          }}
                        >
                          View all
                        </button>
                      )}
                    </div>
                    {screen === "activity" && (
                      <ActivityControls
                        query={query}
                        onQuery={setQuery}
                        category={filter}
                        onCategory={setFilter}
                        payment={paymentFilter}
                        onPayment={setPaymentFilter}
                        sort={sort}
                        onSort={setSort}
                        entries={entries}
                        matching={filtered}
                        onClear={clearFilters}
                      />
                    )}
                    <Transactions
                      emptyMessage={
                        screen === "activity" && hasFilters
                          ? "No matching expenses. Clear filters to see this period’s entries."
                          : "No expenses for this period."
                      }
                      entries={screen === "home" ? recent : filtered}
                      today={today}
                      onEdit={(expense) =>
                        setModal({ type: "expense", expense })
                      }
                    />
                  </section>
                )}
              </>
            )}
          </motion.div>
          {state.expenses.length === 0 && state.plan.allowance === null && (
            <div className="first-run">
              <p>
                Start with your allowance, then log what you spend. Your entries
                stay on this device.
              </p>
              <button
                className="textbutton"
                onClick={() =>
                  update((s) => ({ ...s, expenses: demoExpenses(today) }))
                }
              >
                Try demo expenses
              </button>
            </div>
          )}
          <PwaControls blocked={modal !== null} />
          <footer>
            <span>
              {hasDemo ? "Includes demo expenses · " : " "}Saved on this device
            </span>
            <span>PHP · Asia/Manila</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="desktop-nav-brand" aria-hidden="true">
          peramax<span>.</span>
        </div>
        {(["home", "activity", "add", "insights", "more"] as const).map(
          (item) => (
            <button
              key={item}
              className={
                "nav" +
                (item === "add" ? " nav-add" : "") +
                (item === screen ? " active" : "")
              }
              aria-label={
                item === "add"
                  ? "Add expense"
                  : item === "more"
                    ? "More"
                    : undefined
              }
              aria-current={item === screen ? "page" : undefined}
              aria-haspopup={item === "add" ? "dialog" : undefined}
              onClick={() =>
                item === "add" ? setModal({ type: "expense" }) : navigate(item)
              }
            >
              {item === screen && (
                <motion.span
                  className="nav-pill"
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduce ? 0 : 0.16 }}
                />
              )}
              <i>
                <Icon
                  name={
                    {
                      home: "home",
                      activity: "list",
                      add: "plus",
                      more: "other",
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
                    more: "More",
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
        autoFocusInput={modal?.type === "expense" && !modal.expense}
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
            lastPayment={state.lastPayment}
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
      <AnimatePresence initial={false}>
        {notice && (
          <motion.div
            className="toast"
            key="notice"
            exit={{ opacity: 0, y: reduce ? 0 : 4 }}
            transition={{
              duration: reduce ? 0 : 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="status"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{notice.text}</span>
            {notice.undo && <button onClick={notice.undo}>Undo</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
