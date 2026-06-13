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

## Current status (as of June 2026)
30 card PNGs exist:
- 10 original player cards (village-guard, archer, knight, hunter, dark-assassin, scientist, dragon, joker, king, sand-goblin)
- 10 generated DCC cards batch 1 (slimeling, acid-blob, goo-titan, blob-king, bone-walker, skull-mage, risen-guard, lich-spawn, goblin-shaman, goblin-runt)
- 10 generated DCC cards batch 2 (warchief, vine-lurker, fire-imp, shadow-fiend, root-golem, thorn-sprite, demon-knight, rust-bot, iron-cleric, pit-lord)

20 enemy sprites exist in public/art/enemy-*.png (all biome enemies covered)
4 character sprites exist in public/art/char-*.png

## Fallback system
`sprites.ts` returns `null` for any asset without a PNG. Components (`CardArt.tsx`, `JWCModal.tsx`) fall back to `PixelPortrait` — a category-aware SVG pixel art generator that detects type from the card/enemy name.

**Why:** Avoids broken image icons; the SVG fallback is visually appropriate until real PNGs are generated.

## Remaining cards needing sprites (null in sprites.ts)
Goblin Bomb, Ancient Sprout, Bone Archer, Glass Tyrant, Dust Cloak, Coil Katana, Mercy Dagger, Brass Hunter — 8 remaining.

## Responsive card sizing (added June 2026)
`FullCard` in `CardArt.tsx` now accepts a `scale` prop (default 1).
`CardsScreen.tsx` uses `useCardScale()` hook: 1.0 mobile, 1.4 at 700px+, 1.8 at 1000px+, 2.2 at 1400px+.

## Workflow startup
Needs PORT and BASE_PATH env vars. Command: `PORT=8081 BASE_PATH=/ pnpm --filter the-spirit-realm run dev`
