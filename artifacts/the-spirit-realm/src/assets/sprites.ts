const B = import.meta.env.BASE_URL;

// ── Sprite maps ───────────────────────────────────────────────────────────────
// Return a PNG path string only for files that actually exist in public/art/.
// Return null for anything else — CardArt/JWCModal fall back to PixelPortrait SVG.

// ── DCC / player card art ─────────────────────────────────────────────────────
// 10 original cards (extracted from project zip) + 10 generated slime/skeleton/goblin cards.
// Everything else falls back to PixelPortrait which already detects category from the name.
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
  "Slimeling":      `${B}art/card-slimeling.png`,
  "Acid Blob":      `${B}art/card-acid-blob.png`,
  "Goo Titan":      `${B}art/card-goo-titan.png`,
  "Blob King":      `${B}art/card-blob-king.png`,
  "Bone Walker":    `${B}art/card-bone-walker.png`,
  "Skull Mage":     `${B}art/card-skull-mage.png`,
  "Risen Guard":    `${B}art/card-risen-guard.png`,
  "Lich Spawn":     `${B}art/card-lich-spawn.png`,
  "Goblin Shaman":  `${B}art/card-goblin-shaman.png`,
  "Goblin Runt":    `${B}art/card-goblin-runt.png`,
  // ── All remaining cards: fall back to PixelPortrait (returns null → SVG) ──
  // Goblin set (2 more)
  "Warchief":       null,
  "Goblin Bomb":    null,
  // Plant set
  "Vine Lurker":    null,
  "Thorn Sprite":   null,
  "Root Golem":     null,
  "Ancient Sprout": null,
  // Demon set
  "Fire Imp":       null,
  "Shadow Fiend":   null,
  "Demon Knight":   null,
  "Pit Lord":       null,
  // Extra player-type cards
  "Bone Archer":    null,
  "Rust Bot":       null,
  "Iron Cleric":    null,
  "Glass Tyrant":   null,
  "Dust Cloak":     null,
  "Coil Katana":    null,
  "Mercy Dagger":   null,
  "Brass Hunter":   null,
};

// ── Combat enemy sprites ──────────────────────────────────────────────────────
export const ENEMY_SPRITES: Record<string, string | null> = {
  // Forest
  "Goblin":               `${B}art/enemy-goblin.png`,
  "Slime":                `${B}art/enemy-slime.png`,
  "Orc":                  `${B}art/enemy-orc.png`,
  "Goblin King":          `${B}art/enemy-goblin-king.png`,
  // Snowy
  "Frost Salamander":     `${B}art/enemy-frost-salamander.png`,
  "Snow Wolf":            `${B}art/enemy-snow-wolf.png`,
  "Yeti":                 `${B}art/enemy-yeti.png`,
  "The Great Dragon":     `${B}art/enemy-great-dragon.png`,
  // Underworld
  "Skeleton":             `${B}art/enemy-skeleton.png`,
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
  "Snake":                null,
  "Troll":                `${B}art/enemy-troll.png`,
  "Ancient Black Dragon": null,
};

// ── Bunker / battle character sprites ─────────────────────────────────────────
export const CHARACTER_SPRITES: Record<string, string | null> = {
  "self":   `${B}art/char-self.png`,
  "mundo":  null,
  "ornn":   null,
  "norra":  null,
  "battle": `${B}art/char-self.png`,
};

// ── Weapon icons ──────────────────────────────────────────────────────────────
export const WEAPON_SPRITES: Record<string, string | null> = {
  "sword": null,
  "spear": null,
  "club":  null,
  "fists": null,
  "bow":   null,
  "axe":   null,
};

// ── Armor slot icons ──────────────────────────────────────────────────────────
export const ARMOR_SPRITES: Record<string, string | null> = {
  "helmet": null,
  "chest":  null,
  "cloak":  null,
};

// ── Enemy part / gear drop icons ──────────────────────────────────────────────
export const PART_SPRITES: Record<string, string | null> = {
  "Goblin Ear":    null,
  "Slime Core":    null,
  "Orc Tusk":      null,
  "Royal Crown":   null,
  "Frost Scale":   null,
  "Wolf Pelt":     null,
  "Yeti Fur":      null,
  "Dragon Scale":  null,
  "Bone Fragment": null,
  "Bone Shard":    null,
  "Knight Sigil":  null,
  "Gaunt Core":    null,
  "Cinder Rune":   null,
  "Ashen Hide":    null,
  "Magma Core":    null,
  "Demon Heart":   null,
  "Slime Gland":   null,
  "Venom Fang":    null,
  "Troll Hide":    null,
  "Black Scale":   null,
  "Boss Trophy":   null,
};

export function getSprite(
  map: Record<string, string | null>,
  key: string,
): string | null {
  return map[key] ?? null;
}
