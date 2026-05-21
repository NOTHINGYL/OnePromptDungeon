import { ITEMS, MONSTERS, SHOP_COST } from "../data/catalog";
import { previewCombat } from "./combat";
import { getCurrentFloor } from "./level";
import type {
  CellContent,
  FloorState,
  HeroStats,
  ItemKind,
  Position,
  ShopUpgrade,
  TileKind,
  TowerSnapshot,
  TowerState,
} from "../types/game";

export type Direction = "up" | "down" | "left" | "right";

const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const HISTORY_LIMIT = 30;

export function moveHero(tower: TowerState, direction: Direction): TowerState {
  if (tower.won || tower.lost) {
    return tower;
  }

  const floor = getCurrentFloor(tower);
  const delta = DELTA[direction];
  const next = { x: tower.player.x + delta.x, y: tower.player.y + delta.y };

  if (!isInside(floor, next.x, next.y)) {
    return withLog(tower, "log.outerWall");
  }

  const tile = floor.tiles[next.y][next.x];
  if (tile === "wall") {
    return withLog(tower, "log.wall");
  }

  const doorResult = tryOpenDoor(tower.hero, tile);
  if (!doorResult.ok) {
    return withLog(tower, doorResult.message);
  }

  const nextTower = cloneTower(tower);
  const activeFloor = getCurrentFloor(nextTower);
  nextTower.history = pushHistory(tower);

  if (doorResult.opened) {
    nextTower.hero = doorResult.hero;
    activeFloor.tiles[next.y][next.x] = "floor";
    pushLog(nextTower, doorResult.message);
  }

  const content = activeFloor.contents[next.y][next.x];
  if (content.type === "monster") {
    const preview = previewCombat(nextTower.hero, content.monster);
    const monster = MONSTERS[content.monster];

    if (!preview.canWin) {
      return withLog(tower, "log.monsterTooStrong", { monster: monster.name, loss: formatLoss(preview.damageTaken) });
    }

    nextTower.hero.hp -= preview.damageTaken;
    nextTower.hero.gold += monster.gold;
    activeFloor.contents[next.y][next.x] = { type: "empty" };
    if (monster.boss) {
      nextTower.bossDefeated = true;
    }
    pushLog(nextTower, "log.defeated", { monster: monster.name, loss: preview.damageTaken, gold: monster.gold });
  }

  const afterCombatContent = activeFloor.contents[next.y][next.x];
  if (afterCombatContent.type === "item") {
    applyItem(nextTower.hero, afterCombatContent.item);
    activeFloor.contents[next.y][next.x] = { type: "empty" };
    pushLog(nextTower, "log.claimed", {
      item: ITEMS[afterCombatContent.item].name,
      description: ITEMS[afterCombatContent.item].description,
    });
  }

  const finalContent = activeFloor.contents[next.y][next.x];
  if (finalContent.type === "stairsUp") {
    const climbed = climb(nextTower, "up");
    if (!climbed) {
      return withLog(tower, "log.stairsUpBlocked");
    }
    nextTower.moves += 1;
    pushLog(nextTower, "log.climbed", { floor: getCurrentFloor(nextTower).title });
    return nextTower;
  }

  if (finalContent.type === "stairsDown") {
    const descended = climb(nextTower, "down");
    if (!descended) {
      return withLog(tower, "log.stairsDownBlocked");
    }
    nextTower.moves += 1;
    pushLog(nextTower, "log.descended", { floor: getCurrentFloor(nextTower).title });
    return nextTower;
  }

  if (finalContent.type === "shop") {
    pushLog(nextTower, "log.shopHere");
  }

  if (finalContent.type === "princess") {
    if (!nextTower.bossDefeated) {
      return withLog(tower, "log.princessSealed");
    }

    nextTower.won = true;
    pushLog(nextTower, "log.victory");
  }

  nextTower.player = next;
  nextTower.moves += 1;

  if (nextTower.hero.hp <= 0) {
    nextTower.lost = true;
    pushLog(nextTower, "log.fallen");
  }

  return nextTower;
}

export function buyUpgrade(tower: TowerState, upgrade: ShopUpgrade): TowerState {
  const floor = getCurrentFloor(tower);
  const content = floor.contents[tower.player.y][tower.player.x];

  if (tower.won || tower.lost) {
    return tower;
  }

  if (content.type !== "shop") {
    return withLog(tower, "log.noMerchant");
  }

  if (tower.hero.gold < SHOP_COST) {
    return withLog(tower, "log.notEnoughGold");
  }

  const nextTower = cloneTower(tower);
  nextTower.history = pushHistory(tower);
  nextTower.hero.gold -= SHOP_COST;

  if (upgrade === "atk") {
    nextTower.hero.atk += 12;
    pushLog(nextTower, "log.buyAtk");
  }
  if (upgrade === "def") {
    nextTower.hero.def += 12;
    pushLog(nextTower, "log.buyDef");
  }
  if (upgrade === "hp") {
    nextTower.hero.hp += 250;
    nextTower.hero.maxHp = Math.max(nextTower.hero.maxHp, nextTower.hero.hp);
    pushLog(nextTower, "log.buyHp");
  }

  return nextTower;
}

