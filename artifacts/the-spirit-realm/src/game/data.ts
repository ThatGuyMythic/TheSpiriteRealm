// Game data — biome system, enemies, board layout

export type TileKind = "start" | "pve" | "elite" | "property" | "forge" | "shop" | "bank" | "boss" | "teleport";

// 9x9 board = 32 perimeter tiles clockwise
// Top row (0-8): idx 4 = forge, idx 8 = teleport
// Right col (9-16): idx 12 = shop, idx 16 = CACHE (swapped from boss)
// Bottom row (17-24): idx 20 = forge, idx 24 = BOSS (swapped from cache)
// Left col (25-31): idx 28 = shop
export const BOARD_LAYOUT: TileKind[] = [
  // Top row left→right (9 tiles)
  "start", "pve", "property", "pve", "forge", "pve", "property", "elite", "teleport",
  // Right col top→bottom (8 tiles, rows 1-8 col 8)
  "pve", "property", "pve", "shop", "elite", "pve", "property", "bank",
  // Bottom row right→left (8 tiles, row 8 cols 7→0)
  "pve", "elite", "pve", "forge", "pve", "property", "pve", "boss",
  // Left col bottom→top (7 tiles, rows 7→1 col 0)
  "pve", "property", "elite", "shop", "pve", "property", "pve",
];

export const BOARD = BOARD_LAYOUT.map((kind, index) => ({ index, kind }));
export const TOTAL_TILES = BOARD.length;

export const TILE_COLORS: Record<TileKind, string> = {
  start:    "#7FE05A",
  pve:      "#5C3A24",
  elite:    "#8B2020",
  property: "#C39B4B",
  forge:    "#5D7C8C",
  shop:     "#C07A50",
  bank:     "#D4A02B",
  boss:     "#A3261B",
  teleport: "#7030A0",
};

export const TILE_GLYPH: Record<TileKind, string> = {
  start:    "♥",
  pve:      "⚔",
  elite:    "★",
  property: "$",
  forge:    "⚒",
  shop:     "◈",
  bank:     "B",
  boss:     "☠",
  teleport: "⬡",
};

export const TILE_NAMES: Record<TileKind, string> = {
  start:    "START",
  pve:      "ENEMY CAMP",
  elite:    "ELITE CAMP",
  property: "ABANDONED",
  forge:    "FORGE",
  shop:     "SHOP",
  bank:     "CACHE",
  boss:     "BOSS DEN",
  teleport: "TELEPORT",
};

export function getTileName(kind: TileKind, biome: Biome, owned?: boolean): string {
  if (kind === "property") return owned ? `OWNED ${BIOME_SHORT[biome]}` : `ABANDONED ${BIOME_SHORT[biome]}`;
  return TILE_NAMES[kind];
}

// ── Biomes ─────────────────────────────────────────────────────────────────────
export type Biome = "forest" | "snowy" | "underworld" | "volcano" | "swamp";

const BIOMES: Biome[] = ["forest", "snowy", "underworld", "volcano", "swamp"];
const MAX_CYCLES = 6; // 5 stars, 6 total cycles (cycle 0 = no star)

export const BIOME_NAMES: Record<Biome, string> = {
  forest:     "FOREST",
  snowy:      "SNOWY MOUNTAINS",
  underworld: "UNDERWORLD",
  volcano:    "VOLCANO",
  swamp:      "SWAMP",
};

export const BIOME_SHORT: Record<Biome, string> = {
  forest:     "FOREST",
  snowy:      "SNOWY",
  underworld: "UNDWRLD",
  volcano:    "VOLCANO",
  swamp:      "SWAMP",
};

export const BIOME_COLORS: Record<Biome, string> = {
  forest:     "#6BBF3A",
  snowy:      "#8FD4D9",
  underworld: "#B080D0",
  volcano:    "#E06820",
  swamp:      "#7A1FBF",
};

export const BIOME_BG: Record<Biome, string> = {
  forest:     "#0D1A0A",
  snowy:      "#0A1422",
  underworld: "#0A0010",
  volcano:    "#1A0800",
  swamp:      "#0A0A14",
};

