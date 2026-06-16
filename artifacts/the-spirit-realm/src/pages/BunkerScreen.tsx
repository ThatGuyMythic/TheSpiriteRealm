import React, { useState } from "react";
import { useGame, effectiveMaxHp } from "@/game/state";
import { C, PixelButton, StatChip, PTitle } from "@/components/PixelUI";
import { PixelPortrait } from "@/components/CardArt";
import { CHARACTER_SPRITES, ENEMY_SPRITES } from "@/assets/sprites";
import { GearDoll } from "@/components/CharacterDoll";

// ── Bestiary lore ───────────────────────────────────────────────────────────────
const ENEMY_LORE: Record<string, string> = {
  "Goblin":               "Weak but cunning. Travels in raiding packs.",
  "Slime":                "Dissolves armor on contact. Deceptively durable.",
  "Orc":                  "Brutal warrior. Slow to think, fast to hit.",
  "Goblin King":          "Rules by fear. Richer than he deserves.",
  "Frost Salamander":     "Breathes freezing mist. Cold-blooded killer.",
  "Snow Wolf":            "Pack hunter of the high passes.",
  "Yeti":                 "Ancient mountain beast. Fiercely territorial.",
  "The Great Dragon":     "A legend made real. Few survive its gaze.",
  "Skeleton":             "Risen bones with no mercy. Never tires.",
  "Skeleton Wolf":        "A dead wolf that refuses to stay down.",
  "Skeleton Knight":      "A warrior in death as in life.",
  "Firegaunt":            "A wraith of flame. Burns all it touches.",
  "Fire Lich":            "Undead sorcerer commanding fire and bone.",
  "Burning Snae":         "Serpent wreathed in ash and embers.",
  "Lava Golem":           "Solidified magma animated by dark will.",
  "Fire Demon":           "Servant of the deep flame pits.",
  "Swamp Slug":           "Trails acid. Surprisingly difficult to kill.",
  "Snake":                "Venomous and fast. Hides in the reeds.",
  "Troll":                "Slow regeneration. End it before it heals.",
  "Ancient Black Dragon": "The oldest evil lurking in the swamp.",
};

const ENEMY_ORDER = [
  "Goblin","Slime","Orc","Goblin King",
  "Frost Salamander","Snow Wolf","Yeti","The Great Dragon",
  "Skeleton","Skeleton Wolf","Skeleton Knight","Firegaunt",
  "Fire Lich","Burning Snae","Lava Golem","Fire Demon",
  "Swamp Slug","Snake","Troll","Ancient Black Dragon",
];

// ── Room icons ─────────────────────────────────────────────────────────────────
const ROOM_ICON: Record<string, string> = {
  blacksmith: "[FORGE]",
  shop:       "[SHOP]",
  medlab:     "[MEDIC]",
  storage:    "[STORE]",
};

const ROOM_COLORS: Record<string, string> = {
  blacksmith: C.cyan,
  shop:       C.yellow,
  medlab:     "#50D890",
  storage:    "#B090D0",
};

// ── NPC definitions ────────────────────────────────────────────────────────────
const NPC_INFO: Record<string, {
  color: string;
  title: string;
  room: string;
  dialogue: string[];
}> = {
  ornn: {
    color: C.cyan,
    title: "Master Smith",
    room: "blacksmith",
    dialogue: [
      "\"The forge never sleeps. Bring me monster parts and I'll craft you something worthy.\"",
      "\"Every weapon has a story. Let me add another chapter to yours.\"",
      "\"Metals, parts, patience. The trinity of a true smith.\"",
    ],
  },
  norra: {
    color: C.yellow,
    title: "Trade Network",
    room: "shop",
    dialogue: [
      "\"My portal network spans every Shop on the board. Better stock, better prices — everywhere.\"",
      "\"I've struck deals with every merchant in the realm. You'll notice the difference at the shops.\"",
      "\"Even in the spirit realm, connections are everything. And I have plenty of those.\"",
    ],
  },
  mundo: {
    color: "#50D890",
    title: "Field Surgeon",
    room: "medlab",
    dialogue: [
      "\"Mundo goes where he pleases. And he pleases to heal you.\"",
      "\"Medical lab is fully operational. Mundo knows what he's doing.\"",
      "\"Pain is temporary. Glory is forever. Mostly pain though.\"",
    ],
  },
  self: {
    color: C.green,
    title: "Spirit Walker",
    room: "",
    dialogue: [
      "\"The spirit realm holds many secrets. I walk its paths.\"",
    ],
  },
};

