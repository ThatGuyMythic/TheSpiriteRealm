const B = import.meta.env.BASE_URL;

// ── Sprite maps ───────────────────────────────────────────────────────────────
// Return a PNG path string only for files that actually exist in public/art/.
// Return null for anything else — CardArt/JWCModal fall back to PixelPortrait SVG.

// ── DCC / player card art ─────────────────────────────────────────────────────
export const CARD_SPRITES: Record<string, string | null> = {
  // ── 10 original player cards ──────────────────────────────────────────────
  "Village Guard":  `${B}art/card-village-guard.png`,
  "Archer":         `${B}art/card-archer.png`,
  "Knight":         `${B}art/card-knight.png`,
  "Hunter":         `${B}art/card-hunter.png`,
  "Dark Assassin":  `${B}art/card-dark-assassin.png`,
  "Scientist":      `${B}art/card-scientist.png`,
  "Dragon":         `${B}art/card-dragon.png`,
  "Joker":          `${B}art/card-joker.png`,
  "King":           `${B}art/card-king.png`,
  "Sand Goblin":    `${B}art/card-sand-goblin.png`,
  // ── 10 generated DCC enemy cards (Slime + Skeleton + partial Goblin set) ──
  "Slimeling":      `${B}art/enemy-slimeling-new.png`,
  "Acid Blob":      `${B}art/enemy-acid-blob-new.png`,
  "Goo Titan":      `${B}art/enemy-goo-titan-new.png`,
  "Blob King":      `${B}art/enemy-blob-king-new.png`,
  "Bone Walker":    `${B}art/card-bone-walker.png`,
  "Skull Mage":     `${B}art/card-skull-mage.png`,
  "Risen Guard":    `${B}art/card-risen-guard.png`,
  "Lich Spawn":     `${B}art/card-lich-spawn.png`,
  "Goblin Shaman":  `${B}art/enemy-goblin-shaman-new.png`,
  "Goblin Runt":    `${B}art/enemy-goblin-runt-new.png`,
  // ── Generated sprites (batch 2 — 10 new cards) ────────────────────────────
  "Warchief":       `${B}art/card-warchief.png`,
  "Vine Lurker":    `${B}art/card-vine-lurker.png`,
  "Fire Imp":       `${B}art/card-fire-imp.png`,
  "Shadow Fiend":   `${B}art/card-shadow-fiend.png`,
  "Root Golem":     `${B}art/card-root-golem.png`,
  "Thorn Sprite":   `${B}art/card-thorn-sprite.png`,
  "Demon Knight":   `${B}art/card-demon-knight.png`,
  "Rust Bot":       `${B}art/card-rust-bot.png`,
  "Iron Cleric":    `${B}art/card-iron-cleric.png`,
  "Pit Lord":       `${B}art/card-pit-lord.png`,
  // ── Generated sprites (batch 3 — final 8 cards) ───────────────────────────
  "Goblin Bomb":    `${B}art/card-goblin-bomb.png`,
  "Ancient Sprout": `${B}art/card-ancient-sprout.png`,
  "Bone Archer":    `${B}art/card-bone-archer.png`,
  "Glass Tyrant":   `${B}art/card-glass-tyrant.png`,
  "Dust Cloak":     `${B}art/card-dust-cloak.png`,
  "Coil Katana":    `${B}art/card-coil-katana.png`,
  "Mercy Dagger":   `${B}art/card-mercy-dagger.png`,
  "Brass Hunter":   `${B}art/card-brass-hunter.png`,
};

