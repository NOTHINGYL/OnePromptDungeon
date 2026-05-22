import { useCallback, useEffect, useMemo, useState } from "react";
import { ITEMS, MONSTERS, SHOP_COST, SHOP_UPGRADES } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { buyUpgrade, isPlayerOnShop, moveHero, undo, type Direction } from "./engine/game";
import { createGeneratedTower, getCurrentFloor, makeSeed, randomSeed } from "./engine/level";
import {
  detectLanguage,
  LANG_STORAGE_KEY,
  THEME_STORAGE_KEY,
  translate,
  type Language,
} from "./i18n";
import { GameCanvas, type TowerTheme } from "./ui/GameCanvas";
import type { CellContent, Difficulty, FloorState, LogEntry, ShopUpgrade, TowerState } from "./types/game";

const DEFAULT_WISH = "Rescue the princess from a three-floor tower that answers wishes.";
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

function getInitialLanguage(): Language {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "zh" || saved === "en" ? saved : detectLanguage();
}

function getInitialTheme(): TowerTheme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "classic-dark" || saved === "classic-light" ? saved : "classic-dark";
}

function createBootTower() {
  const params = new URLSearchParams(window.location.search);
  const prompt = params.get("wish") || DEFAULT_WISH;
  const seed = params.get("seed") || makeSeed(prompt);
  const difficulty = parseDifficulty(params.get("difficulty"));
  return createGeneratedTower({ prompt, seed, difficulty });
}

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState<TowerTheme>(getInitialTheme);
  const [tower, setTower] = useState<TowerState>(createBootTower);
  const [wish, setWish] = useState(tower.prompt);
  const [seed, setSeed] = useState(tower.seed);
  const [difficulty, setDifficulty] = useState<Difficulty>(tower.difficulty);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [generatorStatus, setGeneratorStatus] = useState("generator.ready");

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
    setTower(createGeneratedTower({ prompt: wish, seed, difficulty }));
    setGeneratorStatus("generator.restarted");
  };

  const generateTower = () => {
    const nextSeed = seed || makeSeed(wish);
    const nextTower = createGeneratedTower({ prompt: wish, seed: nextSeed, difficulty });
    setTower(nextTower);
    setSeed(nextTower.seed);
    setGeneratorStatus("generator.generated");
  };

  const rerollSeed = () => {
    setSeed(randomSeed());
    setGeneratorStatus("generator.seedReady");
  };

  const buy = (upgrade: ShopUpgrade) => {
    setTower((current) => buyUpgrade(current, upgrade));
  };

  const undoStep = useCallback(() => {
    setTower((current) => undo(current));
  }, []);

  const shareTower = async () => {
    const params = new URLSearchParams({ seed: tower.seed, difficulty: tower.difficulty, wish: tower.prompt });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    await navigator.clipboard?.writeText(url);
    setGeneratorStatus("generator.shareCopied");
  };

  const exportTower = async () => {
    await navigator.clipboard?.writeText(JSON.stringify(tower, null, 2));
    setGeneratorStatus("generator.exportCopied");
  };

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

      if (event.key === "i" || event.key === "I") {
        event.preventDefault();
        setForgeOpen((current) => !current);
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

  const monsterForecast = useMemo(() => getMonsterForecast(tower, floor), [floor, tower]);

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
          <div className="brand-block">
            <span className="brand-shield" />
            <strong>{t("app.title")}</strong>
          </div>
          <div className="floor-title">
            <span>✧</span>
            <strong>{t("status.floor")} {tower.currentFloorIndex + 1} / {tower.floors.length}</strong>
            <span>·</span>
            <strong>{t(floor.title).replace(/^(\dF|第\s?\d\s?层)\s*/i, "")}</strong>
            <span>✧</span>
          </div>
          <div className="window-actions">
            <button type="button" onClick={toggleLanguage}>{t("button.language")}</button>
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
            <button type="button" onClick={toggleTheme}>{theme === "classic-dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={restart}>↻ {t("button.restart")}</button>
            <button type="button" onClick={undoStep} disabled={tower.history.length === 0}>↶ {t("button.undo")}</button>
            <button type="button" className="forge-top-button" onClick={() => setForgeOpen((current) => !current)}>
              ◈ {t("forge.title")}
            </button>
          </div>
        </header>

        <div className="tower-layout">
          <aside className="status-rail" aria-label={t("status.hero")}>
            <section className="hero-card frame-panel">
              <div className="hero-portrait" aria-hidden="true"><span /></div>
              <div className="hero-meta">
                <span>{t("status.floor")}</span>
                <strong>{tower.currentFloorIndex + 1} / {tower.floors.length}</strong>
                <span>Lv. 1 {t("status.hero")}</span>
                <div className="exp-bar"><i style={{ width: `${Math.min(96, tower.moves * 4)}%` }} /></div>
              </div>
            </section>

            <section className="stats-card frame-panel">
              <StatLine icon="heart" label={t("status.hp")} value={`${tower.hero.hp} / ${tower.hero.maxHp}`} accent="red" />
              <StatLine icon="sword" label={t("status.atk")} value={tower.hero.atk} />
              <StatLine icon="shield" label={t("status.def")} value={tower.hero.def} />
              <StatLine icon="coin" label={t("status.gold")} value={tower.hero.gold} />
            </section>

            <section className="keys-card frame-panel">
              <h2>{t("status.keys")}</h2>
              <div className="key-row">
                <KeyToken color="yellow" value={tower.hero.yellowKeys} />
                <KeyToken color="blue" value={tower.hero.blueKeys} />
                <KeyToken color="red" value={tower.hero.redKeys} />
              </div>
            </section>

            <section className="items-card frame-panel">
              <h2>{t("status.items")}</h2>
              <div className="item-row">
                <SpriteIcon kind="potionRed" /><span>2</span>
                <SpriteIcon kind="potionBlue" /><span>1</span>
                <SpriteIcon kind="gemRed" /><span>1</span>
                <SpriteIcon kind="gemBlue" /><span>0</span>
              </div>
            </section>

            <section className="wish-card frame-panel">
              <h2>{t("wish.label")}</h2>
              <div className="wish-line">
                <SpriteIcon kind="princess" />
                <p>{tower.prompt}</p>
              </div>
            </section>
          </aside>

          <section className="map-stage" aria-label="Game board">
            <div className="coord-row" aria-hidden="true">
              {Array.from({ length: 15 }, (_, index) => <span key={index}>{String(index + 1).padStart(2, "0")}</span>)}
            </div>
            <div className="map-with-coords">
              <div className="coord-col" aria-hidden="true">
                {"ABCDEFGHIJKLMNO".split("").map((letter) => <span key={letter}>{letter}</span>)}
              </div>
              <GameCanvas floor={floor} language={language} theme={theme} tower={tower} />
            </div>
          </section>

          <aside className={forgeOpen ? "right-rail forge-open" : "right-rail"}>
            {forgeOpen ? (
              <WishForge
                difficulty={difficulty}
                exportTower={exportTower}
                generateTower={generateTower}
                generatorStatus={t(generatorStatus)}
                rerollSeed={rerollSeed}
                seed={seed}
                setDifficulty={setDifficulty}
                setSeed={setSeed}
                setWish={setWish}
                shareTower={shareTower}
                t={t}
                wish={wish}
                close={() => setForgeOpen(false)}
              />
            ) : (
              <TacticalPanel
                floor={floor}
                monsterForecast={monsterForecast}
                openForge={() => setForgeOpen(true)}
                seed={tower.seed}
                t={t}
                tower={tower}
              />
            )}
          </aside>
        </div>

        <footer className="bottom-panel">
          <section className="forecast-panel frame-panel">
            <h2>{t("fight.title")}</h2>
            {monsterForecast ? (
              <div className="forecast-content">
                <SpriteIcon kind={monsterForecast.monster.kind} />
                <div>
                  <strong>{t(monsterForecast.monster.name)} <small>Lv. 1</small></strong>
                  <Meter value={monsterForecast.monster.hp} max={Math.max(monsterForecast.monster.hp, 160)} />
                </div>
                <dl>
                  <dt>{t("fight.loss")}</dt>
                  <dd>{formatLoss(monsterForecast.preview.damageTaken)}</dd>
                  <dt>{t("fight.canWin")}</dt>
                  <dd className={monsterForecast.preview.canWin ? "good" : "bad"}>{monsterForecast.preview.canWin ? "Yes" : "No"}</dd>
                  <dt>{t("fight.reward")}</dt>
                  <dd>{monsterForecast.monster.gold}</dd>
                </dl>
              </div>
            ) : (
              <p className="empty-note">{t("fight.none")} {t("controls.hint")}</p>
            )}
          </section>

          <section className={onShop ? "merchant-panel frame-panel active" : "merchant-panel frame-panel"}>
            <h2>{t("shop.title")} · {t("shop.cost")}</h2>
            <div className="merchant-options">
              {(Object.keys(SHOP_UPGRADES) as ShopUpgrade[]).map((upgrade) => (
                <button key={upgrade} type="button" onClick={() => buy(upgrade)} disabled={!onShop || tower.hero.gold < SHOP_COST}>
                  <SpriteIcon kind={upgrade === "atk" ? "sword" : upgrade === "def" ? "shield" : "heart"} />
                  <span>{t(`shop.${upgrade}.label`)}</span>
                  <small>{SHOP_COST} ●</small>
                </button>
              ))}
            </div>
          </section>

          <section className="log-panel frame-panel">
            <h2>{t("log.title")}</h2>
            <ul>
              {tower.log.slice(0, 4).map((entry, index) => (
                <li key={`${entry.key}-${index}`}>{formatLog(entry, t)}</li>
              ))}
            </ul>
          </section>

          <section className="route-panel frame-panel">
            <h2>{t("route.title")}</h2>
            <div className="route-icons">
              <SpriteIcon kind="hero" />
              <span>→</span>
              <SpriteIcon kind="keyYellow" />
              <span>→</span>
              <SpriteIcon kind="doorYellow" />
              <span>→</span>
              <SpriteIcon kind="stairs" />
            </div>
            <div className="route-icons">
              <SpriteIcon kind="bat" />
              <span>→</span>
              <SpriteIcon kind="gemRed" />
              <span>→</span>
              <SpriteIcon kind="princess" />
            </div>
          </section>
        </footer>
      </section>
    </main>
  );
}

