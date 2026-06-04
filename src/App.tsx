import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ITEMS, MONSTERS, SHOP_COST, SHOP_UPGRADES } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { buyUpgrade, isPlayerOnShop, moveHero, undo, type Direction } from "./engine/game";
import { createGeneratedTower, getCurrentFloor, makeSeed, randomSeed } from "./engine/level";
import { buildRouteHint, scanTower, summarizeSeed, type RouteHintStep, type ScannerReport, type SeedSummary } from "./engine/analysis";
import {
  detectLanguage,
  LANG_STORAGE_KEY,
  THEME_STORAGE_KEY,
  translate,
  type Language,
} from "./i18n";
import { spriteStyle, type SpriteName } from "./assets/sprites";
import { isUiIcon, uiIconStyle } from "./assets/uiIcons";
import { GameCanvas, type TowerTheme } from "./ui/GameCanvas";
import type { Difficulty, FloorState, LogEntry, ShopUpgrade, TowerState } from "./types/game";

const DEFAULT_WISH = "Rescue the princess from a three-floor tower that answers wishes.";
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const SAVE_STORAGE_KEY = "opd.save.v0.6";
const HISTORY_STORAGE_KEY = "opd.seedHistory.v0.6";
const WISH_PRESETS = [
  { key: "preset.keyPuzzle", wish: "three-floor tower, scarce blue keys, one risky shop route", difficulty: "normal" as Difficulty },
  { key: "preset.bossRush", wish: "boss rush tower with many fights and one treasure comeback", difficulty: "hard" as Difficulty },
  { key: "preset.treasure", wish: "treasure-heavy tower with gems, potions, and optional monsters", difficulty: "easy" as Difficulty },
  { key: "preset.shop", wish: "merchant economy tower, risky shop route, scarce rewards", difficulty: "normal" as Difficulty },
];

type SeedHistoryEntry = {
  seed: string;
  difficulty: Difficulty;
  wish: string;
  solvable: boolean;
};

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
  const hasSharedTower = params.has("wish") || params.has("seed") || params.has("difficulty");
  if (!hasSharedTower) {
    const saved = loadSavedTower();
    if (saved) {
      return saved;
    }
  }

  const prompt = params.get("wish") || DEFAULT_WISH;
  const seed = params.get("seed") || makeSeed(prompt);
  const difficulty = parseDifficulty(params.get("difficulty"));
  return createGeneratedTower({ prompt, seed, difficulty });
}

function loadSavedTower() {
  try {
    const saved = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!saved) {
      return null;
    }
    const parsed = JSON.parse(saved) as TowerState;
    return parsed?.seed && Array.isArray(parsed.floors) ? parsed : null;
  } catch {
    return null;
  }
}

