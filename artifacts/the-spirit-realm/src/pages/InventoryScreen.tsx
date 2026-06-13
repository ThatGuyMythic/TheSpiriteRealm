import React, { useState } from "react";
import { useGame, effectiveMaxHp } from "@/game/state";
import { C, PixelButton, StatChip, PTitle } from "@/components/PixelUI";
import CharacterDoll from "@/components/CharacterDoll";
import { type Weapon, type Armor, type EnemyPart } from "@/game/data";

function effectLabel(effect: Weapon["effect"]): string {
  if (effect === "ice")  return "ICE";
  if (effect === "stun") return "STUN";
  return "";
}

function effectIcon(effect: string | null | undefined): string {
  if (effect === "ice")  return "❄";
  if (effect === "stun") return "⚡";
  return "";
}

const WEAPON_LABEL: Record<string, string> = {
  sword: "SWD", spear: "SPR", club: "CLB", fists: "FST",
};

function WeaponPixel({ kind, sz, col }: { kind: string; sz: number; col: string }) {
  const label = WEAPON_LABEL[kind] ?? "WPN";
  return (
    <svg width={sz - 6} height={sz - 14} viewBox="0 0 18 22" style={{ display:"block" }}>
      {kind === "sword" && <>
        <rect x="8" y="0" width="2" height="16" fill={col} />
        <rect x="5" y="6"  width="8" height="2" fill={col} />
        <rect x="7" y="16" width="4" height="4" fill={col + "88"} />
      </>}
      {kind === "spear" && <>
        <rect x="8" y="0" width="2" height="5"  fill={col} />
        <rect x="6" y="2" width="6" height="3"  fill={col} />
        <rect x="8" y="5" width="2" height="15" fill={col + "88"} />
      </>}
      {kind === "club" && <>
        <rect x="7" y="0" width="4" height="8"  fill={col} />
        <rect x="5" y="0" width="8" height="4"  fill={col} />
        <rect x="8" y="8" width="2" height="14" fill={col + "88"} />
      </>}
      {(kind === "fists" || !["sword","spear","club"].includes(kind)) && <>
        <rect x="5" y="4" width="8" height="6" fill={col} />
        <rect x="4" y="6" width="10" height="4" fill={col} />
        <rect x="6" y="10" width="6" height="4" fill={col + "88"} />
      </>}
    </svg>
  );
}

