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
**38 card PNGs** — all DCC card sprites are now real PNGs, no more null fallbacks:
- Batch 1 (10 original): village-guard, archer, knight, hunter, dark-assassin, scientist, dragon, joker, king, sand-goblin
- Batch 2 (10 generated slime/skeleton/goblin): slimeling, acid-blob, goo-titan, blob-king, bone-walker, skull-mage, risen-guard, lich-spawn, goblin-shaman, goblin-runt
- Batch 3 (10 generated): warchief, vine-lurker, fire-imp, shadow-fiend, root-golem, thorn-sprite, demon-knight, rust-bot, iron-cleric, pit-lord
- Batch 4 (8 generated final): goblin-bomb, ancient-sprout, bone-archer, glass-tyrant, dust-cloak, coil-katana, mercy-dagger, brass-hunter

**20 enemy sprites** in public/art/enemy-*.png (all biome enemies covered)
**4 character sprites** in public/art/char-*.png

## Fallback system
`sprites.ts` returns `null` for any asset without a PNG. Components fall back to `PixelPortrait` SVG.
All CARD_SPRITES entries now have real PNGs — no more null fallbacks.

## Responsive card sizing (added June 2026)
`FullCard` in `CardArt.tsx` accepts a `scale` prop (default 1).
`CardsScreen.tsx` uses `useCardScale()` hook: 1.0 mobile, 1.4 at 700px+, 1.8 at 1000px+, 2.2 at 1400px+.
Stacked card overlap (`marginTop`) also scales with `cardScale`.

## JWC animations (added June 2026)
CSS classes in `index.css`: `jwc-attack-hit` (red flash + shake on enemy), `jwc-shield-block` (cyan glow on player), `jwc-reserve-pulse` (gold glow on player).
Triggered via `useAnimKey()` hook in `JWCModal.tsx` — increments a key to re-trigger the animation class.

## Workflow startup
Artifact workflow: `artifacts/the-spirit-realm: web` — this is the correct one to restart.
The old manual workflow `Start application` uses: `PORT=8081 BASE_PATH=/ pnpm --filter the-spirit-realm run dev`