// ── JWC Combat enemy sprites (Pokemon Fire Red pixel art style) ───────────────
// New sprites live in public/art/jwc/ with descriptive names.
// Files without a new sprite fall back to the old art/ path.
export const ENEMY_SPRITES: Record<string, string | null> = {
  // Forest
  "Goblin":               `${B}art/jwc/Enemy_Goblin.png`,
  "Slime":                `${B}art/jwc/Enemy_Slime.png`,
  "Orc":                  `${B}art/jwc/Enemy_Orc.png`,
  "Goblin King":          `${B}art/jwc/Enemy_Goblin_King.png`,
  // Snowy
  "Frost Salamander":     `${B}art/jwc/Enemy_Frost_Salamander.png`,
  "Snow Wolf":            `${B}art/jwc/Enemy_Snow_Wolf.png`,
  "Yeti":                 `${B}art/jwc/Enemy_Yeti.png`,
  "The Great Dragon":     `${B}art/jwc/Enemy_Great_Dragon.png`,
  // Underworld
  "Skeleton":             `${B}art/jwc/Enemy_Skeleton.png`,
  "Skeleton Wolf":        `${B}art/enemy-skeleton-wolf.png`,
  "Skeleton Knight":      `${B}art/enemy-skeleton-knight.png`,
  "Firegaunt":            `${B}art/enemy-firegaunt.png`,
  // Volcano
  "Fire Lich":            `${B}art/enemy-fire-lich.png`,
  "Burning Snae":         `${B}art/enemy-burning-snae.png`,
  "Lava Golem":           `${B}art/enemy-lava-golem.png`,
  "Fire Demon":           `${B}art/enemy-fire-demon.png`,
  // Swamp
  "Swamp Slug":           `${B}art/enemy-swamp-slug.png`,
  "Snake":                `${B}art/enemy-snake.png`,
  "Troll":                `${B}art/enemy-troll.png`,
  "Ancient Black Dragon": `${B}art/enemy-ancient-black-dragon.png`,
};

// ── JWC Player / character sprites ────────────────────────────────────────────
// Player_model.png is used in JWC combat.
// inventory_player_model.png is the Pokemon Fire Red Pokédex-style sprite
// used in the Gear (Inventory) and Bunker screens.
export const CHARACTER_SPRITES: Record<string, string | null> = {
  "self":                    `${B}art/jwc/Player_model.png`,
  "inventory_player_model":  `${B}art/jwc/inventory_player_model_front.png?v=2`,
  "mundo":  `${B}art/char-mundo.png`,
  "ornn":   `${B}art/char-ornn.png?v=2`,
  "norra":  `${B}art/char-norra.png?v=2`,
  "battle": `${B}art/jwc/Player_model.png`,
};

// ── Weapon icons ──────────────────────────────────────────────────────────────
export const WEAPON_SPRITES: Record<string, string | null> = {
  "sword": `${B}art/weapon-sword.png`,
  "spear": `${B}art/weapon-spear.png`,
  "club":  `${B}art/weapon-club.png`,
  "fists": `${B}art/weapon-fists.png`,
};

// ── Armor slot icons ──────────────────────────────────────────────────────────
export const ARMOR_SPRITES: Record<string, string | null> = {
  "helmet": `${B}art/armor-helmet.png`,
  "chest":  `${B}art/armor-chest.png`,
  "cloak":  `${B}art/armor-cloak.png`,
};

// ── Enemy part / gear drop icons ──────────────────────────────────────────────
export const PART_SPRITES: Record<string, string | null> = {
  "Goblin Ear":    `${B}art/drop-goblin-ear.png`,
  "Slime Core":    `${B}art/drop-slime-core.png`,
  "Orc Tusk":      `${B}art/drop-orc-tusk.png`,
  "Royal Crown":   `${B}art/drop-royal-crown.png`,
  "Frost Scale":   `${B}art/drop-frost-scale.png`,
  "Wolf Pelt":     `${B}art/drop-wolf-pelt.png`,
  "Yeti Fur":      `${B}art/drop-yeti-fur.png`,
  "Dragon Scale":  `${B}art/drop-dragon-scale.png`,
  "Bone Fragment": `${B}art/drop-bone-fragment.png`,
  "Bone Shard":    `${B}art/drop-bone-shard.png`,
  "Knight Sigil":  `${B}art/drop-knight-sigil.png`,
  "Gaunt Core":    `${B}art/drop-gaunt-core.png`,
  "Cinder Rune":   `${B}art/drop-cinder-rune.png`,
  "Ashen Hide":    `${B}art/drop-ashen-hide.png`,
  "Magma Core":    `${B}art/drop-magma-core.png`,
  "Demon Heart":   `${B}art/drop-demon-heart.png`,
  "Slime Gland":   `${B}art/drop-slime-gland.png`,
  "Venom Fang":    `${B}art/drop-venom-fang.png`,
  "Troll Hide":    `${B}art/drop-troll-hide.png`,
  "Black Scale":   `${B}art/drop-black-scale.png`,
  "Boss Trophy":   null,
};

export function getSprite(
  map: Record<string, string | null>,
  key: string,
): string | null {
  return map[key] ?? null;
}
