---
name: Spirit Realm game fixes
description: Key decisions and non-obvious patterns from the Spirit Realm v0.9.x fix session.
---

**recordDCCWin async pattern:** compute `leveled`/`newLevel`/`levelsGained` synchronously from `playerRef.current` BEFORE calling `setPlayerState`; call `setPendingCardUpgrades` outside the setState callback. Mixing mutation and reads inside a setState updater silently returns stale values to callers.

**Tab persistence:** App.tsx uses CSS `display: none` rather than conditional rendering so CardsScreen (DCC state), BoardScreen (board state), etc. stay mounted when switching tabs.

**Card art white-bg fix:** set art area `backgroundColor: "#888888"` + `mixBlendMode: "multiply"` on the `<img>`. Multiply on a medium-grey bg makes white source pixels appear grey (background color), dark/colored pixels are slightly darkened but remain visible.

**Norra discount bug:** `shopPrice(item)` in BoardScreen ShopOverlay was missing the second arg. Fix: `shopPrice(item, player.characters.find(c => c.id === "norra")?.unlocked ?? false)`.

**New card art files:** `-new` suffixed files (`enemy-*-new.png`) in `public/art/` are improved pixel-art versions for 6 DCC slime/goblin cards. Use them in `CARD_SPRITES` (not `card-*.png` for those 6).

**JWC combat layout:** All enemy HP bars go in a single LEFT column, all enemy sprites in a RIGHT row — achieved via `renderEnemies()` helper that splits them into two sibling divs. Previously each enemy paired its own HP box + sprite together, which caused overlap on browser. Info boxes use `backgroundColor: "#888888"` with `border: "2px solid #444444"` (grey bg, dark grey border) for both enemy and player HP panels.

**JWC sprite organization:** New Pokemon Fire Red pixel art sprites live in `public/art/jwc/` with human-readable names: `Player_model.png`, `Enemy_Goblin.png`, etc. `CHARACTER_SPRITES["self"]` and `["battle"]` both point to `Player_model.png`. A sprite browser page at `public/sprites.html` lets the user view and download every sprite by name. The free-tier image generation limit is 10 per run — batch carefully.

**JWC browser overlap fix:** Changed battle scene from `flex: "0 0 67%"` to `flex: "0 0 60%"` in fullscreen modal, giving the player row (`height: 110, flexShrink: 0`) guaranteed space below enemies.

**Why:** All changes maintain backward compatibility with existing save data (card IDs stay the same, only power/cost differ in STARTING_DECK for new games).