function TacticalPanel({
  floor,
  monsterForecast,
  openForge,
  seed,
  t,
  tower,
}: {
  floor: FloorState;
  monsterForecast: ReturnType<typeof getMonsterForecast>;
  openForge: () => void;
  seed: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  tower: TowerState;
}) {
  return (
    <>
      <section className="objective-card frame-panel">
        <h2>{t("objective.title")}</h2>
        <div className="objective-row">
          <SpriteIcon kind="princess" />
          <p>{t(floor.objective)}</p>
        </div>
      </section>
      <section className="monster-card frame-panel">
        <h2>{t("monsterForecast.title")}</h2>
        {monsterForecast ? (
          <div className="monster-row">
            <SpriteIcon kind={monsterForecast.monster.kind} />
            <div>
              <strong>{t(monsterForecast.monster.name)}</strong>
              <StatMini label="HP" value={monsterForecast.monster.hp} />
              <StatMini label="ATK" value={monsterForecast.monster.atk} />
              <StatMini label="DEF" value={monsterForecast.monster.def} />
            </div>
            <dl>
              <dt>{t("forecast.chance")}</dt>
              <dd className={monsterForecast.preview.canWin ? "good" : "bad"}>{monsterForecast.preview.canWin ? "74%" : "12%"}</dd>
              <dt>{t("fight.loss")}</dt>
              <dd>{formatLoss(monsterForecast.preview.damageTaken)}</dd>
            </dl>
          </div>
        ) : (
          <p className="empty-note">{t("fight.none")}</p>
        )}
      </section>
      <section className="minimap-card frame-panel">
        <h2>{t("map.title")}</h2>
        <MiniMap floor={floor} tower={tower} />
      </section>
      <button className="seed-badge" type="button" onClick={openForge}>
        ◈ {t("app.seed")} <strong>{seed}</strong>
      </button>
    </>
  );
}

