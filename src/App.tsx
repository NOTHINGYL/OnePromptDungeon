import { useCallback, useEffect, useMemo, useState } from "react";
import { MONSTERS } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { moveHero, type Direction } from "./engine/game";
import { createInitialLevel } from "./engine/level";
import { GameCanvas } from "./ui/GameCanvas";

const EXAMPLE_PROMPTS = [
  "Rescue the princess from a tower that reshapes itself around old wishes.",
  "Build a moonlit dungeon where every door asks for a cleaner route.",
  "Make a royal rescue inside a quiet machine temple beneath the city.",
];

export default function App() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [level, setLevel] = useState(() => createInitialLevel(EXAMPLE_PROMPTS[0]));

  const move = useCallback((direction: Direction) => {
    setLevel((current) => moveHero(current, direction));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
      };

      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const nearbyMonster = useMemo(() => {
    const candidates = [
      { x: level.player.x, y: level.player.y - 1 },
      { x: level.player.x + 1, y: level.player.y },
      { x: level.player.x, y: level.player.y + 1 },
      { x: level.player.x - 1, y: level.player.y },
    ];

    for (const pos of candidates) {
      if (pos.x < 0 || pos.y < 0 || pos.x >= level.width || pos.y >= level.height) {
        continue;
      }
      const content = level.contents[pos.y][pos.x];
      if (content.type === "monster") {
        return {
          monster: MONSTERS[content.monster],
          preview: previewCombat(level.hero, content.monster),
        };
      }
    }

    return null;
  }, [level]);

  const startTower = () => {
    setLevel(createInitialLevel(prompt));
  };

  const randomPrompt = () => {
    const nextPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    setPrompt(nextPrompt);
    setLevel(createInitialLevel(nextPrompt));
  };

  return (
    <main className="app-shell">
      <section className="command-panel" aria-label="Dungeon command panel">
        <div className="brand-block">
          <p className="eyebrow">v0.1 / Magic Tower-like prototype</p>
          <h1>OnePromptDungeon</h1>
          <p className="intro">
            A compact deterministic tower RPG: open doors, route around danger, break the warden's seal, and rescue the princess.
          </p>
        </div>

        <div className="prompt-box">
          <label htmlFor="prompt">Dungeon wish</label>
          <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} />
          <div className="prompt-actions">
            <button className="primary" type="button" onClick={startTower}>
              Begin Tower
            </button>
            <button type="button" onClick={randomPrompt}>
              Random Wish
            </button>
          </div>
          <p className="fineprint">v0.1 uses a hand-built level. v0.2 will turn this prompt into generated maps.</p>
        </div>

        <div className="stats-grid">
          <Stat label="HP" value={`${level.hero.hp}/${level.hero.maxHp}`} />
          <Stat label="ATK" value={level.hero.atk} />
          <Stat label="DEF" value={level.hero.def} />
          <Stat label="Gold" value={level.hero.gold} />
          <Stat label="Sun Keys" value={level.hero.yellowKeys} />
          <Stat label="Moon Keys" value={level.hero.blueKeys} />
          <Stat label="Moves" value={level.moves} />
          <Stat label="Seal" value={level.bossDefeated ? "Broken" : "Locked"} />
        </div>

        <div className="controls" aria-label="Movement controls">
          <button type="button" onClick={() => move("up")}>↑</button>
          <div>
            <button type="button" onClick={() => move("left")}>←</button>
            <button type="button" onClick={() => move("down")}>↓</button>
            <button type="button" onClick={() => move("right")}>→</button>
          </div>
        </div>
      </section>

      <section className="game-stage" aria-label="Game board">
        <div className="stage-header">
          <div>
            <p className="eyebrow">Floor 1</p>
            <h2>{level.title}</h2>
          </div>
          <button type="button" onClick={() => setLevel(createInitialLevel(prompt))}>
            Restart
          </button>
        </div>
        <GameCanvas level={level} />
      </section>

      <aside className="side-panel" aria-label="Quest details">
        <section className="quest-card">
          <p className="eyebrow">Current Quest</p>
          <h2>Break the crystal seal</h2>
          <p>
            The princess is visible near the tower crown, but the warden binds the final room. Build enough ATK and DEF before choosing that fight.
          </p>
        </section>

        <section className="combat-card">
          <p className="eyebrow">Adjacent Fight</p>
          {nearbyMonster ? (
            <>
              <h3>{nearbyMonster.monster.name}</h3>
              <div className="combat-stats">
                <span>HP {nearbyMonster.monster.hp}</span>
                <span>ATK {nearbyMonster.monster.atk}</span>
                <span>DEF {nearbyMonster.monster.def}</span>
              </div>
              <p className={nearbyMonster.preview.canWin ? "good" : "danger"}>
                {nearbyMonster.preview.canWin ? "Winnable" : "Too dangerous"} / expected loss{" "}
                {Number.isFinite(nearbyMonster.preview.damageTaken) ? nearbyMonster.preview.damageTaken : "∞"} HP
              </p>
            </>
          ) : (
            <p>No monster is adjacent. Move with WASD or arrow keys.</p>
          )}
        </section>

        <section className="log-card">
          <p className="eyebrow">Tower Log</p>
          <ul>
            {level.log.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </section>
      </aside>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
