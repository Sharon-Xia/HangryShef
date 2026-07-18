import { useMemo, useState } from "react";
import type { FoodSpec } from "./types";
import { emojiFor } from "./emoji";

/**
 * Real food photos, addressed by ingredient name from TheMealDB's free
 * ingredient image CDN (transparent PNGs on white). Names don't always match
 * exactly, so we try a series of candidate names (most specific first) and
 * fall back to the emoji when none load — which also covers being offline.
 *
 * Image credit: TheMealDB (https://www.themealdb.com/).
 */

const BASE = "https://www.themealdb.com/images/ingredients/";

// Qualifier words that aren't the ingredient itself — dropped when deriving
// single-word candidates (e.g. "raw chicken breast" -> "chicken").
const STOP = new Set([
  "raw", "cooked", "fresh", "frozen", "whole", "dry", "dried", "canned",
  "opened", "unopened", "low", "fat", "reduced", "lean", "large", "small",
  "boneless", "skinless", "ground", "sliced", "shredded", "grated", "plain",
  "flavored", "commercial", "homemade", "or", "and", "with", "in", "the",
  "processed", "hard", "soft", "light", "heavy",
]);

function toUrl(name: string): string {
  return `${BASE}${encodeURIComponent(name.trim())}-Small.png`;
}

/** Ordered list of image URLs to try for an item. */
export function imageCandidates(spec: FoodSpec, displayName?: string): string[] {
  const names: string[] = [];
  const push = (s?: string) => {
    if (!s) return;
    const t = s.trim();
    if (t && t.length > 1 && !names.some((x) => x.toLowerCase() === t.toLowerCase())) {
      names.push(t);
    }
  };

  push(displayName);
  push(spec.name);
  // Strip parentheticals and anything after a comma ("Cheese, soft" -> "Cheese").
  push(spec.name.replace(/\(.*?\)/g, "").replace(/,.*/, "").trim());
  // Significant single words, longest (most specific) first.
  const words = spec.name
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()));
  words.sort((a, b) => b.length - a.length).forEach(push);
  (spec.aliases ?? []).slice(0, 2).forEach(push);

  return names.slice(0, 5).map(toUrl);
}

export function FoodImage({
  spec,
  name,
  className = "",
}: {
  spec: FoodSpec;
  name: string;
  className?: string;
}) {
  const urls = useMemo(() => imageCandidates(spec, name), [spec, name]);
  const [idx, setIdx] = useState(0);

  if (idx >= urls.length) {
    // Exhausted all photo candidates → emoji fallback.
    return (
      <span className={`${className} emoji-fallback`} role="img" aria-label={name}>
        {emojiFor(spec, name)}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={urls[idx]}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
