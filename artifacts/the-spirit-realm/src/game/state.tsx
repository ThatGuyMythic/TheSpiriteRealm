import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  BOARD, STARTING_ROOMS, STARTING_CHARACTERS, STARTING_DECK,
  rollEncounter, rollBoss, genWeapon, genArmor, genShopItems, shopPrice, makeEnemyPart,
  getBiome, getCycle, getEnemyLevelRange, MAX_STORAGE_LEVEL, pickDCCRewardCard,
  PART_BUFFS,
  type Enemy, type Item, type Weapon, type Armor, type EnemyPart, type Card, type TileKind, type DamageType,
} from "./data";

const SAVE_KEY = "nolife.game.v5";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rebirthMult(rebirthCount: number): number {
  return 1 + 0.1 * rebirthCount;
}

export interface Player {
  name: string;
  money: number;
  gems: number;
  metals: number;
  bones: number;
  position: number;
  lap: number;
  bankBalance: number;
  hp: number;
  maxHp: number;
  inRun: boolean;
  inventory: Item[];
  equipped: { weapon: Weapon | null; helmet: Armor | null; chest: Armor | null; cloak: Armor | null };
  rooms: typeof STARTING_ROOMS;
  characters: typeof STARTING_CHARACTERS;
  deck: Card[];
  deckPool: Card[];
  collection: Record<string, number>;
  dccXp: number;
  dccLevel: number;
  bossKills: number;
  ornnLevel: number;
  norraLevel: number;
  propertyIncome: Record<number, number>;
  propertyLanded: Record<number, boolean>;
  lastTick: number;
  rebirthCount: number;
  rebirthReadySwamp: boolean;
  rebirthReadyDCC: boolean;
  bestiary: Record<string, { seen: number; killed: number; maxHp: number }>;
}

export const MAX_DECK_SIZE = 12;

export function gearBagSize(p: Player): number {
  const storage = p.rooms.find(r => r.id === "storage");
  const lvl = Math.min(MAX_STORAGE_LEVEL, storage?.level ?? 1);
  return 5 + (lvl - 1) * 2;
}
export function gearBagCount(p: Player): number {
  return p.inventory.filter(i => i.kind !== "part").length;
}

export interface JWCState {
  enemies: Enemy[];
  active: number;
  playerHp: number;
  playerMaxHp: number;
  sp: number;
  spBase: number;
  spReserved: number;
  enemyActions: ("atk" | "def")[];
  log: string[];
  atkByEnemy: number[];
  pendingDef: number;
  finished: boolean;
  victory: boolean;
  isBossFight: boolean;
}

export type TileAction =
  | { type: "forge" }
  | { type: "shop"; items: Item[] };

function newPlayer(rebirthCount = 0): Player {
  const baseDeck = shuffle([...STARTING_DECK]);
  const mult = rebirthMult(rebirthCount);
  const baseMaxHp = Math.round(100 * mult);
  const starterSword: Weapon = {
    id: "starter-sword", kind: "weapon",
    weaponKind: "sword", damageType: "slash",
    name: "Notched Blade", damage: Math.round(8 * mult), effect: null, level: 1,
  };
  const starterHelmet: Armor = {
    id: "starter-helmet", kind: "armor",
    slot: "helmet", name: "Iron Coif",
    bluntDef: Math.round(5 * mult), pierceDef: Math.round(3 * mult),
    slashDef: Math.round(2 * mult), bonusHP: Math.round(5 * mult), level: 1,
  };
  return {
    name: "Spirit Walker",
    money: 100, gems: 0, metals: 0, bones: 0,
    position: 0, lap: 1, bankBalance: 0,
    hp: baseMaxHp + 5, maxHp: baseMaxHp, inRun: false,
    inventory: [],
    equipped: { weapon: starterSword, helmet: starterHelmet, chest: null, cloak: null },
    rooms: [...STARTING_ROOMS],
    characters: [...STARTING_CHARACTERS],
    deck: baseDeck,
    deckPool: [...STARTING_DECK],
    collection: {},
    dccXp: 0, dccLevel: 1,
    bossKills: 0,
    ornnLevel: 0, norraLevel: 0,
    propertyIncome: {}, propertyLanded: {},
    lastTick: Date.now(),
    rebirthCount,
    rebirthReadySwamp: false,
    rebirthReadyDCC: false,
    bestiary: {},
  };
}

function sanitize(p: Partial<Player>): Player {
  const base = newPlayer(0);
  const safe: Player = { ...base, ...p } as Player;
  const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  safe.money       = Math.max(0, num(safe.money, 0));
  safe.gems        = Math.max(0, num(safe.gems, 0));
  safe.metals      = Math.max(0, num(safe.metals, 0));
  safe.bones       = Math.max(0, num(safe.bones, 0));
  safe.position    = num(safe.position, 0);
  safe.lap         = Math.max(1, num(safe.lap, 1));
  safe.bankBalance = Math.max(0, num(safe.bankBalance, 0));
  safe.maxHp       = Math.max(10, num(safe.maxHp, 100));
  safe.hp          = Math.max(1, Math.min(safe.maxHp, num(safe.hp, safe.maxHp)));
  safe.dccXp       = num(safe.dccXp, 0);
  safe.dccLevel    = Math.max(1, num(safe.dccLevel, 1));
  safe.bossKills   = Math.max(0, num(safe.bossKills, 0));
  safe.ornnLevel   = Math.max(0, num(safe.ornnLevel, 0));
  safe.norraLevel  = Math.max(0, num(safe.norraLevel, 0));
  if (safe.characters.find(c => c.id === "ornn")?.unlocked  && safe.ornnLevel  === 0) safe.ornnLevel  = 1;
  if (safe.characters.find(c => c.id === "norra")?.unlocked && safe.norraLevel === 0) safe.norraLevel = 1;
  safe.rebirthCount      = Math.max(0, num(safe.rebirthCount, 0));
  safe.rebirthReadySwamp = Boolean(safe.rebirthReadySwamp);
  safe.rebirthReadyDCC   = Boolean(safe.rebirthReadyDCC);
  if (!safe.equipped) safe.equipped = { weapon: null, helmet: null, chest: null, cloak: null };
  if (!Array.isArray(safe.inventory))  safe.inventory = [];
  if (!Array.isArray(safe.deck))       safe.deck = shuffle([...STARTING_DECK]);
  if (!Array.isArray(safe.deckPool))   safe.deckPool = [...safe.deck];
  if (!Array.isArray(safe.characters)) safe.characters = [...STARTING_CHARACTERS];
  if (!Array.isArray(safe.rooms))      safe.rooms = [...STARTING_ROOMS];
  if (safe.rooms.some(r => r.id === "kitchen")) {
    safe.rooms = safe.rooms.map(r => r.id === "kitchen" ? { ...r, id: "medlab", name: "Medical Lab" } : r);
  }
  if (!safe.collection || typeof safe.collection !== "object") safe.collection = {};
  if (!safe.bestiary   || typeof safe.bestiary   !== "object") safe.bestiary   = {};
  if (!safe.propertyIncome || typeof safe.propertyIncome !== "object") safe.propertyIncome = {};
  if (!safe.propertyLanded || typeof safe.propertyLanded !== "object") safe.propertyLanded = {};
  // Fix parts saved from old builds that lack the buff property
  safe.inventory = safe.inventory.map(item => {
    if (item.kind === "part" && !(item as EnemyPart).buff) {
      return { ...item, buff: PART_BUFFS[(item as EnemyPart).name] ?? { label: "+2 dmg", damageBonus: 2 } };
    }
    return item;
  });
  return safe;
}

