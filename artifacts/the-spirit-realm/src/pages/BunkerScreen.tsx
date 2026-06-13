import React, { useState } from "react";
import { useGame, effectiveMaxHp } from "@/game/state";
import { C, PixelButton, StatChip, PTitle } from "@/components/PixelUI";
import { PixelPortrait } from "@/components/CardArt";

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
  const { player, upgradeRoom } = useGame();
  const [msg, setMsg]           = useState("");
  const [activeNpc, setActiveNpc] = useState<string | null>(null);
  const [dialogueIdx, setDialogueIdx] = useState(0);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1800); }

  function doUpgradeRoom(id: string) {
    const ok = upgradeRoom(id);
    const room = player.rooms.find(r => r.id === id);
    flash(ok ? `${room?.name} upgraded!` : `Need $${room?.costMoney} and ${room?.costMetals} metals.`);
  }

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
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>
            RESIDENTS
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {player.characters.map(c => {
              const info     = NPC_INFO[c.id] ?? NPC_INFO["self"];
              const isActive = activeNpc === c.id;
              return (
                <div key={c.id}
                  onClick={() => c.unlocked && cycleDialogue(c.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    backgroundColor: isActive ? info.color + "22" : C.bg2,
                    border: `2px solid ${c.unlocked ? (isActive ? info.color : info.color + "55") : "#222"}`,
                    padding: "8px 10px", cursor: c.unlocked ? "pointer" : "default",
                    opacity: c.unlocked ? 1 : 0.45, minWidth: 60, flex: "0 0 auto",
                    transition: "border-color 0.15s, background-color 0.15s",
                  }}
                >
                  <PixelPortrait name={c.id} size={44} isPlayer={c.id === "self"} />
                  <span className="pixel-text" style={{ color: c.unlocked ? info.color : C.textDim, fontSize: 11 }}>
                    {c.name}
                  </span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 9 }}>
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
        {player.characters.find(c => c.id === "ornn")?.unlocked && (
          <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.cyan}33` }}>
            <div style={{
              padding: "6px 10px", backgroundColor: C.cyan + "11",
              borderBottom: `2px solid ${C.cyan}33`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="pixel-text" style={{ color: C.cyan, fontSize: 15 }}>[FORGE] ORNN'S FORGE</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <span className="pixel-text" style={{ color: C.cyan, fontSize: 14, display: "block" }}>
                    Board Forge Upgraded
                  </span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block", marginTop: 2 }}>
                    Ornn's mastery flows into every Forge tile on the board.
                    Visit a Forge tile to craft weapons and armor, or merge monster parts into your gear.
                  </span>
                </div>
              </div>
              <div style={{ backgroundColor: C.cyan + "11", border: `1px solid ${C.cyan}33`, padding: "4px 8px" }}>
                <span className="pixel-text" style={{ color: C.cyan, fontSize: 11 }}>
                  Board forges: +1 item quality · parts merge at bonus tier
                </span>
              </div>
            </div>
          </div>
        )}

        {player.characters.find(c => c.id === "norra")?.unlocked && (
          <div style={{ backgroundColor: C.bg2, border: `2px solid ${C.yellow}33` }}>
            <div style={{
              padding: "6px 10px", backgroundColor: C.yellow + "11",
              borderBottom: `2px solid ${C.yellow}33`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 15 }}>NORRA'S TRADE NETWORK</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 14, display: "block" }}>
                    Board shops are upgraded
                  </span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block", marginTop: 2 }}>
                    Norra's portal network extends to every Shop tile on the board.
                    All board shops stock one extra item and offer a 10% discount on gear.
                  </span>
                </div>
              </div>
              <div style={{ backgroundColor: C.yellow + "11", border: `1px solid ${C.yellow}33`, padding: "4px 8px" }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>
                  Board shops: +1 extra item · 10% off all gear
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* Rooms — upgrade section */}
        <div>
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>
            ROOM UPGRADES
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {player.rooms.map(room => {
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

        {msg && (
          <div style={{ backgroundColor: "#001A00", border: `1px solid ${C.green}`, padding: "4px 10px" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
