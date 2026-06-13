import React, { useState } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton, PTitle, StatChip } from "@/components/PixelUI";
import { getBiome, getStarDisplay, BIOME_NAMES, type TileKind } from "@/game/data";

type SettingsTab = "beginner" | "combat" | "blackrose" | "bunker" | "data";

const TABS: { id: SettingsTab; label: string; icon: string; color: string }[] = [
  { id: "beginner",  label: "BEGINNER",       icon: "★",  color: "#80C040" },
  { id: "combat",   label: "COMBAT & BOARD", icon: "✦",  color: C.redBright },
  { id: "blackrose",label: "BLACK ROSE",     icon: "♠",  color: C.cyan },
  { id: "bunker",   label: "BUNKER & GEAR",  icon: "⌂",  color: "#9060D0" },
  { id: "data",     label: "DATA & DEBUG",   icon: "◈",  color: C.textDim },
];

function Section({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: C.bg2, border: `2px solid ${color ?? "#222"}`, overflow: "hidden" }}>
      <div style={{ padding: "5px 10px", backgroundColor: (color ?? "#222") + "22", borderBottom: `1px solid ${color ?? "#222"}44` }}>
        <span className="pixel-text" style={{ color: color ?? C.textDim, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span className="pixel-text" style={{ color: C.yellow, fontSize: 13, minWidth: 84 }}>{label}</span>
      <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, flex: 1 }}>{desc}</span>
    </div>
  );
}

