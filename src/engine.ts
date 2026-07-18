import { FOODKEEPER } from "./foodkeeper";
import type { FoodSpec, InventoryItem, StorageLocation } from "./types";
import { LOCATION_LABELS } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Normalize a name for matching: lowercase, strip punctuation/plurals-ish. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Find the best matching FoodSpec in the local FoodKeeper table.
 * Strategy: exact name/alias match, then whole-word containment, then
 * loose "any token overlaps" as a last resort. Returns null if nothing fits.
 */
export function lookupLocalSpec(rawName: string): FoodSpec | null {
  const q = norm(rawName);
  if (!q) return null;

  // 1. Exact match on name or alias.
  for (const spec of FOODKEEPER) {
    if (norm(spec.name) === q) return spec;
    if (spec.aliases?.some((a) => norm(a) === q)) return spec;
  }

  // 2. Containment: the query contains a spec's name/alias, or vice-versa.
  //    e.g. "organic whole milk" -> "milk", "chicken breast" -> "chicken".
  let best: { spec: FoodSpec; score: number } | null = null;
  for (const spec of FOODKEEPER) {
    const candidates = [spec.name, ...(spec.aliases ?? [])].map(norm);
    for (const c of candidates) {
      const cTokens = c.split(" ");
      const qContainsC = ` ${q} `.includes(` ${c} `);
      const cContainsQ = ` ${c} `.includes(` ${q} `);
      if (qContainsC || cContainsQ) {
        // Prefer longer matches (more specific).
        const score = cTokens.length * 10 + c.length;
        if (!best || score > best.score) best = { spec, score };
      }
    }
  }
  if (best) return best.spec;

  // 3. Loose token overlap (single shared word).
  const qTokens = new Set(q.split(" "));
  for (const spec of FOODKEEPER) {
    const candidates = [spec.name, ...(spec.aliases ?? [])].map(norm);
    for (const c of candidates) {
      if (c.split(" ").some((t) => t.length > 2 && qTokens.has(t))) {
        return spec;
      }
    }
  }

  return null;
}

/** Days of shelf life for a spec in a given location (null if not recommended). */
export function daysForLocation(
  spec: FoodSpec,
  location: StorageLocation
): number | null {
  switch (location) {
    case "pantry":
      return spec.pantryDays;
    case "fridge":
      return spec.fridgeDays;
    case "freezer":
      return spec.freezerDays;
  }
}

/** Locations where this spec can actually be stored (has a duration). */
export function validLocations(spec: FoodSpec): StorageLocation[] {
  return (["pantry", "fridge", "freezer"] as StorageLocation[]).filter(
    (loc) => daysForLocation(spec, loc) != null
  );
}

/** Expiry timestamp (epoch ms) for an item, or null if location unsupported. */
export function expiryOf(item: InventoryItem): number | null {
  const days = daysForLocation(item.spec, item.location);
  if (days == null) return null;
  return item.addedAt + days * DAY_MS;
}

/** Whole days remaining until expiry (can be negative if already expired). */
export function daysLeft(item: InventoryItem, now = Date.now()): number | null {
  const expiry = expiryOf(item);
  if (expiry == null) return null;
  return Math.ceil((expiry - now) / DAY_MS);
}

/**
 * Percentage of shelf life remaining (0–100) for the item in its current
 * location, measured from when it was acquired. Null if the location has no
 * defined duration. Used to draw the life bar.
 */
export function lifePercentLeft(item: InventoryItem, now = Date.now()): number | null {
  const total = daysForLocation(item.spec, item.location);
  if (total == null || total <= 0) return null;
  const totalMs = total * DAY_MS;
  const leftMs = totalMs - (now - item.addedAt);
  return Math.max(0, Math.min(100, (leftMs / totalMs) * 100));
}

/** Whole days elapsed since the item was acquired. */
export function daysSinceAcquired(item: InventoryItem, now = Date.now()): number {
  return Math.max(0, Math.floor((now - item.addedAt) / DAY_MS));
}

