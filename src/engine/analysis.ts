import { MONSTERS } from "../data/catalog";
import { previewCombat } from "./combat";
import type { CellContent, FloorState, MonsterKind, Position, TileKind, TowerState } from "../types/game";

export type ScannerReport = {
  reachablePercent: number;
  reachableCells: number;
  walkableCells: number;
  pressureScore: number;
  safeFights: number;
  riskyFights: number;
  dependencies: {
    combat: number;
    key: number;
    shop: number;
    equipment: number;
  };
  blockedDoors: {
    yellow: number;
    blue: number;
    red: number;
  };
  remainingKeys: {
    yellow: number;
    blue: number;
    red: number;
  };
  nextTarget: {
    icon: string;
    key: string;
    tone: "good" | "warn" | "bad";
  };
};

export type RouteHintStep = {
  icon: string;
  key: string;
  tone?: "good" | "warn" | "bad";
};

export type SeedSummary = {
  solvable: boolean;
  style: string[];
  pressureScore: number;
  routeIdentity: string;
  totalMonsters: number;
  totalKeys: number;
  totalDoors: number;
  equipment: number;
  shops: number;
};

export function scanTower(tower: TowerState, floor: FloorState): ScannerReport {
  const reachable = findReachable(tower, floor);
  const walkableCells = countWalkable(floor);
  const blockedDoors = countDoors(floor.tiles);
  const remainingKeys = countKeys(floor);
  const equipment = countEquipment(floor);
  const shops = countShops(floor);
  let safeFights = 0;
  let riskyFights = 0;

  forEachContent(floor, (content) => {
    if (content.type !== "monster") {
      return;
    }

    const preview = previewCombat(tower.hero, content.monster);
    if (preview.canWin && preview.damageTaken < tower.hero.hp * 0.35) {
      safeFights += 1;
    } else {
      riskyFights += 1;
    }
  });

  const reachablePercent = Math.round((reachable.size / Math.max(1, walkableCells)) * 100);
  const dependencies = {
    combat: Math.min(99, safeFights * 8 + riskyFights * 14),
    key: Math.min(99, (blockedDoors.yellow + blockedDoors.blue * 2 + blockedDoors.red * 3) * 8),
    shop: Math.min(99, shops > 0 ? 32 + Math.max(0, 20 - tower.hero.gold) : 0),
    equipment: Math.min(99, equipment * 16),
  };
  const pressureScore = calculatePressureScore({
    reachablePercent,
    safeFights,
    riskyFights,
    blockedDoors,
    equipment,
    shops,
  });

  return {
    reachableCells: reachable.size,
    reachablePercent,
    walkableCells,
    pressureScore,
    safeFights,
    riskyFights,
    dependencies,
    blockedDoors,
    remainingKeys,
    nextTarget: chooseNextTarget(tower, floor, reachable, blockedDoors, safeFights),
  };
}

export function buildRouteHint(tower: TowerState, floor: FloorState, report: ScannerReport): RouteHintStep[][] {
  if (tower.won) {
    return [
      [
        { icon: "hero", key: "route.hero" },
        { icon: "princess", key: "route.rescued", tone: "good" },
      ],
    ];
  }

  if (tower.currentFloorIndex === tower.floors.length - 1 && !tower.bossDefeated) {
    return [
      [
        { icon: "hero", key: "route.hero" },
        { icon: "boss", key: "route.defeatBoss", tone: report.safeFights > 0 ? "good" : "warn" },
        { icon: "princess", key: "route.rescuePrincess" },
      ],
    ];
  }

  const needsKey = report.blockedDoors.yellow > tower.hero.yellowKeys || report.blockedDoors.blue > tower.hero.blueKeys || report.blockedDoors.red > tower.hero.redKeys;
  if (needsKey) {
    const keyIcon = report.remainingKeys.blue > 0 ? "keyBlue" : report.remainingKeys.red > 0 ? "keyRed" : "keyYellow";
    const doorIcon = report.blockedDoors.blue > tower.hero.blueKeys ? "doorBlue" : report.blockedDoors.red > tower.hero.redKeys ? "doorRed" : "doorYellow";
    return [
      [
        { icon: "hero", key: "route.hero" },
        { icon: keyIcon, key: "route.collectKey", tone: "good" },
        { icon: doorIcon, key: "route.openGate" },
        { icon: "stairs", key: "route.reachStairs" },
      ],
    ];
  }

  if (report.safeFights > 0) {
    return [
      [
        { icon: "hero", key: "route.hero" },
        { icon: "bat", key: "route.safeFight", tone: "good" },
        { icon: "gemRed", key: "route.takeReward" },
        { icon: "stairs", key: "route.reachStairs" },
      ],
    ];
  }

  if (hasReachableStairs(tower, floor)) {
    return [
      [
        { icon: "hero", key: "route.hero" },
        { icon: "stairs", key: "route.reachStairs", tone: "good" },
      ],
    ];
  }

  return [
    [
      { icon: "hero", key: "route.hero" },
      { icon: report.nextTarget.icon, key: report.nextTarget.key, tone: report.nextTarget.tone },
    ],
  ];
}

