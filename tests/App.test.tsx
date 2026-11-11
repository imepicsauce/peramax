import { describe, it, expect } from "vitest";
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MotionConfig } from "motion/react";
import App from "../src/App";
import { emptyState, type AppState } from "../src/lib/types";
import { STORAGE_KEY } from "../src/lib/storage";
function start() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));
  return render(
    <MotionConfig reducedMotion="always">
      <App />
    </MotionConfig>,
  );
}
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState;
describe("core app journeys", () => {
  it("adds, edits and deletes an expense, then restores it with undo", async () => {
    const user = userEvent.setup();
    start();
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    await user.type(screen.getByLabelText("Amount (₱)"), "123.45");
    await user.type(screen.getByLabelText(/Note/), "Test lunch");
    await user.click(screen.getByRole("button", { name: "Save expense" }));
    expect(
      await screen.findByRole("button", { name: "Edit Test lunch" }),
    ).toBeInTheDocument();
    expect(stored().expenses[0].amount).toBe(12345);
    await user.click(screen.getByRole("button", { name: "Edit Test lunch" }));
    await user.clear(screen.getByLabelText("Amount (₱)"));
    await user.type(screen.getByLabelText("Amount (₱)"), "100");
    await user.click(screen.getByRole("button", { name: "Save expense" }));
    expect(stored().expenses[0].amount).toBe(10000);
    await user.click(screen.getByRole("button", { name: "Edit Test lunch" }));
    await user.click(screen.getByRole("button", { name: "Delete expense" }));
    expect(stored().expenses).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().expenses[0].note).toBe("Test lunch");
  });
  it("saves a plan, removes a limit, and discards unsaved edits on close", async () => {
    const user = userEvent.setup();
    start();
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.type(screen.getByLabelText("Allowance (₱)"), "2500");
    await user.type(screen.getByLabelText("Daily limit (₱)"), "300");
    await user.click(screen.getByRole("button", { name: "Save plan" }));
    expect(stored().plan.allowance).toBe(250000);
    expect(screen.getByText("Allowance left")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.clear(screen.getByLabelText("Daily limit (₱)"));
    await user.click(screen.getByRole("button", { name: "Save plan" }));
    expect(stored().plan.daily).toBeNull();
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.clear(screen.getByLabelText("Allowance (₱)"));
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(stored().plan.allowance).toBe(250000);
    await user.click(screen.getByRole("button", { name: "My plan" }));
    expect(screen.getByLabelText("Allowance (₱)")).toHaveValue(2500);
  });
  it("creates a savings goal and records money independently of allowance and expenses", async () => {
    const user = userEvent.setup();
    start();
    await user.click(screen.getByRole("button", { name: "Savings" }));
    await user.click(
      screen.getByRole("button", { name: /Set a savings goal/ }),
    );
    await user.type(
      screen.getByLabelText("What are you saving for?"),
      "Emergency fund",
    );
    await user.type(screen.getByLabelText("Target amount (₱)"), "1000");
    await user.click(screen.getByRole("button", { name: "Create goal" }));
    await user.click(screen.getByRole("button", { name: "Add savings" }));
    await user.type(screen.getByLabelText("Amount to add (₱)"), "1000.25");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add savings",
      }),
    );
    expect(await screen.findByText("Goal reached")).toBeInTheDocument();
    expect(stored().goal?.saved).toBe(100025);
    expect(stored().expenses).toHaveLength(0);
    expect(stored().plan.allowance).toBeNull();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Remove goal" }));
    await user.click(screen.getByRole("button", { name: "Keep goal" }));
    expect(stored().goal).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Remove goal" }));
    await user.click(screen.getByRole("button", { name: "Remove goal" }));
    expect(stored().goal).toBeNull();
  });
  it("supports Escape and screen navigation without stale dialogs", async () => {
    const user = userEvent.setup();
    start();
    await user.click(screen.getByRole("button", { name: "My plan" }));
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(
      screen.getByRole("heading", { name: "Activity" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Insights" }));
    expect(
      screen.getByRole("heading", { name: "Insights" }),
    ).toBeInTheDocument();
  });
});
