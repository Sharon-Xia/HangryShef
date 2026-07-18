import type { InventoryItem } from "./types";
import type { Recipe, RecipeIngredient, RecipeMatch, MatchStatus } from "./recipeTypes";

/**
 * Common staples that are almost always on hand and shouldn't block a
 * recipe from looking "ready" — real grocery apps that skip this end up
 * marking every recipe "missing" over salt and water.
 */
const STAPLES = new Set([
  "salt", "pepper", "black pepper", "water", "sugar", "oil", "olive oil",
  "vegetable oil", "cooking oil", "flour", "all-purpose flour", "butter",
  "baking powder", "baking soda", "vanilla", "vanilla extract",
  "garlic powder", "onion powder", "cornstarch", "corn starch", "ice",
  "ice cubes", "cooking spray",
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

const STOP_WORDS = new Set([
  "fresh", "raw", "large", "small", "medium", "chopped", "sliced", "diced",
  "minced", "ground", "whole", "of", "or", "and", "to", "taste", "a", "an",
  "the", "for", "boneless", "skinless", "dried", "frozen", "cooked",
]);

/**
 * Words that mark a recipe ingredient as a *processed derivative* of a raw
 * food (a powder, sauce, stock, etc.) rather than the food itself. Owning
 * raw "chicken" shouldn't satisfy "chicken bouillon powder" — they aren't
 * interchangeable — so ingredients containing one of these require an exact
 * name match rather than loose substring/token containment.
 */
const DERIVATIVE_MARKERS = new Set([
  "powder", "sauce", "stock", "broth", "paste", "extract", "seasoning",
  "bouillon", "syrup", "jam", "jelly", "juice", "vinegar", "essence",
  "concentrate", "mix", "dressing", "spread", "puree", "gravy",
]);

/** Every distinct name/alias associated with the user's current inventory. */
function ownedIndex(items: InventoryItem[]): { exact: Set<string>; tokens: Set<string> } {
  const exact = new Set<string>();
  const tokens = new Set<string>();
  for (const it of items) {
    const names = [it.name, it.spec.name, ...(it.spec.aliases ?? [])];
    for (const n of names) {
      const norm_ = norm(n);
      if (!norm_) continue;
      exact.add(norm_);
      for (const t of norm_.split(" ")) {
        if (t.length > 2 && !STOP_WORDS.has(t)) tokens.add(t);
      }
    }
  }
  return { exact, tokens };
}

function isOwned(
  ingredientName: string,
  owned: { exact: Set<string>; tokens: Set<string> }
): boolean {
  const n = norm(ingredientName);
  if (!n) return false;
  if (owned.exact.has(n)) return true;

  const isDerivative = n.split(" ").some((t) => DERIVATIVE_MARKERS.has(t));
  if (isDerivative) {
    // A processed product (sauce/powder/stock/...) only counts as owned if
    // it's an exact match above — owning the raw ingredient doesn't count.
    return false;
  }

  // Containment: "chicken" owned covers "chicken breast" ingredient, and
  // "boneless chicken thighs" ingredient is covered by owned "chicken".
  for (const ownedName of owned.exact) {
    if (n.includes(ownedName) || ownedName.includes(n)) return true;
  }

  // Token overlap: share a significant word (e.g. "cheddar cheese" ~ "cheese").
  const nTokens = n.split(" ").filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  return nTokens.some((t) => owned.tokens.has(t));
}

function statusOf(matchedCount: number, missingCount: number): MatchStatus {
  if (missingCount === 0) return "ready";
  if (matchedCount > 0 && missingCount <= 2) return "almost";
  return "missing-many";
}

export function matchRecipe(recipe: Recipe, items: InventoryItem[]): RecipeMatch {
  const owned = ownedIndex(items);
  const matched: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  const ignored: RecipeIngredient[] = [];

  for (const ing of recipe.ingredients) {
    const n = norm(ing.name);
    if (STAPLES.has(n)) {
      ignored.push(ing);
      continue;
    }
    if (isOwned(ing.name, owned)) matched.push(ing);
    else missing.push(ing);
  }

  const total = matched.length + missing.length;
  const pct = total === 0 ? 100 : Math.round((matched.length / total) * 100);

  return {
    recipe,
    matched,
    missing,
    ignored,
    pct,
    status: statusOf(matched.length, missing.length),
  };
}

export function matchRecipes(recipes: Recipe[], items: InventoryItem[]): RecipeMatch[] {
  return recipes.map((r) => matchRecipe(r, items));
}

const STATUS_RANK: Record<MatchStatus, number> = {
  ready: 0,
  almost: 1,
  "missing-many": 2,
  unknown: 3,
};

/** Ready-to-cook first, then almost-there, sorted by fewest missing within each. */
export function sortByMatch(matches: RecipeMatch[]): RecipeMatch[] {
  return [...matches].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return a.missing.length - b.missing.length;
  });
}