export const BIOME_TILE_TINT: Record<Biome, Record<TileKind, string>> = {
  forest: {
    start: "#7FE05A", pve: "#3A2B1A", elite: "#7A1B0E", property: "#C39B4B",
    forge: "#5D7C8C", shop: "#A07840", bank: "#D4A02B", boss: "#7A1B0E", teleport: "#7030A0",
  },
  snowy: {
    start: "#C0F0FF", pve: "#2A3A5A", elite: "#6A2020", property: "#B0C8E0",
    forge: "#6090B0", shop: "#8090C0", bank: "#A0C0D8", boss: "#7A1B0E", teleport: "#7030A0",
  },
  underworld: {
    start: "#D0A0FF", pve: "#201030", elite: "#802090", property: "#9060C0",
    forge: "#604080", shop: "#7050A0", bank: "#8060C0", boss: "#900090", teleport: "#7030A0",
  },
  volcano: {
    start: "#FFD080", pve: "#3A1800", elite: "#8B2020", property: "#D4702B",
    forge: "#7A4828", shop: "#C06020", bank: "#E08020", boss: "#7A1B0E", teleport: "#7030A0",
  },
  swamp: {
    start: "#90E098", pve: "#1A2A1A", elite: "#6A1A6A", property: "#8B7040",
    forge: "#486068", shop: "#7A6040", bank: "#A0904B", boss: "#7A1B0E", teleport: "#7030A0",
  },
};

export function getBiome(bossKills: number): Biome {
  return BIOMES[bossKills % 5];
}

export function getCycle(bossKills: number): number {
  return Math.min(MAX_CYCLES - 1, Math.floor(bossKills / 5));
}

export function getStars(bossKills: number): number {
  return getCycle(bossKills);
}

export function getStarDisplay(bossKills: number): string {
  const stars = getStars(bossKills);
  return stars > 0 ? "★".repeat(stars) : "";
}

// Enemy level ranges per biome (base + cycle*50)
const BIOME_BASE_LEVEL: Record<Biome, number> = {
  forest:      0,
  snowy:      10,
  underworld: 20,
  volcano:    30,
  swamp:      40,
};

export function getEnemyLevelRange(bossKills: number, isElite = false, isBoss = false): { min: number; max: number } {
  const biome = getBiome(bossKills);
  const cycle = getCycle(bossKills);
  const base  = BIOME_BASE_LEVEL[biome] + cycle * 50;
  if (isBoss)  return { min: base + 20, max: base + 20 };
  if (isElite) return { min: base + 6,  max: base + 10 };
  return              { min: base + 1,  max: base + 5  };
}

// ── Damage & weapon types ─────────────────────────────────────────────────────
export type DamageType = "blunt" | "slash" | "pierce";
export type WeaponKind = "spear" | "club" | "sword" | "fists";

export const WEAPON_KIND_DAMAGE: Record<WeaponKind, DamageType> = {
  spear: "pierce",
  club:  "blunt",
  sword: "slash",
  fists: "blunt",
};

// Biome-wide weakness: what damage type enemies in this biome are weak to
export const BIOME_WEAKNESS: Record<Biome, DamageType> = {
  forest:     "slash",
  snowy:      "pierce",
  underworld: "blunt",
  volcano:    "slash",
  swamp:      "pierce",
};

// ── Enemy types ───────────────────────────────────────────────────────────────
interface EnemyTemplate {
  name:       string;
  dropName:   string;
  attackType: DamageType;
  isBase:     boolean; // true = base enemy, false = elite template
}

// Forest — weak to slash
const FOREST_BASE: EnemyTemplate[] = [
  { name: "Goblin",  dropName: "Goblin Ear",   attackType: "blunt",  isBase: true },
  { name: "Slime",   dropName: "Slime Core",   attackType: "blunt",  isBase: true },
];
const FOREST_ELITE_TMPL: EnemyTemplate = {
  name: "Orc", dropName: "Orc Tusk", attackType: "blunt", isBase: false,
};
const FOREST_BOSS_TMPL = {
  name: "Goblin King", dropName: "Royal Crown", attackType: "blunt" as DamageType,
};

// Snowy Mountains — weak to pierce
const SNOWY_BASE: EnemyTemplate[] = [
  { name: "Frost Salamander", dropName: "Frost Scale",  attackType: "blunt",  isBase: true },
  { name: "Snow Wolf",        dropName: "Wolf Pelt",    attackType: "blunt",  isBase: true },
];
const SNOWY_ELITE_TMPL: EnemyTemplate = {
  name: "Yeti", dropName: "Yeti Fur", attackType: "blunt", isBase: false,
};
const SNOWY_BOSS_TMPL = {
  name: "The Great Dragon", dropName: "Dragon Scale", attackType: "pierce" as DamageType,
};

