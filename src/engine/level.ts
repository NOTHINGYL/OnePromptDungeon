import type { CellContent, FloorState, HeroStats, Position, TileKind, TowerState } from "../types/game";

type FloorDefinition = {
  id: string;
  title: string;
  objective: string;
  raw: string[];
};

const FLOORS: FloorDefinition[] = [
  {
    id: "floor-1",
    title: "1F Stone Gate",
    objective: "Learn the tower route: collect keys, gems, and reach the upper stairs.",
    raw: [
      "###############",
      "#.....#...h.U.#",
      "#.###Y#.###Y#.#",
      "#...#...#t..#.#",
      "#s#.#####.###.#",
      "#.#...r...#y#.#",
      "#.###.###.#.#.#",
      "#..y#.#...#.#.#",
      "###.#.#.###.#.#",
      "#h..#...s...#.#",
      "#.#####.#####.#",
      "#...d...#...k.#",
      "#.#.###.#.###.#",
      "#P..s..Y..t.y.#",
      "###############",
    ],
  },
  {
    id: "floor-2",
    title: "2F Merchant Hall",
    objective: "Spend gold wisely, open the moon door, and climb toward the sealed crown.",
    raw: [
      "###############",
      "#D..m.#...b.U.#",
      "#.###.#.###B#.#",
      "#...#...#H..#.#",
      "#Y#.#####.###.#",
      "#t#...$...#d#.#",
      "#.###.###.#.#.#",
      "#..y#.#...#.#.#",
      "###.#.#.###.#.#",
      "#r..#...k...#.#",
      "#.#####.#####.#",
      "#...h...#...n.#",
      "#.#.###.#.###.#",
      "#...s..Y..m.e.#",
      "###############",
    ],
  },
  {
    id: "floor-3",
    title: "3F Crystal Crown",
    objective: "Break the warden's seal and rescue the princess.",
    raw: [
      "###############",
      "#D..H.#..X.RC.#",
      "#.###.#.###R#.#",
      "#...#...#n..#.#",
      "#Y#.#####.###.#",
      "#m#...d...#h#.#",
      "#.###.###.#.#.#",
      "#..r#.#...#.#.#",
      "###.#.#.###.#.#",
      "#e..#...k...#.#",
      "#.#####.#####.#",
      "#...b...#...n.#",
      "#.#.###.#.###.#",
      "#...t..B..m.y.#",
      "###############",
    ],
  },
];

const INITIAL_HERO: HeroStats = {
  hp: 540,
  maxHp: 540,
  atk: 38,
  def: 16,
  gold: 0,
  yellowKeys: 1,
  blueKeys: 0,
  redKeys: 0,
};

export function createInitialTower(prompt = "Rescue the princess from the tower that answers wishes."): TowerState {
  const floors = FLOORS.map(createFloor);
  const start = floors[0].start ?? { x: 1, y: 13 };

  return {
    title: "OnePromptDungeon",
    prompt,
    seed: "v0.3-classic-3f",
    floors,
    currentFloorIndex: 0,
    hero: { ...INITIAL_HERO },
    player: { ...start },
    moves: 0,
    bossDefeated: false,
    won: false,
    lost: false,
    log: [{ key: "log.initialWish" }, { key: "log.initialRoute" }],
    history: [],
  };
}

function createFloor(definition: FloorDefinition): FloorState {
  const tiles: TileKind[][] = [];
  const contents: CellContent[][] = [];
  let start: Position | undefined;
  let stairsUp: Position | undefined;
  let stairsDown: Position | undefined;

  definition.raw.forEach((row, y) => {
    const tileRow: TileKind[] = [];
    const contentRow: CellContent[] = [];

    [...row].forEach((char, x) => {
      const parsed = parseCell(char);
      tileRow.push(parsed.tile);
      contentRow.push(parsed.content);

      if (char === "P") {
        start = { x, y };
      }
      if (char === "U") {
        stairsUp = { x, y };
      }
      if (char === "D") {
        stairsDown = { x, y };
      }
    });

    tiles.push(tileRow);
    contents.push(contentRow);
  });

  return {
    id: definition.id,
    title: `floor.${definition.id}.title`,
    objective: `floor.${definition.id}.objective`,
    width: definition.raw[0].length,
    height: definition.raw.length,
    tiles,
    contents,
    start,
    stairsUp,
    stairsDown,
  };
}

function parseCell(char: string): { tile: TileKind; content: CellContent } {
  switch (char) {
    case "#":
      return { tile: "wall", content: { type: "empty" } };
    case "Y":
      return { tile: "yellowDoor", content: { type: "empty" } };
    case "B":
      return { tile: "blueDoor", content: { type: "empty" } };
    case "R":
      return { tile: "redDoor", content: { type: "empty" } };
    case "s":
      return { tile: "floor", content: { type: "monster", monster: "greenSlime" } };
    case "t":
      return { tile: "floor", content: { type: "monster", monster: "nightBat" } };
    case "k":
      return { tile: "floor", content: { type: "monster", monster: "boneGuard" } };
    case "m":
      return { tile: "floor", content: { type: "monster", monster: "runeMage" } };
    case "n":
      return { tile: "floor", content: { type: "monster", monster: "ironKnight" } };
    case "X":
      return { tile: "floor", content: { type: "monster", monster: "towerWarden" } };
    case "h":
      return { tile: "floor", content: { type: "item", item: "smallPotion" } };
    case "H":
      return { tile: "floor", content: { type: "item", item: "largePotion" } };
    case "r":
      return { tile: "floor", content: { type: "item", item: "redGem" } };
    case "d":
      return { tile: "floor", content: { type: "item", item: "blueGem" } };
    case "y":
      return { tile: "floor", content: { type: "item", item: "yellowKey" } };
    case "b":
      return { tile: "floor", content: { type: "item", item: "blueKey" } };
    case "e":
      return { tile: "floor", content: { type: "item", item: "redKey" } };
    case "U":
      return { tile: "floor", content: { type: "stairsUp" } };
    case "D":
      return { tile: "floor", content: { type: "stairsDown" } };
    case "$":
      return { tile: "floor", content: { type: "shop" } };
    case "C":
      return { tile: "floor", content: { type: "princess" } };
    default:
      return { tile: "floor", content: { type: "empty" } };
  }
}

export function getCurrentFloor(tower: TowerState) {
  return tower.floors[tower.currentFloorIndex];
}
