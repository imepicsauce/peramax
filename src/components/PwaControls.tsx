import { useState } from "react";
import { usePwa } from "../hooks/usePwa";
export function PwaControls({ blocked }: { blocked: boolean }) {
  const pwa = usePwa(blocked),
    [help, setHelp] = useState(false);
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
      {pwa.updateAvailable && (
        <div className="pwa-update">
          <span>
            {blocked
              ? "Update ready. Finish your open form first."
              : "A new version is ready."}
          </span>
          <button
            className="secondary"
            disabled={blocked || pwa.updating}
            onClick={pwa.update}
          >
            {pwa.updating ? "Updating…" : "Update now"}
          </button>
        </div>
      )}
    </section>
  );
}