// Underworld — weak to blunt
const UNDERWORLD_BASE: EnemyTemplate[] = [
  { name: "Skeleton",      dropName: "Bone Fragment", attackType: "pierce", isBase: true },
  { name: "Skeleton Wolf", dropName: "Bone Shard",    attackType: "pierce", isBase: true },
];
const UNDERWORLD_ELITE_TMPL: EnemyTemplate = {
  name: "Skeleton Knight", dropName: "Knight Sigil", attackType: "slash", isBase: false,
};
const UNDERWORLD_BOSS_TMPL = {
  name: "Firegaunt", dropName: "Gaunt Core", attackType: "slash" as DamageType,
};

// Volcano — weak to slash
const VOLCANO_BASE: EnemyTemplate[] = [
  { name: "Fire Lich",    dropName: "Cinder Rune",  attackType: "pierce", isBase: true },
  { name: "Burning Snae", dropName: "Ashen Hide",   attackType: "blunt",  isBase: true },
];
const VOLCANO_ELITE_TMPL: EnemyTemplate = {
  name: "Lava Golem", dropName: "Magma Core", attackType: "blunt", isBase: false,
};
const VOLCANO_BOSS_TMPL = {
  name: "Fire Demon", dropName: "Demon Heart", attackType: "blunt" as DamageType,
};

// Swamp — weak to pierce
const SWAMP_BASE: EnemyTemplate[] = [
  { name: "Swamp Slug", dropName: "Slime Gland", attackType: "blunt",  isBase: true },
  { name: "Snake",      dropName: "Venom Fang",  attackType: "pierce", isBase: true },
];
const SWAMP_ELITE_TMPL: EnemyTemplate = {
  name: "Troll", dropName: "Troll Hide", attackType: "blunt", isBase: false,
};
const SWAMP_BOSS_TMPL = {
  name: "Ancient Black Dragon", dropName: "Black Scale", attackType: "pierce" as DamageType,
};

const BIOME_BASE_POOL: Record<Biome, EnemyTemplate[]> = {
  forest:     FOREST_BASE,
  snowy:      SNOWY_BASE,
  underworld: UNDERWORLD_BASE,
  volcano:    VOLCANO_BASE,
  swamp:      SWAMP_BASE,
};

const BIOME_ELITE_POOL: Record<Biome, EnemyTemplate> = {
  forest:     FOREST_ELITE_TMPL,
  snowy:      SNOWY_ELITE_TMPL,
  underworld: UNDERWORLD_ELITE_TMPL,
  volcano:    VOLCANO_ELITE_TMPL,
  swamp:      SWAMP_ELITE_TMPL,
};

const BIOME_BOSS_POOL: Record<Biome, { name: string; dropName: string; attackType: DamageType }> = {
  forest:     FOREST_BOSS_TMPL,
  snowy:      SNOWY_BOSS_TMPL,
  underworld: UNDERWORLD_BOSS_TMPL,
  volcano:    VOLCANO_BOSS_TMPL,
  swamp:      SWAMP_BOSS_TMPL,
};