/** A red→green color for a life-percentage (0 = red, 100 = green). */
export function lifeColor(pct: number): string {
  const hue = Math.max(0, Math.min(120, (pct / 100) * 120)); // 0=red, 120=green
  return `hsl(${Math.round(hue)}, 72%, 45%)`;
}

export type Urgency = "expired" | "critical" | "soon" | "ok" | "unknown";

export function urgencyOf(item: InventoryItem, now = Date.now()): Urgency {
  const d = daysLeft(item, now);
  if (d == null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 2) return "critical";
  if (d <= 5) return "soon";
  return "ok";
}

/**
 * The heart of the "move between sections" feature.
 * Given an item and a target location, describe how its lifespan changes.
 * Keeps addedAt fixed, so expiry is recomputed from the same purchase date.
 */
export interface MoveEffect {
  from: StorageLocation;
  to: StorageLocation;
  fromDays: number | null;
  toDays: number | null;
  /** Days-left before and after the move (from "now"). */
  daysLeftBefore: number | null;
  daysLeftAfter: number | null;
  /** New expiry date after the move (epoch ms), or null if unsupported. */
  newExpiry: number | null;
  supported: boolean;
  /** Human-readable summary of the change. */
  message: string;
}

export function describeMove(
  item: InventoryItem,
  to: StorageLocation,
  now = Date.now()
): MoveEffect {
  const from = item.location;
  const fromDays = daysForLocation(item.spec, from);
  const toDays = daysForLocation(item.spec, to);
  const daysLeftBefore = daysLeft(item, now);

  const moved: InventoryItem = { ...item, location: to };
  const daysLeftAfter = daysLeft(moved, now);
  const newExpiry = expiryOf(moved);
  const supported = toDays != null;

  let message: string;
  if (!supported) {
    message = `${LOCATION_LABELS[to]} isn't recommended for ${item.spec.name.toLowerCase()} — ${
      item.spec.note ?? "quality drops off quickly there."
    }`;
  } else if (fromDays == null) {
    message = `In the ${label(to)} it keeps about ${fmtDays(toDays!)}.`;
  } else {
    const deltaLeft =
      daysLeftAfter != null && daysLeftBefore != null
        ? daysLeftAfter - daysLeftBefore
        : null;
    const dir =
      toDays > fromDays ? "longer" : toDays < fromDays ? "shorter" : "the same";
    const base = `${label(from)}: ~${fmtDays(fromDays)} total → ${label(
      to
    )}: ~${fmtDays(toDays!)} total (${dir}).`;
    const rel =
      deltaLeft != null && deltaLeft !== 0
        ? ` That's ${deltaLeft > 0 ? "+" : ""}${deltaLeft} day${
            Math.abs(deltaLeft) === 1 ? "" : "s"
          } of life from today.`
        : "";
    message = base + rel;
  }

  return {
    from,
    to,
    fromDays,
    toDays,
    daysLeftBefore,
    daysLeftAfter,
    newExpiry,
    supported,
    message,
  };
}

function label(loc: StorageLocation): string {
  return LOCATION_LABELS[loc];
}

/** Format a day count as a friendly duration. */
export function fmtDays(days: number): string {
  if (days >= 365) {
    const y = days / 365;
    return y >= 1.9 ? `${Math.round(y)} years` : "1 year";
  }
  if (days >= 60) {
    return `${Math.round(days / 30)} months`;
  }
  if (days >= 14) {
    return `${Math.round(days / 7)} weeks`;
  }
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Format an epoch-ms date as e.g. "Jul 24", adding the year only when it differs. */
export function fmtDate(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Sort a list of items by soonest to expire (unknown-expiry items last). */
export function sortByExpiry(items: InventoryItem[], now = Date.now()): InventoryItem[] {
  return [...items].sort((a, b) => {
    const da = daysLeft(a, now);
    const db = daysLeft(b, now);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}
