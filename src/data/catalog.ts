import type { Item, ItemKind, Monster, MonsterKind } from "../types/game";

export const ITEMS: Record<ItemKind, Item> = {
  smallPotion: {
    kind: "smallPotion",
    name: "Crimson Vial",
    description: "+160 HP",
  },
  largePotion: {
    kind: "largePotion",
    name: "Royal Elixir",
    description: "+300 HP",
  },
  redGem: {
    kind: "redGem",
    name: "Blade Ruby",
    description: "+6 ATK",
  },
  blueGem: {
    kind: "blueGem",
    name: "Guard Sapphire",
    description: "+6 DEF",
  },
  yellowKey: {
    kind: "yellowKey",
    name: "Sun Key",
    description: "Opens yellow doors",
  },
  blueKey: {
    kind: "blueKey",
    name: "Moon Key",
    description: "Opens blue doors",
  },
  redKey: {
    kind: "redKey",
    name: "Crown Key",
    description: "Opens red doors",
  },
};

export const MONSTERS: Record<MonsterKind, Monster> = {
  greenSlime: {
    kind: "greenSlime",
    name: "Moss Slime",
    hp: 46,
    atk: 18,
    def: 4,
    gold: 2,
  },
  nightBat: {
    kind: "nightBat",
    name: "Night Bat",
    hp: 72,
    atk: 28,
    def: 8,
    gold: 4,
  },
  boneGuard: {
    kind: "boneGuard",
    name: "Bone Guard",
    hp: 108,
    atk: 38,
    def: 12,
    gold: 6,
  },
  runeMage: {
    kind: "runeMage",
    name: "Rune Mage",
    hp: 96,
    atk: 48,
    def: 6,
    gold: 8,
  },
  ironKnight: {
    kind: "ironKnight",
    name: "Iron Knight",
    hp: 180,
    atk: 62,
    def: 22,
    gold: 12,
  },
  towerWarden: {
    kind: "towerWarden",
    name: "Tower Warden",
    hp: 310,
    atk: 78,
    def: 34,
    gold: 40,
    boss: true,
  },
};
