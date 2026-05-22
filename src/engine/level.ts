import type {
  CellContent,
  Difficulty,
  FloorState,
  HeroStats,
  ItemKind,
  MonsterKind,
  Position,
  TileKind,
  TowerState,
} from "../types/game";

type FloorDefinition = {
  id: string;
  title: string;
  objective: string;
  raw: string[];
};

type TowerGenerationOptions = {
  prompt?: string;
  seed?: string;
  difficulty?: Difficulty;
};

type WishProfile = {
  scarceBlue: boolean;
  riskyShop: boolean;
  manyMonsters: boolean;
  treasure: boolean;
  defense: boolean;
  bossRush: boolean;
};

type Rng = () => number;

const VERSION_SEED = "opd-v0.4";

const BASE_FLOORS: FloorDefinition[] = [
  {
    id: "floor-1",
    title: "floor.floor-1.title",
    objective: "floor.floor-1.objective",
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
    title: "floor.floor-2.title",
    objective: "floor.floor-2.objective",
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
    title: "floor.floor-3.title",
    objective: "floor.floor-3.objective",
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

const INITIAL_HERO: Record<Difficulty, HeroStats> = {
  easy: {
    hp: 720,
    maxHp: 720,
    atk: 42,
    def: 20,
    gold: 10,
    yellowKeys: 2,
    blueKeys: 1,
    redKeys: 0,
  },
  normal: {
    hp: 620,
    maxHp: 620,
    atk: 38,
    def: 16,
    gold: 0,
    yellowKeys: 1,
    blueKeys: 0,
    redKeys: 0,
  },
  hard: {
    hp: 560,
    maxHp: 560,
    atk: 36,
    def: 14,
    gold: 0,
    yellowKeys: 1,
    blueKeys: 0,
    redKeys: 0,
  },
};

const VARIANT_SLOTS: Array<Array<{ x: number; y: number; chars: string[] }>> = [
  [
    { x: 3, y: 3, chars: ["h", "r", "s"] },
    { x: 5, y: 5, chars: ["r", "d", "t"] },
    { x: 8, y: 7, chars: ["h", "y", "s"] },
    { x: 11, y: 11, chars: ["k", "t", "d"] },
    { x: 2, y: 13, chars: ["s", "h", "y"] },
  ],
  [
    { x: 3, y: 1, chars: ["m", "h", "r"] },
    { x: 9, y: 3, chars: ["H", "d", "k"] },
    { x: 3, y: 9, chars: ["r", "s", "y"] },
    { x: 7, y: 11, chars: ["h", "t", "d"] },
    { x: 13, y: 13, chars: ["e", "b", "n"] },
  ],
  [
    { x: 3, y: 3, chars: ["h", "r", "m"] },
    { x: 7, y: 5, chars: ["d", "H", "n"] },
    { x: 3, y: 9, chars: ["e", "r", "k"] },
    { x: 11, y: 11, chars: ["n", "b", "H"] },
    { x: 13, y: 13, chars: ["y", "m", "t"] },
  ],
];

export function createInitialTower(prompt = "Rescue the princess from the tower that answers wishes."): TowerState {
  return createGeneratedTower({ prompt, seed: makeSeed(prompt), difficulty: "normal" });
}

export function createGeneratedTower(options: TowerGenerationOptions = {}): TowerState {
  const prompt = options.prompt?.trim() || "Rescue the princess from a three-floor tower that answers wishes.";
  const difficulty = options.difficulty ?? "normal";
  const seed = normalizeSeed(options.seed || makeSeed(prompt));
  const rng = createRng(`${VERSION_SEED}:${difficulty}:${seed}:${prompt}`);
  const profile = analyzeWish(prompt);
  const definitions = buildFloorDefinitions(rng, profile, difficulty);
  const floors = definitions.map(createFloor);
  const start = floors[0].start ?? { x: 1, y: 13 };

  return {
    title: "OnePromptDungeon",
    prompt,
    seed,
    difficulty,
    floors,
    currentFloorIndex: 0,
    hero: { ...INITIAL_HERO[difficulty] },
    player: { ...start },
    moves: 0,
    bossDefeated: false,
    won: false,
    lost: false,
    log: [
      { key: "log.generated", params: { seed, difficulty } },
      { key: "log.initialRoute" },
    ],
    history: [],
  };
}

export function makeSeed(input: string) {
  const hash = hashString(`${VERSION_SEED}:${input || "tower"}`);
  return hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
}

function buildFloorDefinitions(rng: Rng, profile: WishProfile, difficulty: Difficulty): FloorDefinition[] {
  return BASE_FLOORS.map((floor, index) => {
    const raw = floor.raw.map((row) => [...row]);
    for (const slot of VARIANT_SLOTS[index]) {
      const pool = tuneSlot(slot.chars, profile, difficulty);
      setChar(raw, slot.x, slot.y, pick(rng, pool));
    }

    if (profile.scarceBlue && index === 1) {
      setChar(raw, 10, 1, pick(rng, ["b", "k", "d"]));
    }
    if (profile.riskyShop && index === 1) {
      setChar(raw, 5, 5, "$");
      setChar(raw, 7, 5, pick(rng, difficulty === "hard" ? ["m", "n"] : ["k", "m"]));
    }
    if (profile.bossRush && index === 2) {
      setChar(raw, 9, 1, "X");
      setChar(raw, 9, 3, pick(rng, ["n", "m"]));
    }
    if (profile.treasure) {
      const treasure = index === 0 ? "r" : index === 1 ? "H" : "d";
      setChar(raw, 3 + Math.floor(rng() * 3), index === 0 ? 1 : 3, treasure);
    }
    if (profile.defense) {
      setChar(raw, index === 2 ? 5 : 7, index === 0 ? 11 : 9, "d");
    }

    return {
      ...floor,
      raw: raw.map((row) => row.join("")),
    };
  });
}

function tuneSlot(chars: string[], profile: WishProfile, difficulty: Difficulty) {
  const pool = [...chars];
  if (profile.manyMonsters) {
    pool.push("s", "t", difficulty === "hard" ? "m" : "k");
  }
  if (profile.treasure) {
    pool.push("r", "d", "H");
  }
  if (profile.defense) {
    pool.push("d");
  }
  if (difficulty === "easy") {
    pool.push("h", "y", "r");
  }
  if (difficulty === "hard") {
    pool.push("k", "m", "n");
  }
  return pool;
}

function analyzeWish(prompt: string): WishProfile {
  const text = prompt.toLowerCase();
  return {
    scarceBlue: /blue|蓝/.test(text) && /scarce|few|稀缺|很少|少/.test(text),
    riskyShop: /shop|merchant|商店|商人/.test(text) && /risk|risky|危险|高风险|冒险/.test(text),
    manyMonsters: /many|monster|fight|怪|战斗|很多/.test(text),
    treasure: /treasure|gem|potion|reward|宝石|血瓶|奖励|宝藏/.test(text),
    defense: /def|defense|shield|防御|盾/.test(text),
    bossRush: /boss|rush|warden|首领|速通|守卫/.test(text),
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
    title: definition.title,
    objective: definition.objective,
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

function pick<T>(rng: Rng, list: T[]) {
  return list[Math.floor(rng() * list.length)];
}

function setChar(raw: string[][], x: number, y: number, value: string) {
  if (raw[y]?.[x] && raw[y][x] !== "#" && raw[y][x] !== "P" && raw[y][x] !== "U" && raw[y][x] !== "D" && raw[y][x] !== "C") {
    raw[y][x] = value;
  }
}

function normalizeSeed(seed: string) {
  return seed.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12) || randomSeed();
}

function createRng(seed: string): Rng {
  let state = hashString(seed) || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getCurrentFloor(tower: TowerState) {
  return tower.floors[tower.currentFloorIndex];
}
