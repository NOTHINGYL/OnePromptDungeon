import type { ItemKind, MonsterKind, ShopUpgrade } from "./types/game";

export type Language = "en" | "zh";

export type TranslationKey =
  | "app.version"
  | "app.title"
  | "app.seed"
  | "button.restart"
  | "button.undo"
  | "button.shuffle"
  | "button.language"
  | "button.theme"
  | "status.hero"
  | "status.floor"
  | "status.level"
  | "status.hp"
  | "status.atk"
  | "status.def"
  | "status.gold"
  | "status.keys"
  | "status.yellowKey"
  | "status.blueKey"
  | "status.redKey"
  | "wish.label"
  | "fight.title"
  | "fight.none"
  | "fight.canWin"
  | "fight.danger"
  | "fight.loss"
  | "fight.reward"
  | "shop.title"
  | "shop.cost"
  | "log.title"
  | "controls.hint"
  | "overlay.victory"
  | "overlay.victorySub"
  | "overlay.fallen"
  | "overlay.fallenSub"
  | `floor.${string}.title`
  | `floor.${string}.objective`
  | `monster.${MonsterKind}`
  | `item.${ItemKind}.name`
  | `item.${ItemKind}.description`
  | `shop.${ShopUpgrade}.label`
  | `shop.${ShopUpgrade}.description`
  | `log.${string}`;

