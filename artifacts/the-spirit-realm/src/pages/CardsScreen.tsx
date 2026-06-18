import React, { useState, useCallback, useEffect } from "react";
import { useGame, MAX_DECK_SIZE } from "@/game/state";
import { C, PixelButton, StatChip } from "@/components/PixelUI";
import CardArt, { FullCard } from "@/components/CardArt";
import { getDCCThemeInfo, buildDCCEnemyDeck, getAllDCCCardTemplates, getBiome, type Card } from "@/game/data";

type DccTab = "table" | "deck" | "collection" | "merge";
const LANE_COUNT  = 3;
const ROUND_COUNT = 6;

interface Lane { player: Card[]; enemy: Card[] }
type Phase = "idle" | "playing" | "reviewing" | "result" | "upgrade";

interface DCCState {
  round: number; sp: number; enemySp: number;
  lanes: Lane[]; hand: Card[]; deck: Card[]; enemyDeck: Card[];
  phase: Phase; selectedCard: Card | null; logs: string[];
  result: "win" | "loss" | "draw" | null;
  xpGained: number; moneyGained: number; leveled: boolean;
  newLevel: number; upgradesLeft: number; rewardCard: Card | null;
}

function calcSP(round: number, prev: number): number { return Math.min(8, prev + (round <= 3 ? 3 : 4)); }

type EffectKind = "assassin" | "vanguard" | "knight" | "scientist" | "joker" | "surge" | "brawler";

function hasEffect(c: Card, kind: EffectKind): boolean {
  const t = c.text ?? "";
  const n = c.name;
  const id = c.id;
  switch (kind) {
    case "assassin":  return t.includes("Lone:") || n.includes("Assassin") || id === "c7"  || id === "c12";
    case "vanguard":  return t.includes("Vanguard:") || t.includes("outnumber");
    case "knight":    return t.includes("per ally")  || n === "Knight"     || id === "c5";
    case "scientist": return t.includes("if paired") || t.includes("BOOM:") || n === "Scientist" || id === "c8";
    case "joker":     return t.includes("Bleed") || n === "Joker"          || id === "c10";
    case "surge":     return t.includes("Surge") || t.includes("Ancient:");
    case "brawler":   return t.includes("Brawler:") || t.includes("per foe here");
  }
}

function extractNum(text: string | undefined, pattern: RegExp, fallback: number): number {
  const m = text?.match(pattern);
  return m ? parseInt(m[1]) : fallback;
}
function getBleedAmt(c: Card)     { return extractNum(c.text, /[Bb]leed[^−\-]*[−\-](\d+)/, 3); }
function getPerAllyAmt(c: Card)   { return extractNum(c.text, /\+(\d+) per ally/, 1); }
function getPairedAmt(c: Card)    { return extractNum(c.text, /\+(\d+)(?:\s*power)?$/, 4); }
function getSurgeAmt(c: Card)     { return extractNum(c.text, /\+(\d+)(?:\s*if last|\s*power)?$/, 5); }
function getVanguardAmt(c: Card)  { return extractNum(c.text, /Vanguard[^+]*\+(\d+)/, 3); }
function getBrawlerAmt(c: Card)   { return extractNum(c.text, /Brawler[^+]*\+(\d+)/, 2); }

function calcCardPower(card: Card, allies: Card[], laneIdx: number, round = 0, foeCards: Card[] = []): number {
  let power = card.power;
  if (hasEffect(card, "assassin"))  { if (allies.length === 0)                        power *= 2; }
  if (hasEffect(card, "vanguard"))  { if (allies.length + 1 > foeCards.length)        power += getVanguardAmt(card); }
  if (hasEffect(card, "knight"))    { power += getPerAllyAmt(card) * allies.length; }
  if (hasEffect(card, "scientist")) { if (allies.length > 0)                          power += getPairedAmt(card); }
  if (hasEffect(card, "surge"))     { if (round >= ROUND_COUNT)                       power += getSurgeAmt(card); }
  if (hasEffect(card, "brawler"))   { power += getBrawlerAmt(card) * foeCards.length; }
  return power;
}

function calcLanePower(lane: Lane, laneIdx: number, round = 0): { player: number; enemy: number } {
  let pPow = lane.player.reduce((a, c) => {
    const allies = lane.player.filter(x => x.id !== c.id);
    return a + calcCardPower(c, allies, laneIdx, round, lane.enemy);
  }, 0);
  let ePow = lane.enemy.reduce((a, c) => {
    const allies = lane.enemy.filter(x => x.id !== c.id);
    return a + calcCardPower(c, allies, laneIdx, round, lane.player);
  }, 0);
  const playerBleed = lane.player.reduce((s, c) => s + (hasEffect(c, "joker") ? getBleedAmt(c) : 0), 0);
  const enemyBleed  = lane.enemy.reduce((s, c) =>  s + (hasEffect(c, "joker") ? getBleedAmt(c) : 0), 0);
  ePow = Math.max(0, ePow - playerBleed);
  pPow = Math.max(0, pPow - enemyBleed);
  return { player: pPow, enemy: ePow };
}

function evalLanes(lanes: Lane[], round = 0): { player: number; enemy: number; laneSummary: string[] } {
  let p = 0, e = 0;
  const summary: string[] = [];
  for (let i = 0; i < lanes.length; i++) {
    const { player: pPow, enemy: ePow } = calcLanePower(lanes[i], i, round);
    if (pPow > ePow)      { p++; summary.push(`✔ L${i+1}: you ${pPow} vs ${ePow}`); }
    else if (ePow > pPow) { e++; summary.push(`✘ L${i+1}: you ${pPow} vs ${ePow}`); }
    else                  {      summary.push(`↔ L${i+1}: tie ${pPow}`); }
  }
  return { player: p, enemy: e, laneSummary: summary };
}

function enemyAI(hand: Card[], lanes: Lane[], sp: number, round: number): { card: Card; lane: number } | null {
  const playable = hand.filter(c => c.cost <= sp);
  if (playable.length === 0) return null;
  let bestScore = -Infinity;
  let bestMove: { card: Card; lane: number } | null = null;
  for (const card of playable) {
    for (let li = 0; li < lanes.length; li++) {
      const lane = lanes[li];
      const { player: pBefore, enemy: eBefore } = calcLanePower(lane, li, round);
      const simAllies = lane.enemy;
      const cardContrib = calcCardPower(card, simAllies, li, round, lane.player);
      const urgency = Math.max(0, pBefore - eBefore);
      const score = cardContrib + urgency * 0.7 + (eBefore < pBefore ? 3 : 0);
      if (score > bestScore) { bestScore = score; bestMove = { card, lane: li }; }
    }
  }
  return bestMove;
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  return { drawn: deck.slice(0, count), remaining: deck.slice(count) };
}

const initLanes = (): Lane[] => Array.from({ length: LANE_COUNT }, () => ({ player: [], enemy: [] }));

