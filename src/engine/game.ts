import { ITEMS, MONSTERS } from "../data/catalog";
import { previewCombat } from "./combat";
import type { CellContent, HeroStats, ItemKind, LevelState, TileKind } from "../types/game";

export type Direction = "up" | "down" | "left" | "right";

const DELTA: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function moveHero(level: LevelState, direction: Direction): LevelState {
  if (level.won || level.lost) {
    return level;
  }

  const delta = DELTA[direction];
  const next = { x: level.player.x + delta.x, y: level.player.y + delta.y };

  if (!isInside(level, next.x, next.y)) {
    return withLog(level, "The tower wall refuses to move.");
  }

  const tile = level.tiles[next.y][next.x];
  if (tile === "wall") {
    return withLog(level, "A sealed wall blocks the way.");
  }

  const doorResult = tryOpenDoor(level.hero, tile);
  if (!doorResult.ok) {
    return withLog(level, doorResult.message);
  }

  const nextLevel = cloneLevel(level);
  if (doorResult.opened) {
    nextLevel.hero = doorResult.hero;
    nextLevel.tiles[next.y][next.x] = "floor";
    pushLog(nextLevel, doorResult.message);
  }

  const content = nextLevel.contents[next.y][next.x];
  if (content.type === "monster") {
    const preview = previewCombat(nextLevel.hero, content.monster);
    const monster = MONSTERS[content.monster];

    if (!preview.canWin) {
      pushLog(nextLevel, `${monster.name} is too strong right now. Expected loss: ${formatLoss(preview.damageTaken)} HP.`);
      return nextLevel;
    }

    nextLevel.hero.hp -= preview.damageTaken;
    nextLevel.hero.gold += monster.gold;
    nextLevel.contents[next.y][next.x] = { type: "empty" };
    if (monster.boss) {
      nextLevel.bossDefeated = true;
    }
    pushLog(nextLevel, `Defeated ${monster.name}. Lost ${preview.damageTaken} HP, gained ${monster.gold} gold.`);
  }

  const afterCombatContent = nextLevel.contents[next.y][next.x];
  if (afterCombatContent.type === "item") {
    applyItem(nextLevel.hero, afterCombatContent.item);
    nextLevel.contents[next.y][next.x] = { type: "empty" };
    pushLog(nextLevel, `Claimed ${ITEMS[afterCombatContent.item].name}: ${ITEMS[afterCombatContent.item].description}.`);
  }

  const finalContent = nextLevel.contents[next.y][next.x];
  if (finalContent.type === "princess") {
    if (!nextLevel.bossDefeated) {
      pushLog(nextLevel, "The crystal around the princess will not break until the Tower Warden falls.");
      return nextLevel;
    }

    nextLevel.won = true;
    pushLog(nextLevel, "The princess wakes, and the tower finally remembers the sky. Victory.");
  }

  nextLevel.player = next;
  nextLevel.moves += 1;

  if (nextLevel.hero.hp <= 0) {
    nextLevel.lost = true;
    pushLog(nextLevel, "Your lantern goes dark inside the tower.");
  }

  return nextLevel;
}

function tryOpenDoor(hero: HeroStats, tile: TileKind): { ok: true; opened: boolean; hero: HeroStats; message: string } | { ok: false; message: string } {
  if (tile === "yellowDoor") {
    if (hero.yellowKeys <= 0) {
      return { ok: false, message: "A sun door waits for a yellow key." };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, yellowKeys: hero.yellowKeys - 1 },
      message: "A yellow key turns. The sun door opens.",
    };
  }

  if (tile === "blueDoor") {
    if (hero.blueKeys <= 0) {
      return { ok: false, message: "A moon door waits for a blue key." };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, blueKeys: hero.blueKeys - 1 },
      message: "A blue key hums. The moon door opens.",
    };
  }

  if (tile === "redDoor") {
    if (hero.redKeys <= 0) {
      return { ok: false, message: "A crown door waits for a red key." };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, redKeys: hero.redKeys - 1 },
      message: "A red key burns bright. The crown door opens.",
    };
  }

  return { ok: true, opened: false, hero, message: "" };
}

function applyItem(hero: HeroStats, item: ItemKind) {
  switch (item) {
    case "smallPotion":
      hero.hp = Math.min(hero.maxHp + 240, hero.hp + 160);
      hero.maxHp = Math.max(hero.maxHp, hero.hp);
      break;
    case "largePotion":
      hero.hp = Math.min(hero.maxHp + 420, hero.hp + 300);
      hero.maxHp = Math.max(hero.maxHp, hero.hp);
      break;
    case "redGem":
      hero.atk += 6;
      break;
    case "blueGem":
      hero.def += 6;
      break;
    case "yellowKey":
      hero.yellowKeys += 1;
      break;
    case "blueKey":
      hero.blueKeys += 1;
      break;
    case "redKey":
      hero.redKeys += 1;
      break;
  }
}

function cloneLevel(level: LevelState): LevelState {
  return {
    ...level,
    player: { ...level.player },
    hero: { ...level.hero },
    tiles: level.tiles.map((row) => [...row]),
    contents: level.contents.map((row) => row.map(cloneContent)),
    log: [...level.log],
  };
}

function cloneContent(content: CellContent): CellContent {
  if (content.type === "item") {
    return { type: "item", item: content.item };
  }
  if (content.type === "monster") {
    return { type: "monster", monster: content.monster };
  }
  if (content.type === "princess") {
    return { type: "princess" };
  }
  return { type: "empty" };
}

function withLog(level: LevelState, message: string) {
  const nextLevel = cloneLevel(level);
  pushLog(nextLevel, message);
  return nextLevel;
}

function pushLog(level: LevelState, message: string) {
  if (message) {
    level.log = [message, ...level.log].slice(0, 7);
  }
}

function isInside(level: LevelState, x: number, y: number) {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

function formatLoss(value: number) {
  return Number.isFinite(value) ? String(value) : "infinite";
}
