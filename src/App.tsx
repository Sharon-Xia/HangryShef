import { useEffect, useMemo, useState } from "react";
import type { InventoryItem, ItemEvent, StorageLocation } from "./types";
import { LOCATIONS, LOCATION_LABELS, LOCATION_EMOJI } from "./types";
import {
  daysLeft,
  daysSinceAcquired,
  describeMove,
  expiryOf,
  fmtDate,
  fmtDays,
  lifeColor,
  lifePercentLeft,
  sortByExpiry,
  urgencyOf,
  validLocations,
} from "./engine";
import { FoodImage } from "./foodImage";
import { resolveSpec, type ResolveResult } from "./claudeFallback";
import { loadInventory, newId, saveInventory } from "./storage";
import { Settings } from "./Settings";
import { RecipesView } from "./RecipesView";

type View = "location" | "expiry";
type Page = "groceries" | "recipes";

const VIA_LABEL: Record<ResolveResult["via"], string> = {
  foodkeeper: "FoodKeeper",
  cache: "cached",
  claude: "Claude",
  default: "estimated",
};

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>(() => loadInventory());
  const [page, setPage] = useState<Page>("groceries");
  const [view, setView] = useState<View>("expiry");
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => saveInventory(items), [items]);

  function flash(msg: string) {
    setToast(msg);
    window.clearTimeout((flash as any)._t);
    (flash as any)._t = window.setTimeout(() => setToast(null), 4500);
  }

  async function addItem(e?: React.FormEvent) {
    e?.preventDefault();
    const name = text.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const { spec, via } = await resolveSpec(name);
      const now = Date.now();
      const item: InventoryItem = {
        id: newId(),
        name,
        spec,
        location: spec.recommended,
        addedAt: now,
        history: [{ type: "added", at: now, to: spec.recommended }],
      };
      setItems((prev) => [...prev, item]);
      setText("");
      const dl = daysLeft(item);
      flash(
        `Added "${spec.name}" to ${LOCATION_LABELS[item.location]} · ${VIA_LABEL[via]}` +
          (dl != null ? ` · ~${fmtDays(Math.max(dl, 0))} left` : "")
      );
    } finally {
      setAdding(false);
    }
  }

  function removeItem(id: string, name: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedId(null);
    flash(`Removed "${name}" — hope it was tasty, not tossed 🫡`);
  }

  function moveItem(item: InventoryItem, to: StorageLocation) {
    if (to === item.location) return;
    const effect = describeMove(item, to);
    const event: ItemEvent = { type: "moved", at: Date.now(), from: item.location, to };
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, location: to, history: [...it.history, event] }
          : it
      )
    );
    flash(effect.message);
  }

  const sorted = useMemo(() => sortByExpiry(items), [items]);
  const soonestBad = sorted.find((it) => daysLeft(it) != null) ?? null;
  const selected = items.find((it) => it.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Shelf-Life</h1>
          <p className="tagline">What goes bad first, first.</p>
        </div>
        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </header>

      <div className="page-toggle">
        <button className={page === "groceries" ? "active" : ""} onClick={() => setPage("groceries")}>
          🛒 Groceries
        </button>
        <button className={page === "recipes" ? "active" : ""} onClick={() => setPage("recipes")}>
          🍳 Recipes
        </button>
      </div>

      {page === "recipes" ? (
        <RecipesView items={items} />
      ) : (
        <>
      <form className="add-bar" onSubmit={addItem}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item… e.g. chicken breast, milk, spinach"
          autoComplete="off"
          enterKeyHint="done"
        />
        <button type="submit" disabled={adding || !text.trim()}>
          {adding ? "…" : "Add"}
        </button>
      </form>

      {soonestBad && (
        <div className="hero-hint">
          🥇 Use next: <strong>{soonestBad.name}</strong>{" "}
          <UrgencyPill item={soonestBad} />
        </div>
      )}

      <div className="view-toggle">
        <button
          className={view === "expiry" ? "active" : ""}
          onClick={() => setView("expiry")}
        >
          By expiry
        </button>
        <button
          className={view === "location" ? "active" : ""}
          onClick={() => setView("location")}
        >
          By location
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty">
          <p>No items yet.</p>
          <p className="muted">
            Add a few groceries above. Known items use the local USDA FoodKeeper
            table; unknown ones fall back to Claude (if a key is set) or a safe
            estimate.
          </p>
        </div>
      )}

      {view === "expiry" ? (
        <ItemGrid items={sorted} onSelect={setSelectedId} />
      ) : (
        LOCATIONS.map((loc) => {
          const inLoc = sortByExpiry(items.filter((it) => it.location === loc));
          if (inLoc.length === 0) return null;
          return (
            <section key={loc} className="loc-section">
              <h2>
                {LOCATION_EMOJI[loc]} {LOCATION_LABELS[loc]}{" "}
                <span className="count">{inLoc.length}</span>
              </h2>
              <ItemGrid items={inLoc} onSelect={setSelectedId} />
            </section>
          );
        })
      )}
        </>
      )}

      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {selected && (
        <DetailSheet
          item={selected}
          onClose={() => setSelectedId(null)}
          onMove={moveItem}
          onRemove={removeItem}
        />
      )}

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function UrgencyPill({ item }: { item: InventoryItem }) {
  const u = urgencyOf(item);
  const d = daysLeft(item);
  const label =
    u === "unknown"
      ? "no date"
      : d != null && d < 0
      ? `${Math.abs(d)}d over`
      : `${d}d left`;
  return <span className={`pill ${u}`}>{label}</span>;
}