export default function SettingsScreen() {
  const { player, resetAll, debugGiveMoney, debugGiveMetals, debugMoveToTile, debugRebirth, debugGiveOpKit } = useGame();
  const [msg, setMsg]                   = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [tab, setTab]                   = useState<SettingsTab>("beginner");
  const [debugPw, setDebugPw]           = useState("");
  const [debugUnlocked, setDebugUnlocked] = useState(false);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2000); }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 4000); return; }
    resetAll();
    setConfirmReset(false);
    flash("Game reset!");
  }

  const DEBUG_TILES: { label: string; kind: TileKind }[] = [
    { label: "Start",    kind: "start"    },
    { label: "Fight",    kind: "pve"      },
    { label: "Elite",    kind: "elite"    },
    { label: "Boss",     kind: "boss"     },
    { label: "Shop",     kind: "shop"     },
    { label: "Forge",    kind: "forge"    },
    { label: "Teleport", kind: "teleport" },
    { label: "Cache",    kind: "bank"     },
    { label: "Property", kind: "property" },
  ];

  const biome        = getBiome(player.bossKills);
  const stars        = getStarDisplay(player.bossKills);
  const rebirthReady = player.rebirthReadySwamp && player.rebirthReadyDCC;
  const activeTab    = TABS.find(t => t.id === tab)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", backgroundColor: "#08101C", borderBottom: "3px solid #000", flexShrink: 0 }}>
        <PTitle color={C.textDim}>SETTINGS</PTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <StatChip label="LAP"   value={player.lap}             color={C.textDim} />
          <StatChip label="BOSS"  value={`×${player.bossKills}`} color={C.yellow} />
          <StatChip label="G"     value={`$${player.money}`}     color={C.yellow} />
          <StatChip label="DCC"   value={`Lv${player.dccLevel}`} color={C.cyan} />
          <StatChip label="BIOME" value={`${BIOME_NAMES[biome]}${stars ? " " + stars : ""}`} color="#6BBF3A" />
          {player.rebirthCount > 0 && (
            <StatChip label="⟳" value={`×${player.rebirthCount}`} color="#60C8FF" />
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, padding: "6px 10px",
            backgroundColor: tab === t.id ? C.bg2 : C.bg3,
            border: "none", borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
            color: tab === t.id ? t.color : C.textDim,
            fontFamily: "'VT323', monospace", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>

        {tab === "beginner" && (
          <>
            <Section title="★ BEGINNER GUIDE — QUICK START" color="#80C040">
              <InfoRow label="Goal"         desc="Roll the dice, move around the board, defeat enemies, grow stronger, and beat the boss at the end of each lap to progress to new biomes." />
              <InfoRow label="Rolling"      desc="Press ROLL on the Board screen. You move 2–12 tiles. Landing on a Camp, Elite, or Boss tile starts a fight. Roll again after resolving each tile." />
              <InfoRow label="Combat"       desc="Each fight round you get 3 SP. Spend them: STRIKE to deal damage (costs 1 SP each), BLOCK to reduce incoming hits (costs 1 SP), RESERVE to carry SP to next round. Then END TURN." />
              <InfoRow label="Enemies"      desc="Target the enemy you want to attack by tapping their card. Multiple enemies means multiple targets — queue attacks to different enemies." />
              <InfoRow label="Loot"         desc="Enemies drop gold, metals, and parts. Gold buys gear at shops. Metals let you forge new gear. Parts merge into weapons/armor to boost them." />
              <InfoRow label="Gear"         desc="In the GEAR tab, equip weapons and armor. Higher level = stronger. Sell or melt unwanted gear. Merging parts (at the Forge tile) improves existing gear." />
              <InfoRow label="Boss Den ☠"  desc="Land near the end of the board to fight the Boss. Beating the boss advances the biome and increases enemy difficulty. Enemies stay at the same power once scaled." />
              <InfoRow label="Shop ◈"      desc="Buy weapons and armor from the shop tile. Items scale to your current biome level." />
              <InfoRow label="Forge"        desc="Forge tile: spend 3 metals to craft a weapon or armor, OR merge a monster part into existing gear to improve its damage, HP, or add effects (ICE/STUN)." />
              <InfoRow label="Cache B"      desc="Deposits money each lap automatically. Land here to collect your accumulated bank balance." />
              <InfoRow label="Bunker ⌂"   desc="Upgrade rooms in the Bunker tab to unlock NPCs. Dr. Mundo heals you, Ornn forges gear, Norra improves shops." />
              <InfoRow label="Black Rose ♠" desc="Optional card duel in the BLACK ROSE tab. Win for bonus gold and XP. Manage your deck in the CARDS tab. It's separate from board combat." />
              <InfoRow label="Auto-Save"    desc="The game saves every 0.5 seconds to your browser. Safe to close and return anytime." />
            </Section>
          </>
        )}

        {tab === "combat" && (
          <>
            <Section title="COMBAT — HOW IT WORKS" color={C.redBright}>
              <InfoRow label="JWC System"    desc="Each round you have 3 SP (skill points). Spend SP on Hit attacks, Block defenses, or Preserve (reserve for next round). 2+ Blocks gives significantly more protection." />
              <InfoRow label="Multi-Enemy"   desc="Base encounters spawn 2-4 enemies. Tap an enemy card to select your target. Queue Sword attacks to each independently." />
              <InfoRow label="Simultaneous"  desc="All living enemies attack at the end of each round simultaneously. One Shield queued protects against all incoming damage." />
              <InfoRow label="Group Scale"   desc="More enemies in a group = weaker each. 4 enemies are each 50% as strong as a solo enemy. Total threat still grows." />
              <InfoRow label="Elite"         desc="Elite encounters always spawn exactly 1 enemy — more powerful than a base foe." />
              <InfoRow label="[ICE] Ice"      desc="Ice effect freezes the target for 2 turns. Frozen enemies deal 50% reduced damage each turn." />
              <InfoRow label="[STUN] Stun"   desc="Stun effect: 35% chance per hit. Stunned enemy defends instead of attacking next turn." />
              <InfoRow label="Weakness"      desc="Attack with the enemy's weakness damage type for +8 bonus damage. Each biome has a shared weakness." />
              <InfoRow label="Block"         desc="Queue a Block to reduce enemy damage by 25% base (50% if you queue 2+). Armor blunt/pierce/slash defense stacks on top. Blocking even with no armor cuts damage significantly." />
            </Section>
            <Section title="BOARD — HOW IT WORKS" color={C.accent}>
              <InfoRow label="Roll"       desc="Roll 2d6 each turn to move around the 9×9 perimeter board. The biome changes every 5 boss kills." />
              <InfoRow label="5 Biomes"   desc="Forest → Snowy Mountains → Underworld → Volcano → Swamp. After Swamp, loop back to Forest (enemy levels keep rising)." />
              <InfoRow label="Stars"      desc="Each completed cycle of all 5 biomes earns a star (★). Up to 5 stars max (6 total cycles)." />
              <InfoRow label="Camp"       desc="Random base encounter — always 2-4 enemies. Defeat them for loot and parts." />
              <InfoRow label="★ Elite"   desc="Elite camp — 1 powerful enemy, better loot, higher drop rate." />
              <InfoRow label="☠ Boss Den" desc="A powerful boss blocks the path. Boss kills change the biome and increase enemy levels." />
              <InfoRow label="◈ Shop"    desc="Buy biome-appropriate weapons and armor. Gear levels match the current biome." />
              <InfoRow label="Forge"      desc="Craft gear from 3 metals or merge enemy parts into existing items." />
              <InfoRow label="B Cache"   desc="Deposits fill each lap. Land here to collect accumulated balance." />
              <InfoRow label="$ Property" desc="Land on a property to claim it (Abandoned → Owned). Owned properties generate passive income. Collect with the COLLECT button." />
              <InfoRow label="⬡ Teleport" desc="Warp tile — teleports you to the Boss Den." />
              <InfoRow label="START"     desc="Passing start restores full HP and awards lap bonus gold." />
            </Section>
          </>
        )}

        {tab === "blackrose" && (
          <Section title="♠ BLACK ROSE — HOW IT WORKS" color={C.cyan}>
            <InfoRow label="DCC Match" desc="3-lane card duel, 6 rounds. Win 2 of 3 lanes to win the match." />
            <InfoRow label="SP"        desc="Start with 2 SP, gain more each round. Spend SP to play cards from your hand." />
            <InfoRow label="Lanes"     desc="Place cards in lanes. 2-column layout shows cards overlapping — only the top strip (name/SP/power) is visible." />
            <InfoRow label="Enemy AI"  desc="The enemy targets your strongest lane and plays their best card." />
            <InfoRow label="Rewards"   desc="Win → gold + XP + a new card. Level up → choose card upgrades (+1 power per upgrade)." />
            <InfoRow label="Deck"      desc={`Manage your deck in the Cards tab. Max ${12} cards. Click a card to toggle it in/out of your deck.`} />
            <InfoRow label="Themes"    desc="DCC theme cycles through 5 factions: Slimes, Skeletons, Goblins, Plants, Demons — each with unique card art." />
          </Section>
        )}

        {tab === "bunker" && (
          <>
            <Section title="BUNKER — HOW IT WORKS" color="#9060D0">
              <InfoRow label="Rooms"     desc="Upgrade rooms to unlock NPCs and gain permanent bonuses. Each room has a unique resident." />
              <InfoRow label="Ornn"      desc="Master blacksmith — unlocked by upgrading the Forge room. Crafts weapons and armor from metals." />
              <InfoRow label="Norra"     desc="Trade network keeper — unlocked by upgrading the Trading Post. Buffs ALL board shops: +1 extra item, 10% discount." />
              <InfoRow label="Dr. Mundo" desc="Field surgeon — unlocked by upgrading the Medical Lab. Patch Up +25 HP for $20. Full Heal available." />
              <InfoRow label="Storage"   desc="Upgrade Storage to increase gear bag size (base: 5 slots, +2 per upgrade, max 5 upgrades = 13 slots)." />
            </Section>
            <Section title="GEAR — HOW IT WORKS" color={C.yellow}>
              <InfoRow label="Levels"       desc="Gear has levels instead of tiers. Level matches the biome: Forest = 1-10, Snowy = 11-20, Underworld = 21-30, Volcano = 31-40, Swamp = 41-50. Each star cycle adds 50." />
              <InfoRow label="Damage Types" desc="Blunt (clubs), Slash (swords), Pierce (spears). Each enemy has a weakness — deal +8 bonus damage when you match it." />
              <InfoRow label="Armor"        desc="Each piece has bluntDef, pierceDef, slashDef. Higher level = higher totals. Primary defense matches the armor's lean type." />
              <InfoRow label="Biome Weak"   desc="Forest & Volcano: weak to Slash. Snowy & Swamp: weak to Pierce. Underworld: weak to Blunt." />
              <InfoRow label="Forge"        desc="Land on the Forge tile to craft gear from 3 metals or merge monster parts into existing items." />
              <InfoRow label="Enemy Drops"   desc="Enemy drops appear in your Enemy Drops tab after battles. Merge them into gear at the Forge to add damage, HP, and effects like ice/stun." />
              <InfoRow label="Sell/Melt"    desc="Sell gear for gold (scales with level). Melt for metals. Use the Inventory bag tab." />
            </Section>
          </>
        )}

        {tab === "data" && (
          <>
            <Section title="GAME DATA" color={C.textDim}>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                Game auto-saves every 0.5 seconds to browser localStorage. Current save key: v5.
              </span>
              <PixelButton
                onClick={handleReset}
                color={confirmReset ? C.redBright : "#1A0000"}
                textColor={confirmReset ? "#000" : C.redBright}
              >
                {confirmReset ? "!! CONFIRM — WIPE ALL PROGRESS" : "RESET GAME"}
              </PixelButton>
              {confirmReset && (
                <span className="pixel-text" style={{ color: C.redBright, fontSize: 12 }}>
                  Press again to confirm. This will delete your save permanently.
                </span>
              )}
            </Section>

            <Section title="IMAGE REPLACEMENT GUIDE" color="#5080C0">
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                All game images are controlled by{" "}
                <span style={{ color: "#80B0FF" }}>src/assets/sprites.ts</span>.
                Each entry maps a name to a URL (or null for placeholder art).
              </span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                {"To replace any image on GitHub:"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 8, borderLeft: "2px solid #5080C055" }}>
                <span className="pixel-text" style={{ color: "#80B0FF", fontSize: 12 }}>1. Go to your GitHub repo → src/assets/sprites.ts</span>
                <span className="pixel-text" style={{ color: "#80B0FF", fontSize: 12 }}>2. Click the pencil ✏ icon to edit the file</span>
                <span className="pixel-text" style={{ color: "#80B0FF", fontSize: 12 }}>{"3. Change null to a URL string, e.g.:  \"Goblin\": \"https://i.imgur.com/abc.png\""}</span>
                <span className="pixel-text" style={{ color: "#80B0FF", fontSize: 12 }}>4. Commit the change — image appears immediately</span>
              </div>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                Sprite maps: ENEMY_SPRITES (combat), CHARACTER_SPRITES (player/NPCs), CARD_SPRITES (Black Rose cards), WEAPON_SPRITES, PART_SPRITES. Images render at pixel-perfect scale; 64×64 or 96×96 PNGs work best.
              </span>
            </Section>

            <Section title="DEBUG TOOLS" color="#8060C0">
              {!debugUnlocked ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
                    Enter password to unlock debug tools:
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="password"
                      value={debugPw}
                      onChange={e => setDebugPw(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          if (debugPw === "Fizzylikesyummitop") { setDebugUnlocked(true); setDebugPw(""); flash("★ Debug tools unlocked!"); }
                          else { flash("Wrong password."); setDebugPw(""); }
                        }
                      }}
                      placeholder="password..."
                      style={{
                        flex: 1, backgroundColor: "#0A0A18", border: "1px solid #5040A0",
                        color: "#B090E0", fontFamily: "'VT323', monospace", fontSize: 14,
                        padding: "4px 8px", outline: "none",
                      }}
                    />
                    <PixelButton small color="#201040" textColor="#B090E0" onClick={() => {
                      if (debugPw === "Fizzylikesyummitop") { setDebugUnlocked(true); setDebugPw(""); flash("★ Debug tools unlocked!"); }
                      else { flash("Wrong password."); setDebugPw(""); }
                    }}>ENTER</PixelButton>
                  </div>
                </div>
              ) : (
                <>
                  <span className="pixel-text" style={{ color: "#B090E0", fontSize: 12 }}>
                    ★ DEBUG UNLOCKED — Testing shortcuts active.
                  </span>
                  <div style={{ backgroundColor: "#120820", border: `2px solid #FFD700`, padding: "8px 10px", marginBottom: 4 }}>
                    <span className="pixel-text" style={{ color: "#FFD700", fontSize: 15, display: "block", marginBottom: 6 }}>
                      ★ OP KIT — 1,000,000 damage + $9,999,999 + 9,999 metals
                    </span>
                    <PixelButton color="#FFD700" textColor="#000" onClick={() => { debugGiveOpKit(); flash("★ OP KIT equipped! Enjoy your godhood."); }}>
                      ★ GIVE OP KIT
                    </PixelButton>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <PixelButton small color="#201040" textColor="#B090E0"
                      onClick={() => { debugGiveMoney(500); flash("+$500 added."); }}>+$500</PixelButton>
                    <PixelButton small color="#201040" textColor="#B090E0"
                      onClick={() => { debugGiveMoney(2000); flash("+$2000 added."); }}>+$2000</PixelButton>
                    <PixelButton small color="#201040" textColor="#B090E0"
                      onClick={() => { debugGiveMetals(10); flash("+10 metals added."); }}>+10M</PixelButton>
                    <PixelButton small color="#201040" textColor="#B090E0"
                      onClick={() => { debugGiveMetals(50); flash("+50 metals added."); }}>+50M</PixelButton>
                  </div>
              <div>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 4 }}>
                  Move to tile type (jumps to nearest of that type forward):
                </span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {DEBUG_TILES.map(t => (
                    <PixelButton key={t.kind} small color="#201040" textColor="#B090E0"
                      onClick={() => { debugMoveToTile(t.kind); flash(`Moved to ${t.label}.`); }}>
                      {t.label}
                    </PixelButton>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid #60C8FF33`, paddingTop: 8 }}>
                <span className="pixel-text" style={{ color: "#60C8FF", fontSize: 13, display: "block", marginBottom: 6 }}>
                  ⟳ REBIRTH — count: {player.rebirthCount}
                </span>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>
                  Swamp ready: {player.rebirthReadySwamp ? "✓" : "✗"} · DCC ready: {player.rebirthReadyDCC ? "✓" : "✗"}
                </span>
                <PixelButton small color="#001830" textColor="#60C8FF"
                  style={rebirthReady ? { animation: "rebirth-glow 1.5s ease-in-out infinite" } : {}}
                  onClick={() => { debugRebirth(); flash(`⟳ Reborn! Count: ${player.rebirthCount + 1}`); }}>
                  ⟳ FORCE REBIRTH
                </PixelButton>
              </div>
                </>
              )}
            </Section>
          </>
        )}

        {msg && (
          <div style={{ backgroundColor: "#001830", border: `1px solid ${activeTab.color}`, padding: "4px 10px" }}>
            <span className="pixel-text" style={{ color: activeTab.color, fontSize: 13 }}>{msg}</span>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
