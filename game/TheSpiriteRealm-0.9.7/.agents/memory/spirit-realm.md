---
name: Spirit Realm Artifact
description: Key facts about the-spirit-realm React/Vite game artifact for future sessions.
---

## Workflow
Command: `PORT=26090 BASE_PATH=/ pnpm --filter @workspace/the-spirit-realm run dev`
Port: 26090 (artifact proxy at `/`)

## Pre-existing TS errors
`JWCModal.tsx` has `TS18047 'jwc' is possibly 'null'` errors on lines 195–272 inside `renderEnemies()`. These are pre-existing and do not affect runtime. Do not try to fix them unless specifically asked.

## Sprite paths
- JWC combat sprite: `public/art/jwc/Player_model.png` (key `"self"` and `"battle"`)
- Inventory/gear sprite: `public/art/jwc/inventory_player_model.png` (key `"inventory_player_model"`) — currently a copy of Player_model.png; user can replace with their own Pokédex-style art

## Key mechanics notes
- Block reduction: 1 block = 40%, 2+ blocks = 65% (bumped from 25/50 in v0.9.6 session)
- Reserve: reserving SP gives 50% interest back next round (+1 extra per 2 reserved)
- DCC enemy deck: both copies of a card now have identical power (was +2 bug)
- Card effects extracted from text at runtime — hardcoded amounts removed from calcCardPower
- New DCC card effects: Surge (last-round bonus), Shield (bonus if foe lane empty)
- Joker/Bleed: amount read from card text `Bleed: foe −N`

**Why:** These were balance issues + bugs reported by the user in v0.9.6.
