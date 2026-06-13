---
name: Spirit Realm art pipeline
description: How pixel art assets are structured and where they live in The Spirit Realm game
---

## Art directory
`artifacts/the-spirit-realm/public/art/` — all PNG card/sprite art files.

Naming convention:
- `card-<kebab-name>.png` — DCC/player card portraits
- `enemy-<kebab-name>.png` — combat enemy sprites  
- `char-<name>.png` — bunker character sprites

## Current status (COMPLETE as of June 2026)
**38 card PNGs** — all DCC card sprites are now real PNGs, no more null fallbacks.
**20+ enemy sprites** in public/art/enemy-*.png (all biome enemies covered, transparent backgrounds).
**4 character sprites** in public/art/char-*.png (char-self.png = young thief adventurer).

All sprites have transparent backgrounds (bg-removed via tool). JWC SpriteFill uses `objectFit: "contain"` (not cover) so transparency shows correctly.

## Fallback system
`sprites.ts` returns `null` for any asset without a PNG. Components fall back to `PixelPortrait` SVG.

## Responsive card sizing
`FullCard` in `CardArt.tsx` accepts a `scale` prop (default 1).
`CardsScreen.tsx` uses `useCardScale()` hook: 1.0 mobile, 1.4 at 700px+, 1.8 at 1000px+, 2.2 at 1400px+.

## JWC animations
CSS classes in `index.css`: `jwc-attack-hit`, `jwc-shield-block`, `jwc-reserve-pulse`.
Triggered via `useAnimKey()` hook in `JWCModal.tsx`.

## JWC inline layout (June 2026 — FIXED)
Grid rows: `"3fr 3fr 2.2fr"` (sprites bigger, button row bigger).
Button order: END TURN (big, at top of button cell) then 3 action buttons (STRIKE/BLOCK/RSRV) filling the rest.

## Workflow startup
Artifact workflow: `artifacts/the-spirit-realm: web` — this is the correct one to restart.
The old manual workflow `Start application` uses: `PORT=8081 BASE_PATH=/ pnpm --filter the-spirit-realm run dev`