function loadPlayer(): Player {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return sanitize(parsed);
    }
  } catch { /* ignore */ }
  return newPlayer();
}

export function effectiveMaxHp(p: Pick<Player, "maxHp" | "equipped">): number {
  const base = Number.isFinite(p?.maxHp) ? p.maxHp : 100;
  const eq = p?.equipped;
  const bonus = ((eq?.helmet?.kind === "armor" && eq.helmet.bonusHP) || 0)
              + ((eq?.chest?.kind  === "armor" && eq.chest.bonusHP)  || 0)
              + ((eq?.cloak?.kind  === "armor" && eq.cloak.bonusHP)  || 0);
  return base + bonus;
}

function getDefenseVsType(eq: Player["equipped"], dtype: DamageType): number {
  const pieces = [eq?.helmet, eq?.chest, eq?.cloak];
  return pieces.reduce((sum, a) => {
    if (!a || a.kind !== "armor") return sum;
    if (dtype === "blunt")  return sum + (a.bluntDef  ?? 0);
    if (dtype === "pierce") return sum + (a.pierceDef ?? 0);
    return sum + (a.slashDef ?? 0);
  }, 0);
}

function decideEnemyAction(enemy: Enemy): "atk" | "def" {
  if (enemy.stunned) return "def";
  const hpRatio   = enemy.hp / enemy.maxHp;
  const defChance = hpRatio < 0.3 ? 0.55 : hpRatio < 0.6 ? 0.30 : 0.20;
  return Math.random() < defChance ? "def" : "atk";
}

interface GameContextType {
  player: Player;
  jwc: JWCState | null;
  hasPendingCombat: boolean;
  pendingTileAction: TileAction | null;
  setPlayer: (p: Player | ((prev: Player) => Player)) => void;
  rollDice: () => { roll: number; tile: number; enemies: Enemy[] | null };
  triggerPendingCombat: () => void;
  jwcAttack: () => void;
  jwcDefend: () => void;
  jwcReserve: () => void;
  jwcEndRound: () => void;
  jwcSelectTarget: (idx: number) => void;
  jwcAttackEnemy: (idx: number) => void;
  jwcUnqueueAtkForEnemy: (idx: number) => void;
  closeJWC: () => void;
  closeTileAction: () => void;
  mergePartIntoWeapon: (partId: string, targetId: string) => { ok: boolean; msg: string };
  buyShopItem: (item: Item) => { ok: boolean; msg: string };
  equipItem: (itemId: string) => void;
  unequipSlot: (slot: "weapon" | "helmet" | "chest" | "cloak") => void;
  meltItem: (itemId: string) => void;
  sellItem: (itemId: string) => void;
  sellParts: (partName: string, count: number) => void;
  forgeItem: (which: "weapon" | "armor") => boolean;
  upgradeRoom: (id: string) => boolean;
  upgradeCard: (cardName: string) => boolean;
  collectBank: () => void;
  collectProperties: () => void;
  newRun: () => void;
  resetAll: () => void;
  effectiveMaxHp: (p: Pick<Player, "maxHp" | "equipped">) => number;
  jwcUnqueueAtk: () => void;
  jwcUnqueueDef: () => void;
  jwcUnqueueReserve: () => void;
  recordDCCWin: (xpGain: number, moneyGain: number) => { leveled: boolean; newLevel: number; rewardCard: Card };
  getPendingCardUpgrades: () => number;
  applyCardUpgrade: (cardName: string) => void;
  pendingCardUpgrades: number;
  addCardToDeck: (cardId: string) => void;
  removeCardFromDeck: (cardId: string) => void;
  debugGiveMoney: (amount: number) => void;
  debugGiveMetals: (amount: number) => void;
  debugMoveToTile: (kind: TileKind) => void;
  debugRebirth: () => void;
  debugGiveOpKit: () => void;
  debugStartFightSequence: () => void;
  maxUpgradeCard: (cardName: string) => void;
  performRebirth: () => void;
  upgradeNpcLevel: (npcId: "ornn" | "norra") => { ok: boolean; msg: string };
}

