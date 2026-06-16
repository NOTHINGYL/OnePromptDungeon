import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ITEMS, MONSTERS, SHOP_COST, SHOP_UPGRADES } from "./data/catalog";
import { previewCombat } from "./engine/combat";
import { buyUpgrade, isPlayerOnShop, moveHero, undo, type Direction } from "./engine/game";
import { createGeneratedTower, getCurrentFloor, makeSeed, randomSeed } from "./engine/level";
import { buildRouteHint, scanTower, summarizeSeed, type RouteHintStep, type ScannerReport, type SeedSummary } from "./engine/analysis";
import { buildReplayExport, buildShareCardSvg, formatChallengeText, getChallengeResult } from "./engine/challenge";
import { playSfx } from "./audio/sfx";
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
import type { Difficulty, FloorState, LogEntry, ReplayStep, ShopUpgrade, TowerState } from "./types/game";
import type { FeedbackEvent } from "./types/feedback";

const EXPECTED_TOWER_FLOORS = 5;
const DEFAULT_WISH = "Rescue the princess from a five-floor tower that answers wishes.";
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const SAVE_STORAGE_KEY = "opd.save.v1.0";
const LEGACY_SAVE_STORAGE_KEYS = ["opd.save.v0.9", "opd.save.v0.8", "opd.save.v0.6"];
const HISTORY_STORAGE_KEY = "opd.seedHistory.v0.6";
const SOUND_STORAGE_KEY = "opd.soundMuted.v0.7";
const WISH_PRESETS = [
  { key: "preset.keyPuzzle", wish: "five-floor tower, scarce blue keys, one risky shop route", difficulty: "normal" as Difficulty },
  { key: "preset.bossRush", wish: "boss rush tower with many fights and one treasure comeback", difficulty: "hard" as Difficulty },
  { key: "preset.treasure", wish: "treasure-heavy tower with gems, potions, and optional monsters", difficulty: "easy" as Difficulty },
  { key: "preset.shop", wish: "merchant economy tower, risky shop route, scarce rewards", difficulty: "normal" as Difficulty },
];
const SEED_GALLERY = [
  {
    key: "gallery.beginner",
    seed: "BEGIN009",
    difficulty: "easy" as Difficulty,
    wish: "beginner five-floor tower with generous keys and safe equipment growth",
    tags: ["style.keyPuzzle", "style.equipment"],
  },
  {
    key: "gallery.keyPressure",
    seed: "KEYS0909",
    difficulty: "normal" as Difficulty,
    wish: "five-floor key pressure tower with scarce blue keys and one risky shop route",
    tags: ["style.keyPuzzle", "style.shop"],
  },
  {
    key: "gallery.bossRush",
    seed: "BOSS0909",
    difficulty: "hard" as Difficulty,
    wish: "boss rush tower with many fights, weapon timing, and a treasure comeback",
    tags: ["style.bossRush", "style.combat"],
  },
  {
    key: "gallery.merchant",
    seed: "SHOP0909",
    difficulty: "normal" as Difficulty,
    wish: "merchant economy tower where shop timing and gold routing matter",
    tags: ["style.shop", "style.combat"],
  },
  {
    key: "gallery.sword",
    seed: "SWORD909",
    difficulty: "normal" as Difficulty,
    wish: "sword first tower with weapon upgrades opening the risky route",
    tags: ["style.equipment", "identity.weapon"],
  },
  {
    key: "gallery.shield",
    seed: "SHIELD09",
    difficulty: "normal" as Difficulty,
    wish: "shield first tower with defense checks and safe fight planning",
    tags: ["style.equipment", "identity.shield"],
  },
  {
    key: "gallery.treasureTrap",
    seed: "TRAP0909",
    difficulty: "hard" as Difficulty,
    wish: "treasure trap tower with tempting gems, scarce keys, and dangerous monsters",
    tags: ["style.treasure", "style.keyPuzzle"],
  },
  {
    key: "gallery.oneHp",
    seed: "ONEHP909",
    difficulty: "hard" as Difficulty,
    wish: "one hp escape tower with combat pressure, late shield, and exact route planning",
    tags: ["style.combat", "identity.shield"],
  },
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
    if (!isCompatibleSavedTower(parsed)) {
      localStorage.removeItem(SAVE_STORAGE_KEY);
      LEGACY_SAVE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      return null;
    }
    return normalizeSavedTower(parsed);
  } catch {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    return null;
  }
}

