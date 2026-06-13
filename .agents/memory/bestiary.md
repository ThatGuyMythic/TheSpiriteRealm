---
name: Bestiary / CODEX
description: How the bestiary is tracked and displayed in The Spirit Realm
---

## Rule
`Player.bestiary: Record<string, { seen: number; killed: number; maxHp: number }>` persists across sessions via SAVE_KEY.

**Why:** Users asked for a persistent log of every enemy encountered with kill counts.

## Tracking points
- `startJWC` → calls `setPlayerState` immediately after `setJWC` to increment `seen` and update `maxHp` for each scaled enemy
- `closeJWC` (victory block) → increments `killed` for every enemy in `jwc.enemies` inside the `setPlayerState` update

## Sanitize
`if (!safe.bestiary || typeof safe.bestiary !== "object") safe.bestiary = {};` — added to sanitize() for backwards compat.

## UI
BunkerScreen has a `BestiarySection` component at the bottom, collapsed by default. Shows 20 enemies in ENEMY_ORDER grouped by biome. Undiscovered entries are darkened/silhouetted with `filter: brightness(0)`. Shows sprite thumbnail (44×44), name, lore text (ENEMY_LORE map), HP, kills, seen count.