export function summarizeSeed(tower: TowerState): SeedSummary {
  let totalMonsters = 0;
  let totalKeys = 0;
  let totalDoors = 0;
  let equipment = 0;
  let shops = 0;
  let hasBoss = false;
  let hasPrincess = false;

  tower.floors.forEach((floor) => {
    const floorDoors = countDoors(floor.tiles);
    totalDoors += floorDoors.yellow + floorDoors.blue + floorDoors.red;
    forEachContent(floor, (content) => {
      if (content.type === "monster") {
        totalMonsters += 1;
        hasBoss = hasBoss || MONSTERS[content.monster].boss === true;
      }
      if (content.type === "item" && content.item.endsWith("Key")) {
        totalKeys += 1;
      }
      if (content.type === "item" && isEquipmentItem(content.item)) {
        equipment += 1;
      }
      if (content.type === "shop") {
        shops += 1;
      }
      if (content.type === "princess") {
        hasPrincess = true;
      }
    });
  });

  return {
    solvable: hasBoss && hasPrincess && tower.floors.every((floor, index) => index === tower.floors.length - 1 || floor.stairsUp),
    style: detectSeedStyle(tower.prompt, totalMonsters, totalKeys, shops, equipment),
    pressureScore: calculateSeedPressure(totalMonsters, totalKeys, totalDoors, equipment, shops),
    routeIdentity: detectRouteIdentity(tower.prompt, totalMonsters, totalKeys, totalDoors, equipment, shops),
    totalMonsters,
    totalKeys,
    totalDoors,
    equipment,
    shops,
  };
}

function chooseNextTarget(
  tower: TowerState,
  floor: FloorState,
  reachable: Set<string>,
  blockedDoors: ScannerReport["blockedDoors"],
  safeFights: number,
): ScannerReport["nextTarget"] {
  if (hasReachableContent(floor, reachable, (content) => content.type === "stairsUp")) {
    return { icon: "stairs", key: "scanner.next.stairs", tone: "good" };
  }
  if (hasReachableContent(floor, reachable, (content) => content.type === "item" && content.item.endsWith("Key"))) {
    return { icon: "keyYellow", key: "scanner.next.key", tone: "good" };
  }
  if (hasReachableContent(floor, reachable, (content) => content.type === "item" && isEquipmentItem(content.item))) {
    const hasWeapon = hasReachableContent(
      floor,
      reachable,
      (content) => content.type === "item" && (content.item === "ironSword" || content.item === "silverSword"),
    );
    return { icon: hasWeapon ? "sword" : "shield", key: hasWeapon ? "scanner.next.weapon" : "scanner.next.shield", tone: "good" };
  }
  if (safeFights > 0) {
    return { icon: "bat", key: "scanner.next.safeFight", tone: "good" };
  }
  if (tower.hero.gold >= 20 && hasReachableContent(floor, reachable, (content) => content.type === "shop")) {
    return { icon: "shop", key: "scanner.next.shop", tone: "good" };
  }
  if (blockedDoors.yellow > tower.hero.yellowKeys || blockedDoors.blue > tower.hero.blueKeys || blockedDoors.red > tower.hero.redKeys) {
    return { icon: "keyYellow", key: "scanner.next.needKey", tone: "warn" };
  }
  return { icon: "gemRed", key: "scanner.next.reward", tone: "warn" };
}

function isEquipmentItem(item: string) {
  return item === "ironSword" || item === "silverSword" || item === "ironShield" || item === "silverShield";
}

function calculatePressureScore({
  blockedDoors,
  equipment,
  reachablePercent,
  riskyFights,
  safeFights,
  shops,
}: {
  blockedDoors: ScannerReport["blockedDoors"];
  equipment: number;
  reachablePercent: number;
  riskyFights: number;
  safeFights: number;
  shops: number;
}) {
  const doorPressure = blockedDoors.yellow * 4 + blockedDoors.blue * 7 + blockedDoors.red * 11;
  const combatPressure = riskyFights * 9 + Math.max(0, 4 - safeFights) * 4;
  const routePressure = Math.max(0, 70 - reachablePercent);
  const rewardRelief = equipment * 3 + shops * 2;
  return clampScore(Math.round(doorPressure + combatPressure + routePressure - rewardRelief));
}

function calculateSeedPressure(totalMonsters: number, totalKeys: number, totalDoors: number, equipment: number, shops: number) {
  const keyPressure = Math.max(0, totalDoors - totalKeys) * 5;
  const combatPressure = totalMonsters * 2;
  const relief = equipment * 2 + shops * 3;
  return clampScore(Math.round(22 + keyPressure + combatPressure - relief));
}

