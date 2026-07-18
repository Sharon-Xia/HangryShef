import type { Recipe, RecipeSummary } from "./recipeTypes";

/**
 * Local persistence for recipes: a growing cache of every recipe detail
 * we've ever fetched (recipe data is effectively static, so it's cached
 * forever — no expiry), plus the user's liked cuisines and liked recipes,
 * and cached per-cuisine meal listings so re-browsing a cuisine is instant.
 */

const RECIPE_CACHE_KEY = "shelflife.recipe-cache.v1";
const AREA_LIST_CACHE_KEY = "shelflife.recipe-area-cache.v1";
const LIKED_RECIPES_KEY = "shelflife.liked-recipes.v1";
const LIKED_CUISINES_KEY = "shelflife.liked-cuisines.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Recipe detail cache (by id) ----

export function loadRecipeCache(): Record<string, Recipe> {
  return readJson(RECIPE_CACHE_KEY, {});
}

export function cacheRecipe(recipe: Recipe): void {
  const cache = loadRecipeCache();
  cache[recipe.id] = recipe;
  writeJson(RECIPE_CACHE_KEY, cache);
}

export function cacheRecipes(recipes: Recipe[]): void {
  const cache = loadRecipeCache();
  for (const r of recipes) cache[r.id] = r;
  writeJson(RECIPE_CACHE_KEY, cache);
}

export function getCachedRecipe(id: string): Recipe | null {
  return loadRecipeCache()[id] ?? null;
}

// ---- Per-cuisine meal-list cache (id/name/thumbnail only) ----

export function loadAreaListCache(): Record<string, RecipeSummary[]> {
  return readJson(AREA_LIST_CACHE_KEY, {});
}

export function cacheAreaList(area: string, summaries: RecipeSummary[]): void {
  const cache = loadAreaListCache();
  cache[area] = summaries;
  writeJson(AREA_LIST_CACHE_KEY, cache);
}

// ---- Liked recipes ----

export function loadLikedRecipeIds(): string[] {
  return readJson(LIKED_RECIPES_KEY, []);
}

export function toggleLikedRecipe(id: string): boolean {
  const liked = new Set(loadLikedRecipeIds());
  let nowLiked: boolean;
  if (liked.has(id)) {
    liked.delete(id);
    nowLiked = false;
  } else {
    liked.add(id);
    nowLiked = true;
  }
  writeJson(LIKED_RECIPES_KEY, [...liked]);
  return nowLiked;
}

export function isRecipeLiked(id: string): boolean {
  return loadLikedRecipeIds().includes(id);
}

// ---- Liked cuisines ----

export function loadLikedCuisines(): string[] {
  return readJson(LIKED_CUISINES_KEY, []);
}

export function toggleLikedCuisine(area: string): boolean {
  const liked = new Set(loadLikedCuisines());
  let nowLiked: boolean;
  if (liked.has(area)) {
    liked.delete(area);
    nowLiked = false;
  } else {
    liked.add(area);
    nowLiked = true;
  }
  writeJson(LIKED_CUISINES_KEY, [...liked]);
  return nowLiked;
}

export function isCuisineLiked(area: string): boolean {
  return loadLikedCuisines().includes(area);
}

export function recipeCacheSize(): number {
  return Object.keys(loadRecipeCache()).length;
}
