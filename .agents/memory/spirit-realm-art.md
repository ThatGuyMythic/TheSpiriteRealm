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
- `weapon-<type>.png` — weapon icons
- `armor-<slot>.png` — armor slot icons
- `part-<kebab-name>.png` — enemy part/gear drop icons

## Current status (as of June 2026)
20 PNG files exist:
- 10 original player cards (village-guard, archer, knight, hunter, dark-assassin, scientist, dragon, joker, king, sand-goblin)
- 10 generated DCC cards (slimeling, acid-blob, goo-titan, blob-king, bone-walker, skull-mage, risen-guard, lich-spawn, goblin-shaman, goblin-runt)

## Fallback system
`sprites.ts` returns `null` for any asset without a PNG. Components (`CardArt.tsx`, `JWCModal.tsx`) fall back to `PixelPortrait` — a category-aware SVG pixel art generator that detects type from the card/enemy name.

**Why:** Avoids broken image icons; the SVG fallback is visually appropriate until real PNGs are generated.

## Remaining assets to generate (in future runs)
- 10 more DCC cards: Warchief, Goblin Bomb, Vine Lurker, Thorn Sprite, Root Golem, Ancient Sprout, Fire Imp, Shadow Fiend, Demon Knight, Pit Lord
- 8 extra player cards: Bone Archer, Rust Bot, Iron Cleric, Glass Tyrant, Dust Cloak, Coil Katana, Mercy Dagger, Brass Hunter
- 20 combat enemy sprites (all biome enemies)
- 5 character sprites (self, mundo, ornn, norra, battle)
- 4 weapon icons + 3 armor icons
- 21 part/gear drop icons
