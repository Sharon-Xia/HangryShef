/** A single ingredient line as listed by a recipe. */
export interface RecipeIngredient {
  name: string;
  measure: string;
}

/** A recipe pulled from TheMealDB, normalized to our shape. */
export interface Recipe {
  id: string;
  name: string;
  category: string;
  /** Cuisine, e.g. "Italian", "Thai". TheMealDB calls this "Area". */
  area: string;
  thumbnail: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  source: "themealdb";
}

/** Lightweight listing (no ingredients yet) used before a detail fetch. */
export interface RecipeSummary {
  id: string;
  name: string;
  thumbnail: string;
}

export type MatchStatus = "ready" | "almost" | "missing-many" | "unknown";

export interface RecipeMatch {
  recipe: Recipe;
  matched: RecipeIngredient[];
  missing: RecipeIngredient[];
  /** Ignored staples (salt, water, etc.) — never counted as missing. */
  ignored: RecipeIngredient[];
  pct: number;
  status: MatchStatus;
}
