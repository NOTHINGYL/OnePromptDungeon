export type TileKind = "floor" | "wall" | "yellowDoor" | "blueDoor" | "redDoor";

export type ItemKind =
  | "smallPotion"
  | "largePotion"
  | "redGem"
  | "blueGem"
  | "yellowKey"
  | "blueKey"
  | "redKey"
  | "ironSword"
  | "silverSword"
  | "ironShield"
  | "silverShield";

export type MonsterKind =
  | "greenSlime"
  | "nightBat"
  | "boneGuard"
  | "runeMage"
  | "ironKnight"
  | "towerWarden";

export type Difficulty = "easy" | "normal" | "hard";
export type WeaponKind = "none" | "ironSword" | "silverSword";
export type ShieldKind = "none" | "ironShield" | "silverShield";

export type Position = {
  x: number;
  y: number;
};

export type HeroStats = {
  level: number;
  exp: number;
  nextLevelExp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
  weapon: WeaponKind;
  shield: ShieldKind;
};

export type Monster = {
  kind: MonsterKind;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  exp: number;
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
  | { type: "stairsUp" }
  | { type: "stairsDown" }
  | { type: "shop" }
  | { type: "princess" };

export type LogEntry = {
  key: string;
  params?: Record<string, string | number>;
};

export type RunStats = {
  defeated: number;
  doors: number;
  pickups: number;
  shops: number;
};

export type ReplayStep = {
  step: number;
  action: string;
  floor: number;
  from?: Position;
  to?: Position;
  hero: {
    hp: number;
    atk: number;
    def: number;
    gold: number;
    level: number;
  };
  note?: string;
};

export type FloorState = {
  id: string;
  title: string;
  objective: string;
  width: number;
  height: number;
  tiles: TileKind[][];
  contents: CellContent[][];
  start?: Position;
  stairsUp?: Position;
  stairsDown?: Position;
};

export type TowerSnapshot = {
  floors: FloorState[];
  currentFloorIndex: number;
  hero: HeroStats;
  player: Position;
  moves: number;
  bossDefeated: boolean;
  won: boolean;
  lost: boolean;
  log: LogEntry[];
  runStats?: RunStats;
  replay?: ReplayStep[];
};

export type TowerState = TowerSnapshot & {
  title: string;
  prompt: string;
  seed: string;
  difficulty: Difficulty;
  history: TowerSnapshot[];
};

export type ShopUpgrade = "atk" | "def" | "hp";