// ── Forge panel ────────────────────────────────────────────────────────────────
function ForgePanel() {
  const { player, forgeItem, mergePartIntoWeapon } = useGame();
  const [msg, setMsg] = useState("");
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1800); }

  function doForge(which: "weapon" | "armor") {
    const ok = forgeItem(which);
    flash(ok ? `Forged a new ${which}!` : player.metals < 3 ? "Need 3 metals." : "Gear bag full.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
        Spend 3 metals to forge new gear. Merge enemy parts into existing items at the Forge tile.
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <PixelButton
          onClick={() => doForge("weapon")} disabled={player.metals < 3}
          color={player.metals >= 3 ? C.cyan : C.bg3} textColor="#000" style={{ flex: 1 }}
        >
          FORGE WEAPON · 3M
        </PixelButton>
        <PixelButton
          onClick={() => doForge("armor")} disabled={player.metals < 3}
          color={player.metals >= 3 ? C.cyan : C.bg3} textColor="#000" style={{ flex: 1 }}
        >
          FORGE ARMOR · 3M
        </PixelButton>
      </div>
      {msg && <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{msg}</span>}
    </div>
  );
}

// ── Trading Post panel ─────────────────────────────────────────────────────────
function TradingPanel() {
  const { player, sellItem, meltItem } = useGame();
  const [msg, setMsg] = useState("");
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1800); }

  const invGear = player.inventory.filter(i => i.kind !== "part");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
        Sell or melt your spare gear here.
      </span>
      {invGear.length === 0 ? (
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>
          No gear in bag.
        </span>
      ) : (
        invGear.map(item => {
          const it = item as { id: string; name: string; kind: string; level: number };
          const sellVal = 20 + it.level * 15;
          const meltVal = 1 + Math.floor(it.level / 5);
          return (
            <div key={it.id} style={{
              backgroundColor: C.bg3, border: "2px solid #000",
              padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span className="pixel-text" style={{ color: it.kind === "weapon" ? C.yellow : C.cyan, fontSize: 13 }}>
                  {it.name}
                </span>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 10, display: "block" }}>
                  Lv {it.level}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <PixelButton small color={C.yellow} textColor="#000"
                  onClick={() => { sellItem(it.id); flash(`Sold for $${sellVal}.`); }}>
                  ${sellVal}
                </PixelButton>
                <PixelButton small color="#1A1200" textColor={C.textDim}
                  onClick={() => { meltItem(it.id); flash(`Melted → ${meltVal} metals.`); }}>
                  M{meltVal}
                </PixelButton>
              </div>
            </div>
          );
        })
      )}
      {msg && <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{msg}</span>}
    </div>
  );
}