export interface Enemy {
  id:         string;
  name:       string;
  level:      number;
  hp:         number;
  maxHp:      number;
  damage:     number;
  attackType: DamageType;
  weakness:   DamageType;
  isBoss?:    boolean;
  stunned?:   boolean;
  iceTurns?:  number;
  isElite?:   boolean;
  loot: {
    money:    number;
    gems:     number;
    metals:   number;
    partName: string | null;
  };
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Group scaling: more enemies = weaker each
const GROUP_HP_SCALE:  number[] = [1.0, 1.0, 0.75, 0.60, 0.50];
const GROUP_DMG_SCALE: number[] = [1.0, 1.0, 0.80, 0.65, 0.55];

export function rollEncounter(bossKills: number, elite = false): Enemy[] {
  const biome   = getBiome(bossKills);
  const weakness = BIOME_WEAKNESS[biome];

  if (elite) {
    // Elite: always 1 enemy
    const tmpl  = BIOME_ELITE_POOL[biome];
    const range = getEnemyLevelRange(bossKills, true);
    const level = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    const hp    = Math.round(30 + level * 5.5 + Math.floor(Math.random() * 10));
    return [{
      id: uid(), name: tmpl.name, level,
      hp, maxHp: hp,
      damage: Math.round(5 + level * 1.8),
      attackType: tmpl.attackType, weakness,
      stunned: false, iceTurns: 0, isElite: true,
      loot: {
        money:   Math.round(20 + level * 12 + Math.floor(Math.random() * 15)),
        gems:    Math.random() < 0.4 ? 1 : 0,
        metals:  Math.random() < 0.75 ? 1 + Math.floor(Math.random() * 2) : 0,
        partName: Math.random() < 0.85 ? tmpl.dropName : null,
      },
    }];
  }

  // Base: 2-4 enemies, scaled down per extra enemy
  const pool  = BIOME_BASE_POOL[biome];
  const count = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  const range = getEnemyLevelRange(bossKills, false);
  const hpS   = GROUP_HP_SCALE[count] ?? 0.5;
  const dmgS  = GROUP_DMG_SCALE[count] ?? 0.5;

  const result: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    const base  = pool[Math.floor(Math.random() * pool.length)];
    const level = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    const hp    = Math.round((13 + level * 3.8 + Math.floor(Math.random() * 6)) * hpS);
    result.push({
      id: uid(), name: base.name, level,
      hp, maxHp: hp,
      damage: Math.round((3 + level * 1.1) * dmgS),
      attackType: base.attackType, weakness,
      stunned: false, iceTurns: 0,
      loot: {
        money:   Math.round((8 + level * 6 + Math.floor(Math.random() * 8)) / count),
        gems:    Math.random() < 0.2 ? 1 : 0,
        metals:  Math.random() < 0.5 ? 1 : 0,
        partName: Math.random() < 0.6 ? base.dropName : null,
      },
    });
  }
  return result;
}

export function rollBoss(bossKills: number): Enemy[] {
  const biome   = getBiome(bossKills);
  const weakness = BIOME_WEAKNESS[biome];
  const template = BIOME_BOSS_POOL[biome];
  const range    = getEnemyLevelRange(bossKills, false, true);
  const level    = range.min;
  const hp       = 150 + level * 30;
  return [{
    id: `boss-${uid()}`, name: template.name, level,
    hp, maxHp: hp,
    damage: 15 + level * 3,
    attackType: template.attackType, weakness,
    isBoss: true, stunned: false, iceTurns: 0,
    loot: {
      money:   400 + level * 80,
      gems:    10 + level,
      metals:  8 + Math.floor(level / 2),
      partName: template.dropName,
    },
  }];
}

// ── Enemy Parts ───────────────────────────────────────────────────────────────
export interface EnemyPart {
  id:     string;
  kind:   "part";
  name:   string;
  source: string;
  level:  number;
  buff: {
    label:       string;
    damageBonus: number;
    addEffect?:  "stun" | "ice";
  };
}

export const PART_BUFFS: Record<string, { label: string; damageBonus: number; addEffect?: "stun" | "ice" }> = {
  "Goblin Ear":     { label: "+3 dmg",          damageBonus: 3 },
  "Slime Core":     { label: "+2 dmg",          damageBonus: 2 },
  "Orc Tusk":       { label: "+5 dmg, +stun",   damageBonus: 5, addEffect: "stun" },
  "Royal Crown":    { label: "+10 dmg",          damageBonus: 10 },
  "Frost Scale":    { label: "+3 dmg, +ice",     damageBonus: 3, addEffect: "ice" },
  "Wolf Pelt":      { label: "+4 dmg",           damageBonus: 4 },
  "Yeti Fur":       { label: "+6 dmg, +ice",     damageBonus: 6, addEffect: "ice" },
  "Dragon Scale":   { label: "+8 dmg",           damageBonus: 8 },
  "Bone Fragment":  { label: "+2 dmg, +stun",    damageBonus: 2, addEffect: "stun" },
  "Bone Shard":     { label: "+3 dmg",           damageBonus: 3 },
  "Knight Sigil":   { label: "+6 dmg, +stun",    damageBonus: 6, addEffect: "stun" },
  "Gaunt Core":     { label: "+9 dmg",           damageBonus: 9 },
  "Cinder Rune":    { label: "+4 dmg, +ice",     damageBonus: 4, addEffect: "ice" },
  "Ashen Hide":     { label: "+3 dmg",           damageBonus: 3 },
  "Magma Core":     { label: "+5 dmg, +stun",    damageBonus: 5, addEffect: "stun" },
  "Demon Heart":    { label: "+12 dmg",          damageBonus: 12 },
  "Slime Gland":    { label: "+2 dmg",           damageBonus: 2 },
  "Venom Fang":     { label: "+3 dmg, +stun",    damageBonus: 3, addEffect: "stun" },
  "Troll Hide":     { label: "+6 dmg",           damageBonus: 6 },
  "Black Scale":    { label: "+10 dmg, +ice",    damageBonus: 10, addEffect: "ice" },
  "Boss Trophy":    { label: "+10 dmg",          damageBonus: 10 },
};

