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
**4 character sprites** in public/art/char-*.png.
- `char-self.png` = full-body hooded rogue dual daggers, faces RIGHT naturally (no flip in code)

## Undead biome — all redone June 2026
`enemy-skeleton.png`, `enemy-skeleton-wolf.png`, `enemy-skeleton-knight.png`, `enemy-firegaunt.png`

## Swamp boss — redone June 2026
`enemy-ancient-black-dragon.png`

## DCC cards redone June 2026
`card-blob-king.png`, `card-goblin-runt.png`, `card-goblin-shaman.png`, `card-goblin-bomb.png`

## Fallback system
`sprites.ts` returns `null` for any asset without a PNG. Components fall back to `PixelPortrait` SVG.

## JWC animations
CSS classes in `index.css`: `jwc-attack-hit`, `jwc-shield-block`, `jwc-reserve-pulse`.
Triggered via `useAnimKey()` hook in `JWCModal.tsx`.

## Image generation limit
10 images per notebook session (not per call). Restart notebook (`restart: true`) does NOT reset the limit — it's server-side per agent session.

## Workflow startup
Artifact workflow: `artifacts/the-spirit-realm: web` — this is the correct one to restart.
The old manual workflow `Start application` uses: `PORT=8081 BASE_PATH=/ pnpm --filter the-spirit-realm run dev`
