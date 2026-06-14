import React, { useRef, useState, useCallback } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton } from "./PixelUI";
import { ENEMY_SPRITES, CHARACTER_SPRITES } from "@/assets/sprites";
import { PixelPortrait } from "./CardArt";
import { getBiome, BIOME_BG, BIOME_COLORS } from "@/game/data";
import type { Weapon } from "@/game/data";

function HpBar({ hp, maxHp, color, height = 10 }: { hp: number; maxHp: number; color: string; height?: number }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 50 ? color : pct > 20 ? C.yellow : C.redBright;
  return (
    <div style={{ height, backgroundColor: "#111", border: "1px solid #000", overflow: "hidden" }}>
      <div style={{ height: "100%", backgroundColor: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

function SpriteFill({ name, isPlayer, animClass }: { name: string; isPlayer?: boolean; animClass?: string }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;
  return imgSrc ? (
    <img src={imgSrc} alt={name} className={animClass} style={{
      width: "100%", height: "100%",
      objectFit: "contain",
      objectPosition: "center bottom",
      imageRendering: "pixelated",
      display: "block",
    }} />
  ) : (
    <div className={animClass} style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <PixelPortrait name={name} size={200} isPlayer={isPlayer} />
    </div>
  );
}

function useAnimKey() {
  const [keys, setKeys] = useState<Record<string | number, number>>({});
  const trigger = useCallback((id: string | number) => {
    setKeys(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);
  const getClass = useCallback((id: string | number, className: string) => {
    const k = keys[id];
    if (!k) return "";
    return `${className} anim-key-${k}`;
  }, [keys]);
  return { trigger, getClass };
}

export default function JWCModal({ inline }: { inline?: boolean }) {
  const {
    jwc, player,
    jwcAttack,
    jwcDefend, jwcUnqueueDef,
    jwcReserve, jwcUnqueueReserve,
    jwcEndRound, jwcSelectTarget,
    jwcAttackEnemy,
    jwcUnqueueAtkForEnemy,
    closeJWC,
  } = useGame();

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyAnim   = useAnimKey();
  const playerAnim  = useAnimKey();

  if (!jwc) return null;

  const { atkByEnemy, pendingDef, sp, spReserved, isBossFight } = jwc;
  const totalAtkQueued = atkByEnemy.reduce((a, b) => a + b, 0);
  const totalPending   = totalAtkQueued + pendingDef;
  const noSp           = sp < 1;
  const w              = player.equipped.weapon as Weapon | null;
  const accent         = isBossFight ? C.yellow : C.redBright + "88";
  const biome          = getBiome(player.bossKills);
  const biomeBg        = BIOME_BG[biome];
  const biomeColor     = BIOME_COLORS[biome];
  const recentLog      = jwc.log.slice(0, 8);
  const maxSp          = 3;
  const spPips         = Array.from({ length: maxSp }, (_, i) => i < sp);
  const hasActions     = totalPending > 0 || spReserved > 0;

  const battleBg     = isBossFight ? "#1A0408" : biomeBg;
  const battleAccent = isBossFight ? "#2A0808" : biomeColor + "22";

  const lootDisplay = (() => {
    const tm    = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
    const tg    = jwc.enemies.reduce((s, e) => s + (e.loot?.gems ?? 0), 0);
    const drops = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
    return { tm, tg, drops };
  })();

  function startHold(idx: number) {
    holdTimerRef.current = setTimeout(() => jwcUnqueueAtkForEnemy(idx), 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }
  function handleAttackEnemy(idx: number) {
    enemyAnim.trigger(jwc!.enemies[idx]?.id ?? idx);
    jwcAttackEnemy(idx);
  }
  function handleDefend() {
    playerAnim.trigger("player");
    jwcDefend();
  }
  function handleReserve() {
    playerAnim.trigger("reserve");
    jwcReserve();
  }

  // ── Shared: action buttons column ──────────────────────────────────────────
  function renderButtons(compact?: boolean) {
    return (
      <div style={{
        width: compact ? "49%" : "50%", display: "flex", flexDirection: "column",
        backgroundColor: "#050C05", padding: compact ? "3px 3px" : "4px", gap: compact ? 2 : 3,
      }}>
        <button onClick={jwcEndRound} style={{
          padding: compact ? "5px 0" : "8px 0", flexShrink: 0,
          backgroundColor: hasActions ? "#082808" : "#080808",
          border: `2px solid ${hasActions ? C.green : "#2A2A2A"}`,
          color: hasActions ? C.green : "#3A3A3A",
          fontFamily: "'VT323', monospace",
          fontSize: compact ? 14 : 17,
          cursor: "pointer", width: "100%",
        }}>{hasActions ? "END TURN ▶" : "END TURN"}</button>
        <div style={{ display: "flex", gap: compact ? 2 : 3, flex: 1, minHeight: 0 }}>
          {(["STRIKE", "BLOCK", "RSRV"] as const).map((label) => {
            const handler = label === "STRIKE" ? jwcAttack : label === "BLOCK" ? handleDefend : handleReserve;
            const remover = label === "BLOCK" ? jwcUnqueueDef : label === "RSRV" ? jwcUnqueueReserve : null;
            const queuedN = label === "BLOCK" ? pendingDef : label === "RSRV" ? spReserved : 0;
            const col = label === "STRIKE" ? C.redBright : label === "BLOCK" ? C.cyan : C.yellow;
            const bg  = label === "STRIKE" ? "#3A0808" : label === "BLOCK" ? "#001A2A" : "#201800";
            return (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <button onClick={handler} disabled={noSp} style={{
                  flex: 1, width: "100%", cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? bg + "22" : bg,
                  border: `2px solid ${noSp ? col + "22" : col}`,
                  color: noSp ? col + "33" : col,
                  fontFamily: "'VT323', monospace",
                  fontSize: compact ? 12 : 16,
                }}>{label}</button>
                {remover && queuedN > 0 && (
                  <button onClick={remover} style={{
                    width: "100%", cursor: "pointer", backgroundColor: "#080808",
                    border: `1px solid ${col}55`, color: col + "99",
                    fontFamily: "'VT323', monospace", fontSize: 9, padding: "1px 0",
                  }}>↩ ×{queuedN}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Shared: combat log ──────────────────────────────────────────────────────
  function renderLog(compact?: boolean) {
    return (
      <div style={{
        flex: 1, minWidth: 0,
        backgroundColor: "#EDE8D4", borderRight: "1px solid #B8A870",
        padding: compact ? "3px 5px" : "4px 6px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        {recentLog.length === 0 && (
          <span className="pixel-text" style={{ color: "#9A8060", fontSize: compact ? 8 : 10 }}>Combat begins...</span>
        )}
        {recentLog.map((line, i) => (
          <span key={i} className="pixel-text" style={{
            fontSize: i === 0 ? (compact ? 10 : 12) : (compact ? 8 : 10),
            color: line.includes("STUN") || line.includes("[ICE]") ? "#005580"
                 : line.includes("hit") || line.includes("collapse") ? "#880010"
                 : line.includes("VICTORY") || line.includes("★")   ? "#105010"
                 : line.includes("WEAK")                             ? "#705000"
                 : "#3A2810",
            opacity: 1 - i * 0.1, lineHeight: 1.25,
          }}>{line}</span>
        ))}
      </div>
    );
  }

  // ── INLINE (desktop right panel) ───────────────────────────────────────────
  if (inline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Upper 67%: Battle scene ── */}
        <div style={{
          flex: "0 0 67%", minHeight: 0,
          background: `linear-gradient(180deg, ${battleBg} 0%, ${battleAccent} 100%)`,
          display: "flex", flexDirection: "column",
          padding: "6px 8px 4px", gap: 4, overflow: "hidden",
        }}>
          {isBossFight && (
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>★ BOSS ★</span>
            </div>
          )}

          {/* Enemies — HP box to LEFT, sprite to RIGHT (flipped toward player) */}
          <div style={{ display: "flex", gap: 3, flex: 1, minHeight: 0, alignItems: "flex-end" }}>
            {jwc.enemies.map((e, i) => {
              const isDead   = e.hp <= 0;
              const isTarget = i === jwc.active;
              const atkN     = atkByEnemy[i] ?? 0;
              const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");
              return (
                <div key={e.id}
                  onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                  onContextMenu={ev => {
                    ev.preventDefault();
                    if (atkN > 0) jwcUnqueueAtkForEnemy(i);
                    else if (!isDead && !jwc.finished) jwcSelectTarget(i);
                  }}
                  onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                  style={{
                    flex: isDead ? "0 0 12px" : 1,
                    display: "flex", flexDirection: "row", alignItems: "flex-end",
                    cursor: isDead || jwc.finished ? "default" : "pointer",
                    opacity: isDead ? 0.2 : 1,
                  }}>
                  {isDead ? (
                    <span className="pixel-text" style={{ color: "#500", fontSize: 8 }}>✗</span>
                  ) : (
                    <>
                      {/* HP box — LEFT of sprite */}
                      <div style={{
                        flexShrink: 0, width: 44, alignSelf: "flex-end",
                        backgroundColor: "#00000099", padding: "2px 3px",
                        border: `1px solid ${isTarget ? C.redBright + "AA" : "#33111166"}`,
                        display: "flex", flexDirection: "column", gap: 1,
                      }}>
                        <span className="pixel-text" style={{ color: isTarget ? C.redBright : "#DD8888", fontSize: 7, lineHeight: 1 }}>
                          {(isBossFight || e.isElite) ? "★" : ""}{e.name.split(" ")[0].slice(0, 5)}
                        </span>
                        <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={3} />
                        <span className="pixel-text" style={{ color: "#885555", fontSize: 6 }}>{e.hp}/{e.maxHp}</span>
                        {atkN > 0 && (
                          <span className="pixel-text" style={{ color: C.redBright, fontSize: 8 }}>⚔×{atkN}</span>
                        )}
                        {(e.stunned ?? false) && (
                          <span className="pixel-text" style={{ color: C.yellow, fontSize: 6 }}>STUN</span>
                        )}
                        {(e.iceTurns ?? 0) > 0 && (
                          <span className="pixel-text" style={{ color: C.cyan, fontSize: 6 }}>ICE×{e.iceTurns}</span>
                        )}
                      </div>
                      {/* Sprite — flipped to face left (toward player) */}
                      <div className={animClass} style={{
                        flex: 1, height: "100%",
                        filter: isTarget
                          ? `drop-shadow(0 0 5px ${C.redBright}) drop-shadow(0 0 10px ${C.redBright}88)`
                          : "none",
                        transform: "scaleX(-1)",
                      }}>
                        <SpriteFill name={e.name} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player — sprite LEFT, HP/SP RIGHT */}
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "flex-end",
            height: 80, flexShrink: 0,
          }}>
            <div
              className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
              style={{ width: "32%", height: "100%" }}>
              <SpriteFill name="self" isPlayer />
            </div>
            <div style={{
              flex: 1, padding: "0 4px 2px 6px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2,
            }}>
              <div style={{
                backgroundColor: "#00000088", border: `1px solid ${C.green}44`,
                padding: "3px 5px", display: "flex", flexDirection: "column", gap: 2,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="pixel-text" style={{ color: C.green, fontSize: 9 }}>♥ YOU</span>
                  <span className="pixel-text" style={{
                    color: jwc.playerHp / jwc.playerMaxHp > 0.4 ? C.green : C.redBright, fontSize: 9,
                  }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
                </div>
                <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={3} />
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 7 }}>SP</span>
                  {spPips.map((f, i) => (
                    <div key={i} style={{
                      width: 7, height: 7,
                      backgroundColor: f ? C.cyan : "#111",
                      border: `1px solid ${f ? C.cyan : "#333"}`,
                    }} />
                  ))}
                  {spReserved > 0 && (
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 7 }}>+{spReserved}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Lower 33%: Controls ── */}
        <div style={{
          flex: 1, borderTop: `2px solid ${accent}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {!jwc.finished ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>
              {renderLog(true)}
              {renderButtons(true)}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#050C05", padding: "6px", gap: 4 }}>
              {jwc.victory && (
                <div style={{ backgroundColor: "#001608", border: `1px solid ${C.green}44`, padding: "4px 6px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {lootDisplay.tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>+${lootDisplay.tm}</span>}
                    {lootDisplay.tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 11 }}>+{lootDisplay.tg}💎</span>}
                    {lootDisplay.drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 10 }}>{d}</span>)}
                  </div>
                </div>
              )}
              <PixelButton onClick={closeJWC}
                color={jwc.victory ? C.green : "#6B0000"}
                textColor={jwc.victory ? "#052002" : "#fff"}
                style={{ width: "100%", flex: 1 }}>
                {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FULLSCREEN MODAL ────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#03050A",
      display: "flex", flexDirection: "column",
      zIndex: 100, overflow: "hidden",
    }}>

      {/* ── Upper 67%: Battle scene ── */}
      <div style={{
        flex: "0 0 67%", minHeight: 0,
        background: `linear-gradient(180deg, ${battleBg} 0%, ${battleAccent} 100%)`,
        display: "flex", flexDirection: "column",
        padding: "10px 12px 6px", gap: 8, overflow: "hidden",
      }}>

        {isBossFight && (
          <div style={{ textAlign: "center", flexShrink: 0, marginBottom: -4 }}>
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 16 }}>★ BOSS FIGHT ★</span>
          </div>
        )}

        {/* Enemies — row with HP box to LEFT, full-body sprite to RIGHT (flipped toward player) */}
        <div style={{ display: "flex", gap: 6, flex: 1, minHeight: 0, alignItems: "flex-end" }}>
          {jwc.enemies.map((e, i) => {
            const isDead   = e.hp <= 0;
            const isTarget = i === jwc.active;
            const atkN     = atkByEnemy[i] ?? 0;
            const allQueued = atkN >= maxSp;
            const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");
            return (
              <div key={e.id}
                onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                onContextMenu={ev => {
                  ev.preventDefault();
                  if (atkN > 0) jwcUnqueueAtkForEnemy(i);
                  else if (!isDead && !jwc.finished) jwcSelectTarget(i);
                }}
                onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                style={{
                  flex: isDead ? "0 0 18px" : 1,
                  display: "flex", flexDirection: "row", alignItems: "flex-end",
                  cursor: isDead || jwc.finished ? "default" : "pointer",
                  opacity: isDead ? 0.2 : 1, gap: 4,
                }}>
                {isDead ? (
                  <span className="pixel-text" style={{ color: "#500", fontSize: 10, padding: 4 }}>✗</span>
                ) : (
                  <>
                    {/* HP info box — LEFT of enemy */}
                    <div style={{
                      flexShrink: 0, width: 62, alignSelf: "flex-end",
                      backgroundColor: "#00000099",
                      border: `1px solid ${isTarget ? C.redBright + "AA" : "#33111166"}`,
                      padding: "5px 6px",
                      display: "flex", flexDirection: "column", gap: 2,
                      outline: isTarget ? `1px solid ${C.redBright}44` : "none",
                    }}>
                      <span className="pixel-text" style={{
                        color: isTarget ? C.redBright : "#CC6666", fontSize: 10, lineHeight: 1,
                        textShadow: isTarget ? `0 0 6px ${C.redBright}` : "none",
                      }}>
                        {(isBossFight || e.isElite) ? "★ " : ""}{e.name.split(" ")[0]}
                      </span>
                      <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={4} />
                      <span className="pixel-text" style={{ color: "#885555", fontSize: 9 }}>{e.hp}/{e.maxHp}</span>
                      {atkN > 0 && (
                        <span className="pixel-text" style={{
                          color: allQueued ? C.redBright : "#CC4444",
                          fontSize: allQueued ? 12 : 11,
                          backgroundColor: allQueued ? C.redBright + "22" : "transparent",
                        }}>
                          {allQueued ? "ALL IN!" : `⚔ ×${atkN}`}
                        </span>
                      )}
                      <span className="pixel-text" style={{ color: "#664444", fontSize: 8 }}>Lv{e.level}</span>
                      {(e.stunned ?? false) && (
                        <span className="pixel-text" style={{ color: C.yellow, fontSize: 8, backgroundColor: C.yellow + "22", padding: "0 2px" }}>STUN</span>
                      )}
                      {(e.iceTurns ?? 0) > 0 && (
                        <span className="pixel-text" style={{ color: C.cyan, fontSize: 8, backgroundColor: C.cyan + "22", padding: "0 2px" }}>ICE×{e.iceTurns}</span>
                      )}
                    </div>

                    {/* Enemy sprite — flipped horizontally (faces left, toward player below) */}
                    <div className={animClass} style={{
                      flex: 1, height: "100%",
                      filter: isTarget
                        ? `drop-shadow(0 0 8px ${C.redBright}) drop-shadow(0 0 16px ${C.redBright}99)`
                        : "none",
                      transform: "scaleX(-1)",
                    }}>
                      <SpriteFill name={e.name} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Player — sprite LEFT, HP/SP box RIGHT */}
        <div style={{
          display: "flex", flexDirection: "row", alignItems: "flex-end",
          height: 120, flexShrink: 0,
        }}>
          <div
            className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
            style={{ width: "32%", height: "100%" }}>
            <SpriteFill name="self" isPlayer />
          </div>
          {/* HP/SP info to the RIGHT */}
          <div style={{
            flex: 1, padding: "0 8px 8px 12px",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5,
          }}>
            <div style={{
              backgroundColor: "#00000088", border: `1px solid ${C.green}44`,
              padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="pixel-text" style={{ color: C.green, fontSize: 14 }}>♥ YOU</span>
                <span className="pixel-text" style={{
                  color: jwc.playerHp / jwc.playerMaxHp > 0.4 ? C.green : C.redBright, fontSize: 16,
                }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
              </div>
              <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={5} />
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>SP</span>
                {spPips.map((f, i) => (
                  <div key={i} style={{
                    width: 10, height: 10,
                    backgroundColor: f ? C.cyan : "#111",
                    border: `1px solid ${f ? C.cyan : "#333"}`,
                  }} />
                ))}
                {spReserved > 0 && (
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>+{spReserved}</span>
                )}
              </div>
            </div>
            {w && (
              <div style={{ backgroundColor: "#00000066", border: `1px solid ${C.yellow}22`, padding: "3px 6px" }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>
                  ⚔ {w.name} · {w.damage}dmg
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lower 33%: Combat HUD ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        backgroundColor: "#06090F",
        borderTop: `2px solid ${accent}`,
        overflow: "hidden",
      }}>
        {!jwc.finished ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>
            {renderLog()}
            {renderButtons()}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#06090F", padding: "16px 20px", gap: 12 }}>
            {jwc.victory ? (
              <div style={{ backgroundColor: "#001608", border: `1px solid ${C.green}44`, padding: "10px 14px" }}>
                <span className="pixel-text" style={{ color: C.green, fontSize: 18, display: "block", marginBottom: 6 }}>
                  ★ VICTORY
                </span>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {lootDisplay.tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 20 }}>+${lootDisplay.tm}</span>}
                  {lootDisplay.tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 20 }}>+{lootDisplay.tg}💎</span>}
                  {lootDisplay.drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 18 }}>{d}</span>)}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: "#180000", border: `1px solid ${C.redBright}44`, padding: "10px 14px" }}>
                <span className="pixel-text" style={{ color: C.redBright, fontSize: 18 }}>✗ DEFEATED</span>
              </div>
            )}
            <PixelButton onClick={closeJWC}
              color={jwc.victory ? C.green : "#6B0000"}
              textColor={jwc.victory ? "#052002" : "#fff"}
              style={{ flex: 1, fontSize: 22 }}>
              {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}
