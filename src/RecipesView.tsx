import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryItem } from "./types";
import type { Recipe, RecipeMatch, RecipeSummary } from "./recipeTypes";
import {
  fetchAreas,
  fetchMealDetail,
  fetchMealsByArea,
  searchMealsByName,
} from "./recipeApi";
import {
  cacheAreaList,
  cacheRecipe,
  cacheRecipes,
  getCachedRecipe,
  isCuisineLiked,
  isRecipeLiked,
  loadAreaListCache,
  loadLikedCuisines,
  loadLikedRecipeIds,
  toggleLikedCuisine,
  toggleLikedRecipe,
} from "./recipeStorage";
import { matchRecipe, sortByMatch } from "./recipeMatch";

type Mode = "browse" | "search" | "liked";

/** Fetch recipe details for a batch of ids with limited concurrency. */
async function fetchDetailsProgressively(
  ids: string[],
  onOne: (recipe: Recipe) => void,
  concurrency = 6
): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      const cached = getCachedRecipe(id);
      if (cached) {
        onOne(cached);
        continue;
      }
      try {
        const recipe = await fetchMealDetail(id);
        if (recipe) {
          cacheRecipe(recipe);
          onOne(recipe);
        }
      } catch {
        // skip a failed lookup; others continue
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

export function RecipesView({ items }: { items: InventoryItem[] }) {
  const [areas, setAreas] = useState<string[]>([]);
  const [likedCuisines, setLikedCuisines] = useState<string[]>(() => loadLikedCuisines());
  const [likedRecipeIds, setLikedRecipeIds] = useState<string[]>(() => loadLikedRecipeIds());
  const [mode, setMode] = useState<Mode>("browse");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Recipe>>({});
  const [summaries, setSummaries] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const searchDebounce = useRef<number | undefined>(undefined);

  // Load the cuisine list once; default to a liked cuisine if there is one.
  useEffect(() => {
    fetchAreas().then((a) => {
      setAreas(a);
      const liked = loadLikedCuisines();
      setSelectedArea(liked[0] ?? a[0] ?? null);
    });
  }, []);

  // Browse: load the meal list for the selected cuisine, then fetch details.
  useEffect(() => {
    if (mode !== "browse" || !selectedArea) return;
    let cancelled = false;
    setLoading(true);
    setSummaries([]);

    (async () => {
      const cache = loadAreaListCache();
      let list = cache[selectedArea];
      if (!list) {
        list = await fetchMealsByArea(selectedArea);
        cacheAreaList(selectedArea, list);
      }
      if (cancelled) return;
      setSummaries(list);

      await fetchDetailsProgressively(
        list.map((m) => m.id),
        (recipe) => {
          if (cancelled) return;
          setDetails((prev) => ({ ...prev, [recipe.id]: recipe }));
        }
      );
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, selectedArea]);

  // Search: debounced full-text search across all of TheMealDB.
  useEffect(() => {
    if (mode !== "search") return;
    window.clearTimeout(searchDebounce.current);
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchDebounce.current = window.setTimeout(async () => {
      const results = await searchMealsByName(q);
      cacheRecipes(results);
      setDetails((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.id] = r;
        return next;
      });
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }, [mode, query]);

  // Liked: make sure every liked recipe's detail is loaded.
  useEffect(() => {
    if (mode !== "liked") return;
    let cancelled = false;
    setLoading(true);
    fetchDetailsProgressively(likedRecipeIds, (recipe) => {
      if (cancelled) return;
      setDetails((prev) => ({ ...prev, [recipe.id]: recipe }));
    }).then(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode, likedRecipeIds]);

  function onToggleLikedCuisine(area: string, e: React.MouseEvent) {
    e.stopPropagation();
    toggleLikedCuisine(area);
    setLikedCuisines(loadLikedCuisines());
  }

  function onToggleLikedRecipe(id: string) {
    toggleLikedRecipe(id);
    setLikedRecipeIds(loadLikedRecipeIds());
  }

  const matches: RecipeMatch[] = useMemo(() => {
    let pool: Recipe[];
    if (mode === "browse") {
      pool = summaries.map((s) => details[s.id]).filter((r): r is Recipe => !!r);
    } else if (mode === "search") {
      pool = searchResults;
    } else {
      pool = likedRecipeIds.map((id) => details[id]).filter((r): r is Recipe => !!r);
    }
    return sortByMatch(pool.map((r) => matchRecipe(r, items)));
  }, [mode, summaries, details, searchResults, likedRecipeIds, items]);

  const pendingCount =
    mode === "browse" ? summaries.length - matches.length : 0;

  const selectedMatch = selectedRecipeId
    ? matches.find((m) => m.recipe.id === selectedRecipeId) ??
      (details[selectedRecipeId]
        ? matchRecipe(details[selectedRecipeId], items)
        : null)
    : null;

  return (
    <div className="recipes">
      <div className="view-toggle recipe-mode-toggle">
        <button className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")}>
          Browse
        </button>
        <button className={mode === "search" ? "active" : ""} onClick={() => setMode("search")}>
          Search
        </button>
        <button className={mode === "liked" ? "active" : ""} onClick={() => setMode("liked")}>
          ❤️ Liked{likedRecipeIds.length > 0 ? ` (${likedRecipeIds.length})` : ""}
        </button>
      </div>

      {mode === "browse" && (
        <div className="cuisine-chips">
          {areas.map((area) => (
            <button
              key={area}
              className={`cuisine-chip ${selectedArea === area ? "active" : ""}`}
              onClick={() => setSelectedArea(area)}
            >
              {area}
              <span
                className={`chip-heart ${isCuisineLiked(area) ? "on" : ""}`}
                onClick={(e) => onToggleLikedCuisine(area, e)}
                role="button"
                aria-label={`Like ${area} cuisine`}
              >
                {likedCuisines.includes(area) ? "♥" : "♡"}
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === "search" && (
        <form className="add-bar" onSubmit={(e) => e.preventDefault()}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes… e.g. chicken curry"
            autoComplete="off"
          />
        </form>
      )}

      {mode === "browse" && loading && (
        <p className="muted small recipe-loading">
          Loading recipes{pendingCount > 0 ? ` (${pendingCount} left)` : ""}…
        </p>
      )}
      {mode === "search" && searching && <p className="muted small recipe-loading">Searching…</p>}
      {mode === "liked" && loading && <p className="muted small recipe-loading">Loading…</p>}

      {mode === "liked" && likedRecipeIds.length === 0 && (
        <div className="empty">
          <p>No liked recipes yet.</p>
          <p className="muted">
            Browse or search, then tap the heart on a recipe to save it here.
          </p>
        </div>
      )}
      {mode === "search" && !query.trim() && (
        <div className="empty">
          <p>Search TheMealDB by recipe name.</p>
        </div>
      )}

      <ul className="recipe-grid">
        {matches.map((m) => (
          <RecipeCard
            key={m.recipe.id}
            match={m}
            liked={likedRecipeIds.includes(m.recipe.id)}
            onSelect={() => setSelectedRecipeId(m.recipe.id)}
            onToggleLike={() => onToggleLikedRecipe(m.recipe.id)}
          />
        ))}
      </ul>

      {selectedMatch && (
        <RecipeDetailSheet
          match={selectedMatch}
          liked={isRecipeLiked(selectedMatch.recipe.id)}
          onClose={() => setSelectedRecipeId(null)}
          onToggleLike={() => onToggleLikedRecipe(selectedMatch.recipe.id)}
        />
      )}
    </div>
  );
}

function statusLabel(status: RecipeMatch["status"]): string {
  switch (status) {
    case "ready":
      return "Ready to cook";
    case "almost":
      return "Almost there";
    case "missing-many":
      return "Missing a lot";
    default:
      return "";
  }
}

function RecipeCard({
  match,
  liked,
  onSelect,
  onToggleLike,
}: {
  match: RecipeMatch;
  liked: boolean;
  onSelect: () => void;
  onToggleLike: () => void;
}) {
  const { recipe, matched, missing, status } = match;
  const total = matched.length + missing.length;
  return (
    <li className="grid-cell">
      <button className={`tile recipe-tile ${status}`} onClick={onSelect}>
        <div className="tile-img recipe-tile-img">
          <img className="tile-photo" src={recipe.thumbnail} alt={recipe.name} loading="lazy" />
          <span
            className={`heart-btn ${liked ? "on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            role="button"
            aria-label="Like recipe"
          >
            {liked ? "♥" : "♡"}
          </span>
          <span className={`match-badge ${status}`}>
            {status === "ready" ? "✓ Ready" : `${matched.length}/${total}`}
          </span>
        </div>
        <div className="tile-body">
          <div className="tile-name">{recipe.name}</div>
          <div className="tile-meta">
            <span className="cat">{recipe.area}</span>
            <span className={`match-label ${status}`}>{statusLabel(status)}</span>
          </div>
        </div>
      </button>
    </li>
  );
}

function RecipeDetailSheet({
  match,
  liked,
  onClose,
  onToggleLike,
}: {
  match: RecipeMatch;
  liked: boolean;
  onClose: () => void;
  onToggleLike: () => void;
}) {
  const { recipe, matched, missing, ignored, status } = match;
  const total = matched.length + missing.length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <img className="sheet-photo recipe-sheet-photo" src={recipe.thumbnail} alt={recipe.name} />
          <div className="sheet-title">
            <h2>{recipe.name}</h2>
            <p className="muted">
              {recipe.area} · {recipe.category}
            </p>
          </div>
          <span
            className={`heart-btn large ${liked ? "on" : ""}`}
            onClick={onToggleLike}
            role="button"
            aria-label="Like recipe"
          >
            {liked ? "♥" : "♡"}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sheet-life">
          <div className="minibar">
            <div className="minibar-track">
              <div
                className="minibar-fill"
                style={{
                  width: `${total === 0 ? 100 : Math.round((matched.length / total) * 100)}%`,
                  background:
                    status === "ready"
                      ? "var(--ok)"
                      : status === "almost"
                      ? "var(--soon)"
                      : "var(--critical)",
                }}
              />
            </div>
            <span className="minibar-label">
              {matched.length}/{total} ingredients
            </span>
          </div>
        </div>

        <section>
          <h3>Ingredients</h3>
          <ul className="ingredient-list">
            {matched.map((ing, i) => (
              <li key={`m${i}`} className="ingredient-row have">
                <span className="ing-mark">✓</span>
                <span className="ing-name">{ing.name}</span>
                <span className="ing-measure muted">{ing.measure}</span>
              </li>
            ))}
            {missing.map((ing, i) => (
              <li key={`x${i}`} className="ingredient-row missing">
                <span className="ing-mark">✕</span>
                <span className="ing-name">{ing.name}</span>
                <span className="ing-measure muted">{ing.measure}</span>
              </li>
            ))}
            {ignored.map((ing, i) => (
              <li key={`s${i}`} className="ingredient-row staple">
                <span className="ing-mark">•</span>
                <span className="ing-name">{ing.name}</span>
                <span className="ing-measure muted">pantry staple</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Instructions</h3>
          <div className="instructions">
            {recipe.instructions
              .split(/\r?\n+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