export function makeEnemyPart(dropName: string, level: number): EnemyPart {
  const buff = PART_BUFFS[dropName] ?? { label: "+2 dmg", damageBonus: 2 };
  return { id: uid(), kind: "part", name: dropName, source: dropName, level, buff };
}

// ── Weapons ───────────────────────────────────────────────────────────────────
export interface Weapon {
  id:         string;
  kind:       "weapon";
  weaponKind: WeaponKind;
  damageType: DamageType;
  name:       string;
  damage:     number;
  effect:     "stun" | "ice" | null;
  level:      number;
  mergeCount?: number;
}

const SPEAR_NAMES_BY_BIOME: Record<Biome, string[]> = {
  forest:     ["Iron Spear",    "Vine Lance",    "Bramble Pike"],
  snowy:      ["Frost Lance",   "Ice Spear",     "Bone Pike"],
  underworld: ["Soul Spear",    "Bone Lance",    "Death Spike"],
  volcano:    ["Magma Spear",   "Ember Lance",   "Cinder Pike"],
  swamp:      ["Bog Spear",     "Hex Lance",     "Poison Stinger"],
};
const CLUB_NAMES_BY_BIOME: Record<Biome, string[]> = {
  forest:     ["Oak Club",      "Stone Maul",    "Root Crusher"],
  snowy:      ["Ice Mace",      "Frost Hammer",  "Bone Club"],
  underworld: ["Skull Maul",    "Bone Breaker",  "Void Club"],
  volcano:    ["Lava Mace",     "Magma Maul",    "Ember Club"],
  swamp:      ["Bog Maul",      "Slime Mace",    "Hex Club"],
};
const SWORD_NAMES_BY_BIOME: Record<Biome, string[]> = {
  forest:     ["Notched Saber", "Bone Cleaver",  "Oak Falchion"],
  snowy:      ["Frost Edge",    "Ice Pick",      "Glacial Blade"],
  underworld: ["Soul Edge",     "Lich Blade",    "Shade Cutter"],
  volcano:    ["Magma Saber",   "Ember Cleaver", "Lava Dagger"],
  swamp:      ["Hex Blade",     "Bog Iron Sword","Rot Dagger"],
};

export function genWeapon(level = 1, biome: Biome = "forest", forceKind?: WeaponKind): Weapon {
  const kinds: WeaponKind[] = ["spear", "club", "sword"];
  const weaponKind: WeaponKind = forceKind ?? kinds[Math.floor(Math.random() * kinds.length)];
  const damageType = WEAPON_KIND_DAMAGE[weaponKind];

  let names: string[];
  let baseMultiplier: number;
  if (weaponKind === "spear") {
    names = SPEAR_NAMES_BY_BIOME[biome];
    baseMultiplier = 1.1;
  } else if (weaponKind === "club") {
    names = CLUB_NAMES_BY_BIOME[biome];
    baseMultiplier = 1.0;
  } else {
    names = SWORD_NAMES_BY_BIOME[biome];
    baseMultiplier = 1.05;
  }

  const base = Math.round((8 + level * 3) * baseMultiplier);
  const dmg  = base + Math.floor(Math.random() * 4);
  const effect: Weapon["effect"] = Math.random() < 0.4 ? (Math.random() < 0.5 ? "stun" : "ice") : null;

  return {
    id: uid(), kind: "weapon", weaponKind, damageType,
    name: names[Math.floor(Math.random() * names.length)],
    damage: dmg, effect, level,
  };
}

