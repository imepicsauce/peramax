import { useState, type FormEvent } from "react";
import {
  categories,
  payments,
  type Expense,
  type Category,
  type Payment,
} from "../lib/types";
import { amountInput, isDate, parseAmount } from "../lib/finance";
export function ExpenseForm({
  expense,
  today,
  onSave,
  onDelete,
}: {
  expense?: Expense;
  today: string;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const [amount, setAmount] = useState(
      expense ? amountInput(expense.amount) : "",
    ),
    [category, setCategory] = useState<Category>(expense?.category || "Food"),
    [payment, setPayment] = useState<Payment>(expense?.payment || "Cash"),
    [date, setDate] = useState(expense?.date || today),
    [note, setNote] = useState(expense?.note || ""),
    [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (!isDate(date) || date > today)
        throw new Error("Choose today or an earlier date.");
      onSave({
        id: expense?.id || crypto.randomUUID(),
        amount: parseAmount(amount),
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
    <form onSubmit={submit}>
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
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <label htmlFor="expense-category">Category</label>
      <select
        id="expense-category"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
      >
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="formpair">
        <div>
          <label htmlFor="expense-payment">Paid with</label>
          <select
            id="expense-payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value as Payment)}
          >
            {payments.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expense-date">Date</label>
          <input
            id="expense-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>
      <label htmlFor="expense-note">
        Note <span className="optional">optional</span>
      </label>
      <input
        id="expense-note"
        maxLength={100}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What was it for?"
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="dialogactions">
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