// ── Header ──────────────────────────────────────────────────────────────────
function DccHeader({ themeInfo, player, pendingCardUpgrades }: {
  themeInfo: ReturnType<typeof getDCCThemeInfo>;
  player: ReturnType<typeof useGame>["player"];
  pendingCardUpgrades: number;
}) {
  return (
    <div style={{
      padding: "6px 10px", backgroundColor: "#0A0A14",
      borderBottom: "3px solid #000", flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 16 }}>
          🃏 {themeInfo.fullName}
        </span>
        {pendingCardUpgrades > 0 && (
          <div style={{ backgroundColor: "#001A00", border: `1px solid ${C.green}`, padding: "1px 6px" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 11 }}>
              ★ {pendingCardUpgrades} upgrade{pendingCardUpgrades > 1 ? "s" : ""} ready
            </span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <StatChip label="LVL"  value={player.dccLevel}    color={themeInfo.color} />
        <StatChip label="XP"   value={player.dccXp}       color={C.cyan} />
        <StatChip label="G"    value={`$${player.money}`} color={C.yellow} />
        <StatChip label="DECK" value={`${player.deck.length}/${MAX_DECK_SIZE}`} color={C.textDim} />
      </div>
    </div>
  );
}

// ── Wooden table background (DCC table visual) ───────────────────────────────
function WoodenTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "repeating-linear-gradient(90deg, #2A1A08 0px, #3A2210 6px, #2E1C0A 12px, #2A1A08 18px)",
      borderTop: "3px solid #4A2E10", borderBottom: "3px solid #1A0C04",
      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,200,100,0.05)",
      padding: 2,
    }}>
      {children}
    </div>
  );
}

