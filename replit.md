# The Spirit Realm

A medieval card/board RPG built with React + Vite. Players traverse a board, fight enemies in card-based combat, loot gear, and manage a bunker between runs.

## Run & Operate

- `pnpm --filter @workspace/the-spirit-realm run dev` — run the game (port 26090, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React + Vite (artifact: `the-spirit-realm`)
- API: Express 5 (artifact: `api-server`)
- DB: PostgreSQL + Drizzle ORM
- Font: VT323 (pixel/retro aesthetic)

## Where things live

- `artifacts/the-spirit-realm/src/game/data.ts` — all game data: enemies, weapons, armor, biomes, parts
- `artifacts/the-spirit-realm/src/game/state.ts` — full game state machine (Zustand store)
- `artifacts/the-spirit-realm/src/assets/sprites.ts` — sprite map exports; returns null for missing PNGs → PixelPortrait SVG fallback
- `artifacts/the-spirit-realm/public/art/` — PNG pixel art assets (20 files currently)
- `artifacts/the-spirit-realm/src/components/CardArt.tsx` — card rendering + PixelPortrait SVG fallback
- `artifacts/the-spirit-realm/src/components/JWCModal.tsx` — combat screen with SpriteBox (uses CHARACTER_SPRITES + ENEMY_SPRITES)

## Art pipeline

**20 PNG files** exist in `public/art/`:
- 10 original player cards (archer, knight, king, etc.)
- 10 generated DCC enemy cards (slimeling, acid-blob, goo-titan, blob-king, bone-walker, skull-mage, risen-guard, lich-spawn, goblin-shaman, goblin-runt)

All other assets fall back to `PixelPortrait` — a category-aware SVG pixel art generator built into `CardArt.tsx`. To add a PNG: drop the file into `public/art/` and set the path in `sprites.ts` (currently `null`).

**Image generation limit:** free tier = 10 images per run. Generated images always land in `attached_assets/generated_images/` with random hex hash names regardless of `outputPath`. Must visually identify and `cp` to the correct destination.

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- **Null-based sprite fallback**: sprites.ts returns `null` for missing assets; components fall back to SVG `PixelPortrait` (never broken image icons)
- **PixelPortrait** detects card/enemy category from name (slime, skeleton, goblin, fire, etc.) and renders appropriate color/shape pixel art as SVG
- **CharacterDoll** (gear display) uses CSS boxes, not sprite images — no armor PNG needed for the equipment doll
- VT323 pixel font loaded globally for consistent retro aesthetic

## Product

Fantasy board RPG with 5 biomes (Forest, Snowy, Underworld, Volcano, Swamp), card-based JWC combat system, bunker management, gear crafting, and a full DCC (Black Rose) card deck with slime/skeleton/goblin/plant/demon enemy sets.

## User preferences

_Populate as you build._

## Gotchas

- Do NOT call `pnpm dev` at workspace root — use workflow restart or `pnpm --filter` commands
- Image generation: `outputPath` param is ignored; always check `attached_assets/generated_images/` after generating
- Run `pnpm --filter @workspace/the-spirit-realm run typecheck` to verify before assuming TS is clean
