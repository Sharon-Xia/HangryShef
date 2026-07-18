import type { Recipe, RecipeIngredient, RecipeSummary } from "./recipeTypes";

/**
 * TheMealDB free client — public test key "1", no signup required.
 * https://www.themealdb.com/api.php
 */
const BASE = "https://www.themealdb.com/api/json/v1/1";

interface RawMeal {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strMealThumb: string;
  strInstructions?: string;
  [key: string]: string | undefined;
}

function parseIngredients(raw: RawMeal): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`]?.trim();
    const measure = raw[`strMeasure${i}`]?.trim() ?? "";
    if (name) out.push({ name, measure });
  }
  return out;
}

function toRecipe(raw: RawMeal): Recipe {
  return {
    id: raw.idMeal,
    name: raw.strMeal,
    category: raw.strCategory ?? "Other",
    area: raw.strArea ?? "Unknown",
    thumbnail: raw.strMealThumb,
    ingredients: parseIngredients(raw),
    instructions: raw.strInstructions ?? "",
    source: "themealdb",
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  return res.json();
}

/**
 * TheMealDB's `list.php?a=list` returns all 195 ISO nationality names, but
 * only a subset actually has recipes attached (querying most of the rest —
 * including, surprisingly, "American", "French", "Indian", "Dutch" — returns
 * zero results). A known quirk of their free API. Rather than showing
 * mostly-dead cuisine chips, we hardcode the verified-populated set below
 * (confirmed via `filter.php?a=<area>` returning a non-empty meal list).
 */
const KNOWN_AREAS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Thai", "Spanish", "British",
  "Turkish", "Greek", "Moroccan", "Vietnamese", "Jamaican", "Polish",
  "Croatian", "Canadian", "Russian", "Egyptian", "Filipino", "Malaysian",
  "Portuguese", "Tunisian", "Irish", "Ukrainian", "Kenyan",
];

/** Cuisines with actual recipes on TheMealDB, e.g. ["Italian", "Thai", ...]. */
export async function fetchAreas(): Promise<string[]> {
  return [...KNOWN_AREAS].sort();
}

/** Meal summaries (no ingredients) for a given cuisine. */
export async function fetchMealsByArea(area: string): Promise<RecipeSummary[]> {
  const data = await getJson<{
    meals: { idMeal: string; strMeal: string; strMealThumb: string }[] | null;
  }>(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  return (data.meals ?? []).map((m) => ({
    id: m.idMeal,
    name: m.strMeal,
    thumbnail: m.strMealThumb,
  }));
}

/** Full recipe detail (ingredients + instructions) for one meal id. */
export async function fetchMealDetail(id: string): Promise<Recipe | null> {
  const data = await getJson<{ meals: RawMeal[] | null }>(
    `${BASE}/lookup.php?i=${encodeURIComponent(id)}`
  );
  const raw = data.meals?.[0];
  return raw ? toRecipe(raw) : null;
}

/** Full-text search by name — TheMealDB returns full detail directly. */
export async function searchMealsByName(query: string): Promise<Recipe[]> {
  const data = await getJson<{ meals: RawMeal[] | null }>(
    `${BASE}/search.php?s=${encodeURIComponent(query)}`
  );
  return (data.meals ?? []).map(toRecipe);
}