function WishForge({
  close,
  difficulty,
  exportTower,
  generateTower,
  generatorStatus,
  rerollSeed,
  seed,
  setDifficulty,
  setSeed,
  setWish,
  shareTower,
  t,
  wish,
}: {
  close: () => void;
  difficulty: Difficulty;
  exportTower: () => void;
  generateTower: () => void;
  generatorStatus: string;
  rerollSeed: () => void;
  seed: string;
  setDifficulty: (difficulty: Difficulty) => void;
  setSeed: (seed: string) => void;
  setWish: (wish: string) => void;
  shareTower: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  wish: string;
}) {
  return (
    <>
      <section className="forge-panel frame-panel">
        <div className="forge-heading">
          <h2>◈ {t("forge.title")}</h2>
          <button type="button" onClick={close}>×</button>
        </div>
        <label>
          <span>{t("forge.wish")}</span>
          <textarea value={wish} onChange={(event) => setWish(event.target.value)} rows={4} />
        </label>
        <label>
          <span>{t("forge.seed")}</span>
          <div className="seed-input">
            <input value={seed} onChange={(event) => setSeed(event.target.value.toUpperCase())} />
            <button type="button" onClick={rerollSeed}>◇</button>
          </div>
        </label>
        <div className="difficulty-group" role="group" aria-label={t("forge.difficulty")}>
          {DIFFICULTIES.map((level) => (
            <button key={level} type="button" className={difficulty === level ? "selected" : ""} onClick={() => setDifficulty(level)}>
              {t(`difficulty.${level}`)}
            </button>
          ))}
        </div>
        <button className="generate-button" type="button" onClick={generateTower}>✦ {t("forge.generate")}</button>
        <div className="forge-actions">
          <button type="button" onClick={exportTower}>{t("forge.export")}</button>
          <button type="button" onClick={shareTower}>{t("forge.share")}</button>
        </div>
      </section>
      <section className="generator-status frame-panel">
        <strong>{t("forge.local")}</strong>
        <span>{generatorStatus}</span>
      </section>
    </>
  );
}

