import type { FoodSpec, StorageLocation } from "./types";
import { lookupLocalSpec } from "./engine";

/**
 * Resolves a storage spec for an item the local FoodKeeper table doesn't know.
 *
 * Order of resolution:
 *   1. Local FoodKeeper table (free, offline)  -- handled by caller, but re-checked here.
 *   2. Local cache of previous Claude answers (free, offline, grows over time).
 *   3. Claude API (only if the user has entered a key in Settings).
 *   4. Conservative default (fridge, 5 days) so the app always works offline.
 */

const CACHE_KEY = "shelflife.spec-cache.v1";
const API_KEY_KEY = "shelflife.anthropic-key";
const MODEL = "claude-haiku-4-5-20251001"; // cheap + fast; good enough for this lookup

type SpecCache = Record<string, FoodSpec>;

function loadCache(): SpecCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: SpecCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function cacheKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setApiKey(key: string): void {
  if (key) localStorage.setItem(API_KEY_KEY, key.trim());
  else localStorage.removeItem(API_KEY_KEY);
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

/** A safe default so unknown items still get a sensible (editable) spec. */
export function defaultSpec(name: string): FoodSpec {
  return {
    name: titleCase(name),
    category: "Unknown",
    recommended: "fridge",
    pantryDays: 3,
    fridgeDays: 5,
    freezerDays: 90,
    note: "Estimated default — add an API key or edit for a better guess.",
    source: "default",
  };
}

export interface ResolveResult {
  spec: FoodSpec;
  /** Where the answer came from, for UI transparency. */
  via: "foodkeeper" | "cache" | "claude" | "default";
}

/**
 * Main entry point. Never throws — always returns *some* spec so the UI works
 * even offline / without a key.
 */
export async function resolveSpec(name: string): Promise<ResolveResult> {
  const local = lookupLocalSpec(name);
  if (local) return { spec: local, via: "foodkeeper" };

  const cache = loadCache();
  const key = cacheKey(name);
  if (cache[key]) return { spec: cache[key], via: "cache" };

  if (hasApiKey()) {
    try {
      const spec = await fetchSpecFromClaude(name);
      cache[key] = spec;
      saveCache(cache);
      return { spec, via: "claude" };
    } catch (err) {
      console.warn("Claude fallback failed, using default:", err);
    }
  }

  return { spec: defaultSpec(name), via: "default" };
}

/**
 * Calls the Anthropic API directly from the browser.
 *
 * NOTE: this uses `anthropic-dangerous-direct-browser-access`, which exposes
 * your API key to the page. That's fine for a personal local prototype, but a
 * production app must proxy this through a small backend so the key stays secret.
 */
async function fetchSpecFromClaude(name: string): Promise<FoodSpec> {
  const apiKey = getApiKey();
  const prompt = `You are a food-storage expert using USDA FoodKeeper guidance.
For the grocery item "${name}", return ONLY a JSON object (no prose, no markdown fences) with exactly these keys:
{
  "name": string,              // cleaned-up display name
  "category": string,          // e.g. Produce, Dairy, Meat, Pantry
  "recommended": "pantry" | "fridge" | "freezer",
  "pantryDays": number | null, // typical high-quality shelf life in DAYS at room temp, or null if not recommended
  "fridgeDays": number | null,
  "freezerDays": number | null,
  "note": string               // one short storage tip
}
Use null where storing in that location is not recommended. Base numbers on typical USDA FoodKeeper durations.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const parsed = extractJson(text);

  return normalizeSpec(name, parsed);
}

/** Pull the first JSON object out of a text blob, tolerating stray prose. */
function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in Claude response");
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeSpec(fallbackName: string, raw: Record<string, unknown>): FoodSpec {
  const loc = (v: unknown): StorageLocation =>
    v === "pantry" || v === "fridge" || v === "freezer" ? v : "fridge";
  const num = (v: unknown): number | null =>
    typeof v === "number" && v > 0 ? Math.round(v) : null;

  return {
    name: typeof raw.name === "string" ? raw.name : titleCase(fallbackName),
    category: typeof raw.category === "string" ? raw.category : "Other",
    recommended: loc(raw.recommended),
    pantryDays: num(raw.pantryDays),
    fridgeDays: num(raw.fridgeDays),
    freezerDays: num(raw.freezerDays),
    note: typeof raw.note === "string" ? raw.note : undefined,
    source: "claude",
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** For the Settings screen: how many specs we've learned & cached. */
export function cacheSize(): number {
  return Object.keys(loadCache()).length;
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
