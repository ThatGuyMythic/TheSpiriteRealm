---
name: Spirit Realm game fixes
description: Key decisions and non-obvious patterns from the Spirit Realm v0.9.x fix session.
---

**recordDCCWin async pattern:** compute `leveled`/`newLevel`/`levelsGained` synchronously from `playerRef.current` BEFORE calling `setPlayerState`; call `setPendingCardUpgrades` outside the setState callback. Mixing mutation and reads inside a setState updater silently returns stale values to callers.

**Tab persistence:** App.tsx uses CSS `display: none` rather than conditional rendering so CardsScreen (DCC state), BoardScreen (board state), etc. stay mounted when switching tabs.

**Card art white-bg fix:** set art area `backgroundColor: "#888888"` + `mixBlendMode: "multiply"` on the `<img>`. Multiply on a medium-grey bg makes white source pixels appear grey (background color), dark/colored pixels are slightly darkened but remain visible.

**Norra discount bug:** `shopPrice(item)` in BoardScreen ShopOverlay was missing the second arg. Fix: `shopPrice(item, player.characters.find(c => c.id === "norra")?.unlocked ?? false)`.

**New card art files:** `-new` suffixed files (`enemy-*-new.png`) in `public/art/` are improved pixel-art versions for 6 DCC slime/goblin cards. Use them in `CARD_SPRITES` (not `card-*.png` for those 6).

**Why:** All changes maintain backward compatibility with existing save data (card IDs stay the same, only power/cost differ in STARTING_DECK for new games).