// ── Medical Lab panel ──────────────────────────────────────────────────────────
function MedlabPanel() {
  const { player, setPlayer } = useGame();
  const [msg, setMsg] = useState("");
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1800); }

  const eMax = effectiveMaxHp(player);
  const healCost = Math.max(10, Math.floor((eMax - player.hp) * 0.8));
  const canHeal  = player.hp < eMax && player.money >= healCost;

  function doHeal() {
    if (!canHeal) return;
    setPlayer(p => ({
      ...p,
      hp: effectiveMaxHp(p),
      money: p.money - healCost,
    }));
    flash("Fully healed!");
  }

  function doSmallHeal() {
    const cost = 20;
    const heal = 25;
    if (player.money < cost) { flash("Need $20."); return; }
    setPlayer(p => ({
      ...p,
      hp: Math.min(effectiveMaxHp(p), p.hp + heal),
      money: p.money - cost,
    }));
    flash(`+${heal} HP restored.`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <StatChip label="HP" value={`${player.hp}/${eMax}`} color={player.hp / eMax > 0.5 ? C.green : C.redBright} />
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
          Medical services available
        </span>
      </div>
      <PixelButton
        onClick={doSmallHeal} disabled={player.money < 20}
        color={player.money >= 20 ? "#50D890" : C.bg3} textColor="#000"
      >
        PATCH UP · +25 HP · $20
      </PixelButton>
      <PixelButton
        onClick={doHeal} disabled={!canHeal}
        color={canHeal ? "#50D890" : C.bg3} textColor="#000"
      >
        FULL HEAL · ${canHeal ? healCost : "—"}
      </PixelButton>
      {msg && <span className="pixel-text" style={{ color: "#50D890", fontSize: 13 }}>{msg}</span>}
    </div>
  );
}

