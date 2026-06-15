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
  void WEAPON_LABEL;
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

function StatDiff({ label, current, equipped }: { label: string; current: number; equipped: number }) {
  const diff = current - equipped;
  const col = diff > 0 ? C.green : diff < 0 ? C.redBright : C.textDim;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, minWidth: 70 }}>{label}</span>
      <span className="pixel-text" style={{ color: col, fontSize: 13 }}>
        {current}
        {diff !== 0 && (
          <span style={{ fontSize: 11, marginLeft: 4 }}>
            ({diff > 0 ? "+" : ""}{diff})
          </span>
        )}
      </span>
    </div>
  );
}

function InspectPopup({ item, equipped, onEquip, onMelt, onSell, onClose }: {
  item: Weapon | Armor;
  equipped: ReturnType<typeof useGame>["player"]["equipped"];
  onEquip: () => void;
  onMelt: () => void;
  onSell: () => void;
  onClose: () => void;
}) {
  const equippedInSlot =
    item.kind === "weapon"
      ? equipped.weapon
      : equipped[item.slot as "helmet" | "chest" | "cloak"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#0A0A18", border: `2px solid ${C.accent}`,
        padding: 0, maxWidth: 360, width: "100%",
        display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#0E0E22",
          borderBottom: `1px solid ${C.accent}44`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span className="pixel-text" style={{ color: C.accent, fontSize: 15 }}>
            {item.kind === "weapon" ? "⚔ WEAPON" : "🛡 ARMOR"} · Lv{item.level}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.textDim, cursor: "pointer",
            fontFamily: "'VT323', monospace", fontSize: 18,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Item name */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {item.kind === "weapon"
              ? <WeaponIcon weapon={item as Weapon} />
              : <ArmorIcon armor={item as Armor} />
            }
            <div>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 16 }}>
                {item.name}
              </span>
              {item.kind === "weapon" && (
                <div className="pixel-text" style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>
                  {(item as Weapon).weaponKind.toUpperCase()} · {(item as Weapon).damageType}
                  {(item as Weapon).effect ? ` · ${effectIcon((item as Weapon).effect)} ${(item as Weapon).effect!.toUpperCase()}` : ""}
                </div>
              )}
              {item.kind === "armor" && (
                <div className="pixel-text" style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>
                  {(item as Armor).slot.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Stats comparison */}
          <div style={{ backgroundColor: "#080818", border: "1px solid #222", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>STAT</span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                {equippedInSlot ? "vs EQUIPPED" : "NO EQUIPPED"}
              </span>
            </div>

            {item.kind === "weapon" && (() => {
              const w = item as Weapon;
              const eq = equippedInSlot as Weapon | null;
              return <>
                <StatDiff label="Damage" current={w.damage} equipped={eq?.damage ?? 0} />
                <StatDiff label="Level" current={w.level} equipped={eq?.level ?? 0} />
                {w.effect && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, minWidth: 70 }}>Effect</span>
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>
                      {effectIcon(w.effect)} {w.effect.toUpperCase()}
                      {!eq?.effect && <span style={{ color: C.green }}> (NEW)</span>}
                    </span>
                  </div>
                )}
              </>;
            })()}

            {item.kind === "armor" && (() => {
              const a = item as Armor;
              const eq = equippedInSlot as Armor | null;
              return <>
                <StatDiff label="Blunt Def" current={a.bluntDef} equipped={eq?.bluntDef ?? 0} />
                <StatDiff label="Pierce Def" current={a.pierceDef} equipped={eq?.pierceDef ?? 0} />
                <StatDiff label="Slash Def" current={a.slashDef} equipped={eq?.slashDef ?? 0} />
                {(a.bonusHP > 0 || (eq?.bonusHP ?? 0) > 0) && (
                  <StatDiff label="Bonus HP" current={a.bonusHP} equipped={eq?.bonusHP ?? 0} />
                )}
                <StatDiff label="Level" current={a.level} equipped={eq?.level ?? 0} />
              </>;
            })()}
          </div>

          {/* Merge count if any */}
          {(item.mergeCount ?? 0) > 0 && (
            <div className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
              ⚒ {item.mergeCount} merge{item.mergeCount! > 1 ? "s" : ""} applied
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex", gap: 8, padding: "8px 12px",
          borderTop: "1px solid #222",
        }}>
          <PixelButton color="#001A00" textColor={C.green} onClick={() => { onEquip(); onClose(); }}>
            EQUIP
          </PixelButton>
          <PixelButton small color="#1A0A00" textColor={C.textDim} onClick={() => { onMelt(); onClose(); }}>
            MELT
          </PixelButton>
          <PixelButton small color="#0A0A00" textColor={C.textDim} onClick={() => { onSell(); onClose(); }}>
            SELL
          </PixelButton>
          <div style={{ flex: 1 }} />
          <PixelButton small color="#110011" textColor={C.textDim} onClick={onClose}>
            CLOSE
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function WeaponRow({ w, equipped, onClick }: {
  w: Weapon; equipped: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
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
            ? <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>✦ EQUIPPED</span>
            : <span className="pixel-text" style={{ color: C.textDim, fontSize: 9 }}>tap to inspect</span>
          }
        </div>
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
          [{w.weaponKind.toUpperCase()}] {w.damage}dmg · {w.damageType} · Lv{w.level}
          {w.effect ? ` · ${effectIcon(w.effect)} ${effectLabel(w.effect)}` : ""}
        </span>
      </div>
    </div>
  );
}

