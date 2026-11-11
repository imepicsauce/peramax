# Development walkthrough

## 1. Foundation

Vite runs the development server and compiles production assets. React owns the interface. TypeScript checks the contracts between screens, forms, and calculations. Install the pinned dependencies with `npm ci` and run `npm run dev`.

## 2. Domain and persistence

Read `src/lib/types.ts` first, then `finance.ts`. These explain an expense, a plan, and a savings goal independently of their visual layout. `storage.ts` loads validated data and migrates old prototype keys. `useLedger` exposes state and a single update function to the application.

## 3. Interface

`App.tsx` connects the screens. `features/ExpenseForm.tsx` collects and validates an entry; `Dashboard.tsx` derives allowance and limits from all expenses; `Reports.tsx` filters entries for the selected period. `PlanForm.tsx` and `Savings.tsx` provide modal forms. `components/Sheet.tsx` centralizes dialog behavior.

## 4. Design and motion

`styles/app.css` contains the green/stone visual system, phone layout, and readable controls. `styles/effects.css` adds transitions and scroll shaping. `styles/responsive.css` defines tablet layouts from 641px and the desktop sidebar/workspace from 960px. The scroll morph stays mobile-only so desktop table columns remain aligned. `useScrollMorph` controls the edge-rounding values; `PointerGlow` handles the faint touch/cursor glow. Effects are optional: remove those component/hook calls and their CSS to simplify the app without changing financial logic.

## 5. Verify changes

Run `npm run check`. Tests cover decimal precision, Philippine date boundaries, month/week ranges, overspending, legacy migration, damaged storage, expense deletion/undo, plan edits, savings contributions, and dialog/navigation behavior.

Before publishing a release, perform browser QA on a phone and a desktop:

- Check widths around 320, 366, 390, 460, 768, 959, 960, 1024, 1280, and 1440 pixels.
- Add/edit an expense using the phone keyboard; verify the sheet can scroll above the keyboard.
- Close a draft without saving and reopen it; verify the original values return.
- Navigate to Activity, filter/search, then use Insights and period controls.
- Set daily/weekly limits and confirm both update after an expense.
- Create a goal, add savings, correct its balance, and cancel/confirm removal.
- Check keyboard focus, Escape, backdrop dismissal, and screen-reader labels in a real browser.
- Try reduced motion, fast navigation, touch scrolling, scroll morph padding, and pointer glow.
- Refresh and verify persistence. Test removing only demo records.
- Test migration on the original site origin; a different origin has different browser storage.

The DOM test suite cannot substitute for this visual/device pass.

## 6. Put it in your repository

Use the README Git commands after extracting the source archive. GitHub Actions will run type checks, tests, and the production build on pushes and pull requests. Develop future features on a branch, keep commits focused, and review the diff before merging.
