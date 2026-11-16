import { createPortal } from "react-dom";
import { useState } from "react";
import { usePwa } from "../hooks/usePwa";
export function PwaControls({ blocked }: { blocked: boolean }) {
  const pwa = usePwa(blocked),
    [help, setHelp] = useState(false),
    [dismissed, setDismissed] = useState(false);
  return (
    <section className="pwa-controls" aria-label="App installation and updates">
      <div className="pwa-row">
        <span role="status">
          {pwa.offline
            ? "Offline · changes save on this device"
            : pwa.ready
              ? "Ready for offline use"
              : "Saved on this device"}
        </span>
        {!pwa.installed && (
          <button
            className="textbutton"
            onClick={async () => {
              if (!(await pwa.install())) setHelp((h) => !h);
            }}
          >
            Install app
          </button>
        )}
      </div>
      {help && !pwa.installed && (
        <p className="help">
          Use your browser’s Install app or Add to Home Screen option. On
          iPhone, open in Safari, then Share → Add to Home Screen.
        </p>
      )}
      {pwa.error && (
        <p className="help" role="status">
          {pwa.error}
        </p>
      )}
      {pwa.updateAvailable && blocked && (
        <p className="help" role="status">Update ready. Finish your open form first.</p>
      )}
      {pwa.updateAvailable && dismissed && !blocked && (
        <button className="textbutton" onClick={() => setDismissed(false)}>Show update</button>
      )}
      {pwa.updateAvailable && !blocked && !dismissed && createPortal(
        <section className="pwa-update-popup" aria-label="App update">
          <div role="status" aria-live="polite">
            <strong>Update ready</strong>
            <p>A new version is available.</p>
          </div>
          <div className="pwa-update-actions">
            <button className="textbutton" disabled={pwa.updating} onClick={() => setDismissed(true)}>Later</button>
            <button className="primary" disabled={pwa.updating} onClick={pwa.update}>
              {pwa.updating ? "Updating…" : "Update now"}
            </button>
          </div>
        </section>, document.body,
      )}
    </section>
  );
}