function WeaponIcon({ weapon, small }: { weapon: Weapon; small?: boolean }) {
  const sz  = small ? 32 : 44;
  const col = weapon.damageType === "slash" ? C.yellow : weapon.damageType === "pierce" ? C.cyan : "#D0A060";
  return (
    <div style={{
      width: sz, height: sz, flexShrink: 0,
      backgroundColor: "#0A0A0A", border: `2px solid ${col}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", gap: 2,
    }}>
      <WeaponPixel kind={weapon.weaponKind} sz={sz} col={col} />
      {weapon.effect && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          backgroundColor: weapon.effect === "ice" ? "#003366" : "#332200",
          border: `1px solid ${weapon.effect === "ice" ? C.cyan : C.yellow}`,
          padding: "0 2px",
        }}>
          <span className="pixel-text" style={{ fontSize: 6, color: weapon.effect === "ice" ? C.cyan : C.yellow, lineHeight: 1 }}>
            {effectLabel(weapon.effect)}
          </span>
        </div>
      )}
      <span className="pixel-text" style={{ fontSize: 7, color: col, lineHeight: 1 }}>Lv{weapon.level}</span>
    </div>
  );
}

function ArmorIcon({ armor, small }: { armor: Armor; small?: boolean }) {
  const sz  = small ? 32 : 44;
  const col = C.cyan;
  const slotLabel = armor.slot === "helmet" ? "HLM" : armor.slot === "chest" ? "CST" : "CLK";
  const cell = Math.floor((sz - 14) / 4);
  return (
    <div style={{
      width: sz, height: sz, flexShrink: 0,
      backgroundColor: "#0A0A0A", border: `2px solid ${col}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <svg width={cell*4} height={cell*4} viewBox="0 0 4 4" style={{ imageRendering:"pixelated" }}>
        {armor.slot === "helmet" && <>
          <rect x="1" y="0" width="2" height="1" fill={col} />
          <rect x="0" y="1" width="4" height="2" fill={col} />
          <rect x="1" y="3" width="2" height="1" fill={col + "88"} />
        </>}
        {armor.slot === "chest" && <>
          <rect x="0" y="0" width="4" height="1" fill={col} />
          <rect x="0" y="1" width="4" height="3" fill={col} />
          <rect x="1" y="1" width="2" height="1" fill={col + "44"} />
        </>}
        {armor.slot === "cloak" && <>
          <rect x="1" y="0" width="2" height="4" fill={col} />
          <rect x="0" y="1" width="4" height="2" fill={col} />
          <rect x="0" y="3" width="4" height="1" fill={col + "44"} />
        </>}
      </svg>
      <span className="pixel-text" style={{ fontSize: 7, color: col, lineHeight: 1 }}>Lv{armor.level}</span>
    </div>
  );
}

function PartIcon({ part, small }: { part: EnemyPart; small?: boolean }) {
  const sz = small ? 32 : 44;
  const cell = Math.floor((sz - 14) / 4);
  return (
    <div style={{
      width: sz, height: sz, flexShrink: 0,
      backgroundColor: "#0A0A0A", border: `2px solid ${C.textDim}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <svg width={cell*4} height={cell*4} viewBox="0 0 4 4" style={{ imageRendering:"pixelated" }}>
        <rect x="1" y="0" width="2" height="1" fill={C.textDim} />
        <rect x="0" y="1" width="1" height="2" fill={C.textDim} />
        <rect x="3" y="1" width="1" height="2" fill={C.textDim} />
        <rect x="1" y="2" width="2" height="1" fill={C.textDim} />
        <rect x="1" y="1" width="2" height="1" fill={C.textDim + "66"} />
      </svg>
      <span className="pixel-text" style={{ fontSize: 7, color: C.textDim, lineHeight: 1 }}>
        Lv{part.level}
      </span>
    </div>
  );
}

function WeaponRow({ w, equipped, onEquip, onUnequip, onMelt, onSell }: {
  w: Weapon; equipped: boolean;
  onEquip: () => void; onUnequip: () => void;
  onMelt: () => void; onSell: () => void;
}) {
  return (
    <div
      onClick={equipped ? onUnequip : onEquip}
      style={{
        display: "flex", gap: 8, alignItems: "center",
        backgroundColor: equipped ? "#0A1A0A" : C.bg3,
        border: `2px solid ${equipped ? C.green : "#000"}`,
        padding: "6px 8px", cursor: "pointer",
      }}
    >
      <WeaponIcon weapon={w} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span className="pixel-text" style={{ color: C.yellow, fontSize: 14 }}>{equipped ? "★ " : ""}{w.name}</span>
          {equipped
            ? <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>✦ EQUIPPED · tap to unequip</span>
            : <span className="pixel-text" style={{ color: C.textDim, fontSize: 9 }}>tap to equip</span>
          }
        </div>
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
          [{w.weaponKind.toUpperCase()}] {w.damage}dmg · {w.damageType} · Lv{w.level}
          {w.effect ? ` · [${effectLabel(w.effect)}] ${w.effect}` : ""}
        </span>
      </div>
      {!equipped && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }} onClick={e => e.stopPropagation()}>
          <PixelButton small color="#1A0A00" textColor={C.textDim} onClick={onMelt}>MELT</PixelButton>
          <PixelButton small color="#0A0A00" textColor={C.textDim} onClick={onSell}>SELL</PixelButton>
        </div>
      )}
    </div>
  );
}

function ArmorRow({ a, slot, equipped, onEquip, onUnequip, onMelt, onSell }: {
  a: Armor; slot: string; equipped: boolean;
  onEquip: () => void; onUnequip: () => void;
  onMelt: () => void; onSell: () => void;
}) {
  void slot;
  return (
    <div
      onClick={equipped ? onUnequip : onEquip}
      style={{
        display: "flex", gap: 8, alignItems: "center",
        backgroundColor: equipped ? "#0A1A1A" : C.bg3,
        border: `2px solid ${equipped ? C.cyan : "#000"}`,
        padding: "6px 8px", cursor: "pointer",
      }}
    >
      <ArmorIcon armor={a} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span className="pixel-text" style={{ color: C.cyan, fontSize: 14 }}>{equipped ? "★ " : ""}{a.name}</span>
          {equipped
            ? <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>✦ EQUIPPED · tap to unequip</span>
            : <span className="pixel-text" style={{ color: C.textDim, fontSize: 9 }}>tap to equip</span>
          }
        </div>
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
          [{a.slot}] bl:{a.bluntDef} pi:{a.pierceDef} sl:{a.slashDef}{a.bonusHP > 0 ? ` +${a.bonusHP}HP` : ""} · Lv{a.level}
        </span>
      </div>
      {!equipped && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }} onClick={e => e.stopPropagation()}>
          <PixelButton small color="#001A1A" textColor={C.textDim} onClick={onMelt}>MELT</PixelButton>
          <PixelButton small color="#001010" textColor={C.textDim} onClick={onSell}>SELL</PixelButton>
        </div>
      )}
    </div>
  );
}

export default function InventoryScreen() {
  const { player, equipItem, unequipSlot, meltItem, sellItem } = useGame();
  const [tab, setTab] = useState<"equipped" | "bag" | "parts">("equipped");
  const [msg, setMsg] = useState("");

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1600); }

  const eq     = player.equipped;
  const eMax   = effectiveMaxHp(player);
  const invGear   = player.inventory.filter(i => i.kind !== "part") as (Weapon | Armor)[];
  const invParts  = player.inventory.filter(i => i.kind === "part") as EnemyPart[];

  const slots = [
    { id: "weapon",  label: "WEAPON",  item: eq.weapon  },
    { id: "helmet",  label: "HELMET",  item: eq.helmet  },
    { id: "chest",   label: "CHEST",   item: eq.chest   },
    { id: "cloak",   label: "CLOAK",   item: eq.cloak   },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", backgroundColor: "#0A0A14", borderBottom: "3px solid #000", flexShrink: 0 }}>
        <PTitle color={C.yellow}>INVENTORY</PTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <StatChip label="HP"  value={`${player.hp}/${eMax}`} color={C.green} />
          <StatChip label="G"   value={`$${player.money}`}      color={C.yellow} />
          <StatChip label="M"    value={player.metals}           color={C.textDim} />
          <StatChip label="BAG" value={`${invGear.length}/${5 + ((player.rooms.find(r => r.id === "storage")?.level ?? 1) - 1) * 2}`} color={C.textDim} />
        </div>
      </div>

      {/* Character doll + stats */}
      <div style={{
        padding: "8px 12px", backgroundColor: "#0A0A10",
        borderBottom: "2px solid #000", flexShrink: 0,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <CharacterDoll equipped={eq} size="lg" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {slots.map(s => {
              const item = s.item;
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  backgroundColor: item ? "#0A1A0A" : C.bg3,
                  border: `1px solid ${item ? C.green : "#222"}`,
                  padding: "2px 6px",
                }}>
                  {item
                    ? item.kind === "weapon"
                      ? <WeaponIcon weapon={item as Weapon} small />
                      : <ArmorIcon armor={item as Armor} small />
                    : <span style={{ fontSize: 20 }}>·</span>
                  }
                  <div>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 9, display: "block" }}>{s.label}</span>
                    <span className="pixel-text" style={{ color: item ? C.text : C.textDim, fontSize: 11 }}>
                      {item ? (item as Weapon | Armor).name : "—"}
                    </span>
                    {item && item.kind === "weapon" && (
                      <span className="pixel-text" style={{ color: C.yellow, fontSize: 10, display: "block" }}>
                        {(item as Weapon).damage}dmg · {(item as Weapon).damageType}{(item as Weapon).effect ? ` [${(item as Weapon).effect!.toUpperCase()}]` : ""}
                      </span>
                    )}
                    {item && item.kind === "armor" && (
                      <span className="pixel-text" style={{ color: C.cyan, fontSize: 10, display: "block" }}>
                        bl:{(item as Armor).bluntDef} pi:{(item as Armor).pierceDef} sl:{(item as Armor).slashDef}
                        {(item as Armor).bonusHP > 0 ? ` +${(item as Armor).bonusHP}hp` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", flexShrink: 0 }}>
        {(["equipped", "bag", "parts"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "6px 0",
            backgroundColor: tab === t ? C.bg2 : C.bg3,
            border: "none", borderBottom: tab === t ? `2px solid ${C.yellow}` : "2px solid transparent",
            color: tab === t ? C.yellow : C.textDim,
            fontFamily: "'VT323', monospace", fontSize: 14, cursor: "pointer",
          }}>
            {t === "equipped" ? "EQUIPPED" : t === "bag" ? "BAG" : "DROPS"}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: "4px 12px", backgroundColor: "#001A00", borderBottom: "1px solid #0A3A0A" }}>
          <span className="pixel-text" style={{ color: C.green, fontSize: 12 }}>{msg}</span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {tab === "equipped" && (
          <>
            {slots.map(s => {
              const item = s.item;
              if (!item) return (
                <div key={s.id} style={{
                  backgroundColor: C.bg3, border: "2px solid #111",
                  padding: "8px 10px",
                }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>
                    [{s.label}] — empty
                  </span>
                </div>
              );
              if (item.kind === "weapon") return (
                <WeaponRow key={s.id} w={item as Weapon} equipped
                  onEquip={() => {}}
                  onUnequip={() => { unequipSlot(s.id as "weapon"); flash("Unequipped."); }}
                  onMelt={() => {}}
                  onSell={() => {}}
                />
              );
              return (
                <ArmorRow key={s.id} a={item as Armor} slot={s.id} equipped
                  onEquip={() => {}}
                  onUnequip={() => { unequipSlot(s.id as "helmet" | "chest" | "cloak"); flash("Unequipped."); }}
                  onMelt={() => {}}
                  onSell={() => {}}
                />
              );
            })}
            {slots.every(s => !s.item) && (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 14 }}>
                Nothing equipped. Find gear from enemies, shops, or the forge.
              </span>
            )}
          </>
        )}

        {tab === "bag" && (
          <>
            {invGear.length === 0 ? (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 14 }}>
                Gear bag empty. Win battles and visit shops.
              </span>
            ) : (
              invGear.map(item => {
                if (item.kind === "weapon") return (
                  <WeaponRow key={item.id} w={item as Weapon} equipped={false}
                    onEquip={() => { equipItem(item.id); flash(`Equipped ${item.name}.`); }}
                    onUnequip={() => {}}
                    onMelt={() => { meltItem(item.id); flash(`Melted into metals.`); }}
                    onSell={() => { sellItem(item.id); flash(`Sold ${item.name}.`); }}
                  />
                );
                return (
                  <ArmorRow key={item.id} a={item as Armor} slot={(item as Armor).slot} equipped={false}
                    onEquip={() => { equipItem(item.id); flash(`Equipped ${item.name}.`); }}
                    onUnequip={() => {}}
                    onMelt={() => { meltItem(item.id); flash(`Melted into metals.`); }}
                    onSell={() => { sellItem(item.id); flash(`Sold ${item.name}.`); }}
                  />
                );
              })
            )}
          </>
        )}

        {tab === "parts" && (
          <>
            {invParts.length === 0 ? (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 14 }}>
                No enemy drops yet. Defeat enemies — 60% chance to drop a part. Use the Forge to merge drops into gear.
              </span>
            ) : (
              (() => {
                const grouped: Map<string, typeof invParts> = new Map();
                for (const p of invParts) {
                  const list = grouped.get(p.name) ?? [];
                  list.push(p);
                  grouped.set(p.name, list);
                }
                return Array.from(grouped.entries()).map(([name, parts]) => {
                  const p = parts[0];
                  const count = parts.length;
                  return (
                    <div key={name} style={{
                      display: "flex", gap: 8, alignItems: "center",
                      backgroundColor: C.bg3, border: "2px solid #222",
                      padding: "6px 8px",
                    }}>
                      <PartIcon part={p} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="pixel-text" style={{ color: C.text, fontSize: 14 }}>
                            {p.name}
                          </span>
                          {count > 1 && (
                            <span style={{
                              backgroundColor: "#1A1A2A", border: "1px solid #444",
                              padding: "0 5px",
                            }}>
                              <span className="pixel-text" style={{ color: C.cyan, fontSize: 12 }}>×{count}</span>
                            </span>
                          )}
                        </div>
                        <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                          {p.buff?.label ?? "+2 dmg"}
                          {p.buff?.addEffect
                            ? ` · ${effectIcon(p.buff.addEffect)} ${p.buff.addEffect}`
                            : ""}
                        </span>
                        <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                          Merge at Forge tile or Bunker
                        </span>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </>
        )}
      </div>
    </div>
  );
}