export function undo(tower: TowerState): TowerState {
  const [previous, ...rest] = tower.history;
  if (!previous) {
    return withLog(tower, "log.undoEmpty");
  }

  return {
    ...tower,
    ...cloneSnapshot(previous),
    history: rest.map(cloneSnapshot),
    log: [{ key: "log.undid" }, ...previous.log].slice(0, 7),
  };
}

export function isPlayerOnShop(tower: TowerState) {
  const floor = getCurrentFloor(tower);
  return floor.contents[tower.player.y]?.[tower.player.x]?.type === "shop";
}

function climb(tower: TowerState, direction: "up" | "down") {
  const targetIndex = direction === "up" ? tower.currentFloorIndex + 1 : tower.currentFloorIndex - 1;
  const targetFloor = tower.floors[targetIndex];
  if (!targetFloor) {
    return false;
  }

  const targetPosition = direction === "up" ? targetFloor.stairsDown : targetFloor.stairsUp;
  if (!targetPosition) {
    return false;
  }

  tower.currentFloorIndex = targetIndex;
  tower.player = { ...targetPosition };
  return true;
}

function tryOpenDoor(hero: HeroStats, tile: TileKind): { ok: true; opened: boolean; hero: HeroStats; message: string } | { ok: false; message: string } {
  if (tile === "yellowDoor") {
    if (hero.yellowKeys <= 0) {
      return { ok: false, message: "log.yellowDoorBlocked" };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, yellowKeys: hero.yellowKeys - 1 },
      message: "log.yellowDoorOpened",
    };
  }

  if (tile === "blueDoor") {
    if (hero.blueKeys <= 0) {
      return { ok: false, message: "log.blueDoorBlocked" };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, blueKeys: hero.blueKeys - 1 },
      message: "log.blueDoorOpened",
    };
  }

  if (tile === "redDoor") {
    if (hero.redKeys <= 0) {
      return { ok: false, message: "log.redDoorBlocked" };
    }
    return {
      ok: true,
      opened: true,
      hero: { ...hero, redKeys: hero.redKeys - 1 },
      message: "log.redDoorOpened",
    };
  }

  return { ok: true, opened: false, hero, message: "" };
}

function applyItem(hero: HeroStats, item: ItemKind) {
  switch (item) {
    case "smallPotion":
      hero.hp += 160;
      hero.maxHp = Math.max(hero.maxHp, hero.hp);
      break;
    case "largePotion":
      hero.hp += 300;
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

function pushHistory(tower: TowerState) {
  return [snapshotTower(tower), ...tower.history.map(cloneSnapshot)].slice(0, HISTORY_LIMIT);
}

function snapshotTower(tower: TowerState): TowerSnapshot {
  return {
    floors: tower.floors.map(cloneFloor),
    currentFloorIndex: tower.currentFloorIndex,
    hero: { ...tower.hero },
    player: { ...tower.player },
    moves: tower.moves,
    bossDefeated: tower.bossDefeated,
    won: tower.won,
    lost: tower.lost,
    log: tower.log.map(cloneLog),
  };
}

function cloneSnapshot(snapshot: TowerSnapshot): TowerSnapshot {
  return {
    ...snapshot,
    floors: snapshot.floors.map(cloneFloor),
    hero: { ...snapshot.hero },
    player: { ...snapshot.player },
    log: snapshot.log.map(cloneLog),
  };
}

function cloneTower(tower: TowerState): TowerState {
  return {
    ...tower,
    floors: tower.floors.map(cloneFloor),
    hero: { ...tower.hero },
    player: { ...tower.player },
    log: tower.log.map(cloneLog),
    history: tower.history.map(cloneSnapshot),
  };
}

function cloneFloor(floor: FloorState): FloorState {
  return {
    ...floor,
    start: floor.start ? { ...floor.start } : undefined,
    stairsUp: floor.stairsUp ? { ...floor.stairsUp } : undefined,
    stairsDown: floor.stairsDown ? { ...floor.stairsDown } : undefined,
    tiles: floor.tiles.map((row) => [...row]),
    contents: floor.contents.map((row) => row.map(cloneContent)),
  };
}

function cloneContent(content: CellContent): CellContent {
  if (content.type === "item") {
    return { type: "item", item: content.item };
  }
  if (content.type === "monster") {
    return { type: "monster", monster: content.monster };
  }
  if (content.type === "stairsUp") {
    return { type: "stairsUp" };
  }
  if (content.type === "stairsDown") {
    return { type: "stairsDown" };
  }
  if (content.type === "shop") {
    return { type: "shop" };
  }
  if (content.type === "princess") {
    return { type: "princess" };
  }
  return { type: "empty" };
}

function cloneLog(log: TowerState["log"][number]) {
  return {
    key: log.key,
    params: log.params ? { ...log.params } : undefined,
  };
}

function withLog(tower: TowerState, message: string, params?: Record<string, string | number>) {
  const nextTower = cloneTower(tower);
  pushLog(nextTower, message, params);
  return nextTower;
}

function pushLog(tower: TowerState, message: string, params?: Record<string, string | number>) {
  if (message) {
    tower.log = [{ key: message, params }, ...tower.log].slice(0, 7);
  }
}

function isInside(floor: FloorState, x: number, y: number) {
  return x >= 0 && y >= 0 && x < floor.width && y < floor.height;
}

function formatLoss(value: number) {
  return Number.isFinite(value) ? String(value) : "infinite";
}
