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
      objectPosition: isPlayer ? "center bottom" : "center bottom",
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
        backgroundColor: "#888888", borderRight: "2px solid #444444",
        padding: compact ? "3px 5px" : "4px 6px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        {recentLog.length === 0 && (
          <span className="pixel-text" style={{ color: "#222222", fontSize: compact ? 8 : 10 }}>Combat begins...</span>
        )}
        {recentLog.map((line, i) => (
          <span key={i} className="pixel-text" style={{
            fontSize: i === 0 ? (compact ? 10 : 12) : (compact ? 8 : 10),
            color: line.includes("STUN") || line.includes("[ICE]") ? "#003366"
                 : line.includes("hit") || line.includes("collapse") ? "#550008"
                 : line.includes("VICTORY") || line.includes("★")   ? "#003300"
                 : line.includes("WEAK")                             ? "#443300"
                 : "#111111",
            opacity: 1 - i * 0.1, lineHeight: 1.25,
          }}>{line}</span>
        ))}
      </div>
    );
  }

  // ── Shared: enemies section (all HP bars LEFT, all sprites RIGHT) ───────────
  function renderEnemies(compact?: boolean) {
    const hpWidth = compact ? 48 : 52;

    return (
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: compact ? 2 : 3, overflow: "hidden" }}>

        {/* LEFT COLUMN: all HP boxes stacked vertically — anchored to TOP */}
        <div style={{ display: "flex", flexDirection: "column", gap: compact ? 2 : 3, width: hpWidth, flexShrink: 0, justifyContent: "flex-start" }}>
          {jwc.enemies.map((e, i) => {
            const isDead   = e.hp <= 0;
            const isTarget = i === jwc.active;
            const atkN     = atkByEnemy[i] ?? 0;
            const allQueued = atkN >= maxSp;
            return (
              <div key={e.id}
                onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                onContextMenu={ev => {
                  ev.preventDefault();
                  if (atkN > 0) jwcUnqueueAtkForEnemy(i);
                  else if (!isDead && !jwc.finished) jwcSelectTarget(i);
                }}
                style={{ cursor: isDead || jwc.finished ? "default" : "pointer" }}>
                {isDead ? (
                  <span className="pixel-text" style={{ color: "#500", fontSize: compact ? 8 : 10, padding: "0 2px" }}>✗</span>
                ) : (
                  <div style={{
                    backgroundColor: "#3A3A3A",
                    border: `2px solid ${isTarget ? C.redBright : "#1A1A1A"}`,
                    padding: compact ? "2px 3px" : "6px 10px",
                    display: "flex", flexDirection: "column", gap: compact ? 1 : 3,
                    outline: isTarget ? `1px solid ${C.redBright}44` : "none",
                  }}>
                    <span className="pixel-text" style={{
                      color: isTarget ? C.redBright : "#EE9999",
                      fontSize: compact ? 7 : 13,
                      lineHeight: 1,
                      textShadow: isTarget ? `0 0 6px ${C.redBright}` : "none",
                    }}>
                      {(isBossFight || e.isElite) ? "★" : ""}{e.name.split(" ")[0].slice(0, compact ? 5 : 10)}
                    </span>
                    <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={compact ? 7 : 14} />
                    <span className="pixel-text" style={{ color: compact ? "#220000" : "#FFAAAA", fontSize: compact ? 6 : 12 }}>{e.hp}/{e.maxHp}</span>
                    {!compact && <span className="pixel-text" style={{ color: "#AA6666", fontSize: 10 }}>Lv{e.level}</span>}
                    {atkN > 0 && (
                      <span className="pixel-text" style={{
                        color: allQueued ? C.redBright : "#CC4444",
                        fontSize: compact ? 8 : (allQueued ? 11 : 10),
                        backgroundColor: allQueued ? C.redBright + "22" : "transparent",
                      }}>
                        {allQueued ? "ALL!" : `⚔×${atkN}`}
                      </span>
                    )}
                    {(e.stunned ?? false) && (
                      <span className="pixel-text" style={{ color: C.yellow, fontSize: compact ? 6 : 8, backgroundColor: C.yellow + "22", padding: "0 2px" }}>STUN</span>
                    )}
                    {(e.iceTurns ?? 0) > 0 && (
                      <span className="pixel-text" style={{ color: C.cyan, fontSize: compact ? 6 : 8, backgroundColor: C.cyan + "22", padding: "0 2px" }}>ICE×{e.iceTurns}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT SECTION: sprites fill right→left (first enemy rightmost) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "row-reverse", gap: compact ? 1 : 4, alignItems: "flex-end", overflow: "hidden", maxHeight: compact ? 240 : 300 }}>
          {jwc.enemies.map((e, i) => {
            const isDead    = e.hp <= 0;
            const isTarget  = i === jwc.active;
            const atkN      = atkByEnemy[i] ?? 0;
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
                className={animClass}
                style={{
                  flex: isDead ? "0 0 16px" : 1,
                  height: compact ? 240 : 300,
                  cursor: isDead || jwc.finished ? "default" : "pointer",
                  opacity: isDead ? 0.2 : 1,
                  filter: isTarget
                    ? `drop-shadow(0 0 ${compact ? 4 : 8}px ${C.redBright}) drop-shadow(0 0 ${compact ? 8 : 16}px ${C.redBright}99)`
                    : "none",
                  transform: "scaleX(-1)",
                }}>
                {isDead ? (
                  <span className="pixel-text" style={{ color: "#500", fontSize: compact ? 8 : 10 }}>✗</span>
                ) : (
                  <SpriteFill name={e.name} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── INLINE (phone / desktop right panel) ────────────────────────────────────
  if (inline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Upper 68%: Battle scene with player anchored to bottom ── */}
        <div style={{
          flex: "0 0 68%", minHeight: 0,
          background: `linear-gradient(180deg, ${battleBg} 0%, ${battleAccent} 100%)`,
          display: "flex", flexDirection: "column",
          padding: "6px 6px 4px", overflow: "hidden",
          justifyContent: "space-between",
        }}>

          {/* Enemies — fills top, anchored to top */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
            {isBossFight && (
              <div style={{ textAlign: "center", flexShrink: 0, marginBottom: -2 }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 10 }}>★ BOSS ★</span>
              </div>
            )}
            {renderEnemies(true)}
          </div>

          {/* Player — sprite LEFT (fluid), HP/SP box RIGHT — anchored to bottom */}
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "flex-end",
            flexShrink: 0, marginTop: 6, gap: 6, overflow: "hidden",
            height: "clamp(140px, 38vh, 320px)",
          }}>
            <div
              className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
              style={{ width: "clamp(110px, 38%, 240px)", height: "100%", flexShrink: 0 }}>
              <SpriteFill name="self" isPlayer />
            </div>
            <div style={{
              flex: 1, minWidth: 0,
              padding: "0 0 4px 0",
              display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4,
            }}>
              <div style={{
                backgroundColor: "#1C1C1C", border: "1px solid #444",
                padding: "5px 7px", display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="pixel-text" style={{ color: "#AAFFAA", fontSize: 10 }}>♥ YOU</span>
                  <span className="pixel-text" style={{
                    color: jwc.playerHp / jwc.playerMaxHp > 0.4 ? "#88FF88" : C.redBright, fontSize: 11,
                  }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
                </div>
                <div style={{ maxWidth: "35%" }}>
                  <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={6} />
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span className="pixel-text" style={{ color: "#666", fontSize: 9 }}>SP</span>
                  {spPips.map((f, i) => (
                    <div key={i} style={{
                      width: 9, height: 9,
                      backgroundColor: f ? C.cyan : "#111",
                      border: `1px solid ${f ? C.cyan : "#333"}`,
                    }} />
                  ))}
                  {spReserved > 0 && (
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 9 }}>+{spReserved}</span>
                  )}
                </div>
              </div>
              {w && (
                <div style={{ backgroundColor: "#00000066", padding: "2px 5px" }}>
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 9 }}>⚔ {w.name} · {w.damage}dmg</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Lower ~32%: Combat HUD ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderTop: `2px solid ${accent}`,
          overflow: "hidden",
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

  // ── FULLSCREEN MODAL (browser) ───────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#06090F",
      display: "flex", flexDirection: "column",
      zIndex: 100, overflow: "hidden",
    }}>

      {/* ── Upper 68%: Battle scene ── */}
      <div style={{
        flex: "0 0 68%", minHeight: 0,
        background: `linear-gradient(180deg, ${battleBg} 0%, ${battleAccent} 100%)`,
        display: "flex", flexDirection: "column",
        padding: "10px 12px 6px", overflow: "hidden",
        justifyContent: "space-between",
      }}>

        {/* Enemies — fills all available space, anchored to top */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          {isBossFight && (
            <div style={{ textAlign: "center", flexShrink: 0, marginBottom: -4 }}>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 16 }}>★ BOSS FIGHT ★</span>
            </div>
          )}
          {renderEnemies(false)}
        </div>

        {/* Player — sprite LEFT (fluid), HP/SP box RIGHT — anchored to bottom */}
        <div style={{
          display: "flex", flexDirection: "row", alignItems: "flex-end",
          flexShrink: 0, marginTop: 8, gap: 10, overflow: "hidden",
          height: "clamp(160px, 36vh, 360px)",
        }}>
          <div
            className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
            style={{ width: "clamp(120px, 36vw, 340px)", height: "100%", flexShrink: 0 }}>
            <SpriteFill name="self" isPlayer />
          </div>
          <div style={{
            flex: 1, minWidth: 0,
            padding: "0 0 6px 0",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5,
          }}>
            <div style={{
              backgroundColor: "#1C1C1C", border: "2px solid #444444",
              padding: "6px 8px", display: "flex", flexDirection: "column", gap: 5,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="pixel-text" style={{ color: "#AAFFAA", fontSize: 12 }}>♥ YOU</span>
                <span className="pixel-text" style={{
                  color: jwc.playerHp / jwc.playerMaxHp > 0.4 ? "#88FF88" : C.redBright, fontSize: 13,
                }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
              </div>
              <div style={{ maxWidth: "30%" }}>
                <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={7} />
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span className="pixel-text" style={{ color: "#666666", fontSize: 11 }}>SP</span>
                {spPips.map((f, i) => (
                  <div key={i} style={{
                    width: 12, height: 12,
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
              <div style={{ backgroundColor: "#00000066", border: `1px solid ${C.yellow}22`, padding: "4px 8px" }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>
                  ⚔ {w.name} · {w.damage}dmg
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lower ~32%: Combat HUD ── */}
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
