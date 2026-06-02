export const UI_ICON_SHEET_URL = "assets/tower-ui-icons-v05.png";

export type UiIconName = "brandShield" | "heart" | "sword" | "shield" | "coin";

type UiIconRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const UI_ICON_SHEET_SIZE = { w: 2172, h: 724 };

const UI_ICONS: Record<UiIconName, UiIconRect> = {
  brandShield: { x: 52, y: 150, w: 370, h: 382 },
  heart: { x: 518, y: 198, w: 318, h: 312 },
  sword: { x: 912, y: 146, w: 386, h: 410 },
  shield: { x: 1390, y: 164, w: 332, h: 374 },
  coin: { x: 1810, y: 184, w: 318, h: 318 },
};

export function isUiIcon(name: string): name is UiIconName {
  return name === "brandShield" || name === "heart" || name === "sword" || name === "shield" || name === "coin";
}

export function uiIconStyle(name: UiIconName, displayWidth = 30, displayHeight = 30) {
  const icon = UI_ICONS[name];
  const scaleX = displayWidth / icon.w;
  const scaleY = displayHeight / icon.h;
  return {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    backgroundImage: `url("${UI_ICON_SHEET_URL}")`,
    backgroundPosition: `${-icon.x * scaleX}px ${-icon.y * scaleY}px`,
    backgroundSize: `${UI_ICON_SHEET_SIZE.w * scaleX}px ${UI_ICON_SHEET_SIZE.h * scaleY}px`,
  };
}