/** Compact red→green life bar. */
function LifeBar({ item, showLabel = false }: { item: InventoryItem; showLabel?: boolean }) {
  const pct = lifePercentLeft(item);
  if (pct == null) {
    return <div className="minibar no-date">no expiry date</div>;
  }
  const rounded = Math.round(pct);
  return (
    <div className="minibar" title={`${rounded}% of shelf life left`}>
      <div className="minibar-track">
        <div
          className="minibar-fill"
          style={{ width: `${pct}%`, background: lifeColor(pct) }}
        />
      </div>
      {showLabel && <span className="minibar-label">{rounded}% life left</span>}
    </div>
  );
}

function ItemGrid({
  items,
  onSelect,
}: {
  items: InventoryItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="grid">
      {items.map((item) => (
        <ItemTile key={item.id} item={item} onSelect={() => onSelect(item.id)} />
      ))}
    </ul>
  );
}

function ItemTile({ item, onSelect }: { item: InventoryItem; onSelect: () => void }) {
  const u = urgencyOf(item);
  const d = daysLeft(item);
  const estimated = item.spec.source === "claude" || item.spec.source === "default";

  return (
    <li className="grid-cell">
      <button className={`tile ${u}`} onClick={onSelect}>
        <div className="tile-img">
          <FoodImage spec={item.spec} name={item.name} className="tile-photo" />
          <span className="tile-loc" title={LOCATION_LABELS[item.location]}>
            {LOCATION_EMOJI[item.location]}
          </span>
          {estimated && <span className="tile-est">est.</span>}
        </div>
        <div className="tile-body">
          <div className="tile-name">{item.name}</div>
          <LifeBar item={item} />
          <div className="tile-meta">
            <span className={`days ${u}`}>
              {d == null
                ? "—"
                : d < 0
                ? `${Math.abs(d)}d over`
                : `${d}d left`}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

function DetailSheet({
  item,
  onClose,
  onMove,
  onRemove,
}: {
  item: InventoryItem;
  onClose: () => void;
  onMove: (item: InventoryItem, to: StorageLocation) => void;
  onRemove: (id: string, name: string) => void;
}) {
  const expiry = expiryOf(item);
  const others = validLocations(item.spec).filter((l) => l !== item.location);
  const estimated = item.spec.source === "claude" || item.spec.source === "default";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <FoodImage spec={item.spec} name={item.name} className="sheet-photo" />
          <div className="sheet-title">
            <h2>
              {item.name}
              {estimated && <span className="badge est">est.</span>}
            </h2>
            <p className="muted">
              {LOCATION_EMOJI[item.location]} {LOCATION_LABELS[item.location]} ·{" "}
              {item.spec.category}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sheet-life">
          <LifeBar item={item} showLabel />
          <div className="sheet-dates muted small">
            <span>Acquired {fmtDate(item.addedAt)}</span>
            {expiry != null && <span>Expires {fmtDate(expiry)}</span>}
          </div>
        </div>

        <section>
          <h3>Move storage</h3>
          <div className="move-panel">
            {others.map((to) => {
              const effect = describeMove(item, to);
              return (
                <button
                  key={to}
                  className="move-option"
                  onClick={() => onMove(item, to)}
                >
                  <span className="move-to">
                    → {LOCATION_EMOJI[to]} {LOCATION_LABELS[to]}
                  </span>
                  <span className="move-msg">{effect.message}</span>
                </button>
              );
            })}
            {LOCATIONS.filter(
              (l) => l !== item.location && !others.includes(l)
            ).map((to) => {
              const effect = describeMove(item, to);
              return (
                <div key={to} className="move-option disabled">
                  <span className="move-to">
                    {LOCATION_EMOJI[to]} {LOCATION_LABELS[to]}
                  </span>
                  <span className="move-msg">{effect.message}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3>History</h3>
          <HistoryTimeline item={item} />
        </section>

        <button
          className="ghost danger full"
          onClick={() => onRemove(item.id, item.name)}
        >
          Ran out — remove
        </button>
      </div>
    </div>
  );
}

function HistoryTimeline({ item }: { item: InventoryItem }) {
  const now = Date.now();
  return (
    <div className="history-panel">
      <ul className="timeline">
        {item.history.map((ev, i) => (
          <li key={i} className="timeline-row">
            <span className="timeline-dot" />
            <span className="timeline-text">
              {ev.type === "added" ? (
                <>
                  Acquired in{" "}
                  <strong>
                    {LOCATION_EMOJI[ev.to]} {LOCATION_LABELS[ev.to]}
                  </strong>
                </>
              ) : (
                <>
                  Moved {ev.from ? `${LOCATION_LABELS[ev.from]} → ` : ""}
                  <strong>
                    {LOCATION_EMOJI[ev.to]} {LOCATION_LABELS[ev.to]}
                  </strong>
                </>
              )}
            </span>
            <span className="timeline-date">{fmtDateTime(ev.at)}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">
        In storage {daysSinceAcquired(item, now)} day
        {daysSinceAcquired(item, now) === 1 ? "" : "s"} · {item.history.length}{" "}
        event{item.history.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Date + time for the history timeline, e.g. "Jul 17, 3:40 PM". */
function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
