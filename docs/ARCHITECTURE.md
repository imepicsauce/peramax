# Architecture

## Rendering and state

`main.tsx` mounts React in Strict Mode and sets Motion to respect reduced-motion preferences. `App.tsx` coordinates navigation, modal content, and selected reporting dates. Feature components render from props and send validated domain values through callbacks. Forms keep temporary drafts locally; each new dialog session remounts its draft, so closing without saving does not alter the ledger.

`useLedger` owns the persisted snapshot. Its update callback applies one change and saves the resulting snapshot. Storage side effects run outside React state-updater functions to avoid duplicate writes during Strict Mode checks. Persistence failures keep in-memory edits usable and show a warning.

`useToday` updates the Philippine calendar date. The selected historical report period stays under user control; the current allowance/limits panel always uses the current day or week.

## Financial rules

`finance.ts` is pure and does not import React or browser storage. It handles strict decimal input conversion, PHP display, valid calendar dates, reporting ranges, independent limit totals, and allowance remaining. Savings is a separate balance. The interface never infers a saved deposit from an unspent allowance.

## Persistence boundary

`storage.ts` validates all untrusted parsed JSON. It exposes a synchronous repository contract for this local release. Legacy data is read only when the new snapshot is absent, including preserving empty lists. Legacy keys remain untouched. Corrupt data is not silently replaced.

A Supabase implementation will need an asynchronous data layer and authenticated queries; it is not a drop-in synchronous replacement. Keep the domain types/calculations, and replace the loading/mutation orchestration with TanStack Query or an equivalent async adapter.

## Modal and motion behavior

One native dialog hosts Plan, expense forms, and Savings screens. Native modality provides focus containment and background inertness; React controls opening, cancellation, and the return from savings detail forms. CSS discrete transitions animate dialog presentation without delaying data changes. Motion handles screen/tab/progress transitions. Optional glow and scroll hooks have explicit cleanup and do not intercept scroll or pointer events.

## Boundaries of this release

No remote database, credentials, scheduled jobs, notifications, or device synchronization are present. A production service worker precaches the app shell; user records remain in localStorage. Concurrent writes from multiple tabs are not merged. Add a storage-event/merge policy or authenticated server versioning before supporting concurrent editing. Persisted files contain no user financial records from the build environment; real records live only in a visitor's browser.
