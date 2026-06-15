import React, { useState, useCallback, useEffect } from "react";
import { useGame, MAX_DECK_SIZE } from "@/game/state";
import { C, PixelButton, StatChip } from "@/components/PixelUI";
import CardArt, { FullCard } from "@/components/CardArt";
import { getDCCThemeInfo, buildDCCEnemyDeck, getAllDCCCardTemplates, type Card } from "@/game/data";

type DccTab = "table" | "deck" | "collection";
const LANE_COUNT  = 3;
const ROUND_COUNT = 6;

interface Lane { player: Card[]; enemy: Card[] }
type Phase = "idle" | "playing" | "result" | "upgrade";

interface DCCState {
  round: number; sp: number; enemySp: number;
  lanes: Lane[]; hand: Card[]; deck: Card[]; enemyDeck: Card[];
  phase: Phase; selectedCard: Card | null; logs: string[];
  result: "win" | "loss" | "draw" | null;
  xpGained: number; moneyGained: number; leveled: boolean;
  newLevel: number; upgradesLeft: number; rewardCard: Card | null;
}

function calcSP(round: number, prev: number): number { return Math.min(8, prev + (round <= 3 ? 3 : 4)); }

type EffectKind = "assassin" | "archer" | "knight" | "scientist" | "joker" | "surge" | "shield";

function hasEffect(c: Card, kind: EffectKind): boolean {
  const t = c.text ?? "";
  const n = c.name;
  const id = c.id;
  switch (kind) {
    case "assassin":  return t.includes("Lone:") || n.includes("Assassin") || id === "c7"  || id === "c12";
    case "archer":    return t.includes("rightmost") || n === "Archer"     || id === "c3"  || id === "c4";
    case "knight":    return t.includes("per ally")  || n === "Knight"     || id === "c5";
    case "scientist": return t.includes("if paired") || t.includes("BOOM:") || n === "Scientist" || id === "c8";
    case "joker":     return t.includes("Bleed") || n === "Joker"          || id === "c10";
    case "surge":     return t.includes("Surge") || t.includes("Ancient:");
    case "shield":    return t.includes("Shield:");
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
function getShieldAmt(c: Card)    { return extractNum(c.text, /Shield[^+]*\+(\d+)/, 4); }
function getRightmostAmt(c: Card) { return extractNum(c.text, /\+(\d+) if rightmost/, 2); }

function calcCardPower(card: Card, allies: Card[], laneIdx: number, round = 0, foeCards: Card[] = []): number {
  let power = card.power;
  if (hasEffect(card, "assassin"))  { if (allies.length === 0)        power *= 2; }
  if (hasEffect(card, "archer"))    { if (laneIdx === LANE_COUNT - 1) power += getRightmostAmt(card); }
  if (hasEffect(card, "knight"))    { power += getPerAllyAmt(card) * allies.length; }
  if (hasEffect(card, "scientist")) { if (allies.length > 0)          power += getPairedAmt(card); }
  if (hasEffect(card, "surge"))     { if (round >= ROUND_COUNT)       power += getSurgeAmt(card); }
  if (hasEffect(card, "shield"))    { if (foeCards.length === 0)      power += getShieldAmt(card); }
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
    if (w >= 1400) return 1.0;
    if (w >= 1000) return 0.9;
    if (w >= 700)  return 0.8;
    return 0.7;
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1400) setScale(1.0);
      else if (w >= 1000) setScale(0.9);
      else if (w >= 700)  setScale(0.8);
      else setScale(0.7);
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
  } = useGame();
  const [dcc, setDCC]         = useState<DCCState | null>(null);
  const [dccTab, setDccTab]   = useState<DccTab>("table");
  const [cardMsg, setCardMsg] = useState<string | null>(null);

  const cardScale = useCardScale();
  const themeInfo = getDCCThemeInfo(player.dccLevel);

  const startDCC = useCallback(() => {
    if (player.deck.length === 0) return;
    const playerDeck = shuffleArr(player.deck);
    const { drawn: hand, remaining: deck } = drawCards(playerDeck, 4);
    const enemyDeck = shuffleArr(buildDCCEnemyDeck(player.dccLevel));
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
      const { player: pWins, enemy: eWins, laneSummary } = evalLanes(lanes, ROUND_COUNT);
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
        ...dcc, lanes, round: nextRound, enemySp: eSp,
        phase: "result", result, xpGained, moneyGained, leveled, newLevel,
        upgradesLeft, rewardCard,
        logs: [...laneSummary, `${result === "win" ? "★ YOU WIN" : result === "loss" ? "✘ DEFEAT" : "↔ DRAW"}`, ...logs].slice(0, 12),
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
                const { player: pPow, enemy: ePow } = calcLanePower(l, i);
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
                const col0 = l.enemy.filter((_, j) => j % 2 === 0);
                const col1 = l.enemy.filter((_, j) => j % 2 === 1);
                return (
                  <div key={i} style={{
                    borderRight: i < 2 ? "1px solid #3A7A3A55" : undefined,
                    padding: "2px 2px 0", display: "flex", flexDirection: "column",
                    overflowY: "hidden",
                  }}>
                    {l.enemy.length === 0
                      ? <span className="pixel-text" style={{ color: "#1A4A1A", fontSize: 10, margin: "auto", alignSelf: "center", paddingTop: 8 }}>—</span>
                      : <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {[col0, col1].map((col, ci) => col.length > 0 && (
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
                      : <div style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
                          {l.player.map((c, j) => (
                            <div key={c.id + j}>
                              <FullCard card={c} scale={cardScale} />
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, padding: "1px 0" }}>
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
        {(["table", "deck", "collection"] as DccTab[]).map(t => (
          <button key={t} onClick={() => setDccTab(t)} style={{
            flex: 1, padding: "7px 0",
            backgroundColor: dccTab === t ? "#0A0A1A" : C.bg2,
            border: "none", borderBottom: dccTab === t ? `2px solid ${themeInfo.color}` : "2px solid transparent",
            color: dccTab === t ? themeInfo.color : C.textDim,
            fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer",
          }}>
            {t === "table" ? "♠ BLACK ROSE" : t === "deck" ? "DECK" : "COLLECTION"}
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
                tap card to toggle deck
              </span>
            </div>

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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                    {cards.map((c, i) => {
                      const inDeck  = player.deck.some(d => d.id === c.id);
                      const lvl     = player.collection[c.name] || 1;
                      const maxLvl  = lvl >= 5;
                      const upgCost = 50 * lvl;
                      const canAffordAll = player.money >= upgCost;
                      return (
                        <div
                          key={c.id + i}
                          onClick={() => handleToggleDeck(c)}
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
                          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 1, width: "100%" }}>
                            <PixelButton small
                              color={maxLvl ? C.bg3 : C.yellow} textColor="#000"
                              disabled={maxLvl || player.money < upgCost}
                              onClick={() => handleUpgradeCard(c.name)}
                              style={{ flex: 1, fontSize: 8 }}
                            >
                              {maxLvl ? "MAX" : `↑$${upgCost}`}
                            </PixelButton>
                            {!maxLvl && canAffordAll && (
                              <PixelButton small color="#6040C0" textColor="#fff"
                                onClick={() => { maxUpgradeCard(c.name); setCardMsg(`${c.name} maxed!`); setTimeout(() => setCardMsg(null), 2000); }}
                                style={{ flex: 1, fontSize: 8 }}
                              >
                                MAX
                              </PixelButton>
                            )}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
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
    </div>
  );
}