function ArmorRow({ a, equipped, onClick }: {
  a: Armor; equipped: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
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
            ? <span className="pixel-text" style={{ color: C.cyan, fontSize: 10 }}>✦ EQUIPPED</span>
            : <span className="pixel-text" style={{ color: C.textDim, fontSize: 9 }}>tap to inspect</span>
          }
        </div>
        <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
          [{a.slot}] bl:{a.bluntDef} pi:{a.pierceDef} sl:{a.slashDef}{a.bonusHP > 0 ? ` +${a.bonusHP}HP` : ""} · Lv{a.level}
        </span>
      </div>
    </div>
  );
}

export default function InventoryScreen() {
  const { player, equipItem, unequipSlot, meltItem, sellItem } = useGame();
  const [tab, setTab] = useState<"bag" | "parts">("bag");
  const [msg, setMsg] = useState("");
  const [inspectItem, setInspectItem] = useState<Weapon | Armor | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1600); }

  const eq     = player.equipped;
  const eMax   = effectiveMaxHp(player);
  const invGear   = (player.inventory.filter(i => i.kind !== "part") as (Weapon | Armor)[]).sort((a, b) => a.name.localeCompare(b.name));
  const invParts  = (player.inventory.filter(i => i.kind === "part") as EnemyPart[]).sort((a, b) => a.name.localeCompare(b.name));

  const equippedGear: (Weapon | Armor)[] = [
    eq.weapon, eq.helmet, eq.chest, eq.cloak,
  ].filter(Boolean) as (Weapon | Armor)[];

  const allGear = [
    ...equippedGear,
    ...invGear,
  ];

  const slots = [
    { id: "weapon",  label: "WEAPON",  item: eq.weapon  },
    { id: "helmet",  label: "HELMET",  item: eq.helmet  },
    { id: "chest",   label: "CHEST",   item: eq.chest   },
    { id: "cloak",   label: "CLOAK",   item: eq.cloak   },
  ] as const;

  function handleEquipItem(item: Weapon | Armor) {
    const isEquipped = equippedGear.some(g => g.id === item.id);
    if (isEquipped) {
      const slot = item.kind === "weapon" ? "weapon" : (item as Armor).slot;
      unequipSlot(slot as "weapon" | "helmet" | "chest" | "cloak");
      flash("Unequipped.");
    } else {
      equipItem(item.id);
      flash(`Equipped ${item.name}.`);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
      {/* Inspect popup */}
      {inspectItem && (
        <InspectPopup
          item={inspectItem}
          equipped={eq}
          onEquip={() => handleEquipItem(inspectItem)}
          onMelt={() => { meltItem(inspectItem.id); flash("Melted into metals."); }}
          onSell={() => { sellItem(inspectItem.id); flash(`Sold ${inspectItem.name}.`); }}
          onClose={() => setInspectItem(null)}
        />
      )}

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

      {/* Character doll + equipped slots */}
      <div style={{
        padding: "8px 12px", backgroundColor: "#0A0A10",
        borderBottom: "2px solid #000", flexShrink: 0,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <CharacterDoll equipped={eq} size="lg" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {slots.map(s => {
              const item = s.item;
              return (
                <div key={s.id}
                  onClick={() => item && setInspectItem(item as Weapon | Armor)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    backgroundColor: item ? "#0A1A0A" : C.bg3,
                    border: `1px solid ${item ? C.green : "#222"}`,
                    padding: "2px 6px",
                    cursor: item ? "pointer" : "default",
                  }}
                >
                  {item
                    ? item.kind === "weapon"
                      ? <WeaponIcon weapon={item as Weapon} small />
                      : <ArmorIcon armor={item as Armor} small />
                    : <span style={{ fontSize: 20, color: C.textDim }}>·</span>
                  }
                  <div>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 9, display: "block" }}>{s.label}</span>
                    <span className="pixel-text" style={{ color: item ? C.text : C.textDim, fontSize: 11 }}>
                      {item ? (item as Weapon | Armor).name : "—"}
                    </span>
                    {item && item.kind === "weapon" && (
                      <span className="pixel-text" style={{ color: C.yellow, fontSize: 10, display: "block" }}>
                        {(item as Weapon).damage}dmg {(item as Weapon).effect ? effectIcon((item as Weapon).effect) : ""}
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
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
            Tap equipped gear to inspect or unequip
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", flexShrink: 0 }}>
        {(["bag", "parts"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "6px 0",
            backgroundColor: tab === t ? C.bg2 : C.bg3,
            border: "none", borderBottom: tab === t ? `2px solid ${C.yellow}` : "2px solid transparent",
            color: tab === t ? C.yellow : C.textDim,
            fontFamily: "'VT323', monospace", fontSize: 14, cursor: "pointer",
          }}>
            {t === "bag" ? `BAG (${allGear.length})` : `DROPS (${invParts.length})`}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, backgroundColor: "#001A00", border: "1px solid #0A5A0A",
          padding: "5px 18px", whiteSpace: "nowrap",
        }}>
          <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{msg}</span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {tab === "bag" && (
          <>
            {allGear.length === 0 ? (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 14 }}>
                No gear yet. Win battles, visit shops, or use the forge.
              </span>
            ) : (
              allGear.map(item => {
                const isEquipped = equippedGear.some(g => g.id === item.id);
                if (item.kind === "weapon") return (
                  <WeaponRow key={item.id} w={item as Weapon} equipped={isEquipped}
                    onClick={() => setInspectItem(item as Weapon)}
                  />
                );
                return (
                  <ArmorRow key={item.id} a={item as Armor} equipped={isEquipped}
                    onClick={() => setInspectItem(item as Armor)}
                  />
                );
              })
            )}
            {allGear.length > 0 && (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 10, textAlign: "center", marginTop: 4 }}>
                Tap any item to inspect stats, equip, melt, or sell
              </span>
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
