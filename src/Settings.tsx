import { useState } from "react";
import {
  cacheSize,
  clearCache,
  getApiKey,
  hasApiKey,
  setApiKey,
} from "./claudeFallback";
import { FOODKEEPER } from "./foodkeeper";

export function Settings({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);
  const [cached, setCached] = useState(cacheSize());

  function save() {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <section>
          <h3>Claude fallback</h3>
          <p className="muted">
            For items not in the local FoodKeeper table ({FOODKEEPER.length}{" "}
            items), the app can ask Claude for shelf-life data and cache the
            answer. Optional — without a key, unknown items get a safe estimate
            you can still use.
          </p>
          <label className="field">
            <span>Anthropic API key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
            />
          </label>
          <p className="warn">
            ⚠️ Stored only in this browser (localStorage) and sent directly to
            Anthropic. Fine for a personal prototype; a shipped app must proxy
            this through a backend so the key stays secret.
          </p>
          <div className="row">
            <button onClick={save}>{saved ? "Saved ✓" : "Save key"}</button>
            <span className={`status ${hasApiKey() ? "on" : "off"}`}>
              {hasApiKey() ? "Fallback ON" : "Fallback OFF"}
            </span>
          </div>
        </section>

        <section>
          <h3>Learned items cache</h3>
          <p className="muted">
            {cached} item{cached === 1 ? "" : "s"} learned from Claude and cached
            locally (so you never pay for the same lookup twice).
          </p>
          <button
            className="ghost danger"
            onClick={() => {
              clearCache();
              setCached(0);
            }}
          >
            Clear cache
          </button>
        </section>

        <section>
          <h3>How it works</h3>
          <ol className="muted small">
            <li>Local FoodKeeper table (free, offline) — checked first.</li>
            <li>Your local cache of past Claude answers.</li>
            <li>Claude API (only if a key is set above).</li>
            <li>Safe default estimate — so it always works offline.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