function loadSeedHistory(): SeedHistoryEntry[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = saved ? (JSON.parse(saved) as SeedHistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
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
  const [seedHistory, setSeedHistory] = useState<SeedHistoryEntry[]>(loadSeedHistory);

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

  useEffect(() => {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(tower));
  }, [tower]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(seedHistory));
  }, [seedHistory]);

  const move = useCallback((direction: Direction) => {
    setTower((current) => moveHero(current, direction));
  }, []);

  const restart = () => {
    const nextTower = createGeneratedTower({ prompt: wish, seed, difficulty });
    setTower(nextTower);
    addSeedHistory(nextTower);
    setGeneratorStatus("generator.restarted");
  };

  const generateTower = () => {
    const nextSeed = seed || makeSeed(wish);
    const nextTower = createGeneratedTower({ prompt: wish, seed: nextSeed, difficulty });
    setTower(nextTower);
    setSeed(nextTower.seed);
    addSeedHistory(nextTower);
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

  const applyPreset = (preset: (typeof WISH_PRESETS)[number]) => {
    setWish(preset.wish);
    setDifficulty(preset.difficulty);
    setSeed(makeSeed(preset.wish));
    setGeneratorStatus("generator.presetReady");
  };

  const restoreSeed = (entry: SeedHistoryEntry) => {
    const nextTower = createGeneratedTower({ prompt: entry.wish, seed: entry.seed, difficulty: entry.difficulty });
    setWish(entry.wish);
    setSeed(entry.seed);
    setDifficulty(entry.difficulty);
    setTower(nextTower);
    setGeneratorStatus("generator.restored");
  };

  const addSeedHistory = (nextTower: TowerState) => {
    const summary = summarizeSeed(nextTower);
    setSeedHistory((current) => [
      {
        seed: nextTower.seed,
        difficulty: nextTower.difficulty,
        wish: nextTower.prompt,
        solvable: summary.solvable,
      },
      ...current.filter((entry) => entry.seed !== nextTower.seed),
    ].slice(0, 5));
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
  const scanner = useMemo(() => scanTower(tower, floor), [floor, tower]);
  const seedSummary = useMemo(() => summarizeSeed(tower), [tower]);
  const routeHint = useMemo(() => buildRouteHint(tower, floor, scanner), [floor, scanner, tower]);

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
            <SpriteIcon kind="brandShield" width={38} height={38} />
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
              <div className="hero-portrait" aria-hidden="true"><SpriteIcon kind="heroPortrait" width={122} height={116} /></div>
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
                <SpriteIcon kind="smallPotion" /><span>2</span>
                <SpriteIcon kind="largePotion" /><span>1</span>
                <SpriteIcon kind="redGem" /><span>1</span>
                <SpriteIcon kind="blueGem" /><span>0</span>
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
                seedHistory={seedHistory}
                seedSummary={seedSummary}
                rerollSeed={rerollSeed}
                restoreSeed={restoreSeed}
                seed={seed}
                presets={WISH_PRESETS}
                setDifficulty={setDifficulty}
                setSeed={setSeed}
                setWish={setWish}
                shareTower={shareTower}
                t={t}
                wish={wish}
                applyPreset={applyPreset}
                close={() => setForgeOpen(false)}
              />
            ) : (
              <TacticalPanel
                floor={floor}
                monsterForecast={monsterForecast}
                openForge={() => setForgeOpen(true)}
                scanner={scanner}
                seed={tower.seed}
                seedSummary={seedSummary}
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
            <RouteHint rows={routeHint} t={t} />
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
  scanner,
  seed,
  seedSummary,
  t,
  tower,
}: {
  floor: FloorState;
  monsterForecast: ReturnType<typeof getMonsterForecast>;
  openForge: () => void;
  scanner: ScannerReport;
  seed: string;
  seedSummary: SeedSummary;
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
      <section className="scanner-card frame-panel">
        <h2>{t("scanner.title")}</h2>
        <div className="scanner-grid">
          <ScanMetric label={t("scanner.reachable")} value={`${scanner.reachablePercent}%`} tone={scanner.reachablePercent > 50 ? "good" : "warn"} />
          <ScanMetric label={t("scanner.safeFights")} value={scanner.safeFights} tone={scanner.safeFights > 0 ? "good" : "warn"} />
          <ScanMetric label={t("scanner.keys")} value={`${scanner.remainingKeys.yellow}/${scanner.remainingKeys.blue}/${scanner.remainingKeys.red}`} />
          <ScanMetric label={t("scanner.doors")} value={`${scanner.blockedDoors.yellow}/${scanner.blockedDoors.blue}/${scanner.blockedDoors.red}`} tone="warn" />
          <ScanMetric label={t("scanner.solvable")} value={seedSummary.solvable ? t("scanner.yes") : t("scanner.no")} tone={seedSummary.solvable ? "good" : "bad"} />
          <ScanMetric label={t("scanner.next")} value={t(scanner.nextTarget.key)} tone={scanner.nextTarget.tone} />
        </div>
      </section>
      <button className="seed-badge" type="button" onClick={openForge}>
        ◈ {t("app.seed")} <strong>{seed}</strong>
      </button>
    </>
  );
}

