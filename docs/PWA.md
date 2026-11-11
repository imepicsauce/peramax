# Installing and testing Peramax as a PWA

## Install

Visit the deployed HTTPS app online first. The footer's **Install app** button invokes the browser prompt when available; otherwise it explains the browser's installation menu. On iPhone/iPad, use Safari → Share → Add to Home Screen. Supported Android/desktop browsers offer an Install app or Add to Home Screen action. Installation availability is browser-dependent.

The manifest defines a standalone window, Peramax branding, normal and maskable icons, and an Apple touch icon. Development mode does not register a service worker. To test a production build locally:

```sh
npm ci
npm run build
npm run preview
```

Open the localhost URL printed by Vite. Production deployment requires HTTPS and hosting `/sw.js` with JavaScript MIME type at the site root. This configuration targets root deployment, not a nested GitHub Pages subdirectory.

## Offline behavior

Wait for **Ready for offline use** before testing airplane mode. Workbox precaches the compiled app, CSS, local icons, manifest, and index page. Once cached, the app shell can open offline; expenses, plans, and savings already use browser-local storage and can be edited offline. Source ZIP downloads and API paths are excluded from navigation fallback. Google Fonts are not cached by this configuration; system fonts provide an offline fallback.

There is no account or server sync. Clearing browser/site data can remove both cached assets and financial records. Installing a PWA does not turn localStorage into a durable backup. Different browsers, domains, or app containers may have separate storage. Service-worker registration failures show a message while the normal web app remains usable.

## Updates

A newly installed worker waits instead of forcing a reload. Peramax offers **Update now**; the action is disabled while a sheet is open. Activation reloads the current page only after explicit acceptance and only when a sheet is not open. If a sheet opens during activation, the reload is postponed until the user accepts again. Existing local records are retained. Other open tabs are not automatically reloaded; close/reopen them to finish updating. Workbox cleans up obsolete precaches.

## Verification checklist

Automated hook tests check initial setup vs updates, opt-in activation, open-form protection, connection-state messages, installation prompting, and registration failure. Build checks verify a generated manifest, icons, and service worker. These do not replace real service-worker/browser tests.

On a real supported browser/device:

1. Visit online, wait for offline readiness, and install.
2. Close the app, enable airplane mode, reopen, and add/edit an expense and savings entry.
3. Restart again and verify saved records, dates, and reports.
4. Reconnect and deploy a newer build. Check that no open form reloads automatically and that Update now preserves saved records.
5. Test a second tab, Safari installation, maskable icons, keyboard/safe-area layout, and storage-disabled behavior.

The managed browser tool was unavailable during implementation, so device installation and airplane-mode testing remain pending.