function detectRouteIdentity(prompt: string, totalMonsters: number, totalKeys: number, totalDoors: number, equipment: number, shops: number) {
  const text = prompt.toLowerCase();
  if (/boss|rush|首领|速通|守卫/.test(text)) return "identity.bossRush";
  if (/shop|merchant|商店|商人/.test(text) || shops >= 1) return "identity.merchant";
  if (/sword|weapon|剑|武器/.test(text)) return "identity.weapon";
  if (/shield|defense|盾|防御/.test(text)) return "identity.shield";
  if (/treasure|gem|potion|宝石|血瓶|宝藏/.test(text)) return "identity.treasure";
  if (totalDoors > totalKeys + 3) return "identity.keyPressure";
  if (equipment >= 8) return "identity.equipment";
  if (totalMonsters >= 30) return "identity.combat";
  return "identity.balanced";
}

function clampScore(value: number) {
  return Math.max(1, Math.min(99, value));
}

function findReachable(tower: TowerState, floor: FloorState) {
  const visited = new Set<string>();
  const queue: Position[] = [{ ...tower.player }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || !isInside(floor, current)) {
      continue;
    }

    const key = toKey(current.x, current.y);
    if (visited.has(key) || isBlockingCell(floor.tiles[current.y][current.x], floor.contents[current.y][current.x])) {
      continue;
    }

    visited.add(key);
    queue.push(
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    );
  }

  return visited;
}

function isBlockingCell(tile: TileKind, content: CellContent) {
  return tile === "wall" || tile.endsWith("Door") || content.type === "monster";
}

function hasReachableStairs(tower: TowerState, floor: FloorState) {
  const reachable = findReachable(tower, floor);
  return hasReachableContent(floor, reachable, (content) => content.type === "stairsUp");
}

function hasReachableContent(floor: FloorState, reachable: Set<string>, matcher: (content: CellContent) => boolean) {
  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      if (reachable.has(toKey(x, y)) && matcher(floor.contents[y][x])) {
        return true;
      }
    }
  }
  return false;
}

function countWalkable(floor: FloorState) {
  return floor.tiles.flat().filter((tile) => tile !== "wall").length;
}

function countDoors(tiles: TileKind[][]) {
  return tiles.flat().reduce(
    (total, tile) => {
      if (tile === "yellowDoor") total.yellow += 1;
      if (tile === "blueDoor") total.blue += 1;
      if (tile === "redDoor") total.red += 1;
      return total;
    },
    { yellow: 0, blue: 0, red: 0 },
  );
}

function countKeys(floor: FloorState) {
  const keys = { yellow: 0, blue: 0, red: 0 };
  forEachContent(floor, (content) => {
    if (content.type !== "item") {
      return;
    }
    if (content.item === "yellowKey") keys.yellow += 1;
    if (content.item === "blueKey") keys.blue += 1;
    if (content.item === "redKey") keys.red += 1;
  });
  return keys;
}

function countEquipment(floor: FloorState) {
  let total = 0;
  forEachContent(floor, (content) => {
    if (content.type === "item" && isEquipmentItem(content.item)) {
      total += 1;
    }
  });
  return total;
}

function countShops(floor: FloorState) {
  let total = 0;
  forEachContent(floor, (content) => {
    if (content.type === "shop") {
      total += 1;
    }
  });
  return total;
}

function detectSeedStyle(prompt: string, totalMonsters: number, totalKeys: number, shops: number, equipment: number) {
  const text = prompt.toLowerCase();
  const styles: string[] = [];
  if (/shop|merchant|商店|商人/.test(text) || shops > 0) styles.push("style.shop");
  if (/blue|key|钥匙|门/.test(text) || totalKeys < 8) styles.push("style.keyPuzzle");
  if (/sword|weapon|shield|剑|武器|盾/.test(text) || equipment > 0) styles.push("style.equipment");
  if (/boss|rush|首领|速通|守卫/.test(text)) styles.push("style.bossRush");
  if (/treasure|gem|potion|宝石|血瓶|宝藏/.test(text)) styles.push("style.treasure");
  if (totalMonsters >= 16) styles.push("style.combat");
  return styles.slice(0, 3);
}

function forEachContent(floor: FloorState, callback: (content: CellContent, monster?: MonsterKind) => void) {
  floor.contents.forEach((row) => row.forEach((content) => callback(content, content.type === "monster" ? content.monster : undefined)));
}

function isInside(floor: FloorState, position: Position) {
  return position.x >= 0 && position.y >= 0 && position.x < floor.width && position.y < floor.height;
}

function toKey(x: number, y: number) {
  return `${x},${y}`;
}
