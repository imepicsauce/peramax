# Mobile daily-use pass (local review)

Base: f7ad735460ef213f9b063fbc9b0872d309d7eacf, the latest source produced in this conversation. GitHub main was f5707b981c608fd15dc30c6864d75ee86cfa3078 when checked. That GitHub revision predates several requested modal/update improvements; this pass preserves those newer changes. No remote is pushed and no Site is published by this pass.

## What changed

- Expense entry: ₱20/₱50/₱100 presets set (not add to) the amount; all six categories are visible buttons. Date and note are under More details. Edits expose their existing details. Payment defaults to the last successfully saved expense's payment method, persisted with the ledger. No cloud storage or bank connection is involved.
- Home: allowance and an explicit Log expense action lead; one My plan card contains both limits and the weekly unspent target. Period selection and summary metrics live in Activity and Insights. Recent activity renders exactly three entries at every width, with `3 of N` from the same all-time collection.
- First use: an empty ledger with setup guidance. Demo entries are opt-in, and existing demo data has a visible removal action. Existing real expenses, allowances, goals, and storage keys remain compatible.
- Reading and control: 12px minimum text declarations, darker muted labels, 16px form controls, stronger keyboard focus, larger touch targets, wrapping transaction amounts, consistent My plan wording, no external-link arrows on in-app actions.
- Sheets: unsaved changes require Keep editing / Discard changes for X, Escape, backdrop, or drag dismissal. Confirmation keeps the form mounted; it does not save a draft across page reloads. Add expense alone requests input focus, and only if the user hasn't already begun editing. Existing sticky actions and drag/exit animations remain. VisualViewport resize adjusts the mobile sheet's height and bottom offset for the keyboard.
- Touch effects: mouse-only pointer glow; no card/header/modal blur for coarse pointers; one 8px navigation blur. Hover styling is conditional on actual hover support. Scroll morph and reduced-motion support remain.
- Feedback: expense save/delete includes the amount; save includes current-period allowance left/over when configured. Undo lasts 15 seconds. App journey tests get 15 seconds each to accommodate the reported slower Windows run while preserving assertions.

## Bugs and their causes

- Recent activity count and visible rows disagreed because the label counted all entries but CSS hid rows. The component now renders the same three entries it counts.
- Closing a sheet discarded its local React form state. A discard confirmation now guards changed forms and leaves the draft mounted until confirmed.
- A scheduled focus callback could steal focus after typing began. It now respects a field that already has focus.
- Returning from an editor to the Savings hub kept the close-animation flag because the dialog stayed open. Resetting on screenKey as well as open restores a usable hub.
- `crypto.randomUUID()` is unavailable on HTTP network origins. An RFC 4122 v4 fallback uses `crypto.getRandomValues()` without requiring HTTPS for manual expense logging. PWA installation/offline service-worker support still needs a secure origin.

## Verification and limits

Verified locally: `npm run check` passes TypeScript, all 37 tests, and the PWA production build. To reproduce, run `npm ci` and `npm run check`. Tests cover quick entry, persisted payment preference, explicit demo selection, accurate recent counts, guarded drafts, savings navigation, monthly/weekly calculations, warning thresholds, PWA lifecycle, and sheet gestures. ID generation is tested with randomUUID absent.

This environment has no supported browser-control tool, so there is no visual/mobile performance sign-off. Check these on a real phone before merging:

- 320/360/390px screens and 200% zoom; large peso amounts and longer category labels.
- iOS/Android keyboard open: Add amount, More details, sticky Save, My plan with no automatic keyboard.
- Drag handle, short drag snap-back, interrupted drag, Escape, backdrop, Keep editing and Discard changes.
- Focus ring, screen-reader announcement of confirmation, keyboard navigation through category buttons.
- Coarse-pointer effect reduction, desktop hover and layout, reduced motion/transparency.
- A previously saved ledger and an empty new browser profile.

Fonts still use Google Fonts with system fallbacks offline; self-hosting font files is deferred. The weekly allowance proration model and independent manual Savings pot are unchanged. Browser `localStorage` remains device-local and is not a backup.
