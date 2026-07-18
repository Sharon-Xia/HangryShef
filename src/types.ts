// Core domain types for the shelf-life engine.

export type StorageLocation = "pantry" | "fridge" | "freezer";

export const LOCATIONS: StorageLocation[] = ["pantry", "fridge", "freezer"];

export const LOCATION_LABELS: Record<StorageLocation, string> = {
  pantry: "Pantry / Shelf",
  fridge: "Fridge",
  freezer: "Freezer",
};

export const LOCATION_EMOJI: Record<StorageLocation, string> = {
  pantry: "🥫",
  fridge: "❄️",
  freezer: "🧊",
};

/**
 * A storage specification for a kind of food. Durations are the typical
 * *high-quality* shelf life in DAYS for each location. `null` means storing
 * the item in that location is not recommended (or not meaningful).
 */
export interface FoodSpec {
  name: string;
  category: string;
  aliases?: string[];
  /** Where this item is best kept by default. */
  recommended: StorageLocation;
  pantryDays: number | null;
  fridgeDays: number | null;
  freezerDays: number | null;
  note?: string;
  /** How we learned this spec. */
  source: "foodkeeper" | "claude" | "default" | "manual";
}

/** A single event in an item's life: acquired, or moved between locations. */
export interface ItemEvent {
  type: "added" | "moved";
  at: number;
  /** Where it moved from (moves only). */
  from?: StorageLocation;
  /** Where it landed (added: initial location; moved: destination). */
  to: StorageLocation;
}

/** A concrete item the user actually has, placed in a location. */
export interface InventoryItem {
  id: string;
  /** Display name as entered by the user. */
  name: string;
  /** The spec used to compute shelf life. */
  spec: FoodSpec;
  location: StorageLocation;
  /** Epoch ms when the item was acquired (its "acquired" date). */
  addedAt: number;
  /** Chronological log of acquisition + moves. */
  history: ItemEvent[];
}
