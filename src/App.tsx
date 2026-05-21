import { useCallback, useEffect, useMemo, useState } from "react";
import { MONSTERS, SHOP_COST, SHOP_UPGRADES } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { buyUpgrade, isPlayerOnShop, moveHero, undo, type Direction } from "./engine/game";
import { createInitialTower, getCurrentFloor } from "./engine/level";
import { GameCanvas } from "./ui/GameCanvas";
import type { ShopUpgrade, TowerState } from "./types/game";

const EXAMPLE_PROMPTS = [
  "Rescue the princess from a three-floor tower that answers wishes.",
  "Raise an old stone tower with locked doors, merchants, and a crystal crown.",
  "Make a compact Magic Tower route where every key and coin matters.",
];

export default function App() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [tower, setTower] = useState<TowerState>(() => createInitialTower(EXAMPLE_PROMPTS[0]));

  const floor = getCurrentFloor(tower);
  const onShop = isPlayerOnShop(tower);

  const move = useCallback((direction: Direction) => {
    setTower((current) => moveHero(current, direction));
  }, []);

  const restart = () => {
    setTower(createInitialTower(prompt));
  };

  const randomPrompt = () => {
    const nextPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    setPrompt(nextPrompt);
    setTower(createInitialTower(nextPrompt));
  };

  const buy = (upgrade: ShopUpgrade) => {
    setTower((current) => buyUpgrade(current, upgrade));
  };

  const undoStep = useCallback(() => {
    setTower((current) => undo(current));
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

      if (event.key === "z" || event.key === "Z") {
        event.preventDefault();
        undoStep();
        return;
      }

      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, undoStep]);

  const nearbyMonster = useMemo(() => {
    const candidates = [
      { x: tower.player.x, y: tower.player.y - 1 },
      { x: tower.player.x + 1, y: tower.player.y },
      { x: tower.player.x, y: tower.player.y + 1 },
      { x: tower.player.x - 1, y: tower.player.y },
    ];

    for (const pos of candidates) {
      if (pos.x < 0 || pos.y < 0 || pos.x >= floor.width || pos.y >= floor.height) {
        continue;
      }
      const content = floor.contents[pos.y][pos.x];
      if (content.type === "monster") {
        return {
          monster: MONSTERS[content.monster],
          preview: previewCombat(tower.hero, content.monster),
        };
      }
    }

    return null;
  }, [floor, tower.hero, tower.player]);

  return (
    <main className="app-shell">
      <aside className="left-hud" aria-label="Hero status">
        <header className="brand-block">
          <p className="eyebrow">v0.2 / Three-floor tower</p>
          <h1>OnePromptDungeon</h1>
          <p>{tower.seed}</p>
        </header>

        <section className="hero-panel">
          <h2>Hero</h2>
          <div className="stats-grid">
            <Stat label="HP" value={`${tower.hero.hp}/${tower.hero.maxHp}`} tone="hp" />
            <Stat label="ATK" value={tower.hero.atk} tone="atk" />
            <Stat label="DEF" value={tower.hero.def} tone="def" />
            <Stat label="Gold" value={tower.hero.gold} tone="gold" />
          </div>
        </section>

        <section className="key-panel">
          <h2>Keys</h2>
          <div className="key-row">
            <Key label="Yellow" value={tower.hero.yellowKeys} tone="yellow" />
            <Key label="Blue" value={tower.hero.blueKeys} tone="blue" />
            <Key label="Red" value={tower.hero.redKeys} tone="red" />
          </div>
        </section>

        <section className="wish-panel">
          <label htmlFor="prompt">Tower wish</label>
          <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
          <div className="prompt-actions">
            <button className="primary" type="button" onClick={restart}>
              Restart
            </button>
            <button type="button" onClick={randomPrompt}>
              New Wish
            </button>
          </div>
        </section>
      </aside>

      <section className="tower-stage" aria-label="Game board">
        <div className="stage-topbar">
          <div>
            <p className="eyebrow">Floor {tower.currentFloorIndex + 1} / {tower.floors.length}</p>
            <h2>{floor.title}</h2>
          </div>
          <p>{floor.objective}</p>
        </div>

        <GameCanvas floor={floor} tower={tower} />

        <div className="bottom-hud">
          <div className="moves-panel">
            <span>Moves</span>
            <strong>{tower.moves}</strong>
          </div>
          <div className="controls" aria-label="Movement controls">
            <button type="button" onClick={() => move("up")}>↑</button>
            <button type="button" onClick={() => move("left")}>←</button>
            <button type="button" onClick={() => move("down")}>↓</button>
            <button type="button" onClick={() => move("right")}>→</button>
          </div>
          <button className="undo-button" type="button" onClick={undoStep} disabled={tower.history.length === 0}>
            Undo Z
          </button>
        </div>
      </section>

      <aside className="right-hud" aria-label="Tower details">
        <section className="fight-panel">
          <p className="eyebrow">Adjacent Fight</p>
          {nearbyMonster ? (
            <>
              <h2>{nearbyMonster.monster.name}</h2>
              <div className="monster-statline">
                <span>HP {nearbyMonster.monster.hp}</span>
                <span>ATK {nearbyMonster.monster.atk}</span>
                <span>DEF {nearbyMonster.monster.def}</span>
                <span>Gold {nearbyMonster.monster.gold}</span>
              </div>
              <p className={nearbyMonster.preview.canWin ? "good" : "danger"}>
                {nearbyMonster.preview.canWin ? "Can win" : "Do not fight"} / loss{" "}
                {Number.isFinite(nearbyMonster.preview.damageTaken) ? nearbyMonster.preview.damageTaken : "∞"} HP
              </p>
            </>
          ) : (
            <p>No monster beside you. Use WASD, arrows, or the controls below.</p>
          )}
        </section>

        <section className={onShop ? "shop-panel active" : "shop-panel"}>
          <p className="eyebrow">Merchant</p>
          <h2>20 gold each</h2>
          <div className="shop-actions">
            {(Object.keys(SHOP_UPGRADES) as ShopUpgrade[]).map((upgrade) => (
              <button key={upgrade} type="button" onClick={() => buy(upgrade)} disabled={!onShop || tower.hero.gold < SHOP_COST}>
                <strong>{SHOP_UPGRADES[upgrade].label}</strong>
                <span>{SHOP_UPGRADES[upgrade].description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="log-panel">
          <p className="eyebrow">Tower Log</p>
          <ul>
            {tower.log.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </section>
      </aside>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Key({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`key ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