function MiniMap({ floor, tower }: { floor: FloorState; tower: TowerState }) {
  return (
    <div className="minimap-grid" aria-hidden="true">
      {floor.tiles.flatMap((row, y) =>
        row.map((tile, x) => {
          const content = floor.contents[y][x];
          const isHero = tower.player.x === x && tower.player.y === y;
          return <span key={`${x}-${y}`} className={`mini ${isHero ? "hero" : getMiniClass(tile, content)}`} />;
        }),
      )}
    </div>
  );
}

function getMonsterForecast(tower: TowerState, floor: FloorState) {
  const nearby = [
    { x: tower.player.x, y: tower.player.y - 1 },
    { x: tower.player.x + 1, y: tower.player.y },
    { x: tower.player.x, y: tower.player.y + 1 },
    { x: tower.player.x - 1, y: tower.player.y },
  ];

  const positions = [
    ...nearby,
    ...floor.contents.flatMap((row, y) => row.map((_, x) => ({ x, y }))),
  ];

  for (const pos of positions) {
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
}

function getMiniClass(tile: string, content: CellContent) {
  if (content.type === "monster") return "enemy";
  if (content.type === "princess") return "princess";
  if (content.type === "shop") return "shop";
  if (content.type === "item") return content.item.endsWith("Key") ? "key" : "treasure";
  if (content.type === "stairsUp" || content.type === "stairsDown") return "stairs";
  if (tile === "wall") return "wall";
  if (tile.endsWith("Door")) return "door";
  return "floor";
}

function formatLog(entry: LogEntry, t: (key: string, params?: Record<string, string | number>) => string) {
  const params = Object.fromEntries(
    Object.entries(entry.params ?? {}).map(([key, value]) => {
      if (typeof value === "string" && (value.startsWith("monster.") || value.startsWith("item.") || value.startsWith("floor."))) {
        return [key, t(value)];
      }
      if (key === "difficulty") {
        return [key, t(`difficulty.${value}`)];
      }
      return [key, value];
    }),
  );

  return t(entry.key, params);
}

function parseDifficulty(value: string | null): Difficulty {
  return value === "easy" || value === "hard" ? value : "normal";
}

function formatLoss(value: number) {
  return Number.isFinite(value) ? String(value) : "∞";
}

function StatLine({ accent, icon, label, value }: { accent?: "red"; icon: string; label: string; value: string | number }) {
  return (
    <div className={accent ? "stat-line accent-red" : "stat-line"}>
      <SpriteIcon kind={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <p className="stat-mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function KeyToken({ color, value }: { color: "yellow" | "blue" | "red"; value: number }) {
  return (
    <span className={`key-token ${color}`}>
      <SpriteIcon kind={`key-${color}`} />
      <strong>{value}</strong>
    </span>
  );
}

function Meter({ max, value }: { max: number; value: number }) {
  return (
    <span className="meter">
      <i style={{ width: `${Math.max(8, Math.min(100, (value / max) * 100))}%` }} />
    </span>
  );
}

function SpriteIcon({ kind }: { kind: string }) {
  const normalized = kind === "greenSlime" ? "slime" : kind === "nightBat" ? "bat" : kind === "boneGuard" ? "skeleton" : kind === "runeMage" ? "mage" : kind === "ironKnight" ? "knight" : kind === "towerWarden" ? "boss" : kind;
  return <i className={`sprite sprite-${normalized}`} aria-hidden="true" />;
}
