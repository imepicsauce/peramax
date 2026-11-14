# Peramax

## Flutter Android app

The native Flutter version lives in [`flutter_app/`](flutter_app/README.md). Run `flutter pub get` and `flutter run` from that directory. The React app below remains available as a separate implementation; records do not automatically transfer between the two apps.

Android installer and GitHub Release packaging: [installation instructions](flutter_app/INSTALL.md) · [release guide](flutter_app/RELEASING.md).

A mobile-first personal expense tracker for everyday Filipino use, built with **React 19, TypeScript, Vite, and Motion for React**. This repository is the working application migrated from the interactive design prototype.

## Run locally

Use Node.js **22.12 or later** (Node 22 LTS is recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment variables or cloud credentials are required. The initial view includes clearly marked demo expenses; use **Remove demo expenses** in the footer to remove only examples. Your own entries, plan, and savings goal remain.

```sh
npm test          # Financial rules, persistence/migration, and UI journeys
npm run typecheck
npm run build    # Type-check and produce a deployable dist/ directory
npm run preview  # Inspect the production build locally
npm run check    # All required checks
npm run format   # Format source, tests, docs, and configuration
```

## Implemented

- Responsive mobile/tablet/desktop layouts: bottom navigation and raised Add on phones; sidebar, wider reports, and centered dialogs on desktop. Savings / My plan remain available at the top.
- Add, edit, delete, and undo deletion of expenses.
- Daily, Monday–Sunday weekly, and monthly reports; category/payment search and category filtering.
- Philippine peso formatting and Asia/Manila calendar dates.
- Daily/weekly allowances and independent daily/weekly spending limits.
- Remaining allowance in pesos, with a clear over-allowance state.
- One savings goal, optional deadline, recorded contributions, editable saved balance, completion state, and confirmed removal.
- Accessible native dialogs, keyboard dismissal, and input labels.
- Motion transitions, pointer glow, and scroll-driven rounded rows with matching inner padding. Reduced-motion preferences are respected.
- Validated local persistence and migration of existing prototype records on the same origin.
- Strict TypeScript, Vitest, React Testing Library, and a GitHub Actions check workflow.

## Data and scope

This is a working **browser-local first release**. There is no sign-in, bank integration, Supabase connection, or automatic cross-device sync yet. A production service worker caches the app shell for offline use after an initial online visit. Browser storage can be cleared by the browser or device owner; don't treat this version as a sole financial backup.

Amounts are integer **centavos**. A stored value of `12345` represents ₱123.45. Input supports at most two decimal places. Dates are calendar dates in `YYYY-MM-DD` form, interpreted in Philippine time. The app checks the current Philippine day periodically and when the tab becomes visible.

An allowance repeats daily or weekly; unused amounts do not roll forward automatically. Limits are advisory. Adding savings records money already set aside; it does **not** create an expense or subtract from allowance. Edit the saved balance to correct an entry or record a withdrawal.

The new storage key is `peramax-react-v1`. If absent, the application reads the old `peramax-v1`, `peramax-plan-v1`, and `peramax-savings-goal-v1` keys. The old keys are retained, and new state is written on the next change. An intentionally empty expense list stays empty. Invalid stored data produces a visible warning and disables writes for that session instead of overwriting the existing payload.

**Storage is tied to the site origin.** Your records on the hosted prototype cannot be read automatically by localhost or a different domain. Account-backed syncing is a later phase.

## Project map

```text
src/
  App.tsx                 Navigation, selected period, and app-level actions
  components/             Icons, native dialog sheet, pointer glow
  features/               Expense/plan forms, dashboard, reports, savings
  hooks/                  Ledger state, current Philippine date, scroll morph
  lib/
    types.ts              Domain types and categories
    finance.ts            Pure amount/date/report calculations
    storage.ts            Validation, local repository, legacy migration
    demo.ts               Identifiable demo entries
  styles/                 Shared visual system and optional effects
tests/                    Financial, migration, and interaction checks
docs/                     Architecture, walkthrough, and next steps
.github/workflows/        CI checks for pushes and pull requests
```

The design has been moved into readable stylesheets rather than retained as layers of prototype overrides. All application rendering is React; no legacy scripts rewrite React-owned DOM. The scroll effect only sets presentation attributes and CSS variables, and cleans up its observers.

## Add your repository

Create an **empty** repository on GitHub. Extract the source ZIP, open its folder in a terminal, and run:

```sh
git init -b main
git add .
git commit -m "Build Peramax React app"
git remote add origin https://github.com/YOUR_USERNAME/peramax.git
git push -u origin main
```

Replace `YOUR_USERNAME` and the repository name with your own. Authenticate using GitHub's normal CLI or Git credential flow. The source ZIP excludes the prototype's Git history and Sites identity, so you start with your own repository. If you already created a repository containing files, clone it and copy this source into it rather than replacing its history.

`.gitignore` excludes dependencies, build output, logs, and local environment files. Commit `package-lock.json` so teammates and CI install the same versions. No license has been selected; choose one before distributing the code under an open-source license.

## Deploy

Any static host supporting Vite output can serve this application:

- Install: `npm ci`
- Build: `npm run build`
- Publish directory: `dist`

Navigation is currently state-based within one page, so no path-routing rewrites are required. Fonts load from Google Fonts with local sans-serif fallbacks. The hosted Sites checkout also has a provider-specific `.openai/hosting.json`; it is excluded from the downloadable source and unnecessary for other hosts.

## Verification

`npm run check` validates TypeScript, financial rules, migration, and core interaction journeys, then builds production assets. UI tests use jsdom and native-dialog stubs; they do not verify pixel layout, native focus trapping, or animation smoothness. The supported managed browser tool was unavailable during this migration, so visual/mobile QA remains to be performed. See the checklist in `docs/WALKTHROUGH.md` before broader use.

Installation and offline/update testing are documented in `docs/PWA.md`.

Next: follow `docs/ROADMAP.md` to add authentication and Supabase, then an explicit offline synchronization design.

### Weekly allowance savings
My plan supports daily, weekly, and calendar-month allowances. A weekly saving goal tracks money left unspent for one selected Monday–Sunday week, separately from manually recorded Savings. Daily allowance is multiplied by seven; monthly allowance is allocated by each calendar day's share (including weeks spanning two months), rounded once to centavos. Editing the allowance recalculates the selected goal. Goal success is evaluated after Sunday using logged expenses; no savings transfer or automatic renewal occurs. Blank target removes the goal. Existing stored plans remain compatible.

Budget warnings appear across Home, Activity, and Insights at 80% of a configured allowance or daily/weekly limit. At 100% they show reached/used up, and above 100% they show the excess in pesos. Warnings recalculate after edits, deletions, plan changes, and Philippine calendar rollover. These are in-app reminders, not push notifications.