const GameContext = createContext<GameContextType | null>(null);
export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame outside GameProvider");
  return ctx;
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayerState]   = useState<Player>(loadPlayer);
  const [jwc, setJWC]              = useState<JWCState | null>(null);
  const [pendingCardUpgrades, setPendingCardUpgrades] = useState(0);
  const [pendingTileAction, setPendingTileAction] = useState<TileAction | null>(null);
  const pendingCombatRef  = useRef<{ enemies: Enemy[]; isBoss: boolean } | null>(null);
  const [hasPendingCombat, setHasPendingCombat] = useState(false);
  const fightQueueRef = useRef<Array<"pve" | "elite" | "boss">>([]);
  const playerRef = useRef<Player>(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(player)); } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(t);
  }, [player]);

  useEffect(() => {
    const t = setInterval(() => {
      setPlayerState((p) => {
        const owned = Object.keys(p.propertyIncome).map(Number);
        if (owned.length === 0) return p;
        const next = { ...p.propertyIncome };
        for (const k of owned) {
          const cur = next[k] || 0;
          if (cur < 5) next[k] = cur + 1;
        }
        return { ...p, propertyIncome: next, lastTick: Date.now() };
      });
    }, 12000);
    return () => clearInterval(t);
  }, []);

  function setPlayer(p: Player | ((prev: Player) => Player)) {
    setPlayerState((prev) => (typeof p === "function" ? p(prev) : p));
  }

  function setPendingEncounter(val: { enemies: Enemy[]; isBoss: boolean } | null) {
    pendingCombatRef.current = val;
    setHasPendingCombat(!!val);
  }

  function startJWC(enemies: Enemy[], isBoss: boolean) {
    const cur  = playerRef.current;
    const eMax = effectiveMaxHp(cur);
    const hp   = Math.min(cur.hp, eMax);
    const eMult = 1 + 0.05 * cur.rebirthCount;
    const scaledEnemies: Enemy[] = enemies.map(e => ({
      ...e,
      hp:     Math.round(e.hp     * eMult),
      maxHp:  Math.round(e.maxHp  * eMult),
      damage: Math.round(e.damage * eMult),
    }));
    const enemyActions = scaledEnemies.map(e => decideEnemyAction(e));
    const firstAlive = scaledEnemies[0];
    const logLines = [
      isBoss
        ? `★ BOSS ${firstAlive.name} blocks your path!`
        : scaledEnemies.length > 1
          ? `${scaledEnemies.map(e => e.name).join(" & ")} appear!`
          : `A ${firstAlive.name} blocks your path!`,
      `Weak to: ${firstAlive.weakness.toUpperCase()}`,
      "Hit=ATK · Block=DEF · Preserve=Reserve SP",
    ];
    if (cur.rebirthCount > 0) {
      logLines.push(`⟳ Rebirth ×${cur.rebirthCount} — enemies +${cur.rebirthCount * 10}%`);
    }
    setJWC({
      enemies: scaledEnemies, active: 0,
      playerHp: hp, playerMaxHp: eMax,
      sp: 3, spBase: 3, spReserved: 0,
      enemyActions,
      log: logLines,
      atkByEnemy: scaledEnemies.map(() => 0), pendingDef: 0,
      finished: false, victory: false, isBossFight: isBoss,
    });
    setPlayerState(p => {
      const b = { ...p.bestiary };
      for (const e of scaledEnemies) {
        const prev = b[e.name] ?? { seen: 0, killed: 0, maxHp: 0 };
        b[e.name] = { ...prev, seen: prev.seen + 1, maxHp: Math.max(prev.maxHp, e.maxHp) };
      }
      return { ...p, bestiary: b };
    });
  }

  function playerHasNorra(p: Player): boolean {
    return (p.norraLevel ?? 0) > 0;
  }
  function playerHasOrnn(p: Player): boolean {
    return (p.ornnLevel ?? 0) > 0;
  }
  function playerNorraLevel(p: Player): number {
    return p.norraLevel ?? 0;
  }
  function playerOrnnLevel(p: Player): number {
    return p.ornnLevel ?? 0;
  }
  function maxNpcLevel(p: Player): number {
    return Math.min(20, Math.floor(p.bossKills / 5) * 5 + 5);
  }
  function npcUpgradeCost(level: number): { money: number; metals: number } {
    const nextLv = level + 1;
    return { money: nextLv * 80, metals: nextLv };
  }
  function upgradeNpcLevel(npcId: "ornn" | "norra"): { ok: boolean; msg: string } {
    const p = playerRef.current;
    const curLevel = npcId === "ornn" ? playerOrnnLevel(p) : playerNorraLevel(p);
    const isUnlocked = npcId === "ornn"
      ? p.characters.find(c => c.id === "ornn")?.unlocked
      : p.characters.find(c => c.id === "norra")?.unlocked;
    if (!isUnlocked) return { ok: false, msg: `${npcId} not unlocked.` };
    if (curLevel <= 0) return { ok: false, msg: `${npcId} not active.` };
    const cap = maxNpcLevel(p);
    if (curLevel >= cap) return { ok: false, msg: `Reach next biome to unlock higher levels.` };
    if (curLevel >= 20)  return { ok: false, msg: `Already max level 20.` };
    const { money, metals } = npcUpgradeCost(curLevel);
    if (p.money < money)   return { ok: false, msg: `Need $${money}.` };
    if (p.metals < metals) return { ok: false, msg: `Need ${metals} metals.` };
    setPlayerState(q => ({
      ...q,
      money: q.money - money,
      metals: q.metals - metals,
      ornnLevel:  npcId === "ornn"  ? (q.ornnLevel  ?? 0) + 1 : q.ornnLevel,
      norraLevel: npcId === "norra" ? (q.norraLevel ?? 0) + 1 : q.norraLevel,
    }));
    return { ok: true, msg: `${npcId === "ornn" ? "Ornn" : "Norra"} leveled up to ${curLevel + 1}!` };
  }

  function rollDice() {
    const roll = 1 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
    const p0     = playerRef.current;
    const total  = BOARD.length;
    const before = p0.position;
    const after  = (before + roll) % total;

    const tile = BOARD[after];
    let enemies: Enemy[] | null = null;
    let isBoss = false;
    let pendingAction: TileAction | null = null;
    let teleportTo: number | null = null;

    if (tile.kind === "boss") {
      enemies = rollBoss(p0.bossKills);
      isBoss  = true;
    } else if (tile.kind === "pve") {
      enemies = rollEncounter(p0.bossKills);
    } else if (tile.kind === "shop") {
      pendingAction = { type: "shop", items: genShopItems(p0.bossKills, p0.rebirthCount, playerNorraLevel(p0)) };
    } else if (tile.kind === "elite") {
      enemies = rollEncounter(p0.bossKills, true);
    } else if (tile.kind === "forge") {
      pendingAction = { type: "forge" };
    } else if (tile.kind === "teleport") {
      const bossIdx = BOARD.findIndex(t => t.kind === "boss");
      if (bossIdx >= 0) {
        enemies    = rollBoss(p0.bossKills);
        isBoss     = true;
        teleportTo = bossIdx;
      }
    }

    setPlayerState((cur) => {
      const dest = teleportTo ?? after;
      const passedStart = teleportTo !== null
        ? (after < cur.position || teleportTo < after)
        : (after < cur.position || (after === 0 && roll > 0));
      const lap = cur.lap + (passedStart ? 1 : 0);
      let next: Player = { ...cur, position: dest, lap };
      if (passedStart) {
        next.hp          = effectiveMaxHp(next);
        next.money       = next.money + 25;
        next.bankBalance = next.bankBalance + 20 * lap;
      }
      if (tile.kind === "start") {
        next.hp          = effectiveMaxHp(next);
        next.money       = next.money + 25;
        next.bankBalance = next.bankBalance + 20 * lap;
      } else if (tile.kind === "property") {
        if (next.propertyIncome[after] === undefined) {
          next.propertyIncome = { ...next.propertyIncome, [after]: 0 };
        }
        next.propertyLanded = { ...next.propertyLanded, [after]: true };
      }
      return next;
    });

    if (enemies) {
      setPendingEncounter({ enemies, isBoss });
    } else if (pendingAction) {
      setPendingTileAction(pendingAction);
    }

    return { roll, tile: teleportTo ?? after, enemies };
  }

  function triggerPendingCombat() {
    const cur = pendingCombatRef.current;
    if (cur && cur.enemies) {
      pendingCombatRef.current = null;
      setHasPendingCombat(false);
      startJWC(cur.enemies, cur.isBoss);
    }
  }

  function closeTileAction() { setPendingTileAction(null); }

  function mergePartIntoWeapon(partId: string, targetId: string): { ok: boolean; msg: string } {
    const p    = playerRef.current;
    const part = p.inventory.find(i => i.id === partId && i.kind === "part") as EnemyPart | undefined;
    if (!part) return { ok: false, msg: "Part not found." };

    const equippedList: (Weapon | Armor | null)[] = [
      p.equipped.weapon, p.equipped.helmet, p.equipped.chest, p.equipped.cloak,
    ];
    const invItems = p.inventory.filter(i => i.kind !== "part") as (Weapon | Armor)[];
    const target   = [...equippedList, ...invItems].find(i => i?.id === targetId) as Weapon | Armor | undefined;
    if (!target) return { ok: false, msg: "Target item not found." };
    if ((target.mergeCount ?? 0) >= 20) return { ok: false, msg: "Max 20 merges reached for this item." };

    setPlayerState((pl) => {
      const partItem = pl.inventory.find(i => i.id === partId && i.kind === "part") as EnemyPart | undefined;
      if (!partItem) return pl;
      const newInv = pl.inventory.filter(i => i.id !== partId);

      if (target.kind === "weapon") {
        const findWeapon = (): Weapon | undefined => {
          if (pl.equipped.weapon?.id === targetId) return pl.equipped.weapon ?? undefined;
          return pl.inventory.find(i => i.id === targetId && i.kind === "weapon") as Weapon | undefined;
        };
        const wp = findWeapon();
        if (!wp) return pl;
        const newEffect = partItem.buff.addEffect ? partItem.buff.addEffect : wp.effect;
        const upgraded: Weapon = {
          ...wp,
          damage:     wp.damage + partItem.buff.damageBonus,
          effect:     newEffect as Weapon["effect"],
          level:      wp.level + 1,
          mergeCount: (wp.mergeCount ?? 0) + 1,
        };
        if (pl.equipped.weapon?.id === targetId) {
          return { ...pl, equipped: { ...pl.equipped, weapon: upgraded }, inventory: newInv };
        }
        return { ...pl, inventory: newInv.map(i => i.id === targetId ? upgraded : i) };
      } else {
        const findArmor = (): Armor | undefined => {
          const slots = ["helmet", "chest", "cloak"] as const;
          for (const s of slots) {
            if (pl.equipped[s]?.id === targetId) return pl.equipped[s] ?? undefined;
          }
          return pl.inventory.find(i => i.id === targetId && i.kind === "armor") as Armor | undefined;
        };
        const ar = findArmor();
        if (!ar) return pl;
        const upgraded: Armor = { ...ar, bonusHP: ar.bonusHP + partItem.buff.damageBonus, level: ar.level + 1, mergeCount: (ar.mergeCount ?? 0) + 1 };
        const slot = ar.slot;
        if (pl.equipped[slot]?.id === targetId) {
          const newEq = { ...pl.equipped, [slot]: upgraded };
          return {
            ...pl, equipped: newEq, inventory: newInv,
            hp: Math.min(effectiveMaxHp({ ...pl, equipped: newEq }), pl.hp),
          };
        }
        return { ...pl, inventory: newInv.map(i => i.id === targetId ? upgraded : i) };
      }
    });

    const buffDesc = target.kind === "weapon"
      ? `+${part.buff.damageBonus} dmg + tier up${part.buff.addEffect ? ` + ${part.buff.addEffect}` : ""}`
      : `+${part.buff.damageBonus} HP + tier up`;
    return { ok: true, msg: `Merged ${part.name} → ${buffDesc}` };
  }

  function buyShopItem(item: Item): { ok: boolean; msg: string } {
    if (item.kind === "part") return { ok: false, msg: "Can't buy parts." };
    const price = shopPrice(item, playerNorraLevel(playerRef.current));
    if (playerRef.current.money < price) return { ok: false, msg: `Need $${price}.` };
    const p = playerRef.current;
    if (gearBagCount(p) >= gearBagSize(p)) {
      return { ok: false, msg: `Gear bag full (${gearBagSize(p)} slots). Sell or melt items first.` };
    }
    setPlayerState((q) => ({ ...q, money: q.money - price, inventory: [...q.inventory, item] }));
    return { ok: true, msg: `Bought ${(item as Weapon | Armor).name} for $${price}!` };
  }

  const SP_PER_ROUND = 3;

  function calcDamageTaken(rawDmg: number, dtype: DamageType, blockCount: number, eq: Player["equipped"]): number {
    const totalDef = getDefenseVsType(eq, dtype);
    if (blockCount === 0) {
      if (totalDef === 0) return rawDmg;
      const passiveReduction = Math.min(0.12, totalDef / (totalDef + 60));
      return Math.max(1, Math.round(rawDmg * (1 - passiveReduction)));
    }
    // Block 1: 40% base reduction. Block 2+: 65% base reduction.
    const baseReduction = blockCount >= 2 ? 0.65 : 0.40;
    const armorReduction = totalDef > 0 ? Math.min(0.50, totalDef / (totalDef + 45)) : 0;
    const totalReduction = Math.min(0.90, baseReduction + armorReduction * (1 - baseReduction));
    return Math.max(1, Math.round(rawDmg * (1 - totalReduction)));
  }

  function checkVictory(state: JWCState): JWCState {
    if (state.enemies.every(e => e.hp <= 0)) {
      return { ...state, finished: true, victory: true, log: ["★ VICTORY! ★", ...state.log] };
    }
    let next = { ...state };
    if (next.enemies[next.active]?.hp <= 0) {
      const nextIdx = next.enemies.findIndex(e => e.hp > 0);
      if (nextIdx >= 0) {
        const newActions = [...next.enemyActions];
        newActions[nextIdx] = decideEnemyAction(next.enemies[nextIdx]);
        next = { ...next, active: nextIdx, enemyActions: newActions };
      }
    }
    return next;
  }

  function jwcAttack() {
    if (!jwc || jwc.finished || jwc.sp < 1) {
      if (jwc && jwc.sp < 1) setJWC({ ...jwc, log: ["No SP for Hit.", ...jwc.log].slice(0, 10) });
      return;
    }
    const newAtk = [...jwc.atkByEnemy];
    newAtk[jwc.active] = (newAtk[jwc.active] ?? 0) + 1;
    setJWC({ ...jwc, atkByEnemy: newAtk, sp: jwc.sp - 1 });
  }

  function jwcUnqueueAtk() {
    if (!jwc || jwc.finished || (jwc.atkByEnemy[jwc.active] ?? 0) < 1) return;
    const newAtk = [...jwc.atkByEnemy];
    newAtk[jwc.active] = newAtk[jwc.active] - 1;
    setJWC({ ...jwc, atkByEnemy: newAtk, sp: jwc.sp + 1 });
  }

  function jwcDefend() {
    if (!jwc || jwc.finished || jwc.sp < 1) {
      if (jwc && jwc.sp < 1) setJWC({ ...jwc, log: ["No SP for Shield.", ...jwc.log].slice(0, 10) });
      return;
    }
    setJWC({ ...jwc, pendingDef: jwc.pendingDef + 1, sp: jwc.sp - 1 });
  }

  function jwcUnqueueDef() {
    if (!jwc || jwc.finished || jwc.pendingDef < 1) return;
    setJWC({ ...jwc, pendingDef: jwc.pendingDef - 1, sp: jwc.sp + 1 });
  }

  function jwcReserve() {
    if (!jwc || jwc.finished || jwc.sp < 1) {
      if (jwc && jwc.sp < 1) setJWC({ ...jwc, log: ["No SP to reserve.", ...jwc.log].slice(0, 10) });
      return;
    }
    setJWC({ ...jwc, sp: jwc.sp - 1, spReserved: jwc.spReserved + 1 });
  }

  function jwcUnqueueReserve() {
    if (!jwc || jwc.finished || jwc.spReserved < 1) return;
    setJWC({ ...jwc, spReserved: jwc.spReserved - 1, sp: jwc.sp + 1 });
  }

  function jwcSelectTarget(idx: number) {
    if (!jwc || jwc.finished) return;
    const enemy = jwc.enemies[idx];
    if (!enemy || enemy.hp <= 0) return;
    setJWC({ ...jwc, active: idx });
  }

  function jwcAttackEnemy(idx: number) {
    if (!jwc || jwc.finished || jwc.sp < 1) return;
    const enemy = jwc.enemies[idx];
    if (!enemy || enemy.hp <= 0) return;
    const newAtk = [...jwc.atkByEnemy];
    newAtk[idx] = (newAtk[idx] ?? 0) + 1;
    setJWC({ ...jwc, active: idx, atkByEnemy: newAtk, sp: jwc.sp - 1 });
  }

  function jwcUnqueueAtkForEnemy(idx: number) {
    if (!jwc || jwc.finished || (jwc.atkByEnemy[idx] ?? 0) < 1) return;
    const newAtk = [...jwc.atkByEnemy];
    newAtk[idx] = newAtk[idx] - 1;
    setJWC({ ...jwc, atkByEnemy: newAtk, sp: jwc.sp + 1 });
  }

  function jwcEndRound() {
    if (!jwc || jwc.finished) return;
    const { atkByEnemy, pendingDef } = jwc;
    const logs: string[] = [];
    let next = { ...jwc, atkByEnemy: jwc.enemies.map(() => 0), pendingDef: 0 };
    const w = playerRef.current.equipped.weapon;
    const pMult = rebirthMult(playerRef.current.rebirthCount);

    for (let ei = 0; ei < jwc.enemies.length; ei++) {
      const atks = atkByEnemy[ei] ?? 0;
      if (atks === 0) continue;
      const target = jwc.enemies[ei];
      if (!target || target.hp <= 0) continue;

      let totalDmg = 0;
      let weaponEffect: "stun" | "ice" | null = null;
      const targetAction = jwc.enemyActions[ei] ?? "atk";

      for (let i = 0; i < atks; i++) {
        let dmg = Math.round(5 * pMult);
        if (w && w.kind === "weapon") {
          const isWeakness = w.damageType === target.weakness;
          dmg = Math.round((w.damage + (isWeakness ? 8 : 0)) * pMult);
          if (w.effect && !weaponEffect) weaponEffect = w.effect;
        }
        if (targetAction === "def") dmg = Math.max(1, Math.round(dmg * 0.6));
        totalDmg += dmg;
      }

      if (totalDmg > 0) {
        const enemies = [...next.enemies];
        enemies[ei] = { ...enemies[ei], hp: Math.max(0, enemies[ei].hp - totalDmg) };
        next = { ...next, enemies };
        const hitLabel = w?.damageType === target.weakness ? " (WEAK!)" : "";
        logs.push(`Hit ×${atks} → ${target.name}: −${totalDmg}${hitLabel}${targetAction === "def" ? " [braced]" : ""}`);

        if (weaponEffect === "stun" && Math.random() < 0.35) {
          const enemies2 = [...next.enemies];
          enemies2[ei] = { ...enemies2[ei], stunned: true };
          next = { ...next, enemies: enemies2 };
          logs.push(`${target.name} is STUNNED!`);
        }

        if (weaponEffect === "ice") {
          const enemies2 = [...next.enemies];
          enemies2[ei] = { ...enemies2[ei], iceTurns: 2 };
          next = { ...next, enemies: enemies2 };
          logs.push(`[ICE] ${target.name} is FROZEN for 2 turns!`);
        }
      }
    }

    next = checkVictory(next);

    if (!next.finished) {
      for (let i = 0; i < next.enemies.length; i++) {
        const e = next.enemies[i];
        if (e.hp <= 0) continue;
        const eAction = next.enemyActions[i] ?? "atk";

        if (eAction === "atk") {
          const frozen  = (e.iceTurns ?? 0) > 0;
          const rawDmg  = frozen ? Math.max(1, Math.round(e.damage * 0.5)) : e.damage;
          const finalDmg = calcDamageTaken(rawDmg, e.attackType, pendingDef, playerRef.current.equipped);
          next = { ...next, playerHp: Math.max(0, next.playerHp - finalDmg) };
          const defNote = pendingDef > 0 ? (pendingDef >= 2 ? ` [block×${pendingDef}]` : ` [block]`) : "";
          const frozeNote = frozen ? ` [ICE frozen -50%]` : "";
          logs.push(`${e.name} hits −${finalDmg}${defNote}${frozeNote}`);
        } else if (eAction === "def") {
          if (e.stunned) logs.push(`${e.name} is STUNNED — can't act!`);
        }
      }
    }

    {
      const updatedEnemies = next.enemies.map(e => ({
        ...e,
        stunned: false,
        iceTurns: Math.max(0, (e.iceTurns ?? 0) - 1),
      }));
      next = { ...next, enemies: updatedEnemies };
    }

    if (next.playerHp <= 0 && !next.finished) {
      next = { ...next, finished: true, victory: false };
      logs.push("You collapse...");
    }

    next = checkVictory(next);

    if (!next.finished) {
      const reserved = next.spReserved;
      // Reserve bonus: each reserved SP earns +1 extra SP on return (50% interest)
      const bonus    = reserved > 0 ? Math.ceil(reserved * 0.5) : 0;
      const newSp    = Math.min(6, SP_PER_ROUND + reserved + bonus);
      const newEnemyActions = next.enemies.map(e =>
        e.hp > 0 ? decideEnemyAction(e) : ("def" as const)
      );
      if (reserved > 0) {
        logs.push(`── SP: ${newSp} (${SP_PER_ROUND}+${reserved} rsrv +${bonus} bonus!) ──`);
      } else {
        logs.push(`── SP: ${newSp} ──`);
      }
      next = { ...next, sp: newSp, spReserved: 0, enemyActions: newEnemyActions };
    }

    setJWC({ ...next, log: [...logs, ...next.log].slice(0, 12) });
  }

  function closeJWC() {
    if (!jwc) return;
    if (jwc.victory) {
      let totalMoney = 0, totalGems = 0, totalMetals = 0;
      const partDrops: EnemyPart[] = [];
      const gearDrops: (Weapon | Armor)[] = [];

      const bk    = playerRef.current.bossKills;
      const range = getEnemyLevelRange(bk, jwc.isBossFight ? false : false, jwc.isBossFight);
      const gearLevel = Math.round((range.min + range.max) / 2);
      for (const e of jwc.enemies) {
        totalMoney  += e.loot.money;
        totalGems   += e.loot.gems;
        totalMetals += e.loot.metals;
        if (e.loot.partName) {
          partDrops.push(makeEnemyPart(e.loot.partName, e.level ?? gearLevel));
        }
        if (Math.random() < 0.25) {
          gearDrops.push(Math.random() < 0.5 ? genWeapon(gearLevel, getBiome(bk)) : genArmor(gearLevel));
        }
      }

      const isBossWin = jwc.isBossFight;
      const lootMult = rebirthMult(playerRef.current.rebirthCount);
      setPlayerState((p) => {
        const bagMax      = gearBagSize(p);
        const currentGear = gearBagCount(p);
        const space       = Math.max(0, bagMax - currentGear);
        const fittingGear = gearDrops.slice(0, space);
        const newBossKills = isBossWin ? p.bossKills + 1 : p.bossKills;
        const newReadySwamp = p.rebirthReadySwamp || (isBossWin && newBossKills === 19);
        const newBestiary = { ...p.bestiary };
        for (const e of jwc.enemies) {
          const prev = newBestiary[e.name] ?? { seen: 0, killed: 0, maxHp: 0 };
          newBestiary[e.name] = { ...prev, killed: prev.killed + 1 };
        }
        return {
          ...p,
          hp:        Math.max(1, Math.min(effectiveMaxHp(p), jwc.playerHp)),
          money:     p.money   + Math.round(totalMoney  * lootMult),
          gems:      p.gems    + Math.round(totalGems   * lootMult),
          metals:    p.metals  + Math.round(totalMetals * lootMult),
          inventory: [...p.inventory, ...partDrops, ...fittingGear],
          bossKills: newBossKills,
          rebirthReadySwamp: newReadySwamp,
          bestiary: newBestiary,
        };
      });
    } else {
      setPlayerState((p) => ({
        ...p,
        hp:       Math.max(10, Math.floor(effectiveMaxHp(p) * 0.5)),
        money:    Math.floor(p.money * 0.75),
        position: 0,
        inRun:    true,
      }));
    }
    setJWC(null);
    if (fightQueueRef.current.length > 0) {
      const [next, ...rest] = fightQueueRef.current;
      fightQueueRef.current = rest;
      const p = playerRef.current;
      setTimeout(() => {
        if (next === "elite") {
          const enemies = rollEncounter(p.bossKills, true);
          setPendingEncounter({ enemies, isBoss: false });
        } else if (next === "boss") {
          const enemies = rollBoss(p.bossKills);
          setPendingEncounter({ enemies, isBoss: true });
        } else {
          const enemies = rollEncounter(p.bossKills);
          setPendingEncounter({ enemies, isBoss: false });
        }
      }, 200);
    }
  }

  function equipItem(itemId: string) {
    setPlayerState((p) => {
      const item = p.inventory.find(i => i.id === itemId);
      if (!item || item.kind === "part") return p;
      const eq  = { ...p.equipped };
      let inv   = p.inventory.filter(i => i.id !== itemId);
      if (item.kind === "weapon") {
        if (eq.weapon) inv = [...inv, eq.weapon];
        eq.weapon = item;
      } else {
        const slot = (item as Armor).slot;
        if (eq[slot]) inv = [...inv, eq[slot]!];
        (eq as Record<string, Item | null>)[slot] = item;
      }
      const next = { ...p, inventory: inv, equipped: eq };
      return { ...next, hp: Math.min(effectiveMaxHp(next), next.hp) };
    });
  }

  function unequipSlot(slot: "weapon" | "helmet" | "chest" | "cloak") {
    setPlayerState((p) => {
      const item = p.equipped[slot];
      if (!item) return p;
      const next = { ...p, equipped: { ...p.equipped, [slot]: null }, inventory: [...p.inventory, item] };
      return { ...next, hp: Math.min(effectiveMaxHp(next), next.hp) };
    });
  }

  function meltItem(itemId: string) {
    setPlayerState((p) => {
      const item = p.inventory.find(i => i.id === itemId);
      if (!item || item.kind === "part") return p;
      return { ...p, metals: p.metals + 1 + Math.floor(item.level / 5), inventory: p.inventory.filter(i => i.id !== itemId) };
    });
  }

  function sellItem(itemId: string) {
    setPlayerState((p) => {
      const item = p.inventory.find(i => i.id === itemId);
      if (!item || item.kind === "part") return p;
      return { ...p, money: p.money + 20 + item.level * 12, inventory: p.inventory.filter(i => i.id !== itemId) };
    });
  }

  function sellParts(partName: string, count: number) {
    setPlayerState((p) => {
      const partsOfType = p.inventory.filter(i => i.kind === "part" && (i as EnemyPart).name === partName) as EnemyPart[];
      const toSell = count < 0 ? partsOfType : partsOfType.slice(0, count);
      if (toSell.length === 0) return p;
      const ids = new Set(toSell.map(pt => pt.id));
      const avgLevel = Math.round(toSell.reduce((s, pt) => s + pt.level, 0) / toSell.length);
      const sellValue = Math.max(5, 8 + avgLevel * 2) * toSell.length;
      return {
        ...p,
        inventory: p.inventory.filter(i => !ids.has(i.id)),
        money: p.money + sellValue,
      };
    });
  }

  function forgeItem(which: "weapon" | "armor"): boolean {
    if (playerRef.current.metals < 3) return false;
    const p = playerRef.current;
    if (gearBagCount(p) >= gearBagSize(p)) return false;
    setPlayerState((q) => {
      const range = getEnemyLevelRange(q.bossKills, false);
      const baseLevel = Math.round((range.min + range.max) / 2);
      const ornnBonus = playerOrnnLevel(q);
      const level = baseLevel + ornnBonus;
      return {
        ...q,
        metals: q.metals - 3,
        inventory: [
          ...q.inventory,
          which === "weapon"
            ? genWeapon(level, getBiome(q.bossKills))
            : genArmor(level),
        ],
      };
    });
    return true;
  }

  function upgradeRoom(id: string): boolean {
    const room = playerRef.current.rooms.find(r => r.id === id);
    if (!room) return false;
    if (playerRef.current.money < room.costMoney || playerRef.current.metals < room.costMetals) return false;
    setPlayerState((p) => {
      const rooms = p.rooms.map(r =>
        r.id === id
          ? { ...r, level: r.level + 1, costMoney: Math.floor(r.costMoney * 1.6), costMetals: Math.floor(r.costMetals * 1.5) + 1 }
          : r
      );
      const characters = p.characters.map(c => {
        if (id === "blacksmith" && c.id === "ornn")  return { ...c, unlocked: true };
        if (id === "shop"       && c.id === "norra") return { ...c, unlocked: true };
        if (id === "medlab"     && c.id === "mundo") return { ...c, unlocked: true };
        return c;
      });
      const bonusMax = id === "medlab" ? 5 : 0;
      const newMax   = p.maxHp + bonusMax;
      return {
        ...p,
        money:   p.money   - room.costMoney,
        metals:  p.metals  - room.costMetals,
        rooms, characters,
        maxHp: newMax,
        hp: Math.min(effectiveMaxHp({ ...p, maxHp: newMax }), p.hp + bonusMax),
      };
    });
    return true;
  }

  function upgradeCard(cardName: string): boolean {
    const cur = playerRef.current.collection[cardName] || 1;
    if (cur >= 5) return false;
    const cost = 50 * cur;
    if (playerRef.current.money < cost) return false;
    setPlayerState((p) => ({
      ...p,
      money: p.money - cost,
      collection: { ...p.collection, [cardName]: cur + 1 },
      deck:     p.deck.map(c     => c.name === cardName ? { ...c, power: c.power + 1 } : c),
      deckPool: p.deckPool.map(c => c.name === cardName ? { ...c, power: c.power + 1 } : c),
    }));
    return true;
  }

  function applyCardUpgrade(cardName: string) {
    setPlayerState((p) => ({
      ...p,
      collection: { ...p.collection, [cardName]: (p.collection[cardName] || 1) + 1 },
      deck:     p.deck.map(c     => c.name === cardName ? { ...c, power: c.power + 1 } : c),
      deckPool: p.deckPool.map(c => c.name === cardName ? { ...c, power: c.power + 1 } : c),
    }));
    setPendingCardUpgrades(n => Math.max(0, n - 1));
  }

  function getPendingCardUpgrades() { return pendingCardUpgrades; }

  function recordDCCWin(xpGain: number, moneyGain: number): { leveled: boolean; newLevel: number; rewardCard: Card } {
    const cur          = playerRef.current;
    const totalXp      = cur.dccXp + xpGain;
    const xpPerLevel   = 100;
    const levelsGained = Math.floor(totalXp / xpPerLevel);
    const leveled      = levelsGained > 0;
    const newLevel     = cur.dccLevel + levelsGained;
    const rewardCard   = pickDCCRewardCard(cur.dccLevel);

    if (leveled) {
      setPendingCardUpgrades(prev => prev + levelsGained * 2);
    }

    setPlayerState((p) => {
      const pTotalXp      = p.dccXp + xpGain;
      const pLevelsGained = Math.floor(pTotalXp / xpPerLevel);
      const newDeckPool   = [...p.deckPool, rewardCard];
      const newDeck       = p.deck.length < MAX_DECK_SIZE ? [...p.deck, rewardCard] : p.deck;
      const newDccLevel   = p.dccLevel + pLevelsGained;
      const newReadyDCC   = p.rebirthReadyDCC || newDccLevel >= 20;
      return {
        ...p,
        money:           p.money + moneyGain,
        dccXp:           pTotalXp % xpPerLevel,
        dccLevel:        newDccLevel,
        deckPool:        newDeckPool,
        deck:            newDeck,
        rebirthReadyDCC: newReadyDCC,
      };
    });
    return { leveled, newLevel, rewardCard };
  }

  function addCardToDeck(cardId: string) {
    setPlayerState((p) => {
      if (p.deck.length >= MAX_DECK_SIZE) return p;
      if (p.deck.some(c => c.id === cardId)) return p;
      const card = p.deckPool.find(c => c.id === cardId);
      if (!card) return p;
      return { ...p, deck: [...p.deck, card] };
    });
  }

  function removeCardFromDeck(cardId: string) {
    setPlayerState(p => ({ ...p, deck: p.deck.filter(c => c.id !== cardId) }));
  }

  function collectBank() {
    setPlayerState(p => ({ ...p, money: p.money + p.bankBalance, bankBalance: 0 }));
  }

  function collectProperties() {
    setPlayerState((p) => {
      let total = 0;
      const newIncome = { ...p.propertyIncome };
      for (const k of Object.keys(newIncome).map(Number)) {
        total += newIncome[k] || 0;
        newIncome[k] = 0;
      }
      return { ...p, money: p.money + total, propertyIncome: newIncome };
    });
  }

  function newRun() {
    setPlayerState(p => ({ ...p, inRun: true, hp: effectiveMaxHp(p), position: 0 }));
  }

  function resetAll() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    setPlayerState(newPlayer());
    setJWC(null);
    setPendingCardUpgrades(0);
    setPendingTileAction(null);
  }

  function performRebirth() {
    const cur = playerRef.current;
    if (!cur.rebirthReadySwamp || !cur.rebirthReadyDCC) return;
    const nextCount = cur.rebirthCount + 1;
    const fresh = newPlayer(nextCount);
    setPlayerState({ ...fresh });
    setJWC(null);
    setPendingCardUpgrades(0);
    setPendingTileAction(null);
  }

  function maxUpgradeCard(cardName: string) {
    setPlayerState((p) => {
      let cur = p.collection[cardName] || 1;
      let money = p.money;
      let powerBoost = 0;
      while (cur < 5) {
        const cost = 50 * cur;
        if (money < cost) break;
        money -= cost;
        cur++;
        powerBoost++;
      }
      if (powerBoost === 0) return p;
      return {
        ...p,
        money,
        collection: { ...p.collection, [cardName]: cur },
        deck:     p.deck.map(c     => c.name === cardName ? { ...c, power: c.power + powerBoost } : c),
        deckPool: p.deckPool.map(c => c.name === cardName ? { ...c, power: c.power + powerBoost } : c),
      };
    });
  }

  function debugGiveMoney(amount: number) {
    setPlayerState(p => ({ ...p, money: p.money + amount }));
  }

  function debugGiveMetals(amount: number) {
    setPlayerState(p => ({ ...p, metals: p.metals + amount }));
  }

  function debugGiveOpKit() {
    const opWeapon = {
      id: `op-kit-${Date.now()}`,
      kind: "weapon" as const,
      weaponKind: "sword" as const,
      damageType: "slash" as const,
      name: "★ DEBUG — THE OP KIT",
      damage: 1000000,
      effect: "stun" as const,
      level: 999,
    } as Weapon;
    setPlayerState(p => ({
      ...p,
      money: p.money + 9999999,
      metals: p.metals + 9999,
      hp: effectiveMaxHp(p),
      inventory: [...p.inventory, opWeapon],
      equipped: { ...p.equipped, weapon: opWeapon },
    }));
  }

  function debugMoveToTile(kind: TileKind) {
    const p    = playerRef.current;
    const cur  = p.position;
    const len  = BOARD.length;
    for (let offset = 1; offset <= len; offset++) {
      const idx = (cur + offset) % len;
      if (BOARD[idx].kind === kind) {
        setPlayerState((pl) => {
          let next: Player = { ...pl, position: idx };
          if (kind === "property") {
            if (next.propertyIncome[idx] === undefined) {
              next.propertyIncome = { ...next.propertyIncome, [idx]: 0 };
            }
            next.propertyLanded = { ...next.propertyLanded, [idx]: true };
          } else if (kind === "start") {
            next.hp          = effectiveMaxHp(next);
            next.money       = next.money + 25;
            next.bankBalance = next.bankBalance + 20 * next.lap;
          }
          return next;
        });
        if (kind === "shop") {
          setPendingTileAction({ type: "shop", items: genShopItems(p.bossKills, p.rebirthCount, playerNorraLevel(p)) });
        } else if (kind === "forge") {
          setPendingTileAction({ type: "forge" });
        } else if (kind === "pve") {
          const enemies = rollEncounter(p.bossKills);
          setPendingEncounter({ enemies, isBoss: false });
        } else if (kind === "elite") {
          const enemies = rollEncounter(p.bossKills, true);
          setPendingEncounter({ enemies, isBoss: false });
        } else if (kind === "boss") {
          const enemies = rollBoss(p.bossKills);
          setPendingEncounter({ enemies, isBoss: true });
        }
        break;
      }
    }
  }

  function debugStartFightSequence() {
    const p = playerRef.current;
    fightQueueRef.current = ["elite", "boss"];
    const enemies = rollEncounter(p.bossKills);
    setPendingEncounter({ enemies, isBoss: false });
  }

  function debugRebirth() {
    const cur = playerRef.current;
    const nextCount = cur.rebirthCount + 1;
    const fresh = newPlayer(nextCount);
    setPlayerState({ ...fresh });
    setJWC(null);
    setPendingCardUpgrades(0);
    setPendingTileAction(null);
  }

  return (
    <GameContext.Provider value={{
      player, jwc, hasPendingCombat, pendingTileAction,
      setPlayer,
      rollDice, triggerPendingCombat,
      jwcAttack, jwcUnqueueAtk, jwcDefend, jwcUnqueueDef,
      jwcReserve, jwcUnqueueReserve, jwcEndRound, jwcSelectTarget, jwcAttackEnemy, jwcUnqueueAtkForEnemy, closeJWC,
      closeTileAction, mergePartIntoWeapon, buyShopItem,
      equipItem, unequipSlot, meltItem, sellItem, sellParts, forgeItem,
      upgradeRoom, upgradeCard, applyCardUpgrade,
      collectBank, collectProperties,
      newRun, resetAll,
      effectiveMaxHp,
      recordDCCWin, getPendingCardUpgrades, pendingCardUpgrades,
      addCardToDeck, removeCardFromDeck,
      debugGiveMoney, debugGiveMetals, debugMoveToTile, debugRebirth, debugGiveOpKit, debugStartFightSequence,
      maxUpgradeCard,
      performRebirth,
      upgradeNpcLevel,
    }}>
      {children}
    </GameContext.Provider>
  );
}