// ── Main BunkerScreen ──────────────────────────────────────────────────────────
export default function BunkerScreen() {
  const { player, upgradeRoom, upgradeNpcLevel } = useGame();
  const [msg, setMsg]           = useState("");
  const [npcMsg, setNpcMsg]     = useState("");
  const [activeNpc, setActiveNpc] = useState<string | null>(null);
  const [dialogueIdx, setDialogueIdx] = useState(0);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1800); }
  function flashNpc(m: string) { setNpcMsg(m); setTimeout(() => setNpcMsg(""), 2000); }

  function doUpgradeRoom(id: string) {
    const ok = upgradeRoom(id);
    const room = player.rooms.find(r => r.id === id);
    flash(ok ? `${room?.name} upgraded!` : `Need $${room?.costMoney} and ${room?.costMetals} metals.`);
  }

  function doUpgradeNpc(id: "ornn" | "norra") {
    const r = upgradeNpcLevel(id);
    flashNpc(r.msg);
  }

  function npcUpgradeCost(level: number) {
    const nextLv = level + 1;
    return { money: nextLv * 80, metals: nextLv };
  }

  const maxNpcLv = Math.min(20, Math.floor(player.bossKills / 5) * 5 + 5);

  function cycleDialogue(npcId: string) {
    const info = NPC_INFO[npcId];
    if (!info) return;
    if (activeNpc === npcId) {
      setDialogueIdx(i => (i + 1) % info.dialogue.length);
    } else {
      setActiveNpc(npcId);
      setDialogueIdx(0);
    }
  }

  const eMax = effectiveMaxHp(player);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", backgroundColor: "#0A0A18", borderBottom: "3px solid #000", flexShrink: 0 }}>
        <PTitle color="#9060D0">BUNKER</PTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <StatChip label="HP"     value={`${player.hp}/${eMax}`}   color={C.green} />
          <StatChip label="G"      value={`$${player.money}`}        color={C.yellow} />
          <StatChip label="M"       value={player.metals}             color={C.textDim} />
          <StatChip label="BOSS"   value={`×${player.bossKills}`}    color={C.yellow} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Characters row */}
        <div>
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 13, display: "block", marginBottom: 8, letterSpacing: 2 }}>
            RESIDENTS
          </span>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {player.characters.map(c => {
              const info     = NPC_INFO[c.id] ?? NPC_INFO["self"];
              const isActive = activeNpc === c.id;
              const imgSrc   = CHARACTER_SPRITES[c.id] ?? null;
              return (
                <div key={c.id}
                  onClick={() => c.unlocked && cycleDialogue(c.id)}
                  style={{
                    flexShrink: 0, width: 180,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    backgroundColor: isActive ? info.color + "18" : C.bg2,
                    border: `2px solid ${c.unlocked ? (isActive ? info.color : info.color + "44") : "#222"}`,
                    padding: "0 0 10px",
                    cursor: c.unlocked ? "pointer" : "default",
                    opacity: c.unlocked ? 1 : 0.45,
                    transition: "border-color 0.15s, background-color 0.15s",
                    overflow: "hidden",
                  }}
                >
                  {/* Portrait image — fills width, fixed height */}
                  <div style={{ width: "100%", height: 220, overflow: "hidden", backgroundColor: "#000", position: "relative" }}>
                    {c.id === "self" ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
                        {CHARACTER_SPRITES["inventory_player_model"] ? (
                          <img
                            src={CHARACTER_SPRITES["inventory_player_model"]}
                            alt="Player"
                            style={{
                              width: "100%", height: "100%",
                              objectFit: "contain",
                              objectPosition: "center",
                              imageRendering: "pixelated",
                            }}
                          />
                        ) : (
                          <GearDoll
                            w={110} h={165}
                            hasHelmet={false} hasChest={false} hasCloak={false} hasWeapon={false}
                          />
                        )}
                      </div>
                    ) : imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={c.name}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          objectPosition: "center top",
                          imageRendering: "pixelated",
                          mixBlendMode: "screen",
                        }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PixelPortrait name={c.id} size={160} isPlayer={c.id === "self"} />
                      </div>
                    )}
                    {!c.unlocked && (
                      <div style={{ position: "absolute", inset: 0, backgroundColor: "#000000AA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="pixel-text" style={{ color: "#555", fontSize: 18 }}>LOCKED</span>
                      </div>
                    )}
                  </div>
                  <span className="pixel-text" style={{ color: c.unlocked ? info.color : C.textDim, fontSize: 16, marginTop: 6 }}>
                    {c.name}
                  </span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                    {c.unlocked ? info.title : "[LOCKED]"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dialogue bubble */}
          {activeNpc && (() => {
            const c    = player.characters.find(c => c.id === activeNpc);
            const info = NPC_INFO[activeNpc];
            if (!c || !info) return null;
            return (
              <div style={{
                marginTop: 8,
                backgroundColor: info.color + "11", border: `2px solid ${info.color}44`,
                padding: "8px 12px", borderRadius: 2,
              }}>
                <span className="pixel-text" style={{ color: info.color, fontSize: 13, display: "block" }}>
                  {info.dialogue[dialogueIdx]}
                </span>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 10, marginTop: 4, display: "block" }}>
                  Tap again to hear more · Tap another to switch
                </span>
              </div>
            );
          })()}
        </div>

        {/* NPC Panels */}
        {npcMsg && (
          <div style={{ backgroundColor: "#001A00", border: `1px solid ${C.green}`, padding: "6px 10px" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{npcMsg}</span>
          </div>
        )}

        {(() => {
          const ornnUnlocked = player.characters.find(c => c.id === "ornn")?.unlocked;
          const blacksmithRoom = player.rooms.find(r => r.id === "blacksmith");
          if (!ornnUnlocked) {
            const canAffordUnlock = blacksmithRoom
              ? player.money >= blacksmithRoom.costMoney && player.metals >= blacksmithRoom.costMetals
              : false;
            return (
              <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.cyan}22` }}>
                <div style={{ padding: "6px 10px", backgroundColor: C.cyan + "08", borderBottom: `2px solid ${C.cyan}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="pixel-text" style={{ color: C.cyan + "88", fontSize: 15 }}>[FORGE] ORNN'S FORGE</span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>LOCKED</span>
                </div>
                <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                    Upgrade the Blacksmith room to unlock Ornn and his 20-level forge.
                  </span>
                  {blacksmithRoom && (
                    <PixelButton
                      small
                      onClick={() => doUpgradeRoom("blacksmith")}
                      disabled={!canAffordUnlock}
                      color={canAffordUnlock ? C.cyan : C.bg3}
                      textColor={canAffordUnlock ? "#000" : "#555"}
                    >
                      {canAffordUnlock
                        ? `UNLOCK · $${blacksmithRoom.costMoney} · ${blacksmithRoom.costMetals}M`
                        : `NEED $${blacksmithRoom.costMoney} · ${blacksmithRoom.costMetals}M`}
                    </PixelButton>
                  )}
                </div>
              </div>
            );
          }
          const lv = player.ornnLevel ?? 1;
          const atCap = lv >= maxNpcLv;
          const atMax = lv >= 20;
          const cost = npcUpgradeCost(lv);
          const canAfford = player.money >= cost.money && player.metals >= cost.metals;
          const ornnDiscount = Math.min(30, 5 + lv * 1.5);
          return (
            <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.cyan}33` }}>
              <div style={{
                padding: "6px 10px", backgroundColor: C.cyan + "11",
                borderBottom: `2px solid ${C.cyan}33`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span className="pixel-text" style={{ color: C.cyan, fontSize: 15 }}>[FORGE] ORNN'S FORGE</span>
                <span className="pixel-text" style={{ color: C.cyan, fontSize: 13 }}>Lv {lv}/20</span>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 6,
                      backgroundColor: i < lv ? C.cyan : i < maxNpcLv ? C.cyan + "33" : "#222",
                      border: `1px solid ${i < lv ? C.cyan : "#333"}`,
                    }} />
                  ))}
                </div>
                <div style={{ backgroundColor: C.cyan + "11", border: `1px solid ${C.cyan}33`, padding: "4px 8px" }}>
                  <span className="pixel-text" style={{ color: C.cyan, fontSize: 11 }}>
                    Forge quality +{lv} · item level bonus per boss kill
                  </span>
                </div>
                {!atMax && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <PixelButton
                      small
                      onClick={() => doUpgradeNpc("ornn")}
                      disabled={atCap || !canAfford}
                      color={!atCap && canAfford ? C.cyan : C.bg3}
                      textColor={!atCap && canAfford ? "#000" : "#555"}
                    >
                      {atCap ? `BIOME CAP (${lv}/${maxNpcLv})` : `LV UP · $${cost.money} · ${cost.metals}M`}
                    </PixelButton>
                    {atCap && !atMax && (
                      <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                        Beat 5 more bosses to unlock next level
                      </span>
                    )}
                  </div>
                )}
                {atMax && (
                  <span className="pixel-text" style={{ color: C.cyan, fontSize: 11 }}>★ MAX LEVEL — Master Smith at full power</span>
                )}
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                  Ornn discount: {Math.round(ornnDiscount)}%
                </span>
              </div>
            </div>
          );
        })()}

        {(() => {
          const norraUnlocked = player.characters.find(c => c.id === "norra")?.unlocked;
          const shopRoom = player.rooms.find(r => r.id === "shop");
          if (!norraUnlocked) {
            const canAffordUnlock = shopRoom
              ? player.money >= shopRoom.costMoney && player.metals >= shopRoom.costMetals
              : false;
            return (
              <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.yellow}22` }}>
                <div style={{ padding: "6px 10px", backgroundColor: C.yellow + "08", borderBottom: `2px solid ${C.yellow}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="pixel-text" style={{ color: C.yellow + "88", fontSize: 15 }}>NORRA'S TRADE NETWORK</span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>LOCKED</span>
                </div>
                <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                    Upgrade the Shop room to unlock Norra and her 20-level trade network.
                  </span>
                  {shopRoom && (
                    <PixelButton
                      small
                      onClick={() => doUpgradeRoom("shop")}
                      disabled={!canAffordUnlock}
                      color={canAffordUnlock ? C.yellow : C.bg3}
                      textColor={canAffordUnlock ? "#000" : "#555"}
                    >
                      {canAffordUnlock
                        ? `UNLOCK · $${shopRoom.costMoney} · ${shopRoom.costMetals}M`
                        : `NEED $${shopRoom.costMoney} · ${shopRoom.costMetals}M`}
                    </PixelButton>
                  )}
                </div>
              </div>
            );
          }
          const lv = player.norraLevel ?? 1;
          const atCap = lv >= maxNpcLv;
          const atMax = lv >= 20;
          const cost = npcUpgradeCost(lv);
          const canAfford = player.money >= cost.money && player.metals >= cost.metals;
          const discountPct = Math.min(30, 5 + lv * 1.5);
          const extraItems = lv >= 10 ? 2 : 1;
          return (
            <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.yellow}33` }}>
              <div style={{
                padding: "6px 10px", backgroundColor: C.yellow + "11",
                borderBottom: `2px solid ${C.yellow}33`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 15 }}>NORRA'S TRADE NETWORK</span>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 13 }}>Lv {lv}/20</span>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 6,
                      backgroundColor: i < lv ? C.yellow : i < maxNpcLv ? C.yellow + "33" : "#222",
                      border: `1px solid ${i < lv ? C.yellow : "#333"}`,
                    }} />
                  ))}
                </div>
                <div style={{ backgroundColor: C.yellow + "11", border: `1px solid ${C.yellow}33`, padding: "4px 8px" }}>
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>
                    Board shops: +{extraItems} extra item{extraItems > 1 ? "s" : ""} · {Math.round(discountPct)}% off all gear
                  </span>
                </div>
                {!atMax && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <PixelButton
                      small
                      onClick={() => doUpgradeNpc("norra")}
                      disabled={atCap || !canAfford}
                      color={!atCap && canAfford ? C.yellow : C.bg3}
                      textColor={!atCap && canAfford ? "#000" : "#555"}
                    >
                      {atCap ? `BIOME CAP (${lv}/${maxNpcLv})` : `LV UP · $${cost.money} · ${cost.metals}M`}
                    </PixelButton>
                    {atCap && !atMax && (
                      <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                        Beat 5 more bosses to unlock next level
                      </span>
                    )}
                  </div>
                )}
                {atMax && (
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>★ MAX LEVEL — Trade network at full capacity</span>
                )}
              </div>
            </div>
          );
        })()}

        {player.characters.find(c => c.id === "mundo")?.unlocked && (
          <div style={{ backgroundColor: C.bg2, border: `2px solid #50D89033` }}>
            <div style={{
              padding: "6px 10px", backgroundColor: "#50D89011",
              borderBottom: "2px solid #50D89033",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="pixel-text" style={{ color: "#50D890", fontSize: 15 }}>DR. MUNDO'S MEDICAL LAB</span>
            </div>
            <div style={{ padding: "0 10px 8px" }}>
              <MedlabPanel />
            </div>
          </div>
        )}

        {/* Rooms — upgrade section (medlab & storage only; forge/shop handled by Ornn/Norra panels above) */}
        <div>
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>
            ROOM UPGRADES
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {player.rooms.filter(r => r.id !== "blacksmith" && r.id !== "shop").map(room => {
              const col     = ROOM_COLORS[room.id] ?? C.textDim;
              const icon    = ROOM_ICON[room.id] ?? "[?]";
              const canAfford = player.money >= room.costMoney && player.metals >= room.costMetals;
              const unlockNote = room.id === "blacksmith" ? "→ unlocks Ornn"
                               : room.id === "shop"       ? "→ unlocks Norra (buffs board shops)"
                               : room.id === "medlab"     ? "→ unlocks Dr. Mundo"
                               : "";
              return (
                <div key={room.id} style={{
                  backgroundColor: C.bg3, border: `2px solid ${col}33`,
                  padding: "8px 10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{
                      width: 40, height: 40, backgroundColor: col + "22",
                      border: `2px solid ${col}44`, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="pixel-text" style={{ color: col, fontSize: 8, textAlign: "center", lineHeight: 1.3 }}>{icon}</span>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="pixel-text" style={{ color: col, fontSize: 15 }}>{room.name}</span>
                        <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                          Lv{room.level}
                        </span>
                      </div>
                      <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block" }}>
                        {room.benefit}
                        {unlockNote && (
                          <span style={{ color: col, marginLeft: 4 }}>{unlockNote}</span>
                        )}
                      </span>
                      <span className="pixel-text" style={{ color: canAfford ? col : "#444", fontSize: 10 }}>
                        Upgrade: ${room.costMoney} · {room.costMetals}M
                      </span>
                    </div>
                  </div>
                  <PixelButton
                    small
                    onClick={() => doUpgradeRoom(room.id)}
                    disabled={!canAfford}
                    color={canAfford ? col : C.bg3}
                    textColor="#000"
                  >
                    ↑ LVL
                  </PixelButton>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CODEX / Bestiary ────────────────────────────────────────────────── */}
        <BestiarySection bestiary={player.bestiary} />

        {msg && (
          <div style={{ backgroundColor: "#001A00", border: `1px solid ${C.green}`, padding: "4px 10px" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bestiary section ────────────────────────────────────────────────────────────
function BestiarySection({ bestiary }: { bestiary: Record<string, { seen: number; killed: number; maxHp: number }> }) {
  const [open, setOpen] = useState(false);
  const encountered = ENEMY_ORDER.filter(n => bestiary[n]);
  const total = ENEMY_ORDER.length;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none",
          border: `2px solid #6040A044`,
          padding: "6px 10px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span className="pixel-text" style={{ color: "#A080D0", fontSize: 14, letterSpacing: 2 }}>
          CODEX
        </span>
        <span className="pixel-text" style={{ color: "#705090", fontSize: 11 }}>
          {encountered.length}/{total} discovered {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
          {ENEMY_ORDER.map(name => {
            const entry = bestiary[name];
            const imgSrc = ENEMY_SPRITES[name] ?? null;
            const seen = entry?.seen ?? 0;
            const killed = entry?.killed ?? 0;
            const maxHp = entry?.maxHp ?? 0;
            const discovered = !!entry;
            return (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 8,
                backgroundColor: discovered ? "#0A0814" : "#080808",
                border: `1px solid ${discovered ? "#4A2A7044" : "#1A1A1A"}`,
                padding: "5px 8px",
                opacity: discovered ? 1 : 0.35,
              }}>
                {/* Sprite thumbnail */}
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "#050508",
                  border: `1px solid ${discovered ? "#6040A044" : "#111"}`,
                  overflow: "hidden",
                }}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={name} style={{
                      width: "100%", height: "100%",
                      objectFit: "contain", imageRendering: "pixelated",
                      filter: discovered ? "none" : "brightness(0)",
                    }} />
                  ) : (
                    <PixelPortrait name={name} size={38} />
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="pixel-text" style={{
                    color: discovered ? "#C090FF" : "#333",
                    fontSize: 13, display: "block", lineHeight: 1.1,
                  }}>
                    {discovered ? name : "???"}
                  </span>
                  {discovered ? (
                    <>
                      <span className="pixel-text" style={{ color: "#706050", fontSize: 9, display: "block", marginTop: 1 }}>
                        {ENEMY_LORE[name] ?? "Unknown creature."}
                      </span>
                      <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                        <span className="pixel-text" style={{ color: "#CC4444", fontSize: 10 }}>HP: {maxHp}</span>
                        <span className="pixel-text" style={{ color: "#44AA44", fontSize: 10 }}>Kills: {killed}</span>
                        <span className="pixel-text" style={{ color: "#9060D0", fontSize: 10 }}>Seen: {seen}</span>
                      </div>
                    </>
                  ) : (
                    <span className="pixel-text" style={{ color: "#222", fontSize: 9 }}>Not yet encountered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