function isCompatibleSavedTower(tower: TowerState | null | undefined) {
  return Boolean(tower?.seed && Array.isArray(tower.floors) && tower.floors.length >= EXPECTED_TOWER_FLOORS);
}

function normalizeSavedTower(tower: TowerState): TowerState {
  return {
    ...tower,
    hero: normalizeHero(tower.hero),
    replay: normalizeReplay(tower.replay),
    history: (tower.history ?? []).map((snapshot) => ({
      ...snapshot,
      hero: normalizeHero(snapshot.hero),
      replay: normalizeReplay(snapshot.replay),
    })),
  };
}

function normalizeHero(hero: TowerState["hero"]): TowerState["hero"] {
  return {
    ...hero,
    level: hero.level ?? 1,
    exp: hero.exp ?? 0,
    nextLevelExp: hero.nextLevelExp ?? 30,
    weapon: hero.weapon ?? "none",
    shield: hero.shield ?? "none",
  };
}

function normalizeReplay(replay: TowerState["replay"]): ReplayStep[] {
  return (replay ?? []).map((step, index) => ({
    ...step,
    step: step.step ?? index + 1,
    hero: {
      hp: step.hero?.hp ?? 0,
      atk: step.hero?.atk ?? 0,
      def: step.hero?.def ?? 0,
      gold: step.hero?.gold ?? 0,
      level: step.hero?.level ?? 1,
    },
  }));
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

function getInitialSoundMuted() {
  return localStorage.getItem(SOUND_STORAGE_KEY) === "true";
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
  const [soundMuted, setSoundMuted] = useState(getInitialSoundMuted);
  const [feedback, setFeedback] = useState<FeedbackEvent | null>(null);
  const [monsterBookOpen, setMonsterBookOpen] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);

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

  useEffect(() => {
    localStorage.setItem(SOUND_STORAGE_KEY, String(soundMuted));
  }, [soundMuted]);

  const triggerFeedback = useCallback((event: Omit<FeedbackEvent, "id">) => {
    const nextEvent = { ...event, id: Date.now() };
    setFeedback(nextEvent);
    playSfx(nextEvent.kind, soundMuted);
  }, [soundMuted]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const move = useCallback((direction: Direction) => {
    setTower((current) => {
      const nextTower = moveHero(current, direction);
      const event = createMoveFeedback(current, nextTower, direction);
      if (event) {
        triggerFeedback(event);
      } else {
        clearFeedback();
      }
      return appendReplayStep(nextTower, current, `move:${direction}`, nextTower.log[0]?.key);
    });
  }, [clearFeedback, triggerFeedback]);

  const restart = () => {
    const nextTower = createGeneratedTower({ prompt: wish, seed, difficulty });
    setTower(appendReplayStep(nextTower, undefined, "restart", "restart"));
    setResultDismissed(false);
    addSeedHistory(nextTower);
    setGeneratorStatus("generator.restarted");
  };

  const generateTower = () => {
    const nextSeed = seed || makeSeed(wish);
    const nextTower = createGeneratedTower({ prompt: wish, seed: nextSeed, difficulty });
    setTower(appendReplayStep(nextTower, undefined, "generate", "generate"));
    setResultDismissed(false);
    setSeed(nextTower.seed);
    addSeedHistory(nextTower);
    setGeneratorStatus("generator.generated");
    triggerFeedback({
      kind: "stairs",
      floorIndex: 0,
      from: nextTower.player,
      to: nextTower.player,
      label: "Seed",
    });
  };

  const rerollSeed = () => {
    setSeed(randomSeed());
    setGeneratorStatus("generator.seedReady");
  };

  const buy = (upgrade: ShopUpgrade) => {
    setTower((current) => {
      const nextTower = buyUpgrade(current, upgrade);
      if (nextTower.hero.gold < current.hero.gold) {
        triggerFeedback({
          kind: "shop",
          floorIndex: current.currentFloorIndex,
          from: current.player,
          to: current.player,
          label: t(`shop.${upgrade}.label`),
        });
      } else if (nextTower.log[0]?.key === "log.notEnoughGold" || nextTower.log[0]?.key === "log.noMerchant") {
        triggerFeedback({
          kind: "blocked",
          floorIndex: current.currentFloorIndex,
          from: current.player,
          to: current.player,
          label: t(nextTower.log[0].key),
        });
      }
      return appendReplayStep(nextTower, current, `shop:${upgrade}`, nextTower.log[0]?.key);
    });
  };

  const undoStep = useCallback(() => {
    setTower((current) => {
      const nextTower = undo(current);
      if (nextTower !== current) {
        triggerFeedback({
          kind: "undo",
          floorIndex: nextTower.currentFloorIndex,
          from: nextTower.player,
          to: nextTower.player,
          label: t("log.undid"),
        });
      }
      return appendReplayStep(nextTower, current, "undo", "undo");
    });
  }, [t, triggerFeedback]);

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

  const applyGallerySeed = (entry: (typeof SEED_GALLERY)[number]) => {
    const nextTower = createGeneratedTower({ prompt: entry.wish, seed: entry.seed, difficulty: entry.difficulty });
    setWish(entry.wish);
    setSeed(entry.seed);
    setDifficulty(entry.difficulty);
    setTower(appendReplayStep(nextTower, undefined, "gallery", entry.key));
    setResultDismissed(false);
    addSeedHistory(nextTower);
    setGeneratorStatus("generator.galleryLoaded");
  };

  const restoreSeed = (entry: SeedHistoryEntry) => {
    const nextTower = createGeneratedTower({ prompt: entry.wish, seed: entry.seed, difficulty: entry.difficulty });
    setWish(entry.wish);
    setSeed(entry.seed);
    setDifficulty(entry.difficulty);
    setTower(appendReplayStep(nextTower, undefined, "restore", entry.seed));
    setResultDismissed(false);
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
            <button type="button" onClick={() => setSoundMuted((current) => !current)}>
              {soundMuted ? t("button.soundOff") : t("button.soundOn")}
            </button>
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
                <span>{t("status.level")} {tower.hero.level} {t("status.hero")}</span>
                <div className="exp-row">
                  <small>EXP</small>
                  <b>{tower.hero.exp} / {tower.hero.nextLevelExp}</b>
                </div>
                <div className="exp-bar"><i style={{ width: `${Math.max(4, Math.min(100, (tower.hero.exp / tower.hero.nextLevelExp) * 100))}%` }} /></div>
                <div className="equipment-lines">
                  <span title={t("status.weapon")}><SpriteIcon kind="sword" width={14} height={14} /> <b>{t(`equipment.${tower.hero.weapon}`)}</b></span>
                  <span title={t("status.shield")}><SpriteIcon kind="shield" width={14} height={14} /> <b>{t(`equipment.${tower.hero.shield}`)}</b></span>
                </div>
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
              <GameCanvas feedback={feedback} floor={floor} language={language} theme={theme} tower={tower} />
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
                seedGallery={SEED_GALLERY}
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
                applyGallerySeed={applyGallerySeed}
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
            <h2>{t("fight.title")} <button className="inline-panel-button" type="button" onClick={() => setMonsterBookOpen(true)}>{t("book.title")}</button></h2>
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
      {monsterBookOpen ? (
        <MonsterBook floor={floor} t={t} tower={tower} close={() => setMonsterBookOpen(false)} />
      ) : null}
      {(tower.won || tower.lost) && !resultDismissed ? (
        <ResultDialog close={() => setResultDismissed(true)} shareTower={shareTower} t={t} tower={tower} />
      ) : null}
    </main>
  );
}

function createMoveFeedback(before: TowerState, after: TowerState, direction: Direction): Omit<FeedbackEvent, "id"> | null {
  const delta = directionDelta(direction);
  const target = { x: before.player.x + delta.x, y: before.player.y + delta.y };
  const beforeFloor = getCurrentFloor(before);
  const logKey = after.log[0]?.key;

  if (target.x < 0 || target.y < 0 || target.x >= beforeFloor.width || target.y >= beforeFloor.height) {
    return { kind: "blocked", floorIndex: before.currentFloorIndex, from: before.player, to: before.player, label: "Blocked" };
  }

  const tile = beforeFloor.tiles[target.y][target.x];
  const content = beforeFloor.contents[target.y][target.x];

  if (after.won && !before.won) {
    return { kind: "victory", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: "Victory", strong: true };
  }
  if (after.lost && !before.lost) {
    return { kind: "fallen", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: "Fallen", strong: true };
  }
  if (logKey?.includes("Blocked") || logKey === "log.wall" || logKey === "log.outerWall" || logKey === "log.princessSealed" || logKey === "log.monsterTooStrong") {
    return { kind: "blocked", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: "Blocked" };
  }
  if (content.type === "monster" && beforeFloor.contents[target.y][target.x].type === "monster") {
    const damage = Math.max(0, before.hero.hp - after.hero.hp);
    return { kind: "combat", floorIndex: before.currentFloorIndex, from: before.player, to: target, damage, strong: MONSTERS[content.monster].boss };
  }
  if (content.type === "item") {
    return { kind: "pickup", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: itemLabel(content.item) };
  }
  if (tile.endsWith("Door") && logKey?.includes("DoorOpened")) {
    return { kind: "door", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: "Open" };
  }
  if (content.type === "stairsUp" || content.type === "stairsDown") {
    return { kind: "stairs", floorIndex: before.currentFloorIndex, from: before.player, to: target, label: "Stairs" };
  }
  return null;
}

function directionDelta(direction: Direction) {
  if (direction === "up") return { x: 0, y: -1 };
  if (direction === "down") return { x: 0, y: 1 };
  if (direction === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function itemLabel(item: string) {
  if (item.endsWith("Key")) return "Key";
  if (item.includes("Potion")) return "HP";
  if (item === "redGem") return "ATK";
  if (item === "blueGem") return "DEF";
  if (item.includes("Sword")) return "ATK";
  if (item.includes("Shield")) return "DEF";
  return "Item";
}

function appendReplayStep(nextTower: TowerState, previousTower: TowerState | undefined, action: string, note?: string): TowerState {
  const replay = nextTower.replay ?? [];
  const last = replay[replay.length - 1];
  const duplicateNoOp = previousTower === nextTower;
  if (duplicateNoOp) {
    return nextTower;
  }

  return {
    ...nextTower,
    replay: [
      ...replay,
      {
        step: (last?.step ?? 0) + 1,
        action,
        floor: nextTower.currentFloorIndex + 1,
        from: previousTower ? { ...previousTower.player } : undefined,
        to: { ...nextTower.player },
        hero: {
          hp: nextTower.hero.hp,
          atk: nextTower.hero.atk,
          def: nextTower.hero.def,
          gold: nextTower.hero.gold,
          level: nextTower.hero.level,
        },
        note,
      },
    ].slice(-600),
  };
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
          <ScanMetric label={t("scanner.pressure")} value={scanner.pressureScore} tone={scanner.pressureScore > 70 ? "bad" : scanner.pressureScore > 45 ? "warn" : "good"} />
          <ScanMetric label={t("scanner.keys")} value={`${scanner.remainingKeys.yellow}/${scanner.remainingKeys.blue}/${scanner.remainingKeys.red}`} />
          <ScanMetric label={t("scanner.doors")} value={`${scanner.blockedDoors.yellow}/${scanner.blockedDoors.blue}/${scanner.blockedDoors.red}`} tone="warn" />
          <ScanMetric label={t("scanner.dependency")} value={formatDependency(scanner.dependencies)} />
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

function formatDependency(dependencies: ScannerReport["dependencies"]) {
  const entries = [
    ["K", dependencies.key],
    ["C", dependencies.combat],
    ["E", dependencies.equipment],
    ["S", dependencies.shop],
  ].sort((a, b) => Number(b[1]) - Number(a[1]));
  return entries.slice(0, 2).map(([label, value]) => `${label}${value}`).join("/");
}

function WishForge({
  applyGallerySeed,
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
  seedGallery,
  seedSummary,
  setDifficulty,
  setSeed,
  setWish,
  shareTower,
  t,
  wish,
}: {
  applyGallerySeed: (entry: (typeof SEED_GALLERY)[number]) => void;
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
  seedGallery: typeof SEED_GALLERY;
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
          <span>{t("report.shape")}: {seedSummary.totalKeys}K / {seedSummary.totalDoors}D / {seedSummary.totalMonsters}M / {seedSummary.equipment}E</span>
          <span>{t("report.pressure")}: <b className={seedSummary.pressureScore > 70 ? "bad" : seedSummary.pressureScore > 45 ? "warn" : "good"}>{seedSummary.pressureScore}</b> · {t(seedSummary.routeIdentity)}</span>
          <span>{seedSummary.style.map((style) => t(style)).join(" · ")}</span>
        </div>
        <button className="generate-button" type="button" onClick={generateTower}>✦ {t("forge.generate")}</button>
        <div className="seed-gallery">
          <strong>{t("gallery.title")}</strong>
          <div className="gallery-list">
            {seedGallery.map((entry) => (
              <button key={entry.seed} type="button" onClick={() => applyGallerySeed(entry)}>
                <span>{t(`${entry.key}.name`)}</span>
                <small>{entry.seed} · {t(`difficulty.${entry.difficulty}`)}</small>
                <em>{entry.tags.map((tag) => t(tag)).join(" · ")}</em>
              </button>
            ))}
          </div>
        </div>
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

function MonsterBook({ close, floor, t, tower }: { close: () => void; floor: FloorState; t: (key: string, params?: Record<string, string | number>) => string; tower: TowerState }) {
  const monsters = getFloorMonsterRows(floor, tower);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("book.title")}>
      <section className="modal-panel frame-panel monster-book">
        <div className="modal-heading">
          <h2>{t("book.title")}</h2>
          <button type="button" onClick={close}>×</button>
        </div>
        <div className="monster-book-list">
          {monsters.length === 0 ? <p className="empty-note">{t("book.empty")}</p> : null}
          {monsters.map(({ count, kind, preview }) => {
            const monster = MONSTERS[kind];
            return (
              <div className="monster-book-row" key={kind}>
                <SpriteIcon kind={kind} />
                <div>
                  <strong>{t(monster.name)} <small>×{count}</small></strong>
                  <span>HP {monster.hp} · ATK {monster.atk} · DEF {monster.def} · Gold {monster.gold}</span>
                </div>
                <b className={preview.canWin ? "good" : "bad"}>{preview.canWin ? t("scanner.yes") : t("scanner.no")}</b>
                <em>{t("fight.loss")} {formatLoss(preview.damageTaken)}</em>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ResultDialog({ close, shareTower, t, tower }: { close: () => void; shareTower: () => void; t: (key: string, params?: Record<string, string | number>) => string; tower: TowerState }) {
  const summary = getRunSummary(tower);
  const challenge = getChallengeResult(tower);
  const copyChallenge = async () => {
    await navigator.clipboard?.writeText(formatChallengeText(tower, challenge, `${window.location.origin}${window.location.pathname}`));
  };
  const downloadReplay = () => {
    downloadText(`opd-replay-${tower.seed}.json`, JSON.stringify(buildReplayExport(tower, challenge), null, 2), "application/json");
  };
  const downloadCard = () => {
    downloadText(`opd-card-${tower.seed}.svg`, buildShareCardSvg(tower, challenge), "image/svg+xml");
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={tower.won ? t("result.victory") : t("result.fallen")}>
      <section className="modal-panel frame-panel result-panel">
        <div className="modal-heading">
          <h2>{tower.won ? t("result.victory") : t("result.fallen")}</h2>
          <button type="button" onClick={close}>×</button>
        </div>
        <p>{tower.won ? t("result.victorySub") : t("result.fallenSub")}</p>
        <div className={`share-card-preview rank-${challenge.rank.toLowerCase()}`}>
          <span>{t("challenge.label")}</span>
          <strong>{challenge.rank}</strong>
          <p>{tower.seed} · {t(challenge.identity)} · {t("challenge.pressure")} {challenge.pressure}</p>
        </div>
        <div className="result-grid">
          <ResultMetric label={t("challenge.rank")} value={`${challenge.rank} / ${challenge.score}`} />
          <ResultMetric label={t("app.seed")} value={tower.seed} />
          <ResultMetric label={t("forge.difficulty")} value={t(`difficulty.${tower.difficulty}`)} />
          <ResultMetric label={t("result.moves")} value={tower.moves} />
          <ResultMetric label={t("status.hp")} value={`${tower.hero.hp} / ${tower.hero.maxHp}`} />
          <ResultMetric label={t("result.defeated")} value={summary.defeated} />
          <ResultMetric label={t("result.doors")} value={summary.doors} />
          <ResultMetric label={t("result.shops")} value={summary.shops} />
          <ResultMetric label={t("status.gold")} value={tower.hero.gold} />
        </div>
        <div className="result-actions">
          <button type="button" onClick={copyChallenge}>{t("challenge.copy")}</button>
          <button type="button" onClick={downloadCard}>{t("challenge.card")}</button>
          <button type="button" onClick={downloadReplay}>{t("challenge.replay")}</button>
          <button type="button" onClick={shareTower}>{t("forge.share")}</button>
          <button type="button" onClick={close}>{t("result.close")}</button>
        </div>
      </section>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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

function getFloorMonsterRows(floor: FloorState, tower: TowerState) {
  const counts = new Map<keyof typeof MONSTERS, number>();
  floor.contents.flat().forEach((content) => {
    if (content.type === "monster") {
      counts.set(content.monster, (counts.get(content.monster) ?? 0) + 1);
    }
  });
  return [...counts.entries()].map(([kind, count]) => ({ kind, count, preview: previewCombat(tower.hero, kind) }));
}

function getRunSummary(tower: TowerState) {
  return tower.runStats ?? { defeated: 0, doors: 0, pickups: 0, shops: 0 };
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
