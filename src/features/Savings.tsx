import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  amountInput,
  formatDate,
  isDate,
  MAX_CENTAVOS,
  money,
  parseAmount,
} from "../lib/finance";
import type { SavingsGoal } from "../lib/types";
import { Icon } from "../components/Icon";
export function SavingsHub({
  goal,
  today,
  onEdit,
  onAdd,
}: {
  goal: SavingsGoal | null;
  today: string;
  onEdit: () => void;
  onAdd: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <section>
      <div className="sectionhead">
        <h3>Savings goal</h3>
        {goal && (
          <button className="textbutton" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      {!goal ? (
        <button className="goal-create" onClick={onEdit}>
          <Icon name="plus" />
          Set a savings goal<span>›</span>
        </button>
      ) : (
        <div className="goal-card">
          <div className="goal-top">
            <h3>{goal.name}</h3>
            {goal.saved >= goal.target && (
              <span className="badge">Goal reached</span>
            )}
          </div>
          <div className="goal-values">
            <div>
              <strong>{money(goal.saved)}</strong>
              <span>saved</span>
            </div>
            <span>of {money(goal.target)}</span>
          </div>
          <div
            className="track goal-track"
            role="progressbar"
            aria-label="Savings goal progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(
              100,
              Math.round((goal.saved / goal.target) * 100),
            )}
            aria-valuetext={`${money(goal.saved)} saved of ${money(goal.target)}`}
          >
            <motion.div
              initial={false}
              animate={{
                width: `${Math.min(100, (goal.saved / goal.target) * 100)}%`,
              }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            />
          </div>
          <div className="goal-meta">
            <span>
              {goal.saved >= goal.target
                ? "You’ve reached your target."
                : `${money(goal.target - goal.saved)} to go`}
            </span>
            {goal.date && (
              <span>
                {goal.date < today && goal.saved < goal.target
                  ? "Target passed"
                  : "Target"}{" "}
                ·{" "}
                {formatDate(goal.date, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <button className="primary full" onClick={onAdd}>
            <Icon name="plus" />
            Add savings
          </button>
        </div>
      )}
    </section>
  );
}
export function GoalForm({
  goal,
  onSave,
  onRemove,
}: {
  goal: SavingsGoal | null;
  onSave: (goal: SavingsGoal) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(goal?.name || ""),
    [target, setTarget] = useState(goal ? amountInput(goal.target) : ""),
    [saved, setSaved] = useState(goal ? amountInput(goal.saved) : "0"),
    [date, setDate] = useState(goal?.date || ""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      if (!name.trim()) throw new Error("Enter a name for your goal.");
      if (date && !isDate(date)) throw new Error("Enter a valid target date.");
      onSave({
        name: name.trim(),
        target: parseAmount(target),
        saved: parseAmount(saved, true),
        date,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (confirm)
    return (
      <div>
        <p>Remove this goal and its saved balance?</p>
        <div className="dialogactions">
          <button className="secondary" onClick={() => setConfirm(false)}>
            Keep goal
          </button>
          <button className="primary" onClick={onRemove}>
            Remove goal
          </button>
        </div>
      </div>
    );
  return (
    <form onSubmit={submit}>
      <label htmlFor="goal-name">What are you saving for?</label>
      <input
        id="goal-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Emergency fund"
        maxLength={60}
        required
      />
      <div className="formpair">
        <div>
          <label htmlFor="goal-target">Target amount (₱)</label>
          <input
            id="goal-target"
            type="number"
            min="0.01"
            max="99999999"
            step="0.01"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="goal-saved">Already saved (₱)</label>
          <input
            id="goal-saved"
            type="number"
            min="0"
            max="99999999"
            step="0.01"
            inputMode="decimal"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
            required
          />
        </div>
      </div>
      <label htmlFor="goal-date">
        Target date <span className="optional">optional</span>
      </label>
      <input
        id="goal-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <p className="help">
        Track money you’ve set aside. Your allowance and expenses stay separate.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="dialogactions">
        {goal && (
          <button
            type="button"
            className="danger"
            onClick={() => setConfirm(true)}
          >
            Remove goal
          </button>
        )}
        <button className="primary" type="submit">
          {goal ? "Save changes" : "Create goal"}
        </button>
      </div>
    </form>
  );
}
export function AddSavingsForm({
  goal,
  onAdd,
}: {
  goal: SavingsGoal;
  onAdd: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(""),
    [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const cents = parseAmount(amount);
      if (goal.saved + cents > MAX_CENTAVOS)
        throw new Error("Saved balance cannot exceed ₱99,999,999.");
      onAdd(cents);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <p className="saving-name">{goal.name}</p>
      <label htmlFor="saving-amount">Amount to add (₱)</label>
      <input
        id="saving-amount"
        className="amount-field"
        type="number"
        min="0.01"
        max="99999999"
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <p className="help">Record money you’ve already set aside.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary full" type="submit">
        Add savings
      </button>
    </form>
  );
}