// ── Felt game area ──────────────────────────────────────────────────────────
function FeltArea({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight
        ? "radial-gradient(ellipse at center, #1A4A1A 0%, #0D2E0D 100%)"
        : "radial-gradient(ellipse at center, #0D3010 0%, #081A08 100%)",
      border: `2px solid ${highlight ? "#3A7A3A" : "#153015"}`,
      boxShadow: "inset 0 1px 6px rgba(0,0,0,0.6)",
      flex: 1,
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

// ── Card scale hook — larger cards on big screens ────────────────────────────
function useCardScale(): number {
  const [scale, setScale] = useState(() => {
    const w = window.innerWidth;
    if (w >= 1400) return 1.4;
    if (w >= 1000) return 1.25;
    if (w >= 700)  return 1.1;
    return 1.0;
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1400) setScale(1.4);
      else if (w >= 1000) setScale(1.25);
      else if (w >= 700)  setScale(1.1);
      else setScale(1.0);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CardsScreen() {
  const {
    player, recordDCCWin, pendingCardUpgrades, applyCardUpgrade,
    upgradeCard, addCardToDeck, removeCardFromDeck, maxUpgradeCard,
    sellCard, mergeTwoCards,
  } = useGame();
  const [dcc, setDCC]             = useState<DCCState | null>(null);
  const [dccTab, setDccTab]       = useState<DccTab>("table");
  const [cardMsg, setCardMsg]     = useState<string | null>(null);
  const [inspectCard, setInspectCard] = useState<Card | null>(null);
  const [mergeSlot1, setMergeSlot1]   = useState<Card | null>(null);
  const [mergeSlot2, setMergeSlot2]   = useState<Card | null>(null);
  const [mergeFused, setMergeFused]   = useState(false);

  const cardScale = useCardScale();
  const themeInfo = getDCCThemeInfo(player.dccLevel);

  const startDCC = useCallback(() => {
    if (player.deck.length === 0) return;
    const playerDeck = shuffleArr(player.deck);
    const { drawn: hand, remaining: deck } = drawCards(playerDeck, 4);
    const enemyDeck = shuffleArr(buildDCCEnemyDeck(player.dccLevel, getBiome(player.bossKills)));
    setDCC({
      round: 1, sp: 2, enemySp: 2,
      lanes: initLanes(), hand, deck, enemyDeck,
      phase: "playing", selectedCard: null,
      logs: ["Round 1 — SP: 2 · Place cards, then End Turn."],
      result: null, xpGained: 0, moneyGained: 0,
      leveled: false, newLevel: player.dccLevel, upgradesLeft: 0, rewardCard: null,
    });
    setDccTab("table");
  }, [player.deck, player.dccLevel]);

  const selectCard = (card: Card) => {
    if (!dcc || dcc.phase !== "playing") return;
    setDCC(d => d ? { ...d, selectedCard: d.selectedCard?.id === card.id ? null : card } : d);
  };

  const placeCard = (laneIdx: number) => {
    if (!dcc || !dcc.selectedCard || dcc.phase !== "playing") return;
    const card = dcc.selectedCard;
    if (card.cost > dcc.sp) {
      setDCC(d => d ? { ...d, logs: [`Need ${card.cost} SP (have ${dcc.sp}).`, ...d.logs].slice(0, 12) } : d);
      return;
    }
    setDCC(d => {
      if (!d || !d.selectedCard) return d;
      const lanes = d.lanes.map((l, i) =>
        i === laneIdx ? { ...l, player: [...l.player, d.selectedCard!] } : l
      );
      return {
        ...d,
        sp: d.sp - card.cost,
        hand: d.hand.filter(c => c.id !== d.selectedCard!.id),
        lanes, selectedCard: null,
        logs: [`Placed ${card.name} → lane ${laneIdx + 1}`, ...d.logs].slice(0, 10),
      };
    });
  };

  const endTurn = () => {
    if (!dcc || dcc.phase !== "playing") return;
    let eSp   = dcc.enemySp;
    let eHand = shuffleArr(dcc.enemyDeck).slice(0, 3 + dcc.round);
    let lanes = dcc.lanes.map(l => ({ ...l }));
    const eLogs: string[] = [];

    for (let plays = 0; plays < 2; plays++) {
      const move = enemyAI(eHand, lanes, eSp, dcc.round);
      if (!move) break;
      lanes  = lanes.map((l, i) => i === move.lane ? { ...l, enemy: [...l.enemy, move.card] } : l);
      eHand  = eHand.filter(c => c.id !== move.card.id);
      eSp   -= move.card.cost;
      eLogs.push(`Enemy → ${move.card.name} L${move.lane + 1}`);
    }

    const logs      = [...eLogs, ...dcc.logs].slice(0, 10);
    const nextRound = dcc.round + 1;

    if (nextRound > ROUND_COUNT) {
      setDCC({
        ...dcc, lanes, round: nextRound, enemySp: eSp,
        phase: "reviewing",
        logs: [...eLogs, ...dcc.logs].slice(0, 10),
        result: null, xpGained: 0, moneyGained: 0,
        leveled: false, newLevel: player.dccLevel, upgradesLeft: 0, rewardCard: null,
      });
    } else {
      const newSP  = calcSP(nextRound, dcc.sp);
      const newESP = calcSP(nextRound, eSp);
      const { drawn: newCards, remaining } = drawCards(dcc.deck, Math.min(2, dcc.deck.length));
      setDCC({
        ...dcc, lanes, round: nextRound, sp: newSP, enemySp: newESP,
        hand: [...dcc.hand, ...newCards], deck: remaining,
        phase: "playing", selectedCard: null,
        logs: [`Round ${nextRound} — SP: ${newSP}`, ...logs].slice(0, 10),
      });
    }
  };

  const closeDCC = () => {
    if (!dcc) return;
    if (dcc.upgradesLeft > 0 && dcc.phase === "result") {
      setDCC({ ...dcc, phase: "upgrade" });
    } else {
      setDCC(null);
    }
  };

  const finalizeResult = () => {
    if (!dcc) return;
    const { player: pWins, enemy: eWins, laneSummary } = evalLanes(dcc.lanes, ROUND_COUNT);
    const result: "win" | "loss" | "draw" = pWins > eWins ? "win" : eWins > pWins ? "loss" : "draw";
    let xpGained = 0, moneyGained = 0, leveled = false;
    let newLevel = player.dccLevel, upgradesLeft = 0;
    let rewardCard: Card | null = null;
    if (result === "win") {
      xpGained    = 30;
      moneyGained = 80 + player.dccLevel * 25;
      const r     = recordDCCWin(xpGained, moneyGained);
      leveled     = r.leveled;
      newLevel    = r.newLevel;
      rewardCard  = r.rewardCard;
      if (leveled) upgradesLeft = (newLevel - player.dccLevel) * 2;
    }
    setDCC({
      ...dcc,
      phase: "result", result, xpGained, moneyGained, leveled, newLevel,
      upgradesLeft, rewardCard,
      logs: [...laneSummary, `${result === "win" ? "★ YOU WIN" : result === "loss" ? "✘ DEFEAT" : "↔ DRAW"}`, ...dcc.logs].slice(0, 12),
    });
  };

  const handleUpgrade = (card: Card) => {
    if (!dcc || dcc.upgradesLeft <= 0) return;
    applyCardUpgrade(card.name);
    const next = dcc.upgradesLeft - 1;
    setDCC(next <= 0 ? null : { ...dcc, upgradesLeft: next });
  };

  const deckPool       = player.deckPool ?? player.deck ?? [];
  const upgradeOptions = [...deckPool].sort((a, b) => a.name.localeCompare(b.name));

  function handleToggleDeck(card: Card) {
    const inDeck = player.deck.some(c => c.id === card.id);
    if (inDeck) {
      removeCardFromDeck(card.id);
      setCardMsg(`Removed ${card.name} from deck.`);
    } else {
      if (player.deck.length >= MAX_DECK_SIZE) {
        setCardMsg(`Deck full (${MAX_DECK_SIZE} max). Remove a card first.`);
        return;
      }
      addCardToDeck(card.id);
      setCardMsg(`Added ${card.name} to deck.`);
    }
    setTimeout(() => setCardMsg(null), 1800);
  }

  function handleUpgradeCard(cardName: string) {
    const ok = upgradeCard(cardName);
    setCardMsg(ok ? `${cardName} upgraded!` : "Not enough gold or card is max level.");
    setTimeout(() => setCardMsg(null), 1800);
  }

  // ── Reviewing phase — final board state, all rounds done ────────────────────
  if (dcc && dcc.phase === "reviewing") {
    const numCols = cardScale >= 0.9 ? 4 : 2;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#1A0E04", overflow: "hidden" }}>
        <WoodenTable>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 13 }}>♠ FINAL BOARD — Round {ROUND_COUNT}/{ROUND_COUNT}</span>
          </div>
        </WoodenTable>
        <FeltArea>
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ backgroundColor: "#0A0000cc", padding: "3px 10px", borderBottom: "1px solid #3A7A3A55" }}>
              <span className="pixel-text" style={{ color: C.redBright, fontSize: 10 }}>ENEMY SIDE — FINAL STATE</span>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "2px solid #3A7A3A" }}>
              {dcc.lanes.map((l, i) => {
                const { enemy: ePow } = calcLanePower(l, i, ROUND_COUNT);
                const cols = Array.from({ length: numCols }, (_, ci) => l.enemy.filter((_, j) => j % numCols === ci));
                return (
                  <div key={i} style={{ borderRight: i < 2 ? "1px solid #3A7A3A55" : undefined, padding: "2px 2px 0", display: "flex", flexDirection: "column", overflowY: "hidden" }}>
                    {l.enemy.length === 0
                      ? <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10, margin: "auto", alignSelf: "center", paddingTop: 8 }}>—</span>
                      : <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {cols.map((col, ci) => col.length > 0 && (
                            <div key={ci} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                              {col.map((c, j) => <div key={c.id + j} style={{ marginTop: j > 0 ? Math.round(-65 * cardScale) : 0, position: "relative", zIndex: j }}><FullCard card={c} isEnemy scale={cardScale} /></div>)}
                            </div>
                          ))}
                        </div>
                    }
                    {ePow > 0 && <div style={{ marginTop: "auto", textAlign: "right", padding: "0 2px 1px" }}><span className="pixel-text" style={{ color: "#A03030", fontSize: 10 }}>Σ{ePow}</span></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ backgroundColor: "#071207", borderTop: "2px solid #3A7A3A", borderBottom: "2px solid #3A7A3A", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                {dcc.lanes.map((l, i) => {
                  const { player: pPow, enemy: ePow } = calcLanePower(l, i, ROUND_COUNT);
                  return (
                    <div key={i} style={{ borderRight: i < 2 ? "1px solid #3A7A3A44" : undefined, padding: "3px 6px", textAlign: "center" }}>
                      <span className="pixel-text" style={{ fontSize: 14, color: pPow > ePow ? C.green : pPow < ePow ? C.redBright : C.yellow }}>
                        {pPow}:{ePow}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "3px 8px" }}>
                <button onClick={finalizeResult} style={{
                  width: "100%", padding: "5px 0", backgroundColor: "#0A1A0A", border: "1px solid #2A5A2A",
                  color: C.green, fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer", letterSpacing: 1,
                }}>
                  NEXT → SEE RESULTS
                </button>
              </div>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #3A7A3A22" }}>
              {dcc.lanes.map((l, i) => {
                const { player: pPow } = calcLanePower(l, i, ROUND_COUNT);
                const cols = Array.from({ length: numCols }, (_, ci) => l.player.filter((_, j) => j % numCols === ci));
                return (
                  <div key={i} style={{ borderRight: i < 2 ? "1px solid #3A7A3A55" : undefined, padding: "2px 2px 0", display: "flex", flexDirection: "column", overflowY: "hidden" }}>
                    {l.player.length === 0
                      ? <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10, margin: "auto", alignSelf: "center", paddingTop: 8 }}>—</span>
                      : <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {cols.map((col, ci) => col.length > 0 && (
                            <div key={ci} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                              {col.map((c, j) => <div key={c.id + j} style={{ marginTop: j > 0 ? Math.round(-65 * cardScale) : 0, position: "relative", zIndex: j }}><FullCard card={c} scale={cardScale} /></div>)}
                            </div>
                          ))}
                        </div>
                    }
                    {pPow > 0 && <div style={{ marginTop: "auto", textAlign: "right", padding: "0 2px 1px" }}><span className="pixel-text" style={{ color: "#308030", fontSize: 10 }}>Σ{pPow}</span></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ backgroundColor: "#000A00cc", padding: "3px 10px", borderTop: "1px solid #3A7A3A55" }}>
              <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>YOUR SIDE — FINAL STATE</span>
            </div>
          </div>
        </FeltArea>
        <WoodenTable>
          <div style={{ padding: "4px 8px" }}>
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>All {ROUND_COUNT} rounds played — press NEXT to see results</span>
          </div>
        </WoodenTable>
      </div>
    );
  }

  // ── Result phase ────────────────────────────────────────────────────────────
  if (dcc && dcc.phase === "result") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
        <DccHeader themeInfo={themeInfo} player={player} pendingCardUpgrades={pendingCardUpgrades} />
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            backgroundColor: dcc.result === "win" ? "#001A00" : dcc.result === "loss" ? "#1A0000" : C.bg2,
            border: `2px solid ${dcc.result === "win" ? C.green : dcc.result === "loss" ? C.redBright : C.textDim}`,
            padding: "10px 14px",
          }}>
            <span className="pixel-text" style={{ fontSize: 24, color: dcc.result === "win" ? C.green : dcc.result === "loss" ? C.redBright : C.textDim }}>
              {dcc.result === "win" ? "★ VICTORY!" : dcc.result === "loss" ? "✘ DEFEAT" : "↔ DRAW"}
            </span>
            {dcc.result === "win" && (
              <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 15 }}>+${dcc.moneyGained}</span>
                <span className="pixel-text" style={{ color: C.cyan,   fontSize: 15 }}>+{dcc.xpGained} XP</span>
                {dcc.leveled && <span className="pixel-text" style={{ color: C.green, fontSize: 15 }}>★ Level {dcc.newLevel}!</span>}
              </div>
            )}
          </div>

          {dcc.rewardCard && (
            <div style={{
              backgroundColor: "#0A0A1A", border: `2px solid ${themeInfo.color}`,
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <CardArt name={dcc.rewardCard.name} size={44} />
              <div>
                <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 11 }}>
                  {player.deck.length < MAX_DECK_SIZE ? "NEW CARD ADDED TO DECK" : "NEW CARD ADDED TO COLLECTION"}
                </span>
                <span className="pixel-text" style={{ color: C.text, fontSize: 17, display: "block" }}>
                  {dcc.rewardCard.name}
                </span>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                  {dcc.rewardCard.cost}sp · p{dcc.rewardCard.power}
                </span>
              </div>
            </div>
          )}

          <div style={{ border: "2px solid #000", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", backgroundColor: C.bg3, borderBottom: "2px solid #000" }}>
              {[1,2,3].map(n => (
                <div key={n} style={{ padding: "4px 0", textAlign: "center", borderRight: n < 3 ? "1px solid #000" : undefined }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>LANE {n}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {dcc.lanes.map((l, i) => {
                const { player: pPow, enemy: ePow } = calcLanePower(l, i, ROUND_COUNT);
                const won = pPow > ePow, lost = ePow > pPow;
                return (
                  <div key={i} style={{
                    padding: "6px 8px", borderRight: i < 2 ? "1px solid #000" : undefined,
                    backgroundColor: won ? "#001A00" : lost ? "#1A0000" : C.bg2,
                  }}>
                    <span className="pixel-text" style={{ color: won ? C.green : lost ? C.redBright : C.textDim, fontSize: 12, display: "block" }}>
                      {won ? "✔ WIN" : lost ? "✘ LOSS" : "↔ TIE"}
                    </span>
                    <span className="pixel-text" style={{ color: C.text, fontSize: 11 }}>
                      You: {pPow} · Foe: {ePow}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {dcc.logs.map((l, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: 11,
                color: l.startsWith("✔") ? C.green : l.startsWith("✘") ? C.redBright : l.startsWith("★") ? C.yellow : C.textDim,
              }}>{l}</span>
            ))}
          </div>

          <PixelButton
            onClick={closeDCC}
            color={dcc.result === "win" ? C.green : dcc.result === "loss" ? C.redBright : C.bg3}
            textColor={dcc.result === "win" ? "#052002" : "#fff"}
          >
            {dcc.leveled ? "★ UPGRADE CARDS →" : "BACK"}
          </PixelButton>
        </div>
      </div>
    );
  }

  // ── Upgrade picker phase ─────────────────────────────────────────────────────
  if (dcc && dcc.phase === "upgrade") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
        <DccHeader themeInfo={themeInfo} player={player} pendingCardUpgrades={pendingCardUpgrades} />
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ backgroundColor: "#001A00", border: `2px solid ${C.green}`, padding: "8px 12px" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 18 }}>★ LEVEL UP! Pick a card to upgrade</span>
            <br />
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>
              {dcc.upgradesLeft} upgrade{dcc.upgradesLeft !== 1 ? "s" : ""} left
            </span>
          </div>
          {upgradeOptions.map((c, i) => (
            <div key={c.id + i} onClick={() => handleUpgrade(c)}
              style={{ backgroundColor: C.bg2, border: "2px solid #000", padding: 10, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <FullCard card={c} scale={cardScale} />
              <div style={{ flex: 1 }}>
                <span className="pixel-text" style={{ color: C.text, fontSize: 16 }}>{c.name}</span>
                <br />
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                  Cost: {c.cost} SP · Power: {c.power} → {c.power + 1}
                </span>
              </div>
              <PixelButton small color={C.green} textColor="#052002">↑ PICK</PixelButton>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Playing phase — wooden table DCC ─────────────────────────────────────────
  if (dcc && dcc.phase === "playing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#1A0E04", overflow: "hidden" }}>
        {/* Round header on wooden bar */}
        <WoodenTable>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 13 }}>
              ♠ BLACK ROSE — {themeInfo.fullName}
            </span>
            <StatChip label="R"    value={`${dcc.round}/${ROUND_COUNT}`} color={C.textDim} />
            <StatChip label="SP"   value={dcc.sp}    color={C.green}    />
            <StatChip label="E.SP" value={dcc.enemySp} color={C.redBright} />
            {dcc.selectedCard && (
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, marginLeft: 4 }}>
                → tap lane
              </span>
            )}
          </div>
        </WoodenTable>

        {/* FELT TABLE — main area */}
        <FeltArea highlight={!!dcc.selectedCard}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Enemy row header */}
            <div style={{ backgroundColor: "#0A0000cc", padding: "3px 10px", borderBottom: "1px solid #3A7A3A55" }}>
              <span className="pixel-text" style={{ color: C.redBright, fontSize: 10 }}>ENEMY SIDE</span>
            </div>

            {/* Enemy lane area */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "2px solid #3A7A3A" }}>
              {dcc.lanes.map((l, i) => {
                const { enemy: ePow } = calcLanePower(l, i);
                const numCols = cardScale >= 0.9 ? 4 : 2;
                const cols = Array.from({ length: numCols }, (_, ci) => l.enemy.filter((_, j) => j % numCols === ci));
                return (
                  <div key={i} style={{
                    borderRight: i < 2 ? "1px solid #3A7A3A55" : undefined,
                    padding: "2px 2px 0", display: "flex", flexDirection: "column",
                    overflowY: "hidden",
                  }}>
                    {l.enemy.length === 0
                      ? <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10, margin: "auto", alignSelf: "center", paddingTop: 8 }}>—</span>
                      : <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {cols.map((col, ci) => col.length > 0 && (
                            <div key={ci} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                              {col.map((c, j) => (
                                <div key={c.id + j} style={{ marginTop: j > 0 ? Math.round(-65 * cardScale) : 0, position: "relative", zIndex: j }}>
                                  <FullCard card={c} isEnemy scale={cardScale} />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                    }
                    {ePow > 0 && (
                      <div style={{ marginTop: "auto", textAlign: "right", padding: "0 2px 1px" }}>
                        <span className="pixel-text" style={{ color: "#A03030", fontSize: 10 }}>Σ{ePow}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Score row + centered END TURN */}
            <div style={{ backgroundColor: "#071207", borderTop: "2px solid #3A7A3A", borderBottom: "2px solid #3A7A3A", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                {dcc.lanes.map((l, i) => {
                  const { player: pPow, enemy: ePow } = calcLanePower(l, i);
                  return (
                    <div key={i} onClick={() => dcc.selectedCard && placeCard(i)}
                      style={{
                        borderRight: i < 2 ? "1px solid #3A7A3A44" : undefined,
                        padding: "3px 6px", textAlign: "center",
                        cursor: dcc.selectedCard ? "pointer" : "default",
                        backgroundColor: dcc.selectedCard ? "#1A2A0A" : undefined,
                      }}>
                      <span className="pixel-text" style={{
                        fontSize: 14,
                        color: pPow > ePow ? C.green : pPow < ePow ? C.redBright : C.yellow,
                      }}>
                        {pPow}:{ePow}
                      </span>
                      {dcc.selectedCard && (
                        <span className="pixel-text" style={{ color: C.yellow, fontSize: 8, display: "block" }}>↑ PLACE</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "3px 8px" }}>
                <button onClick={endTurn} style={{
                  width: "100%", padding: "5px 0",
                  backgroundColor: "#0A1A0A",
                  border: "1px solid #2A5A2A",
                  color: C.green,
                  fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer",
                  letterSpacing: 1,
                }}>
                  ▶ END TURN
                </button>
              </div>
            </div>

            {/* Player lane area */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #3A7A3A22" }}>
              {dcc.lanes.map((l, i) => {
                const { player: pPow } = calcLanePower(l, i);
                const numCols = cardScale >= 0.9 ? 4 : 2;
                const cols = Array.from({ length: numCols }, (_, ci) => l.player.filter((_, j) => j % numCols === ci));
                return (
                  <div key={i} onClick={() => dcc.selectedCard && placeCard(i)}
                    style={{
                      borderRight: i < 2 ? "1px solid #3A7A3A55" : undefined,
                      padding: "2px 2px 0", display: "flex", flexDirection: "column",
                      cursor: dcc.selectedCard ? "pointer" : "default",
                      outline: dcc.selectedCard ? `2px solid ${C.yellow}44` : undefined,
                      overflowY: "hidden",
                    }}>
                    {l.player.length === 0
                      ? <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10, margin: "auto", alignSelf: "center", paddingTop: 8 }}>—</span>
                      : <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {cols.map((col, ci) => col.length > 0 && (
                            <div key={ci} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                              {col.map((c, j) => (
                                <div key={c.id + j} style={{ marginTop: j > 0 ? Math.round(-65 * cardScale) : 0, position: "relative", zIndex: j }}>
                                  <FullCard card={c} scale={cardScale} />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                    }
                    {pPow > 0 && (
                      <div style={{ marginTop: "auto", textAlign: "right", padding: "0 2px 1px" }}>
                        <span className="pixel-text" style={{ color: "#308030", fontSize: 10 }}>Σ{pPow}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Player row header */}
            <div style={{ backgroundColor: "#000A00cc", padding: "3px 10px", borderTop: "1px solid #3A7A3A55" }}>
              <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>YOUR SIDE</span>
            </div>
          </div>
        </FeltArea>

        {/* Log */}
        <div style={{ padding: "2px 10px", backgroundColor: "#0D0804", borderTop: "1px solid #2A1A08" }}>
          <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
            {dcc.logs[0] || "—"}
          </span>
        </div>

        {/* Hand area on wooden shelf */}
        <WoodenTable>
          <div style={{ overflowY: "auto", maxHeight: 260 }}>
            {dcc.hand.length === 0 ? (
              <span className="pixel-text" style={{ color: "#8A6040", fontSize: 12 }}>
                Empty hand — tap END TURN above
              </span>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardScale >= 0.9 ? 6 : 4}, 1fr)`, gap: 1, padding: "1px 0" }}>
                {dcc.hand.map(card => (
                  <FullCard
                    key={card.id}
                    card={card}
                    selected={dcc.selectedCard?.id === card.id}
                    dimmed={card.cost > dcc.sp}
                    onClick={() => selectCard(card)}
                    scale={cardScale}
                  />
                ))}
              </div>
            )}
          </div>
        </WoodenTable>
      </div>
    );
  }

  // ── Idle — lobby ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
      <DccHeader themeInfo={themeInfo} player={player} pendingCardUpgrades={pendingCardUpgrades} />

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", flexShrink: 0 }}>
        {(["table", "deck", "collection", "merge"] as DccTab[]).map(t => (
          <button key={t} onClick={() => setDccTab(t)} style={{
            flex: 1, padding: "7px 0",
            backgroundColor: dccTab === t ? "#0A0A1A" : C.bg2,
            border: "none", borderBottom: dccTab === t ? `2px solid ${themeInfo.color}` : "2px solid transparent",
            color: dccTab === t ? themeInfo.color : C.textDim,
            fontFamily: "'VT323', monospace", fontSize: 14, cursor: "pointer",
          }}>
            {t === "table" ? "♠ ROSE" : t === "deck" ? "DECK" : t === "collection" ? "ALL" : "MERGE"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {dccTab === "table" ? (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Card table visualization */}
            <div style={{
              background: "repeating-linear-gradient(90deg, #2A1A08 0px, #3A2210 6px, #2E1C0A 12px, #2A1A08 18px)",
              border: "5px solid #5A3618",
              borderRadius: 6,
              padding: 5,
              boxShadow: "0 4px 0 #000, inset 0 2px 4px rgba(255,200,80,0.06)",
            }}>
              {/* Green felt */}
              <div style={{
                background: "radial-gradient(ellipse at 50% 40%, #1A5A1A 0%, #0D3210 55%, #071A07 100%)",
                border: "2px solid #2A5A2A",
                borderRadius: 3,
                padding: "16px 14px 14px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                minHeight: 240, position: "relative", overflow: "hidden",
              }}>
                {/* Felt texture lines */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 10px)",
                }} />
                {/* Title */}
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <span className="pixel-text" style={{
                    color: themeInfo.color, fontSize: 24, display: "block",
                    textShadow: `0 0 12px ${themeInfo.color}55`,
                  }}>
                    ♠ THE BLACK ROSE ♠
                  </span>
                  <span className="pixel-text" style={{ color: "#3A7A3A", fontSize: 11 }}>
                    {themeInfo.fullName} · {ROUND_COUNT} rounds · win 2/3 lanes
                  </span>
                </div>
                {/* Opponent face-down cards */}
                <div style={{ display: "flex", gap: 5, alignItems: "center", position: "relative", zIndex: 1 }}>
                  <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 9, marginRight: 4 }}>OPPONENT</span>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      width: 22, height: 32, flexShrink: 0,
                      background: "linear-gradient(145deg, #2A0A3A 0%, #1A052A 100%)",
                      border: "1px solid #5A2A7A", borderRadius: 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: `rotate(${(i - 1.5) * 5}deg)`,
                      boxShadow: "2px 2px 0 #000",
                    }}>
                      <span style={{ color: "#4A1A6A", fontSize: 9, fontFamily: "monospace" }}>♠</span>
                    </div>
                  ))}
                </div>
                {/* Lane dividers */}
                <div style={{ display: "flex", gap: 6, position: "relative", zIndex: 1 }}>
                  {[1,2,3].map(n => (
                    <div key={n} style={{
                      width: 52, height: 32, flexShrink: 0,
                      border: "1px solid #2A5A2A", borderRadius: 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backgroundColor: "#0A200A88",
                      boxShadow: "inset 0 1px 4px rgba(0,0,0,0.4)",
                    }}>
                      <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10 }}>LANE {n}</span>
                    </div>
                  ))}
                </div>
                {/* CTA */}
                <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                  <PixelButton
                    onClick={startDCC}
                    disabled={player.deck.length === 0}
                    color={player.deck.length === 0 ? C.bg3 : themeInfo.color}
                    textColor={player.deck.length === 0 ? C.textDim : "#000"}
                  >
                    {player.deck.length === 0 ? "ADD CARDS TO DECK FIRST" : "♠ SIT DOWN & PLAY"}
                  </PixelButton>
                </div>
                <span className="pixel-text" style={{ color: "#2A6A2A", fontSize: 10, position: "relative", zIndex: 1 }}>
                  {player.deck.length}/{MAX_DECK_SIZE} cards in deck
                </span>
              </div>
            </div>

            {pendingCardUpgrades > 0 && (
              <div style={{ backgroundColor: "#001A00", border: `2px solid ${C.green}`, padding: "8px 12px" }}>
                <span className="pixel-text" style={{ color: C.green, fontSize: 14 }}>
                  ★ {pendingCardUpgrades} card upgrade{pendingCardUpgrades > 1 ? "s" : ""} available — go to DECK tab
                </span>
              </div>
            )}

            {cardMsg && (
              <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{cardMsg}</span>
            )}
          </div>
        ) : dccTab === "deck" ? (
          /* ── DECK tab ─────────────────────────────────────────────────────── */
          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                Owned: {upgradeOptions.length} · Deck: {player.deck.length}/{MAX_DECK_SIZE}
              </span>
              <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 11 }}>
                tap card to inspect
              </span>
            </div>

            {/* Merge tip — point to the MERGE tab */}
            {(() => {
              const nameCounts: Record<string, number> = {};
              upgradeOptions.forEach(c => { nameCounts[c.name] = (nameCounts[c.name] ?? 0) + 1; });
              const hasDupes = Object.values(nameCounts).some(c => c >= 2);
              if (!hasDupes) return null;
              return (
                <div style={{ paddingBottom: 4, borderBottom: `1px solid #333` }}>
                  <span className="pixel-text" style={{ color: "#CC88FF", fontSize: 10 }}>
                    ⇒ You have duplicate cards — go to the MERGE tab to combine them into starred versions.
                  </span>
                </div>
              );
            })()}

            {/* Deck cards first (highlighted), then rest */}
            {(() => {
              const inDeckCards  = upgradeOptions.filter(c => player.deck.some(d => d.id === c.id));
              const outDeckCards = upgradeOptions.filter(c => !player.deck.some(d => d.id === c.id));

              const renderGrid = (cards: typeof inDeckCards, sectionLabel?: string) => (
                <div key={sectionLabel}>
                  {sectionLabel && (
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block", marginBottom: 4 }}>
                      {sectionLabel}
                    </span>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardScale >= 0.9 ? 6 : 4}, 1fr)`, gap: 3 }}>
                    {cards.map((c, i) => {
                      const inDeck  = player.deck.some(d => d.id === c.id);
                      const lvl     = player.collection[c.name] || 1;
                      const maxLvl  = lvl >= 5;
                      const upgCost = 50 * lvl;
                      const canAffordAll = player.money >= upgCost;
                      return (
                        <div
                          key={c.id + i}
                          onClick={() => setInspectCard(c)}
                          style={{
                            backgroundColor: inDeck ? themeInfo.color + "18" : C.bg2,
                            border: `1px solid ${inDeck ? themeInfo.color : "#2A2A2A"}`,
                            padding: "2px 2px 2px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                            cursor: "pointer",
                            transition: "border-color 0.15s, background-color 0.15s",
                          }}
                        >
                          <FullCard card={c} scale={cardScale} />
                          <span className="pixel-text" style={{ color: C.text, fontSize: 9, textAlign: "center", lineHeight: 1.1 }}>
                            {c.name}
                          </span>
                          <span className="pixel-text" style={{ color: C.textDim, fontSize: 8 }}>
                            {c.cost}sp·p{c.power}·L{lvl}
                          </span>
                          {inDeck && (
                            <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 7 }}>
                              ♠ DECK
                            </span>
                          )}
                          <div onClick={e => e.stopPropagation()} style={{ width: "100%" }}>
                            <PixelButton small
                              color={themeInfo.color + "33"} textColor={themeInfo.color}
                              onClick={() => setInspectCard(c)}
                              style={{ width: "100%", fontSize: 8 }}
                            >
                              INSPECT
                            </PixelButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

              return (
                <>
                  {inDeckCards.length > 0 && renderGrid(inDeckCards, `♠ IN DECK (${inDeckCards.length}/${MAX_DECK_SIZE})`)}
                  {outDeckCards.length > 0 && renderGrid(outDeckCards, inDeckCards.length > 0 ? "OWNED — NOT IN DECK" : undefined)}
                  {upgradeOptions.length === 0 && (
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>
                      Win DCC games to earn cards. Go to ♠ BLACK ROSE tab to play.
                    </span>
                  )}
                </>
              );
            })()}

            {cardMsg && (
              <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{cardMsg}</span>
            )}
          </div>
        ) : dccTab === "merge" ? (
          /* ── MERGE tab ──────────────────────────────────────────────────────── */
          (() => {
            const mergeScale = Math.min(cardScale, 0.9);
            const canFuse = !!(mergeSlot1 && mergeSlot2 && mergeSlot1.name === mergeSlot2.name
              && (mergeSlot1.name.match(/★/g) || []).length < 5);
            const fusedPreview: Card | null = canFuse ? {
              id: "preview",
              name: mergeSlot1!.name.trimEnd() + " ★",
              cost: mergeSlot1!.cost,
              power: mergeSlot1!.power + mergeSlot2!.power,
              text: mergeSlot1!.text,
            } : null;

            function handleMergeCardClick(card: Card) {
              if (mergeFused) return;
              if (mergeSlot1?.id === card.id) { setMergeSlot1(null); setMergeSlot2(null); return; }
              if (mergeSlot2?.id === card.id) { setMergeSlot2(null); return; }
              if (!mergeSlot1) { setMergeSlot1(card); return; }
              if (!mergeSlot2 && mergeSlot1.name === card.name) { setMergeSlot2(card); return; }
              setMergeSlot1(card); setMergeSlot2(null);
            }

            function handleConfirmMerge() {
              if (!mergeSlot1 || !fusedPreview) return;
              mergeTwoCards(mergeSlot1.name);
              setCardMsg(`⇒ Fused into ${fusedPreview.name} (p${fusedPreview.power})!`);
              setTimeout(() => setCardMsg(null), 3000);
              setMergeSlot1(null); setMergeSlot2(null); setMergeFused(false);
            }

            const SlotBox = ({ card, label, onClick: slotClick }: { card: Card | null; label: string; onClick?: () => void }) => (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>{label}</span>
                <div
                  onClick={slotClick}
                  style={{
                    width: Math.round(60 * mergeScale) + 4, height: Math.round(92 * mergeScale) + 4,
                    border: card ? `2px solid #8844CC` : `2px dashed #3A2A50`,
                    backgroundColor: card ? "#160828" : "#0A0616",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: card ? "pointer" : "default",
                    flexShrink: 0,
                  }}>
                  {card
                    ? <FullCard card={card} scale={mergeScale} />
                    : <span className="pixel-text" style={{ color: "#3A2A50", fontSize: 10, textAlign: "center" }}>Pick a{"\n"}card</span>
                  }
                </div>
                {card && (
                  <span className="pixel-text" style={{ color: "#8844CC", fontSize: 9 }}>tap to remove</span>
                )}
              </div>
            );

            return (
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg, #1A0830 0%, #2A1050 50%, #1A0830 100%)",
                  border: "2px solid #8844CC", padding: "8px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span className="pixel-text" style={{ color: "#CC88FF", fontSize: 18 }}>⇒</span>
                  <div>
                    <span className="pixel-text" style={{ color: "#CC88FF", fontSize: 15 }}>CARD FUSION FORGE</span>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block", marginTop: 1 }}>
                      Place 2 identical cards in the slots · Fuse → ★ powered-up version · Max ★★★★★
                    </span>
                  </div>
                </div>

                {/* Fusion bench: [SLOT 1] ⇒ [SLOT 2] = [RESULT] */}
                <div style={{
                  backgroundColor: "#0D0520", border: "2px solid #3A1A60",
                  padding: "14px 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 10, flexWrap: "wrap",
                }}>
                  <SlotBox card={mergeSlot1} label="SLOT 1" onClick={mergeSlot1 ? () => { setMergeSlot1(null); setMergeSlot2(null); setMergeFused(false); } : undefined} />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span className="pixel-text" style={{ color: canFuse ? "#8844CC" : "#2A1A40", fontSize: 20 }}>⇒</span>
                    {canFuse && !mergeFused && (
                      <PixelButton color="#6633AA" textColor="#EEB0FF"
                        onClick={() => setMergeFused(true)}
                        style={{ fontSize: 11, padding: "4px 10px" }}>
                        FUSE
                      </PixelButton>
                    )}
                    {mergeSlot1 && mergeSlot2 && mergeSlot1.name !== mergeSlot2.name && (
                      <span className="pixel-text" style={{ color: "#AA4444", fontSize: 9, textAlign: "center", maxWidth: 60 }}>
                        Must match!
                      </span>
                    )}
                  </div>

                  <SlotBox card={mergeSlot2} label="SLOT 2" onClick={mergeSlot2 ? () => { setMergeSlot2(null); setMergeFused(false); } : undefined} />

                  <span className="pixel-text" style={{ color: mergeFused ? "#CC88FF" : "#2A1A40", fontSize: 20 }}>=</span>

                  {/* Result slot */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>RESULT</span>
                    {mergeFused && fusedPreview
                      ? <div onClick={handleConfirmMerge} style={{ cursor: "pointer" }}>
                          <FullCard card={fusedPreview} scale={mergeScale} ghosted />
                        </div>
                      : <div style={{
                          width: Math.round(60 * mergeScale) + 4, height: Math.round(92 * mergeScale) + 4,
                          border: "2px dashed #3A1A60", backgroundColor: "#08030F",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span className="pixel-text" style={{ color: "#2A1040", fontSize: 10, textAlign: "center" }}>
                            {fusedPreview ? "Click\nFUSE" : "—"}
                          </span>
                        </div>
                    }
                    {mergeFused && (
                      <span className="pixel-text" style={{ color: "#CC88FF", fontSize: 9 }}>click card to confirm</span>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                {!mergeSlot1 && (
                  <div style={{ backgroundColor: C.bg2, border: "1px solid #2A1A40", padding: "8px 12px", textAlign: "center" }}>
                    <span className="pixel-text" style={{ color: "#6633AA", fontSize: 12 }}>
                      Tap a card below to place it in Slot 1 — then tap another copy for Slot 2
                    </span>
                  </div>
                )}
                {mergeSlot1 && !mergeSlot2 && (
                  <div style={{ backgroundColor: "#0A0520", border: "1px solid #4422AA", padding: "8px 12px", textAlign: "center" }}>
                    <span className="pixel-text" style={{ color: "#9966CC", fontSize: 12 }}>
                      Now tap another <span style={{ color: "#CC88FF" }}>{mergeSlot1.name}</span> for Slot 2
                    </span>
                  </div>
                )}

                {cardMsg && (
                  <div style={{ backgroundColor: "#0A1A0A", border: `1px solid ${C.green}`, padding: "6px 10px" }}>
                    <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>{cardMsg}</span>
                  </div>
                )}

                {/* Card pool */}
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                  YOUR CARDS ({upgradeOptions.length}) — tap to place in slot
                </span>
                {upgradeOptions.length === 0
                  ? <div style={{ backgroundColor: C.bg2, border: "1px solid #333", padding: "20px 16px", textAlign: "center" }}>
                      <span className="pixel-text" style={{ color: "#8844CC", fontSize: 20, display: "block", marginBottom: 6 }}>⇒ ⊕ ⇐</span>
                      <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>
                        No cards yet. Win DCC matches to collect cards.
                      </span>
                    </div>
                  : <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardScale >= 0.9 ? 6 : 4}, 1fr)`, gap: 4 }}>
                      {upgradeOptions.map((c, i) => {
                        const inSlot1 = mergeSlot1?.id === c.id;
                        const inSlot2 = mergeSlot2?.id === c.id;
                        const sameAsSlot1 = mergeSlot1 && !inSlot1 && !inSlot2 && c.name === mergeSlot1.name;
                        const starCount = (c.name.match(/★/g) || []).length;
                        const atMaxStar = starCount >= 5;
                        return (
                          <div
                            key={c.id + i}
                            onClick={() => !mergeFused && !atMaxStar && handleMergeCardClick(c)}
                            style={{
                              backgroundColor: inSlot1 || inSlot2 ? "#1A0840" : sameAsSlot1 ? "#0F0520" : C.bg2,
                              border: `2px solid ${inSlot1 || inSlot2 ? "#CC88FF" : sameAsSlot1 ? "#6633AA" : atMaxStar ? "#2A2A2A" : "#2A1A40"}`,
                              padding: "3px 3px 4px",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                              cursor: mergeFused || atMaxStar ? "default" : "pointer",
                              opacity: atMaxStar ? 0.4 : 1,
                              transition: "border-color 0.1s, background-color 0.1s",
                              position: "relative",
                            }}>
                            {(inSlot1 || inSlot2) && (
                              <div style={{
                                position: "absolute", top: 2, right: 3,
                                backgroundColor: "#CC88FF", color: "#000",
                                fontFamily: "'VT323', monospace", fontSize: 9, padding: "0 2px",
                              }}>
                                {inSlot1 ? "S1" : "S2"}
                              </div>
                            )}
                            {sameAsSlot1 && (
                              <div style={{
                                position: "absolute", top: 2, right: 3,
                                backgroundColor: "#6633AA", color: "#EEB0FF",
                                fontFamily: "'VT323', monospace", fontSize: 9, padding: "0 2px",
                              }}>
                                ✓
                              </div>
                            )}
                            <FullCard card={c} scale={mergeScale} />
                            <span className="pixel-text" style={{ color: C.textDim, fontSize: 8, textAlign: "center", lineHeight: 1.1 }}>
                              {c.name}
                            </span>
                            {atMaxStar && (
                              <span className="pixel-text" style={{ color: C.yellow, fontSize: 8 }}>MAX ★</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            );
          })()
        ) : (
          /* ── COLLECTION tab — all DCC cards, owned or not ──────────────────── */
          (() => {
            const allTemplates = getAllDCCCardTemplates();
            const ownedNames = new Set(upgradeOptions.map(c => c.name));
            return (
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                  All {allTemplates.length} DCC cards — {ownedNames.size} owned
                </span>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardScale >= 0.9 ? 6 : 4}, 1fr)`, gap: 3 }}>
                  {allTemplates.map((t, i) => {
                    const owned = ownedNames.has(t.name);
                    const lvl   = player.collection[t.name] || 0;
                    return (
                      <div key={t.id + i} style={{
                        backgroundColor: owned ? C.bg2 : "#070710",
                        border: `1px solid ${owned ? themeInfo.color + "66" : "#222"}`,
                        padding: "2px 2px 2px",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                        opacity: owned ? 1 : 0.45,
                      }}>
                        <div style={{ filter: owned ? "none" : "grayscale(1) brightness(0.4)" }}>
                          <FullCard card={{ ...t, power: t.power } as any} scale={cardScale} />
                        </div>
                        <span className="pixel-text" style={{ color: owned ? C.text : "#444", fontSize: 9, textAlign: "center", lineHeight: 1.1 }}>
                          {t.name}
                        </span>
                        <span className="pixel-text" style={{ color: C.textDim, fontSize: 8 }}>
                          {t.cost}sp·p{t.power}{owned ? `·L${lvl}` : "·🔒"}
                        </span>
                        {t.text && (
                          <span className="pixel-text" style={{ color: "#605880", fontSize: 9, textAlign: "center", lineHeight: 1.2 }}>
                            {t.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* ── INSPECT card modal ─────────────────────────────────────────────── */}
      {inspectCard && (() => {
        const lvl       = player.collection[inspectCard.name] || 1;
        const maxLvl    = lvl >= 5;
        const upgCost   = 50 * lvl;
        const canAfford = player.money >= upgCost;
        const dupCount  = upgradeOptions.filter(c => c.name === inspectCard.name).length;
        const sellVal   = Math.max(1, inspectCard.power ?? 1) * 10;
        const inDeckNow = player.deck.some(d => d.id === inspectCard.id);
        const deckFull  = player.deck.length >= MAX_DECK_SIZE;
        const maxUpgCost = (() => {
          let cost = 0;
          for (let l = lvl; l < 5; l++) cost += 50 * l;
          return cost;
        })();
        const canAffordMax = player.money >= upgCost;
        return (
          <div style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }} onClick={() => setInspectCard(null)}>
            <div style={{
              backgroundColor: "#0A0A1A", border: `2px solid ${themeInfo.color}`,
              maxWidth: 320, width: "92%", padding: 16,
              display: "flex", flexDirection: "column", gap: 8,
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pixel-text" style={{ color: themeInfo.color, fontSize: 18 }}>♠ INSPECT</span>
                <button onClick={() => setInspectCard(null)} style={{
                  background: "none", border: `1px solid ${themeInfo.color}55`, color: themeInfo.color,
                  cursor: "pointer", fontFamily: "'VT323', monospace", fontSize: 18, padding: "0 8px",
                }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <FullCard card={inspectCard} scale={1.0} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="pixel-text" style={{ color: C.text, fontSize: 16 }}>{inspectCard.name}</span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>Power: {inspectCard.power}</span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>Cost: {inspectCard.cost}sp</span>
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>
                    Level: {lvl}/5 {maxLvl ? "★ MAX" : ""}
                  </span>
                  {!maxLvl && (
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
                      Max cap: L5 (costs ${maxUpgCost} total)
                    </span>
                  )}
                  {inspectCard.text && (
                    <span className="pixel-text" style={{ color: "#A080D0", fontSize: 11, maxWidth: 150, lineHeight: 1.3 }}>
                      {inspectCard.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Deck toggle */}
              {inDeckNow
                ? <PixelButton color="#003344" textColor={C.cyan}
                    onClick={() => removeCardFromDeck(inspectCard.id)}>
                    ♠ REMOVE FROM DECK
                  </PixelButton>
                : <PixelButton
                    color={deckFull ? C.bg3 : "#003300"}
                    textColor={deckFull ? C.textDim : C.green}
                    disabled={deckFull}
                    onClick={() => addCardToDeck(inspectCard.id)}>
                    {deckFull ? `DECK FULL (${MAX_DECK_SIZE})` : "♠ ADD TO DECK"}
                  </PixelButton>
              }

              {/* Upgrade buttons */}
              {maxLvl
                ? <PixelButton color={C.bg3} textColor={C.textDim} disabled>FULLY UPGRADED (MAX L5)</PixelButton>
                : <>
                    <PixelButton
                      color={canAfford ? C.yellow : C.bg3}
                      textColor={canAfford ? "#000" : C.textDim}
                      disabled={!canAfford}
                      onClick={() => {
                        handleUpgradeCard(inspectCard.name);
                        setCardMsg(`Upgraded ${inspectCard.name}!`);
                        setTimeout(() => setCardMsg(null), 2000);
                      }}>
                      ↑ UPGRADE +1 — ${upgCost}
                    </PixelButton>
                    <PixelButton
                      color={canAffordMax ? "#443300" : C.bg3}
                      textColor={canAffordMax ? C.yellow : C.textDim}
                      disabled={!canAffordMax}
                      onClick={() => {
                        maxUpgradeCard(inspectCard.name);
                        setCardMsg(`Max upgraded ${inspectCard.name}!`);
                        setTimeout(() => setCardMsg(null), 2000);
                      }}>
                      ⚡ MAX UPGRADE → L5 (${maxUpgCost})
                    </PixelButton>
                  </>
              }

              {dupCount >= 2 && (
                <div style={{ backgroundColor: "#1A0830", border: "1px solid #3A1060", padding: "4px 8px" }}>
                  <span className="pixel-text" style={{ color: "#CC88FF", fontSize: 11 }}>
                    ×{dupCount} copies — go to MERGE tab to fuse
                  </span>
                </div>
              )}
              <PixelButton color="#440000" textColor="#FF7766"
                onClick={() => {
                  sellCard(inspectCard.id);
                  setCardMsg(`Sold ${inspectCard.name} for $${sellVal}`);
                  setTimeout(() => setCardMsg(null), 2000);
                  setInspectCard(null);
                }}>
                SELL — ${sellVal}
              </PixelButton>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
