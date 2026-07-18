# Grocery Shelf-Life — engine prototype

A React PWA that de-risks the hardest part of your grocery app: the **shelf-life
engine**. It ranks food by what goes bad first, auto-picks a storage location,
and tells you how an item's lifespan changes when you move it between
pantry / fridge / freezer.

## What's in here

| Piece | File |
|---|---|
| Local USDA FoodKeeper table (~60 items) | `src/foodkeeper.ts` |
| Matching + expiry + move-recompute logic | `src/engine.ts` |
| Claude fallback for unknown items + cache | `src/claudeFallback.ts` |
| UI (add / sort / move / "ran out") | `src/App.tsx` |
| Settings (API key, cache) | `src/Settings.tsx` |

Resolution order for any item: **local table → local cache → Claude (if key set)
→ safe estimate**. So it always works, even offline with no key.

## Run it on your computer

You need Node.js 18+ (`node --version` to check).

```bash
npm install      # first time only
npm run dev      # starts the dev server
```

Open the printed **Local** URL (usually http://localhost:5173) in your browser.

## Install it on your phone (same Wi-Fi, no App Store)

1. `npm run dev` prints a **Network** URL like `http://192.168.x.x:5173`.
2. On your phone (connected to the **same Wi-Fi**), open that URL in the browser.
3. Add to Home Screen:
   - **iPhone (Safari):** Share → *Add to Home Screen*.
   - **Android (Chrome):** ⋮ menu → *Add to Home screen* / *Install app*.
4. It now launches full-screen like a native app.

> The dev server must be running on your computer for the phone to load it.
> To use it fully standalone, run `npm run build` then `npm run preview` (also
> prints a Network URL), or deploy the `dist/` folder to any static host.

## Turning on the Claude fallback (optional)

Tap ⚙️ → paste an Anthropic API key. Unknown items will then be looked up via
Claude and cached so you only pay once per item. Without a key, unknown items
get an editable safe estimate.
