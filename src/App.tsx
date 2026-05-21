import { useCallback, useEffect, useMemo, useState } from "react";
import { MONSTERS, SHOP_COST, SHOP_UPGRADES } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { buyUpgrade, isPlayerOnShop, moveHero, undo, type Direction } from "./engine/game";
import { createInitialTower, getCurrentFloor } from "./engine/level";
import {
  detectLanguage,
  LANG_STORAGE_KEY,
  THEME_STORAGE_KEY,
  translate,
  type Language,
} from "./i18n";
import { GameCanvas, type TowerTheme } from "./ui/GameCanvas";
import type { LogEntry, ShopUpgrade, TowerState } from "./types/game";

const EXAMPLE_PROMPTS = [
  "Rescue the princess from a three-floor tower that answers wishes.",
  "Raise an old stone tower with locked doors, merchants, and a crystal crown.",
  "Make a compact Magic Tower route where every key and coin matters.",
];

function getInitialLanguage(): Language {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "zh" || saved === "en" ? saved : detectLanguage();
}

function getInitialTheme(): TowerTheme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "classic-dark" || saved === "classic-light" ? saved : "classic-light";
}

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState<TowerTheme>(getInitialTheme);
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [tower, setTower] = useState<TowerState>(() => createInitialTower(EXAMPLE_PROMPTS[0]));

  const floor = getCurrentFloor(tower);
  const onShop = isPlayerOnShop(tower);
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(language, key, params), [language]);

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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

  const toggleLanguage = () => {
    setLanguage((current) => (current === "zh" ? "en" : "zh"));
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "classic-light" ? "classic-dark" : "classic-light"));
  };

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="game-window" aria-label="OnePromptDungeon">
        <header className="window-titlebar">
          <div className="window-title">
            <span className="title-gem" />
            <strong>{t("app.title")}</strong>
          </div>
          <div className="window-actions">
            <button type="button" onClick={toggleLanguage}>{t("button.language")}</button>
            <button type="button" onClick={toggleTheme}>{t("button.theme")}</button>
            <button type="button" onClick={restart}>{t("button.restart")}</button>
            <button type="button" onClick={undoStep} disabled={tower.history.length === 0}>{t("button.undo")}</button>
          </div>
        </header>

        <div className="classic-layout">
          <aside className="status-board" aria-label={t("status.hero")}>
            <p className="version-text">{t("app.version")}</p>
            <div className="hero-mark" aria-hidden="true">
              <span />
            </div>
            <StatLine label={t("status.floor")} value={tower.currentFloorIndex + 1} />
            <StatLine label={t("status.level")} value={1} />
            <StatLine label={t("status.hp")} value={tower.hero.hp} />
            <StatLine label={t("status.atk")} value={tower.hero.atk} />
            <StatLine label={t("status.def")} value={tower.hero.def} />
            <StatLine label={t("status.gold")} value={tower.hero.gold} />

            <div className="key-list">
              <KeyLine color="yellow" label={t("status.yellowKey")} value={tower.hero.yellowKeys} />
              <KeyLine color="blue" label={t("status.blueKey")} value={tower.hero.blueKeys} />
              <KeyLine color="red" label={t("status.redKey")} value={tower.hero.redKeys} />
            </div>

            <div className="wish-panel">
              <label htmlFor="prompt">{t("wish.label")}</label>
              <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
              <button type="button" onClick={randomPrompt}>{t("button.shuffle")}</button>
            </div>
          </aside>

          <section className="map-board" aria-label="Game board">
            <div className="floor-strip">
              <strong>{t(floor.title)}</strong>
              <span>{t(floor.objective)}</span>
            </div>
            <GameCanvas floor={floor} language={language} theme={theme} tower={tower} />
          </section>
        </div>

        <footer className="bottom-panel">
          <section className="forecast-panel">
            <p>{t("fight.title")}</p>
            {nearbyMonster ? (
              <div>
                <strong>{t(nearbyMonster.monster.name)}</strong>
                <span>
                  {nearbyMonster.preview.canWin ? t("fight.canWin") : t("fight.danger")} / {t("fight.loss")}{" "}
                  {Number.isFinite(nearbyMonster.preview.damageTaken) ? nearbyMonster.preview.damageTaken : "∞"} /{" "}
                  {t("fight.reward")} {nearbyMonster.monster.gold}
                </span>
              </div>
            ) : (
              <span>{t("fight.none")} {t("controls.hint")}</span>
            )}
          </section>

          <section className={onShop ? "merchant-panel active" : "merchant-panel"}>
            <p>{t("shop.title")} · {t("shop.cost")}</p>
            <div>
              {(Object.keys(SHOP_UPGRADES) as ShopUpgrade[]).map((upgrade) => (
                <button key={upgrade} type="button" onClick={() => buy(upgrade)} disabled={!onShop || tower.hero.gold < SHOP_COST}>
                  {t(`shop.${upgrade}.label`)}
                </button>
              ))}
            </div>
          </section>

          <section className="log-panel">
            <p>{t("log.title")}</p>
            <ul>
              {tower.log.slice(0, 3).map((entry, index) => (
                <li key={`${entry.key}-${index}`}>{formatLog(entry, t)}</li>
              ))}
            </ul>
          </section>
        </footer>
      </section>
    </main>
  );
}

function formatLog(entry: LogEntry, t: (key: string, params?: Record<string, string | number>) => string) {
  const params = Object.fromEntries(
    Object.entries(entry.params ?? {}).map(([key, value]) => {
      if (typeof value === "string" && (value.startsWith("monster.") || value.startsWith("item.") || value.startsWith("floor."))) {
        return [key, t(value)];
      }
      return [key, value];
    }),
  );

  return t(entry.key, params);
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KeyLine({ color, label, value }: { color: "yellow" | "blue" | "red"; label: string; value: number }) {
  return (
    <div className="key-line">
      <i className={`key-dot ${color}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
