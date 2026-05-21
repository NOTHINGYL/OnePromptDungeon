import type { CellContent, HeroStats, LevelState, TileKind } from "../types/game";

const RAW_LEVEL = [
  "###############",
  "#...h.#..n.XC.#",
  "#.###.#.###Y#.#",
  "#...#...#b.H#.#",
  "#Y#.#####.###.#",
  "#s#...m...#d#.#",
  "#.###.###.#.#.#",
  "#..y#.#...#.#.#",
  "###.#.#.###.#.#",
  "#h..#...t...#.#",
  "#.#####.#####.#",
  "#...r...#...B.#",
  "#.#.###.#.###.#",
  "#P..s..Y..k.y.#",
  "###############",
];

const INITIAL_HERO: HeroStats = {
  hp: 430,
  maxHp: 430,
  atk: 36,
  def: 13,
  gold: 0,
  yellowKeys: 1,
  blueKeys: 0,
  redKeys: 0,
};

export function createInitialLevel(prompt = "Rescue the princess from the tower that answers wishes."): LevelState {
  const tiles: TileKind[][] = [];
  const contents: CellContent[][] = [];
  let player = { x: 1, y: 13 };

  RAW_LEVEL.forEach((row, y) => {
    const tileRow: TileKind[] = [];
    const contentRow: CellContent[] = [];

    [...row].forEach((char, x) => {
      const parsed = parseCell(char);
      tileRow.push(parsed.tile);
      contentRow.push(parsed.content);
      if (char === "P") {
        player = { x, y };
      }
    });

    tiles.push(tileRow);
    contents.push(contentRow);
  });

  return {
    title: "The Whispering Tower",
    prompt,
    width: RAW_LEVEL[0].length,
    height: RAW_LEVEL.length,
    tiles,
    contents,
    hero: { ...INITIAL_HERO },
    player,
    moves: 0,
    bossDefeated: false,
    won: false,
    lost: false,
    log: [
      "The tower folds your wish into stone.",
      "Find keys, choose battles, and break the seal near the princess.",
    ],
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
    case "C":
      return { tile: "floor", content: { type: "princess" } };
    default:
      return { tile: "floor", content: { type: "empty" } };
  }
}
