import type { Item, ItemKind, Monster, MonsterKind, ShopUpgrade } from "../types/game";

export const ITEMS: Record<ItemKind, Item> = {
  smallPotion: {
    kind: "smallPotion",
    name: "item.smallPotion.name",
    description: "item.smallPotion.description",
  },
  largePotion: {
    kind: "largePotion",
    name: "item.largePotion.name",
    description: "item.largePotion.description",
  },
  redGem: {
    kind: "redGem",
    name: "item.redGem.name",
    description: "item.redGem.description",
  },
  blueGem: {
    kind: "blueGem",
    name: "item.blueGem.name",
    description: "item.blueGem.description",
  },
  yellowKey: {
    kind: "yellowKey",
    name: "item.yellowKey.name",
    description: "item.yellowKey.description",
  },
  blueKey: {
    kind: "blueKey",
    name: "item.blueKey.name",
    description: "item.blueKey.description",
  },
  redKey: {
    kind: "redKey",
    name: "item.redKey.name",
    description: "item.redKey.description",
  },
};

export const MONSTERS: Record<MonsterKind, Monster> = {
  greenSlime: {
    kind: "greenSlime",
    name: "monster.greenSlime",
    hp: 44,
    atk: 20,
    def: 4,
    gold: 3,
  },
  nightBat: {
    kind: "nightBat",
    name: "monster.nightBat",
    hp: 72,
    atk: 30,
    def: 8,
    gold: 5,
  },
  boneGuard: {
    kind: "boneGuard",
    name: "monster.boneGuard",
    hp: 108,
    atk: 42,
    def: 14,
    gold: 8,
  },
  runeMage: {
    kind: "runeMage",
    name: "monster.runeMage",
    hp: 126,
    atk: 52,
    def: 8,
    gold: 12,
  },
  ironKnight: {
    kind: "ironKnight",
    name: "monster.ironKnight",
    hp: 190,
    atk: 70,
    def: 24,
    gold: 18,
  },
  towerWarden: {
    kind: "towerWarden",
    name: "monster.towerWarden",
    hp: 360,
    atk: 92,
    def: 36,
    gold: 50,
    boss: true,
  },
};

export const SHOP_COST = 20;

export const SHOP_UPGRADES: Record<ShopUpgrade, { label: string; description: string }> = {
  atk: { label: "+12 ATK", description: "Sharpen the hero's blade." },
  def: { label: "+12 DEF", description: "Reforge the tower shield." },
  hp: { label: "+250 HP", description: "Drink a sealed royal elixir." },
};
