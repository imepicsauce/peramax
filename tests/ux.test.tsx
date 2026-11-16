import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { emptyState, type AppState } from "../src/lib/types";
import { STORAGE_KEY } from "../src/lib/storage";
import { createExpenseId } from "../src/lib/id";
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState;
vi.setConfig({ testTimeout: 15000 });
describe("daily-use UX", () => {
  it("logs a quick amount and category, remembers payment across reloads, and leaves details optional", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    await user.click(screen.getByRole("button", { name: "Set amount to ₱50" }));
    await user.click(screen.getByRole("button", { name: "Pamasahe" }));
    await user.selectOptions(screen.getByLabelText("Paid with"), "GCash");
    expect(screen.getByLabelText("Date")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save expense" }));
    expect(stored().expenses[0]).toMatchObject({
      amount: 5000,
      category: "Pamasahe",
      payment: "GCash",
      note: "",
    });
    expect(screen.getByText("₱50.00 saved.")).toBeInTheDocument();
    view.unmount();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(screen.getByLabelText("Paid with")).toHaveValue("GCash");
    expect(screen.getByLabelText("Amount (₱)")).toHaveValue(null);
  });
  it("keeps an expense draft on accidental backdrop close and discards only after confirmation", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    await user.click(
      screen.getByRole("button", { name: "Set amount to ₱100" }),
    );
    fireEvent.click(screen.getByRole("dialog"), { clientX: -10, clientY: -10 });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Amount (₱)")).toHaveValue(100);
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(screen.getByLabelText("Amount (₱)")).toHaveValue(null);
    expect(stored().expenses).toEqual([]);
  });
  it("starts empty, keeps Home brief, and counts only its three rendered recent entries", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("0 of 0")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous period" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Daily average")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try demo expenses" }));
    const total = stored().expenses.length;
    expect(screen.getByText(`3 of ${total}`)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /^Edit (?!plan)/ }),
    ).toHaveLength(3);
    expect(
      screen.getByText("You’re viewing example expenses."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(
      screen.getByRole("button", { name: "Previous period" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Daily average")).not.toBeInTheDocument();
  });
  it("does not open the keyboard for My plan and protects its unsaved settings", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Close dialog" }),
      ).toHaveFocus(),
    );
    await user.type(screen.getByLabelText("Allowance (₱)"), "2500");
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Allowance (₱)")).toHaveValue(2500);
    await user.click(screen.getByRole("button", { name: "Save plan" }));
    expect(stored().plan.allowance).toBe(250000);
  });
  it("allows closing the savings hub after returning from an unsaved goal", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Savings" }));
    await user.click(
      screen.getByRole("button", { name: /Set a savings goal/ }),
    );
    await user.type(screen.getByLabelText("What are you saving for?"), "Bike");
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("heading", {
        name: "Savings",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
it("generates unique valid expense IDs when randomUUID is unavailable on LAN HTTP", () => {
  const original = Object.getOwnPropertyDescriptor(
    globalThis.crypto,
    "randomUUID",
  );
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    configurable: true,
    value: undefined,
  });
  try {
    const ids = Array.from({ length: 100 }, createExpenseId);
    expect(new Set(ids).size).toBe(100);
    expect(
      ids.every((id) =>
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          id,
        ),
      ),
    ).toBe(true);
  } finally {
    if (original)
      Object.defineProperty(globalThis.crypto, "randomUUID", original);
    else Reflect.deleteProperty(globalThis.crypto, "randomUUID");
  }
});
it("adapts amount suggestions to category without overwriting a typed amount", async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Add expense" }));
  expect(
    screen.getByRole("group", { name: "Quick amounts for Food" }),
  ).toHaveTextContent("₱50₱100₱150");
  await user.type(screen.getByLabelText("Amount (₱)"), "60");
  await user.click(screen.getByRole("button", { name: "Pamasahe" }));
  expect(
    screen.getByRole("group", { name: "Quick amounts for Pamasahe" }),
  ).toHaveTextContent("₱12₱14₱25");
  expect(screen.getByLabelText("Amount (₱)")).toHaveValue(60);
  await user.click(screen.getByRole("button", { name: "Set amount to ₱14" }));
  await user.click(screen.getByRole("button", { name: "Save expense" }));
  expect(stored().expenses[0]).toMatchObject({
    amount: 1400,
    category: "Pamasahe",
  });
});

it("filters Activity by payment, shows its matching total, and opens More settings", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Try demo expenses" }));
  await user.click(screen.getByRole("button", { name: "Activity" }));
  expect(screen.queryByLabelText("Filter payment method")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(
    screen.getByLabelText("Filter payment method"),
    "GCash",
  );
  const totals = screen.getByRole("region", {
    name: "Expenses by payment method",
  });
  expect(within(totals).getByRole("button", { name: /GCash/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText(/expenses? matched/)).toBeInTheDocument();
  await user.selectOptions(
    screen.getByLabelText("Sort transactions"),
    "payment",
  );
  await user.click(screen.getByRole("button", { name: "More" }));
  expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "About Peramax" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Filter payment method"),
  ).not.toBeInTheDocument();
});
it("explains filtered emptiness and clears the filters", async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Activity" }));
  await user.type(
    screen.getByLabelText("Search transactions"),
    "unmatched note",
  );
  expect(screen.getByText(/No matching expenses/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByLabelText("Search transactions")).toHaveValue("");
  expect(screen.getByText("No expenses for this period.")).toBeInTheDocument();
});
it("highlights and focuses My plan from the allowance card without opening a modal", async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
  const user = userEvent.setup(); const view = render(<App />);
  await user.click(screen.getByRole("button", { name: "Highlight My plan in the header" }));
  expect(screen.getByRole("button", { name: "My plan" })).toHaveFocus();
  expect(view.container.querySelector(".plan-locator")).toBeInTheDocument();
  await user.click(screen.getByRole("heading", { name: "Home" }));
  expect(view.container.querySelector(".plan-locator")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Highlight My plan in the header" }));
  expect(view.container.querySelector(".plan-locator")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(view.container.querySelector(".plan-locator")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "My plan" }));
  expect(screen.getByLabelText("Allowance (₱)")).toBeInTheDocument();
});

it("keeps active filters visible after collapsing and supports removing them", async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
  const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole("button", { name: "Activity" }));
  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(screen.getByLabelText("Filter category"), "Food");
  await user.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Transaction filters" })).not.toBeInTheDocument());
  const toggle = screen.getByRole("button", { name: "Filters 1" });
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await user.click(screen.getByRole("button", { name: "Remove category filter Food" }));
  expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
});
it("persists the blur setting and restores solid surfaces after reload", async () => {
  const user = userEvent.setup(); const view = render(<App />);
  await user.click(screen.getByRole("button", { name: "More" }));
  await user.click(screen.getByRole("checkbox", { name: /Disable blur effects/ }));
  expect(localStorage.getItem("peramax-disable-blur")).toBe("true");
  expect(document.documentElement).toHaveClass("no-blur");
  view.unmount(); render(<App />);
  await user.click(screen.getByRole("button", { name: "More" }));
  expect(screen.getByRole("checkbox", { name: /Disable blur effects/ })).toBeChecked();
  await user.click(screen.getByRole("checkbox", { name: /Disable blur effects/ }));
  expect(document.documentElement).not.toHaveClass("no-blur");
});