// ── Armor ─────────────────────────────────────────────────────────────────────
export interface Armor {
  id:        string;
  kind:      "armor";
  slot:      "helmet" | "chest" | "cloak";
  name:      string;
  bluntDef:  number;
  pierceDef: number;
  slashDef:  number;
  bonusHP:   number;
  level:     number;
  mergeCount?: number;
}

type DefLean = "blunt" | "slash" | "pierce";

const ARMOR_VARIANTS: Record<"helmet" | "chest" | "cloak", { name: string; lean: DefLean }[]> = {
  helmet: [
    { name: "Iron Coif",      lean: "blunt"  },
    { name: "Bone Skull Cap", lean: "blunt"  },
    { name: "Shadow Hood",    lean: "slash"  },
    { name: "Frost Helm",     lean: "pierce" },
    { name: "Void Cowl",      lean: "slash"  },
  ],
  chest: [
    { name: "Chain Coat",     lean: "pierce" },
    { name: "Plate Cuirass",  lean: "pierce" },
    { name: "Scale Vest",     lean: "blunt"  },
    { name: "Bone Plate",     lean: "blunt"  },
    { name: "Phantom Wrap",   lean: "slash"  },
  ],
  cloak: [
    { name: "Shadow Drape",   lean: "slash"  },
    { name: "Leather Cloak",  lean: "slash"  },
    { name: "Iron Mantle",    lean: "pierce" },
    { name: "Frost Cloak",    lean: "pierce" },
    { name: "Bone Shroud",    lean: "blunt"  },
  ],
};

function calcArmorStats(lean: DefLean, level: number): Pick<Armor, "bluntDef" | "pierceDef" | "slashDef"> {
  const maxTotal  = 15 + (level - 1) * 3;
  const primary   = Math.max(1, Math.round(maxTotal * (0.60 + Math.random() * 0.10)));
  const remaining = Math.max(0, maxTotal - primary);
  const sec1      = Math.max(0, Math.round(remaining * (0.45 + Math.random() * 0.10)));
  const sec2      = Math.max(0, remaining - sec1);
  const others    = (["blunt", "slash", "pierce"] as DefLean[]).filter(k => k !== lean);
  const out = { bluntDef: 0, pierceDef: 0, slashDef: 0 };
  (out as Record<string, number>)[lean + "Def"] = primary;
  (out as Record<string, number>)[others[0] + "Def"] = sec1;
  (out as Record<string, number>)[others[1] + "Def"] = sec2;
  return out;
}

export function genArmor(level = 1): Armor {
  const slots   = ["helmet", "chest", "cloak"] as const;
  const slot    = slots[Math.floor(Math.random() * 3)];
  const variant = ARMOR_VARIANTS[slot][Math.floor(Math.random() * ARMOR_VARIANTS[slot].length)];
  const stats   = calcArmorStats(variant.lean, level);
  return {
    id: uid(), kind: "armor", slot,
    name:    variant.name,
    ...stats,
    bonusHP:  Math.random() < 0.45 ? Math.max(1, Math.round((3 + level * 1.5) * (Math.random() * 0.4 + 0.8))) : 0,
    level,
  };
}

export type Item = Weapon | Armor | EnemyPart;

export function genShopItems(bossKills: number, rebirthCount = 0, norraLevel = 0): Item[] {
  const biome = getBiome(bossKills);
  const range = getEnemyLevelRange(bossKills, false);
  const baseLevel = Math.round((range.min + range.max) / 2);
  const hasNorra = norraLevel > 0;
  const level = hasNorra ? baseLevel + Math.min(5, Math.floor(norraLevel / 4) + 1) : baseLevel;
  const m = 1 + 0.1 * rebirthCount;
  function scaleWeapon(w: Weapon): Weapon {
    return { ...w, damage: Math.round(w.damage * m) };
  }
  function scaleArmor(a: Armor): Armor {
    return {
      ...a,
      bluntDef:  Math.round(a.bluntDef  * m),
      pierceDef: Math.round(a.pierceDef * m),
      slashDef:  Math.round(a.slashDef  * m),
      bonusHP:   Math.round(a.bonusHP   * m),
    };
  }
  const base: Item[] = [
    scaleWeapon(genWeapon(level, biome, "spear")),
    scaleWeapon(genWeapon(level, biome, "club")),
    scaleWeapon(genWeapon(level, biome, "sword")),
    scaleArmor(genArmor(level)),
    scaleArmor(genArmor(level)),
  ];
  if (hasNorra) {
    base.push(Math.random() < 0.5 ? scaleWeapon(genWeapon(level, biome)) : scaleArmor(genArmor(level)));
    if (norraLevel >= 10) base.push(Math.random() < 0.5 ? scaleWeapon(genWeapon(level, biome)) : scaleArmor(genArmor(level)));
  }
  return base;
}

