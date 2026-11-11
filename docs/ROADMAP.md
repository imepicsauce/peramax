# Next implementation phases

## Account-backed storage

1. Create a Supabase project and choose the sign-in method.
2. Add PostgreSQL tables for expenses, plans, savings goals, and savings entries. Use integer centavos and calendar-date columns; associate every record with the authenticated user.
3. Enable row-level security and verify users can only access their own rows. Never ship a service-role key in the browser.
4. Add the public Supabase URL and publishable key through local/host environment settings; keep `.env` untracked.
5. Replace synchronous local loading/mutations with authenticated asynchronous queries, then add caching and mutation handling through TanStack Query.
6. Add an explicit local-to-account import flow with stable IDs and duplicate protection. Preserve a local backup before import.
7. Verify sign-in/out, expired sessions, unauthorized access, error recovery, and use across two devices. Do not silently upload existing local data merely because a user signs in.

## Installable/offline experience

The app-shell PWA is implemented with `vite-plugin-pwa`. Installing an app shell does not make record writes reliably offline. Add IndexedDB, queued mutations, idempotent operation IDs, visible sync status, and an explicit conflict policy. Test airplane mode, reconnection, multiple tabs/devices, and service-worker upgrades.

## Product improvements

Consider multiple goals, savings contribution history, CSV import/export, custom categories, and recurring-expense reminders after the first account-backed release is dependable. Add each as a bounded feature with tests around the financial behavior it changes.

## Capacitor after PWA

Keep the React/Vite interface. Add Capacitor Android/iOS projects with `webDir: "dist"`, and disable web service-worker registration in native builds. Decide on durable native storage and migration before moving records out of browser localStorage. Test keyboard/safe-area behavior, native back navigation, permissions, offline persistence, and store signing on devices. iOS builds require macOS and Xcode.
