---
name: JWC Inline Layout
description: Key decisions for the JWC inline combat layout in BoardScreen
---

## Rule
Battle scene is flex-row: player left (30%, no scaleX flip — sprite faces right naturally), enemies right (flex 1, alignItems: stretch so columns fill full height).

**Why:** scaleX(-1) was applied previously making the player face away from enemies. The generated sprite already faces right. alignItems: flex-end caused enemy columns to not stretch to full height, making HP overlays at the bottom invisible.

## Enemy HP overlay
- Parent (enemy column): `display: flex, flexDirection: column, justifyContent: flex-end`
- Sprite wrapper: `flex: 1, minHeight: 0`
- HP div: `flexShrink: 0` — must have this or it collapses
- Text color must be bright e.g. `#CC7777` not `#80404077` (transparent)
- Bar height 4px minimum to be visible

## Boss/elite sizing
- `maxHeight: isBoss ? "65%" : enemies.length === 1 ? "72%" : "100%"` on the sprite wrapper
- Prevents single bosses from filling the entire battle area

## Bottom strip
- Height 44%, flex-row
- Left: parchment log (#EDE8D4 bg, dark text)
- Right 48%: HP chip + END TURN button + 3 action buttons