export function shopPrice(item: Item, norraLevel = 0): number {
  if (item.kind === "part") return 0;
  const base = 60 + item.level * 35;
  if (norraLevel <= 0) return base;
  const discountPct = Math.min(30, 5 + norraLevel * 1.5);
  return Math.round(base * (1 - discountPct / 100));
}

// ── Static game data ──────────────────────────────────────────────────────────
export const STARTING_ROOMS = [
  { id: "blacksmith", name: "Forge Room",    level: 1, costMoney: 150, costMetals: 5, benefit: "Unlocks Ornn — upgrades board forge" },
  { id: "shop",       name: "Trade Network", level: 1, costMoney: 120, costMetals: 3, benefit: "Unlocks Norra — buffs board shops (+1 item, 10% off)" },
  { id: "medlab",     name: "Medical Lab",   level: 1, costMoney: 80,  costMetals: 2, benefit: "Unlocks Dr. Mundo — full heal & patch up" },
  { id: "storage",    name: "Storage",       level: 1, costMoney: 60,  costMetals: 1, benefit: "+2 gear bag slots (max 5 upgrades)" },
];

export const MAX_STORAGE_LEVEL = 5;

export const STARTING_CHARACTERS = [
  { id: "self",  name: "You",       role: "Spirit Walker", unlocked: true  },
  { id: "ornn",  name: "Ornn",      role: "Master Smith",  unlocked: false },
  { id: "norra", name: "Norra",     role: "Trade Network", unlocked: false },
  { id: "mundo", name: "Dr. Mundo", role: "Field Surgeon", unlocked: false },
];

// ── Cards ─────────────────────────────────────────────────────────────────────
export interface Card {
  id:     string;
  name:   string;
  cost:   number;
  power:  number;
  text?:  string;
}

export const STARTING_DECK: Card[] = [
  { id: "c1",  name: "Village Guard",  cost: 1, power: 3 },
  { id: "c2",  name: "Village Guard",  cost: 1, power: 3 },
  { id: "c3",  name: "Archer",         cost: 1, power: 2,  text: "+3 if rightmost lane" },
  { id: "c4",  name: "Archer",         cost: 1, power: 2,  text: "+3 if rightmost lane" },
  { id: "c5",  name: "Knight",         cost: 3, power: 6,  text: "+2 per ally here" },
  { id: "c6",  name: "Hunter",         cost: 2, power: 6 },
  { id: "c7",  name: "Dark Assassin",  cost: 2, power: 4,  text: "Lone: ×2 power" },
  { id: "c8",  name: "Scientist",      cost: 3, power: 5,  text: "+6 if paired" },
  { id: "c9",  name: "Dragon",         cost: 5, power: 12 },
  { id: "c10", name: "Joker",          cost: 1, power: 2,  text: "Bleed: foe −3" },
  { id: "c11", name: "King",           cost: 4, power: 9 },
  { id: "c12", name: "Dark Assassin",  cost: 2, power: 4,  text: "Lone: ×2 power" },
];

// ── DCC Themes ────────────────────────────────────────────────────────────────
export type DCCTheme = "slimes" | "skeletons" | "goblins" | "plants" | "demons";
export const DCC_THEMES: DCCTheme[] = ["slimes", "skeletons", "goblins", "plants", "demons"];
export const DCC_THEME_NAMES: Record<DCCTheme, string> = {
  slimes:    "Slime Swamp",
  skeletons: "Dead Mines",
  goblins:   "Goblin Warcamp",
  plants:    "Ancient Grove",
  demons:    "Demon Rift",
};
export const DCC_THEME_COLORS: Record<DCCTheme, string> = {
  slimes:    "#50D890",
  skeletons: "#B8C0CC",
  goblins:   "#D4A520",
  plants:    "#7DC95E",
  demons:    "#D94040",
};

interface CardTemplate { name: string; cost: number; power: number; text?: string }