export const LANG_STORAGE_KEY = "opd.language";
export const THEME_STORAGE_KEY = "opd.theme";

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    "app.version": "v0.3 / Classic tower UI",
    "app.title": "OnePromptDungeon",
    "app.seed": "Handcrafted tower",
    "button.restart": "Restart",
    "button.undo": "Undo Z",
    "button.shuffle": "Shuffle Text",
    "button.language": "中文",
    "button.theme": "Theme",
    "status.hero": "Hero",
    "status.floor": "Floor",
    "status.level": "Level",
    "status.hp": "HP",
    "status.atk": "ATK",
    "status.def": "DEF",
    "status.gold": "Gold",
    "status.keys": "Keys",
    "status.yellowKey": "Yellow",
    "status.blueKey": "Blue",
    "status.redKey": "Red",
    "wish.label": "Tower wish",
    "fight.title": "Battle forecast",
    "fight.none": "No monster beside you.",
    "fight.canWin": "Can win",
    "fight.danger": "Do not fight",
    "fight.loss": "Loss",
    "fight.reward": "Reward",
    "shop.title": "Merchant",
    "shop.cost": "20 gold each",
    "log.title": "Tower log",
    "controls.hint": "Move with WASD or arrow keys.",
    "overlay.victory": "VICTORY",
    "overlay.victorySub": "The princess is free.",
    "overlay.fallen": "FALLEN",
    "overlay.fallenSub": "Undo and choose another route.",
    "floor.floor-1.title": "1F Stone Gate",
    "floor.floor-1.objective": "Learn the tower route: collect keys, gems, and reach the upper stairs.",
    "floor.floor-2.title": "2F Merchant Hall",
    "floor.floor-2.objective": "Spend gold wisely, open the moon door, and climb toward the sealed crown.",
    "floor.floor-3.title": "3F Crystal Crown",
    "floor.floor-3.objective": "Break the warden's seal and rescue the princess.",
    "monster.greenSlime": "Green Slime",
    "monster.nightBat": "Night Bat",
    "monster.boneGuard": "Bone Guard",
    "monster.runeMage": "Rune Mage",
    "monster.ironKnight": "Iron Knight",
    "monster.towerWarden": "Crystal Warden",
    "item.smallPotion.name": "Red Potion",
    "item.smallPotion.description": "+160 HP",
    "item.largePotion.name": "Royal Potion",
    "item.largePotion.description": "+300 HP",
    "item.redGem.name": "Ruby",
    "item.redGem.description": "+6 ATK",
    "item.blueGem.name": "Sapphire",
    "item.blueGem.description": "+6 DEF",
    "item.yellowKey.name": "Yellow Key",
    "item.yellowKey.description": "Opens yellow doors",
    "item.blueKey.name": "Blue Key",
    "item.blueKey.description": "Opens blue doors",
    "item.redKey.name": "Red Key",
    "item.redKey.description": "Opens red doors",
    "shop.atk.label": "+12 ATK",
    "shop.atk.description": "Sharpen the hero's blade.",
    "shop.def.label": "+12 DEF",
    "shop.def.description": "Reforge the tower shield.",
    "shop.hp.label": "+250 HP",
    "shop.hp.description": "Drink a sealed royal elixir.",
    "log.initialWish": "The old tower accepts your wish and locks the crown room.",
    "log.initialRoute": "Route carefully. Every key, fight, and shop visit matters.",
    "log.outerWall": "The outer wall has no door.",
    "log.wall": "Stone blocks the route.",
    "log.yellowDoorBlocked": "A yellow door waits for a yellow key.",
    "log.blueDoorBlocked": "A blue door waits for a blue key.",
    "log.redDoorBlocked": "A red door waits for a red key.",
    "log.yellowDoorOpened": "A yellow key turns. The door opens.",
    "log.blueDoorOpened": "A blue key hums. The door opens.",
    "log.redDoorOpened": "A red key burns bright. The door opens.",
    "log.monsterTooStrong": "{monster} is too strong. Expected loss: {loss} HP.",
    "log.defeated": "Defeated {monster}. Lost {loss} HP, gained {gold} gold.",
    "log.claimed": "Claimed {item}: {description}.",
    "log.climbed": "Climbed to {floor}.",
    "log.descended": "Returned to {floor}.",
    "log.stairsUpBlocked": "The upper stairs are sealed.",
    "log.stairsDownBlocked": "The lower stairs have vanished.",
    "log.shopHere": "The merchant offers power for 20 gold.",
    "log.princessSealed": "The princess remains sealed until the Crystal Warden falls.",
    "log.victory": "The princess steps free. The tower opens to morning.",
    "log.fallen": "The hero falls inside the tower.",
    "log.noMerchant": "There is no merchant here.",
    "log.notEnoughGold": "Not enough gold. The merchant wants 20.",
    "log.buyAtk": "Bought sword training: +12 ATK.",
    "log.buyDef": "Bought shield training: +12 DEF.",
    "log.buyHp": "Bought a royal elixir: +250 HP.",
    "log.undoEmpty": "No previous step to undo.",
    "log.undid": "Undid the last step.",
  },
  zh: {
    "app.version": "v0.3 / 经典魔塔界面",
    "app.title": "一句话魔塔",
    "app.seed": "手工三层塔",
    "button.restart": "重开",
    "button.undo": "撤销 Z",
    "button.shuffle": "换一句",
    "button.language": "EN",
    "button.theme": "主题",
    "status.hero": "勇士",
    "status.floor": "楼层",
    "status.level": "等级",
    "status.hp": "生命",
    "status.atk": "攻击",
    "status.def": "防御",
    "status.gold": "金币",
    "status.keys": "钥匙",
    "status.yellowKey": "黄钥匙",
    "status.blueKey": "蓝钥匙",
    "status.redKey": "红钥匙",
    "wish.label": "塔之愿望",
    "fight.title": "战斗预估",
    "fight.none": "身边没有怪物。",
    "fight.canWin": "可战",
    "fight.danger": "危险",
    "fight.loss": "损血",
    "fight.reward": "收益",
    "shop.title": "商人",
    "shop.cost": "每次 20 金币",
    "log.title": "塔内记录",
    "controls.hint": "使用 WASD 或方向键移动。",
    "overlay.victory": "胜利",
    "overlay.victorySub": "公主已经获救。",
    "overlay.fallen": "失败",
    "overlay.fallenSub": "撤销一步，换条路线。",
    "floor.floor-1.title": "第 1 层 石门大厅",
    "floor.floor-1.objective": "学习路线规划：收集钥匙、宝石，找到上楼梯。",
    "floor.floor-2.title": "第 2 层 商人回廊",
    "floor.floor-2.objective": "合理花金币，打开蓝门，向塔顶前进。",
    "floor.floor-3.title": "第 3 层 水晶王座",
    "floor.floor-3.objective": "击败水晶守卫，救出公主。",
    "monster.greenSlime": "绿色史莱姆",
    "monster.nightBat": "夜蝙蝠",
    "monster.boneGuard": "骷髅卫兵",
    "monster.runeMage": "符文法师",
    "monster.ironKnight": "铁甲骑士",
    "monster.towerWarden": "水晶守卫",
    "item.smallPotion.name": "红血瓶",
    "item.smallPotion.description": "+160 生命",
    "item.largePotion.name": "大血瓶",
    "item.largePotion.description": "+300 生命",
    "item.redGem.name": "红宝石",
    "item.redGem.description": "+6 攻击",
    "item.blueGem.name": "蓝宝石",
    "item.blueGem.description": "+6 防御",
    "item.yellowKey.name": "黄钥匙",
    "item.yellowKey.description": "打开黄门",
    "item.blueKey.name": "蓝钥匙",
    "item.blueKey.description": "打开蓝门",
    "item.redKey.name": "红钥匙",
    "item.redKey.description": "打开红门",
    "shop.atk.label": "+12 攻击",
    "shop.atk.description": "磨快勇士的剑。",
    "shop.def.label": "+12 防御",
    "shop.def.description": "重铸塔盾。",
    "shop.hp.label": "+250 生命",
    "shop.hp.description": "喝下皇家秘药。",
    "log.initialWish": "古塔回应了你的愿望，并封锁了王座之间。",
    "log.initialRoute": "谨慎规划。每把钥匙、每场战斗、每次交易都很重要。",
    "log.outerWall": "塔的外墙没有出口。",
    "log.wall": "石墙挡住了道路。",
    "log.yellowDoorBlocked": "黄门需要黄钥匙。",
    "log.blueDoorBlocked": "蓝门需要蓝钥匙。",
    "log.redDoorBlocked": "红门需要红钥匙。",
    "log.yellowDoorOpened": "黄钥匙转动，门打开了。",
    "log.blueDoorOpened": "蓝钥匙发光，门打开了。",
    "log.redDoorOpened": "红钥匙燃起微光，门打开了。",
    "log.monsterTooStrong": "{monster} 现在太强。预计损血：{loss}。",
    "log.defeated": "击败 {monster}。损失 {loss} 生命，获得 {gold} 金币。",
    "log.claimed": "获得 {item}：{description}。",
    "log.climbed": "上楼到 {floor}。",
    "log.descended": "下楼回到 {floor}。",
    "log.stairsUpBlocked": "上楼梯被封住了。",
    "log.stairsDownBlocked": "下楼梯消失了。",
    "log.shopHere": "商人愿意用 20 金币换取力量。",
    "log.princessSealed": "公主仍被封印，必须先击败水晶守卫。",
    "log.victory": "公主走出封印，魔塔迎来晨光。",
    "log.fallen": "勇士倒在了塔中。",
    "log.noMerchant": "这里没有商人。",
    "log.notEnoughGold": "金币不足，商人需要 20 金币。",
    "log.buyAtk": "购买剑术训练：攻击 +12。",
    "log.buyDef": "购买盾术训练：防御 +12。",
    "log.buyHp": "购买皇家秘药：生命 +250。",
    "log.undoEmpty": "没有可以撤销的步骤。",
    "log.undid": "已撤销上一步。",
  },
};

export function detectLanguage(): Language {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return "zh";
  }
  return "en";
}

export function translate(language: Language, key: TranslationKey | string, params: Record<string, string | number> = {}) {
  const template = dictionary[language][key] ?? dictionary.en[key] ?? key;
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}
