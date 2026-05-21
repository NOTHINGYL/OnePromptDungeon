export type TileKind = "floor" | "wall" | "yellowDoor" | "blueDoor" | "redDoor";

export type ItemKind =
  | "smallPotion"
  | "largePotion"
  | "redGem"
  | "blueGem"
  | "yellowKey"
  | "blueKey"
  | "redKey";

export type MonsterKind =
  | "greenSlime"
  | "nightBat"
  | "boneGuard"
  | "runeMage"
  | "ironKnight"
  | "towerWarden";

export type Position = {
  x: number;
  y: number;
};

export type HeroStats = {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
};

export type Monster = {
  kind: MonsterKind;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  boss?: boolean;
};

export type Item = {
  kind: ItemKind;
  name: string;
  description: string;
};

export type CellContent =
  | { type: "empty" }
  | { type: "item"; item: ItemKind }
  | { type: "monster"; monster: MonsterKind }
  | { type: "princess" };

export type LevelState = {
  title: string;
  prompt: string;
  width: number;
  height: number;
  tiles: TileKind[][];
  contents: CellContent[][];
  hero: HeroStats;
  player: Position;
  moves: number;
  bossDefeated: boolean;
  won: boolean;
  lost: boolean;
  log: string[];
};
