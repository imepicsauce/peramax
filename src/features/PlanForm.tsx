import { useState, type FormEvent } from "react";
import { amountInput, parseAmount } from "../lib/finance";
import type { Plan } from "../lib/types";
export function PlanForm({
  plan,
  onSave,
}: {
  plan: Plan;
  onSave: (plan: Plan) => void;
}) {
  const [allowance, setAllowance] = useState(amountInput(plan.allowance)),
    [daily, setDaily] = useState(amountInput(plan.daily)),
    [weekly, setWeekly] = useState(amountInput(plan.weekly)),
    [frequency, setFrequency] = useState(plan.frequency),
    [error, setError] = useState("");
  const warning =
    Number(allowance) > 0 &&
    (frequency === "day" ? Number(daily) : Number(weekly)) > Number(allowance)
      ? "Your spending limit exceeds your allowance."
      : Number(daily) > 0 &&
          Number(weekly) > 0 &&
          Number(daily) > Number(weekly)
        ? "Your daily limit is higher than your weekly limit. Both are tracked independently."
        : "";
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const optional = (value: string) =>
        value.trim() === "" ? null : parseAmount(value);
      onSave({
        allowance: optional(allowance),
        frequency,
        daily: optional(daily),
        weekly: optional(weekly),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <section className="plan-panel">
        <h3>Allowance</h3>
        <div className="formpair">
          <div>
            <label htmlFor="plan-allowance">Allowance (₱)</label>
            <input
              id="plan-allowance"
              type="number"
              min="0.01"
              max="99999999"
              step="0.01"
              inputMode="decimal"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              placeholder="2,500"
            />
          </div>
          <div>
            <label htmlFor="plan-frequency">Repeat every</label>
            <select
              id="plan-frequency"
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as Plan["frequency"])
              }
            >
              <option value="week">Week · Mon–Sun</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>
        <p className="help">Resets each period. No automatic carryover.</p>
      </section>
      <section className="plan-panel">
        <h3>Spending limits</h3>
        <div className="formpair">
          <div>
            <label htmlFor="plan-daily">Daily limit (₱)</label>
            <input
              id="plan-daily"
              type="number"
              min="0.01"
              max="99999999"
              step="0.01"
              inputMode="decimal"
              value={daily}
              onChange={(e) => setDaily(e.target.value)}
              placeholder="300"
            />
          </div>
          <div>
            <label htmlFor="plan-weekly">Weekly limit (₱)</label>
            <input
              id="plan-weekly"
              type="number"
              min="0.01"
              max="99999999"
              step="0.01"
              inputMode="decimal"
              value={weekly}
              onChange={(e) => setWeekly(e.target.value)}
              placeholder="1,800"
            />
          </div>
        </div>
        <p className="help">
          Daily: midnight, Philippine time. Weekly: Mon–Sun. Leave blank to
          remove a limit.
        </p>
      </section>
      {warning && <p className="warning">{warning}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary full" type="submit">
        Save plan <span aria-hidden="true">↗</span>
      </button>
      <p className="help centered">
        Saved on this device. Limits are reminders, not restrictions.
      </p>
    </form>
  );
}
