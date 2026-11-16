import { useBlurPreference, setBlurDisabled } from "../hooks/useBlurPreference";
import { useState } from "react";
export function More() {
  const blurDisabled = useBlurPreference();
  const [motion, setMotion] = useState(() => {
    try {
      return localStorage.getItem("peramax-reduce-motion") === "true";
    } catch {
      return false;
    }
  });
  function changeMotion(value: boolean) {
    setMotion(value);
    document.documentElement.classList.toggle("reduce-motion", value);
    try {
      localStorage.setItem("peramax-reduce-motion", String(value));
    } catch {
      /* Session preference still applies. */
    }
    window.dispatchEvent(new Event("peramax-motion-change"));
  }
  return (
    <div className="more-page">
      <section>
        <h2>Settings</h2>
        <label className="setting-toggle">
          <span>
            <strong>Reduce animations</strong>
            <small>Use less movement throughout the app.</small>
          </span>
          <input
            type="checkbox"
            checked={motion}
            onChange={(e) => changeMotion(e.target.checked)}
          />
        </label>
        <label className="setting-toggle blur-setting">
          <span><strong>Disable blur effects</strong><small>Use solid surfaces for better performance.</small></span>
          <input type="checkbox" checked={blurDisabled} onChange={e => setBlurDisabled(e.target.checked)} />
        </label>
        <div className="setting-info">
          <span>Currency</span>
          <strong>Philippine peso (PHP)</strong>
        </div>
        <div className="setting-info">
          <span>Calendar</span>
          <strong>Asia/Manila · Weeks start Monday</strong>
        </div>
      </section>
      <section>
        <h2>About Peramax</h2>
        <p>Your everyday expenses, allowance, and savings in one place.</p>
        <p>
          Entries are saved in this browser on this device. Clearing site data
          removes them. There is no account sync yet.
        </p>
        <p>
          You can install Peramax from your browser for quick access and offline
          use.
        </p>
      </section>
    </div>
  );
}