const DCC_CARD_POOL: Record<DCCTheme, CardTemplate[]> = {
  slimes: [
    { name: "Slimeling",     cost: 1, power: 3,  text: "+1 per ally here" },
    { name: "Acid Blob",     cost: 2, power: 6,  text: "Bleed: foe −3" },
    { name: "Goo Titan",     cost: 4, power: 11, text: "Surge: +5 if last round" },
    { name: "Blob King",     cost: 5, power: 16, text: "Lone: ×2 power" },
  ],
  skeletons: [
    { name: "Bone Walker",   cost: 1, power: 3,  text: "+2 if rightmost lane" },
    { name: "Skull Mage",    cost: 2, power: 6,  text: "Curse: Bleed foe −4" },
    { name: "Risen Guard",   cost: 3, power: 9,  text: "Shield: +4 if foe empty" },
    { name: "Lich Spawn",    cost: 5, power: 15, text: "Lone: ×2 power" },
  ],
  goblins: [
    { name: "Goblin Runt",   cost: 1, power: 3,  text: "+1 per ally here" },
    { name: "Goblin Shaman", cost: 2, power: 6,  text: "Hex: Bleed foe −3" },
    { name: "Goblin Bomb",   cost: 3, power: 9,  text: "BOOM: if paired +6" },
    { name: "Warchief",      cost: 5, power: 14, text: "Rally: +3 per ally here" },
  ],
  plants: [
    { name: "Vine Lurker",   cost: 1, power: 3,  text: "+2 if rightmost lane" },
    { name: "Thorn Sprite",  cost: 2, power: 6,  text: "Thorns: Bleed foe −3" },
    { name: "Root Golem",    cost: 4, power: 11, text: "Shield: +5 if foe empty" },
    { name: "Ancient Sprout",cost: 5, power: 15, text: "Ancient: Surge +6 if last round" },
  ],
  demons: [
    { name: "Fire Imp",      cost: 1, power: 4,  text: "Bleed: foe −3" },
    { name: "Shadow Fiend",  cost: 2, power: 7,  text: "Lone: ×2 power" },
    { name: "Demon Knight",  cost: 4, power: 12, text: "+2 per ally here" },
    { name: "Pit Lord",      cost: 6, power: 19, text: "BOOM: if paired +8 power" },
  ],
};

export function getDCCThemeInfo(dccLevel: number): {
  theme: DCCTheme; cycle: number; stars: string; themeName: string; fullName: string; color: string;
} {
  const idx   = (dccLevel - 1) % 5;
  const cycle = Math.min(3, Math.floor((dccLevel - 1) / 5));
  const theme = DCC_THEMES[idx];
  const stars = "★".repeat(cycle);
  return {
    theme, cycle, stars,
    themeName: DCC_THEME_NAMES[theme],
    fullName:  DCC_THEME_NAMES[theme] + (stars ? ` ${stars}` : ""),
    color:     DCC_THEME_COLORS[theme],
  };
}

export function pickDCCRewardCard(dccLevel: number): Card {
  const { theme, cycle } = getDCCThemeInfo(dccLevel);
  const pool = DCC_CARD_POOL[theme];
  const t    = pool[Math.floor(Math.random() * pool.length)];
  return {
    id:    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name:  t.name,
    cost:  t.cost,
    power: t.power + Math.floor(dccLevel * 0.8) + cycle * 2,
    text:  t.text,
  };
}

export function buildDCCEnemyDeck(dccLevel: number): Card[] {
  const { theme, cycle } = getDCCThemeInfo(dccLevel);
  const pool  = DCC_CARD_POOL[theme];
  const scale = dccLevel;
  return pool.flatMap((t, i) => {
    const power = t.power + scale * 2 + i;
    const cost  = Math.max(1, t.cost + cycle);
    return [
      { id: `e${i}a`, name: t.name, cost,     power, text: t.text },
      { id: `e${i}b`, name: t.name, cost,     power, text: t.text },
    ];
  });
}

export function getAllDCCCardTemplates(): Card[] {
  const seen = new Set<string>();
  let idx = 0;
  return Object.values(DCC_CARD_POOL)
    .flatMap(arr => arr)
    .filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true; })
    .map(t => ({ id: `tpl-${idx++}`, name: t.name, cost: t.cost, power: t.power, text: t.text }));
}