function ScanMetric({ label, tone, value }: { label: string; tone?: "good" | "warn" | "bad"; value: string | number }) {
  return (
    <div className="scan-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function WishForge({
  applyPreset,
  close,
  difficulty,
  exportTower,
  generateTower,
  generatorStatus,
  presets,
  rerollSeed,
  restoreSeed,
  seed,
  seedHistory,
  seedSummary,
  setDifficulty,
  setSeed,
  setWish,
  shareTower,
  t,
  wish,
}: {
  applyPreset: (preset: (typeof WISH_PRESETS)[number]) => void;
  close: () => void;
  difficulty: Difficulty;
  exportTower: () => void;
  generateTower: () => void;
  generatorStatus: string;
  presets: typeof WISH_PRESETS;
  rerollSeed: () => void;
  restoreSeed: (entry: SeedHistoryEntry) => void;
  seed: string;
  seedHistory: SeedHistoryEntry[];
  seedSummary: SeedSummary;
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
        <div className="preset-grid">
          {presets.map((preset) => (
            <button key={preset.key} type="button" onClick={() => applyPreset(preset)}>
              {t(preset.key)}
            </button>
          ))}
        </div>
        <label>
          <span>{t("forge.wish")}</span>
          <textarea value={wish} onChange={(event) => setWish(event.target.value)} rows={2} />
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
        <div className="forge-report">
          <strong>{t("report.title")}</strong>
          <span>{t("report.solvable")}: <b className={seedSummary.solvable ? "good" : "bad"}>{seedSummary.solvable ? t("scanner.yes") : t("scanner.no")}</b></span>
          <span>{t("report.shape")}: {seedSummary.totalKeys}K / {seedSummary.totalDoors}D / {seedSummary.totalMonsters}M</span>
          <span>{seedSummary.style.map((style) => t(style)).join(" · ")}</span>
        </div>
        <button className="generate-button" type="button" onClick={generateTower}>✦ {t("forge.generate")}</button>
        <div className="seed-history">
          <strong>{t("history.title")}</strong>
          {seedHistory.length > 0 ? seedHistory.map((entry) => (
            <button key={`${entry.seed}-${entry.difficulty}`} type="button" onClick={() => restoreSeed(entry)}>
              <span>{entry.seed}</span>
              <small>{t(`difficulty.${entry.difficulty}`)} · {entry.solvable ? t("scanner.yes") : t("scanner.no")}</small>
            </button>
          )) : <span className="empty-note">{t("history.empty")}</span>}
        </div>
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

function RouteHint({ rows, t }: { rows: RouteHintStep[][]; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="route-hint-body">
      {rows.map((row, rowIndex) => (
        <div className="route-icons" key={rowIndex}>
          {row.map((step, index) => (
            <Fragment key={`${step.icon}-${index}`}>
              <span className="route-step">
                <SpriteIcon kind={step.icon} />
                <small className={step.tone}>{t(step.key)}</small>
              </span>
              {index < row.length - 1 ? <b className="route-arrow" key={`${step.icon}-${index}-arrow`}>→</b> : null}
            </Fragment>
          ))}
        </div>
      ))}
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

function SpriteIcon({ height, kind, width }: { height?: number; kind: string; width?: number }) {
  if (isUiIcon(kind)) {
    const displayWidth = width ?? (kind === "brandShield" ? 34 : 30);
    const displayHeight = height ?? (kind === "brandShield" ? 36 : 30);
    return <i className="sprite sprite-ui-icon" style={uiIconStyle(kind, displayWidth, displayHeight)} aria-hidden="true" />;
  }

  const sheetName = toSheetSprite(kind);
  if (sheetName) {
    const displayWidth = width ?? (sheetName === "heroPortrait" ? 122 : sheetName === "towerWarden" ? 48 : 30);
    const displayHeight = height ?? (sheetName === "heroPortrait" ? 116 : sheetName === "towerWarden" ? 48 : 30);
    return <i className="sprite sprite-sheet" style={spriteStyle(sheetName, displayWidth, displayHeight)} aria-hidden="true" />;
  }

  const normalized = kind === "heart" ? "heart" : kind === "sword" ? "sword" : kind === "shield" ? "shield" : kind === "coin" ? "coin" : kind;
  return <i className={`sprite sprite-${normalized}`} aria-hidden="true" />;
}

function toSheetSprite(kind: string): SpriteName | null {
  switch (kind) {
    case "greenSlime":
      return "greenSlime";
    case "nightBat":
    case "bat":
      return "nightBat";
    case "boneGuard":
      return "boneGuard";
    case "runeMage":
      return "runeMage";
    case "ironKnight":
      return "ironKnight";
    case "towerWarden":
    case "boss":
      return "towerWarden";
    case "hero":
      return "hero";
    case "heroPortrait":
      return "heroPortrait";
    case "princess":
      return "princess";
    case "key-yellow":
    case "keyYellow":
    case "yellowKey":
      return "yellowKey";
    case "key-blue":
    case "keyBlue":
    case "blueKey":
      return "blueKey";
    case "key-red":
    case "keyRed":
    case "redKey":
      return "redKey";
    case "smallPotion":
      return "smallPotion";
    case "largePotion":
      return "largePotion";
    case "redGem":
    case "gemRed":
      return "redGem";
    case "blueGem":
    case "gemBlue":
      return "blueGem";
    case "doorYellow":
    case "yellowDoor":
      return "yellowDoor";
    case "doorBlue":
    case "blueDoor":
      return "blueDoor";
    case "doorRed":
    case "redDoor":
      return "redDoor";
    case "stairs":
      return "stairs";
    case "shop":
      return "shop";
    default:
      return null;
  }
}
