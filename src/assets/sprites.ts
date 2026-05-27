export const SPRITE_SHEET_URL = "assets/tower-sprites-v05.png";

export type SpriteName =
  | "floor"
  | "wall"
  | "yellowDoor"
  | "blueDoor"
  | "redDoor"
  | "yellowKey"
  | "blueKey"
  | "redKey"
  | "smallPotion"
  | "largePotion"
  | "redGem"
  | "blueGem"
  | "stairs"
  | "shop"
  | "greenSlime"
  | "nightBat"
  | "boneGuard"
  | "runeMage"
  | "ironKnight"
  | "towerWarden"
  | "hero"
  | "heroPortrait"
  | "princess";

export type SpriteRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export const SHEET_SIZE = { w: 1536, h: 1024 };

export const SPRITES: Record<SpriteName, SpriteRect> = {
  floor: { x: 52, y: 38, w: 154, h: 150 },
  wall: { x: 240, y: 38, w: 160, h: 150 },
  yellowDoor: { x: 468, y: 32, w: 150, h: 160 },
  blueDoor: { x: 680, y: 32, w: 150, h: 160 },
  redDoor: { x: 896, y: 32, w: 150, h: 160 },
  yellowKey: { x: 1090, y: 46, w: 118, h: 134 },
  blueKey: { x: 1250, y: 46, w: 118, h: 134 },
  redKey: { x: 1390, y: 46, w: 118, h: 134 },
  smallPotion: { x: 72, y: 248, w: 104, h: 136 },
  largePotion: { x: 242, y: 248, w: 104, h: 136 },
  redGem: { x: 458, y: 236, w: 96, h: 150 },
  blueGem: { x: 640, y: 236, w: 96, h: 150 },
  stairs: { x: 842, y: 218, w: 146, h: 164 },
  shop: { x: 1078, y: 224, w: 158, h: 174 },
  greenSlime: { x: 64, y: 456, w: 142, h: 96 },
  nightBat: { x: 318, y: 452, w: 230, h: 122 },
  boneGuard: { x: 650, y: 430, w: 150, h: 178 },
  runeMage: { x: 886, y: 430, w: 144, h: 178 },
  ironKnight: { x: 1148, y: 410, w: 162, h: 208 },
  heroPortrait: { x: 44, y: 590, w: 424, h: 390 },
  hero: { x: 526, y: 704, w: 140, h: 210 },
  princess: { x: 766, y: 704, w: 128, h: 210 },
  towerWarden: { x: 1034, y: 640, w: 370, h: 344 },
};

export function spriteStyle(name: SpriteName, displayWidth = 32, displayHeight = 32) {
  const sprite = SPRITES[name];
  const scaleX = displayWidth / sprite.w;
  const scaleY = displayHeight / sprite.h;
  return {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    backgroundImage: `url("${SPRITE_SHEET_URL}")`,
    backgroundPosition: `${-sprite.x * scaleX}px ${-sprite.y * scaleY}px`,
    backgroundSize: `${SHEET_SIZE.w * scaleX}px ${SHEET_SIZE.h * scaleY}px`,
  };
}
