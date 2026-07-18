import type { InventoryItem } from "./types";

// Simple localStorage-backed persistence for the inventory list.
// (In the full app this would be SQLite / cloud sync; localStorage is plenty
// for de-risking the shelf-life engine.)

const KEY = "shelflife.inventory.v1";

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrate items saved before `history` existed.
    return parsed.map((it: InventoryItem) =>
      it.history && it.history.length
        ? it
        : { ...it, history: [{ type: "added", at: it.addedAt, to: it.location }] }
    );
  } catch {
    return [];
  }
}

export function saveInventory(items: InventoryItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
