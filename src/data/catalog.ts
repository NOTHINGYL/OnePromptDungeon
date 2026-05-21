import type { Item, ItemKind, Monster, MonsterKind, ShopUpgrade } from "../types/game";

export const ITEMS: Record<ItemKind, Item> = {
  smallPotion: {
    kind: "smallPotion",
    name: "Red Potion",
    description: "+160 HP",
  },
  largePotion: {
    kind: "largePotion",
    name: "Royal Potion",
    description: "+300 HP",
  },
  redGem: {
    kind: "redGem",
    name: "Ruby",
    description: "+6 ATK",
  },
  blueGem: {
    kind: "blueGem",
    name: "Sapphire",
    description: "+6 DEF",
  },
  yellowKey: {
    kind: "yellowKey",
    name: "Yellow Key",
    description: "Opens yellow doors",
  },
  blueKey: {
    kind: "blueKey",
    name: "Blue Key",
    description: "Opens blue doors",
  },
  redKey: {
    kind: "redKey",
    name: "Red Key",
    description: "Opens red doors",
  },
};

export const MONSTERS: Record<MonsterKind, Monster> = {
  greenSlime: {
    kind: "greenSlime",
    name: "Green Slime",
    hp: 44,
    atk: 20,
    def: 4,
    gold: 3,
  },
  nightBat: {
    kind: "nightBat",
    name: "Night Bat",
    hp: 72,
    atk: 30,
    def: 8,
    gold: 5,
  },
  boneGuard: {
    kind: "boneGuard",
    name: "Bone Guard",
    hp: 108,
    atk: 42,
    def: 14,
    gold: 8,
  },
  runeMage: {
    kind: "runeMage",
    name: "Rune Mage",
    hp: 126,
    atk: 52,
    def: 8,
    gold: 12,
  },
  ironKnight: {
    kind: "ironKnight",
    name: "Iron Knight",
    hp: 190,
    atk: 70,
    def: 24,
    gold: 18,
  },
  towerWarden: {
    kind: "towerWarden",
    name: "Crystal Warden",
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
