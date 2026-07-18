import type { FoodSpec } from "./types";

/**
 * Picks a food "image" (emoji) for an item. Prototype stand-in for real product
 * photos — works offline and covers unknown/Claude items via a category
 * fallback, so every tile always has a visual.
 */

// Keyword → emoji. First matching keyword (substring, case-insensitive) wins.
const KEYWORDS: [RegExp, string][] = [
  [/milk/, "🥛"],
  [/butter/, "🧈"],
  [/cheese/, "🧀"],
  [/yogurt|cream/, "🥛"],
  [/egg/, "🥚"],
  [/chicken/, "🍗"],
  [/ground beef|hamburger|mince/, "🥩"],
  [/steak|beef/, "🥩"],
  [/pork|bacon|ham/, "🥓"],
  [/sausage|hot dog|frankfurter/, "🌭"],
  [/deli|lunch meat|cold cut/, "🥪"],
  [/fish|salmon|cod|tilapia/, "🐟"],
  [/shrimp|prawn/, "🦐"],
  [/tofu/, "🧊"],
  [/banana/, "🍌"],
  [/apple/, "🍎"],
  [/strawberr|berr/, "🍓"],
  [/blueberr/, "🫐"],
  [/grape/, "🍇"],
  [/lettuce|spinach|romaine|kale|greens/, "🥬"],
  [/tomato/, "🍅"],
  [/carrot/, "🥕"],
  [/potato/, "🥔"],
  [/onion/, "🧅"],
  [/garlic/, "🧄"],
  [/broccoli/, "🥦"],
  [/pepper|capsicum/, "🫑"],
  [/avocado/, "🥑"],
  [/mushroom/, "🍄"],
  [/cucumber/, "🥒"],
  [/celery/, "🥬"],
  [/lemon|lime|citrus/, "🍋"],
  [/corn/, "🌽"],
  [/bread|loaf|toast/, "🍞"],
  [/bagel/, "🥯"],
  [/tortilla|wrap/, "🫓"],
  [/rice/, "🍚"],
  [/pasta|spaghetti|noodle/, "🍝"],
  [/flour|sugar|oats|oatmeal|cereal/, "🌾"],
  [/canned|can |beans/, "🥫"],
  [/peanut|nut butter/, "🥜"],
  [/oil/, "🫒"],
  [/coffee/, "☕"],
  [/chips|crisp/, "🍟"],
  [/honey/, "🍯"],
  [/ketchup|mustard|mayo|salsa|soy|jam|jelly|sauce/, "🥫"],
  [/leftover|cooked|prepared/, "🍲"],
];

const CATEGORY_FALLBACK: Record<string, string> = {
  Produce: "🥬",
  Dairy: "🥛",
  Meat: "🍖",
  Seafood: "🐟",
  Bakery: "🍞",
  Pantry: "🥫",
  Condiment: "🧂",
  Prepared: "🍲",
  Protein: "🫘",
};

export function emojiFor(spec: FoodSpec, displayName?: string): string {
  const hay = `${displayName ?? ""} ${spec.name}`.toLowerCase();
  for (const [re, emoji] of KEYWORDS) {
    if (re.test(hay)) return emoji;
  }
  return CATEGORY_FALLBACK[spec.category] ?? "🍽️";
}
