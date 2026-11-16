import { useRef, useState, type FormEvent } from "react";
import {
  categories,
  payments,
  type Expense,
  type Category,
  type Payment,
} from "../lib/types";
import { amountInput, isDate, parseAmount } from "../lib/finance";
import { Icon, type IconName } from "../components/Icon";
import { createExpenseId } from "../lib/id";
const presets: Record<Category, readonly number[]> = {
  Food: [50, 100, 150],
  Pamasahe: [12, 14, 25],
  Groceries: [100, 300, 500],
  "Load / data": [50, 99, 149],
  Bills: [500, 1000, 1500],
  Others: [50, 100, 200],
};
const icons: Record<Category, IconName> = {
  Food: "food", Pamasahe: "ride", Groceries: "bag",
  "Load / data": "phone", Bills: "bill", Others: "other",
};
export function ExpenseForm({
  expense,
  today,
  lastPayment = "Cash",
  onSave,
  onDelete,
}: {
  expense?: Expense;
  today: string;
  lastPayment?: Payment;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const [amount, setAmount] = useState(
      expense ? amountInput(expense.amount) : "",
    ),
    [category, setCategory] = useState<Category>(expense?.category || "Food"),
    [payment, setPayment] = useState<Payment>(expense?.payment || lastPayment),
    [date, setDate] = useState(expense?.date || today),
    [note, setNote] = useState(expense?.note || ""),
    [error, setError] = useState("");
  const initial = useRef(
    JSON.stringify([amount, category, payment, date, note]),
  );
  const dirty =
    JSON.stringify([amount, category, payment, date, note]) !== initial.current;
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const value = parseAmount(amount);
      if (!isDate(date) || date > today)
        throw new Error("Choose today or an earlier date.");
      onSave({
        id: expense?.id || createExpenseId(),
        amount: value,
        category,
        payment,
        date,
        note: note.trim(),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form className="expense-form" onSubmit={submit} data-dirty={dirty} autoComplete="off">
      <label htmlFor="expense-amount">Amount (₱)</label>
      <input
        id="expense-amount"
        className="amount-field"
        inputMode="decimal"
        type="number"
        min="0.01"
        max="99999999"
        step="0.01"
        value={amount}
        enterKeyHint="done"
        onChange={(e) => setAmount(e.target.value)}
        required
        aria-describedby={error ? "expense-error" : undefined}
      />
      <div className="quick-amounts" role="group" aria-label={`Quick amounts for ${category}`}>
        {presets[category].map((value) => (
          <button
            type="button"
            key={value}
            aria-label={`Set amount to ₱${value}`}
            onClick={() => setAmount(String(value))}
          >
            ₱{value}
          </button>
        ))}
      </div>
      <fieldset className="category-choices">
        <legend>Category</legend>
        <div className="category-chips">
          {categories.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              <Icon name={icons[value]} />
              <span>{value}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="expense-payment">Paid with</label>
      <select
        id="expense-payment"
        value={payment}
        onChange={(e) => setPayment(e.target.value as Payment)}
      >
        {payments.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <div className="expense-details">
        <label htmlFor="expense-date">Date</label>
        <input
          id="expense-date"
          type="date"
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <label htmlFor="expense-note">
          Note <span className="optional">optional</span>
        </label>
        <input
          id="expense-note"
          maxLength={100}
          value={note}
          enterKeyHint="done"
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was it for?"
        />
      </div>
      {error && (
        <p className="error" id="expense-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialogactions sheet-sticky-actions">
        {expense && (
          <button
            type="button"
            className="danger"
            onClick={() => onDelete(expense.id)}
          >
            Delete expense
          </button>
        )}
        <button className="primary" type="submit">
          Save expense
        </button>
      </div>
    </form>
  );
}
