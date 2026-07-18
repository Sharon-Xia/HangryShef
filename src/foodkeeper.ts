import type { FoodSpec } from "./types";

/**
 * Curated subset of the USDA FoodKeeper dataset (public domain).
 * Durations are approximate high-quality shelf life in DAYS after purchase,
 * for storage in each location. `null` = not recommended for that location.
 *
 * This is a representative ~60-item table for the prototype. The real app would
 * bundle the full ~400-item FoodKeeper feed; the shape here is identical, so
 * expanding it is just adding rows. Anything not found here falls back to Claude.
 *
 * Source: USDA FSIS FoodKeeper — https://www.fsis.usda.gov/ (public data).
 */
export const FOODKEEPER: FoodSpec[] = [
  // ---- Produce ----
  { name: "Apple", category: "Produce", aliases: ["apples"], recommended: "fridge", pantryDays: 21, fridgeDays: 42, freezerDays: 240, source: "foodkeeper" },
  { name: "Banana", category: "Produce", aliases: ["bananas"], recommended: "pantry", pantryDays: 5, fridgeDays: 9, freezerDays: 60, note: "Skin darkens in fridge but fruit is fine.", source: "foodkeeper" },
  { name: "Strawberries", category: "Produce", aliases: ["strawberry", "berries"], recommended: "fridge", pantryDays: 1, fridgeDays: 5, freezerDays: 240, source: "foodkeeper" },
  { name: "Blueberries", category: "Produce", aliases: ["blueberry"], recommended: "fridge", pantryDays: 1, fridgeDays: 10, freezerDays: 240, source: "foodkeeper" },
  { name: "Grapes", category: "Produce", aliases: ["grape"], recommended: "fridge", pantryDays: 1, fridgeDays: 7, freezerDays: 300, source: "foodkeeper" },
  { name: "Lettuce", category: "Produce", aliases: ["romaine", "iceberg"], recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: null, note: "Freezing ruins texture.", source: "foodkeeper" },
  { name: "Spinach", category: "Produce", aliases: ["baby spinach"], recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: 300, source: "foodkeeper" },
  { name: "Tomato", category: "Produce", aliases: ["tomatoes"], recommended: "pantry", pantryDays: 5, fridgeDays: 14, freezerDays: 60, note: "Best flavor at room temp; fridge for longevity.", source: "foodkeeper" },
  { name: "Carrot", category: "Produce", aliases: ["carrots"], recommended: "fridge", pantryDays: 4, fridgeDays: 28, freezerDays: 300, source: "foodkeeper" },
  { name: "Potato", category: "Produce", aliases: ["potatoes", "russet"], recommended: "pantry", pantryDays: 60, fridgeDays: 90, freezerDays: null, note: "Cold turns starch to sugar; keep cool & dark, not in fridge.", source: "foodkeeper" },
  { name: "Onion", category: "Produce", aliases: ["onions"], recommended: "pantry", pantryDays: 30, fridgeDays: 60, freezerDays: 240, source: "foodkeeper" },
  { name: "Garlic", category: "Produce", recommended: "pantry", pantryDays: 90, fridgeDays: 60, freezerDays: 300, source: "foodkeeper" },
  { name: "Broccoli", category: "Produce", recommended: "fridge", pantryDays: null, fridgeDays: 5, freezerDays: 300, source: "foodkeeper" },
  { name: "Bell Pepper", category: "Produce", aliases: ["pepper", "peppers", "capsicum"], recommended: "fridge", pantryDays: 2, fridgeDays: 14, freezerDays: 240, source: "foodkeeper" },
  { name: "Avocado", category: "Produce", aliases: ["avocados"], recommended: "fridge", pantryDays: 4, fridgeDays: 7, freezerDays: 180, note: "Ripen on counter, then fridge. Freeze as puree.", source: "foodkeeper" },
  { name: "Mushrooms", category: "Produce", aliases: ["mushroom"], recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: 300, source: "foodkeeper" },
  { name: "Cucumber", category: "Produce", aliases: ["cucumbers"], recommended: "fridge", pantryDays: 2, fridgeDays: 7, freezerDays: null, source: "foodkeeper" },
  { name: "Celery", category: "Produce", recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: 300, source: "foodkeeper" },
  { name: "Lemon", category: "Produce", aliases: ["lemons", "lime", "limes", "citrus"], recommended: "fridge", pantryDays: 7, fridgeDays: 28, freezerDays: 120, source: "foodkeeper" },

  // ---- Dairy & eggs ----
  { name: "Milk", category: "Dairy", recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: 90, note: "Freezing is fine but texture separates; shake after thaw.", source: "foodkeeper" },
  { name: "Eggs", category: "Dairy", aliases: ["egg"], recommended: "fridge", pantryDays: null, fridgeDays: 35, freezerDays: null, note: "Don't freeze in shell. Beaten eggs freeze ~1 year.", source: "foodkeeper" },
  { name: "Butter", category: "Dairy", recommended: "fridge", pantryDays: 2, fridgeDays: 30, freezerDays: 270, source: "foodkeeper" },
  { name: "Cheese (hard)", category: "Dairy", aliases: ["cheddar", "parmesan", "hard cheese"], recommended: "fridge", pantryDays: null, fridgeDays: 180, freezerDays: 180, source: "foodkeeper" },
  { name: "Cheese (soft)", category: "Dairy", aliases: ["mozzarella", "brie", "soft cheese"], recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: 180, source: "foodkeeper" },
  { name: "Yogurt", category: "Dairy", recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: 60, source: "foodkeeper" },
  { name: "Cream Cheese", category: "Dairy", recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: 60, source: "foodkeeper" },
  { name: "Sour Cream", category: "Dairy", recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: null, source: "foodkeeper" },

  // ---- Meat & seafood ----
  { name: "Chicken (raw)", category: "Meat", aliases: ["chicken", "chicken breast", "chicken thigh"], recommended: "fridge", pantryDays: null, fridgeDays: 2, freezerDays: 270, source: "foodkeeper" },
  { name: "Ground Beef", category: "Meat", aliases: ["mince", "hamburger", "ground meat"], recommended: "fridge", pantryDays: null, fridgeDays: 2, freezerDays: 120, source: "foodkeeper" },
  { name: "Steak", category: "Meat", aliases: ["beef", "beef steak"], recommended: "fridge", pantryDays: null, fridgeDays: 4, freezerDays: 300, source: "foodkeeper" },
  { name: "Pork Chops", category: "Meat", aliases: ["pork", "pork chop"], recommended: "fridge", pantryDays: null, fridgeDays: 4, freezerDays: 180, source: "foodkeeper" },
  { name: "Bacon", category: "Meat", recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: 30, source: "foodkeeper" },
  { name: "Sausage (raw)", category: "Meat", aliases: ["sausage", "sausages"], recommended: "fridge", pantryDays: null, fridgeDays: 2, freezerDays: 60, source: "foodkeeper" },
  { name: "Fish (fresh)", category: "Seafood", aliases: ["fish", "salmon", "tilapia", "cod"], recommended: "fridge", pantryDays: null, fridgeDays: 2, freezerDays: 180, source: "foodkeeper" },
  { name: "Shrimp", category: "Seafood", aliases: ["prawns"], recommended: "fridge", pantryDays: null, fridgeDays: 2, freezerDays: 180, source: "foodkeeper" },
  { name: "Deli Meat", category: "Meat", aliases: ["lunch meat", "cold cuts", "ham"], recommended: "fridge", pantryDays: null, fridgeDays: 4, freezerDays: 60, note: "Once opened.", source: "foodkeeper" },
  { name: "Hot Dogs", category: "Meat", aliases: ["hot dog", "frankfurter"], recommended: "fridge", pantryDays: null, fridgeDays: 7, freezerDays: 60, note: "Once opened.", source: "foodkeeper" },
  { name: "Tofu", category: "Protein", recommended: "fridge", pantryDays: null, fridgeDays: 5, freezerDays: 150, note: "Once opened; freezing changes texture (chewier).", source: "foodkeeper" },

  // ---- Bakery ----
  { name: "Bread", category: "Bakery", aliases: ["loaf", "sliced bread"], recommended: "pantry", pantryDays: 5, fridgeDays: 14, freezerDays: 90, note: "Fridge staling is faster but mold slower; freezer is best for keeping.", source: "foodkeeper" },
  { name: "Bagels", category: "Bakery", aliases: ["bagel"], recommended: "pantry", pantryDays: 5, fridgeDays: 14, freezerDays: 180, source: "foodkeeper" },
  { name: "Tortillas", category: "Bakery", aliases: ["tortilla", "wraps"], recommended: "pantry", pantryDays: 7, fridgeDays: 28, freezerDays: 180, source: "foodkeeper" },

  // ---- Pantry / dry goods ----
  { name: "Rice (dry)", category: "Pantry", aliases: ["rice", "white rice"], recommended: "pantry", pantryDays: 720, fridgeDays: null, freezerDays: null, source: "foodkeeper" },
  { name: "Pasta (dry)", category: "Pantry", aliases: ["pasta", "spaghetti", "noodles"], recommended: "pantry", pantryDays: 720, fridgeDays: null, freezerDays: null, source: "foodkeeper" },
  { name: "Flour", category: "Pantry", aliases: ["all-purpose flour"], recommended: "pantry", pantryDays: 240, fridgeDays: 365, freezerDays: 365, source: "foodkeeper" },
  { name: "Sugar", category: "Pantry", recommended: "pantry", pantryDays: 730, fridgeDays: null, freezerDays: null, source: "foodkeeper" },
  { name: "Cereal", category: "Pantry", recommended: "pantry", pantryDays: 180, fridgeDays: null, freezerDays: null, note: "Unopened; ~2-3 months once opened.", source: "foodkeeper" },
  { name: "Oats", category: "Pantry", aliases: ["oatmeal", "rolled oats"], recommended: "pantry", pantryDays: 365, fridgeDays: null, freezerDays: 365, source: "foodkeeper" },
  { name: "Canned Goods", category: "Pantry", aliases: ["canned", "can", "canned beans", "canned soup"], recommended: "pantry", pantryDays: 730, fridgeDays: null, freezerDays: null, note: "Once opened, refrigerate and use in 3-4 days.", source: "foodkeeper" },
  { name: "Peanut Butter", category: "Pantry", aliases: ["peanutbutter", "nut butter"], recommended: "pantry", pantryDays: 180, fridgeDays: 90, freezerDays: null, source: "foodkeeper" },
  { name: "Cooking Oil", category: "Pantry", aliases: ["oil", "olive oil", "vegetable oil"], recommended: "pantry", pantryDays: 180, fridgeDays: 365, freezerDays: null, source: "foodkeeper" },
  { name: "Coffee (ground)", category: "Pantry", aliases: ["coffee"], recommended: "pantry", pantryDays: 90, fridgeDays: null, freezerDays: 240, source: "foodkeeper" },
  { name: "Potato Chips", category: "Pantry", aliases: ["chips", "crisps"], recommended: "pantry", pantryDays: 60, fridgeDays: null, freezerDays: null, source: "foodkeeper" },
  { name: "Honey", category: "Pantry", recommended: "pantry", pantryDays: 3650, fridgeDays: null, freezerDays: null, note: "Essentially never spoils.", source: "foodkeeper" },

  // ---- Condiments (opened) ----
  { name: "Ketchup", category: "Condiment", recommended: "fridge", pantryDays: 30, fridgeDays: 180, freezerDays: null, note: "Once opened.", source: "foodkeeper" },
  { name: "Mustard", category: "Condiment", recommended: "fridge", pantryDays: 30, fridgeDays: 365, freezerDays: null, note: "Once opened.", source: "foodkeeper" },
  { name: "Mayonnaise", category: "Condiment", aliases: ["mayo"], recommended: "fridge", pantryDays: null, fridgeDays: 60, freezerDays: null, note: "Once opened.", source: "foodkeeper" },
  { name: "Jam", category: "Condiment", aliases: ["jelly", "preserves"], recommended: "fridge", pantryDays: 30, fridgeDays: 180, freezerDays: null, note: "Once opened.", source: "foodkeeper" },
  { name: "Salsa", category: "Condiment", recommended: "fridge", pantryDays: null, fridgeDays: 14, freezerDays: null, note: "Once opened.", source: "foodkeeper" },
  { name: "Soy Sauce", category: "Condiment", recommended: "fridge", pantryDays: 180, fridgeDays: 365, freezerDays: null, note: "Once opened; keeps longer refrigerated.", source: "foodkeeper" },

  // ---- Leftovers ----
  { name: "Leftovers (cooked)", category: "Prepared", aliases: ["leftovers", "cooked food"], recommended: "fridge", pantryDays: null, fridgeDays: 4, freezerDays: 120, source: "foodkeeper" },
];
