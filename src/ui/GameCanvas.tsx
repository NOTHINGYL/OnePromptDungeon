import { useEffect, useMemo, useRef, useState } from "react";
import { MONSTERS } from "../data/catalog";
import { previewCombat } from "../engine/combat";
import { translate, type Language } from "../i18n";
import { SPRITE_SHEET_URL, SPRITES, type SpriteName } from "../assets/sprites";
import type { CellContent, FloorState, TileKind, TowerState } from "../types/game";

export type TowerTheme = "classic-light" | "classic-dark";

type GameCanvasProps = {
  floor: FloorState;
  language: Language;
  theme: TowerTheme;
  tower: TowerState;
};

type Palette = {
  floor: string;
  floorAlt: string;
  wall: string;
  wallShade: string;
  grid: string;
  frame: string;
  doorYellow: string;
  doorBlue: string;
  doorRed: string;
  text: string;
  overlay: string;
};

const PALETTES: Record<TowerTheme, Palette> = {
  "classic-light": {
    floor: "#9a5a28",
    floorAlt: "#7f451f",
    wall: "#31373b",
    wallShade: "#171b1f",
    grid: "rgba(20, 12, 8, 0.42)",
    frame: "#0a1d35",
    doorYellow: "#f1b62b",
    doorBlue: "#188add",
    doorRed: "#c73631",
    text: "#f8f0da",
    overlay: "rgba(30, 18, 10, 0.78)",
  },
  "classic-dark": {
    floor: "#9a5a28",
    floorAlt: "#7d431f",
    wall: "#323940",
    wallShade: "#15191e",
    grid: "rgba(20, 12, 8, 0.45)",
    frame: "#0a1d35",
    doorYellow: "#f1b62b",
    doorBlue: "#158ee6",
    doorRed: "#c93430",
    text: "#fff6d7",
    overlay: "rgba(4, 6, 12, 0.82)",
  },
};

export function GameCanvas({ floor, language, theme, tower }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(640);
  const [spriteSheet, setSpriteSheet] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height));
      setSize(Math.max(nextSize, 320));
    });

    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = SPRITE_SHEET_URL;
    image.onload = () => setSpriteSheet(image);
    image.onerror = () => setSpriteSheet(null);
  }, []);

  const hoverPreview = useMemo(() => {
    const nearbyContent = [
      { x: tower.player.x, y: tower.player.y - 1 },
      { x: tower.player.x + 1, y: tower.player.y },
      { x: tower.player.x, y: tower.player.y + 1 },
      { x: tower.player.x - 1, y: tower.player.y },
    ]
      .filter((pos) => pos.x >= 0 && pos.y >= 0 && pos.x < floor.width && pos.y < floor.height)
      .map((pos) => floor.contents[pos.y][pos.x])
      .find((content) => content.type === "monster");

    return nearbyContent?.type === "monster" ? previewCombat(tower.hero, nearbyContent.monster) : null;
  }, [floor, tower]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    drawGame(ctx, floor, language, PALETTES[theme], tower, size, spriteSheet);
  }, [floor, language, theme, tower, size, spriteSheet]);

  return (
    <div className="board-shell" ref={shellRef}>
      <canvas aria-label="OnePromptDungeon game board" ref={canvasRef} />
      {hoverPreview ? (
        <div className={hoverPreview.canWin ? "combat-ribbon good-ribbon" : "combat-ribbon danger-ribbon"}>
          {hoverPreview.canWin ? translate(language, "fight.canWin") : translate(language, "fight.danger")} /{" "}
          {translate(language, "fight.loss")} {Number.isFinite(hoverPreview.damageTaken) ? hoverPreview.damageTaken : "∞"}
        </div>
      ) : null}
    </div>
  );
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  floor: FloorState,
  language: Language,
  palette: Palette,
  tower: TowerState,
  size: number,
  spriteSheet: HTMLImageElement | null,
) {
  const tile = size / floor.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      drawTile(ctx, palette, floor.tiles[y][x], x, y, tile, spriteSheet);
      drawContent(ctx, palette, floor.contents[y][x], x, y, tile, spriteSheet);
    }
  }

  drawHero(ctx, tower.player.x, tower.player.y, tile, spriteSheet);
  drawFrame(ctx, palette, size, tile);

  if (tower.won) {
    drawOverlay(ctx, palette, size, translate(language, "overlay.victory"), translate(language, "overlay.victorySub"));
  }
  if (tower.lost) {
    drawOverlay(ctx, palette, size, translate(language, "overlay.fallen"), translate(language, "overlay.fallenSub"));
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  kind: TileKind,
  x: number,
  y: number,
  tile: number,
  spriteSheet: HTMLImageElement | null,
) {
  const left = x * tile;
  const top = y * tile;

  if (kind === "floor") {
    if (spriteSheet) {
      drawSheetSprite(ctx, spriteSheet, "floor", left, top, tile, tile, "cover");
      ctx.strokeStyle = palette.grid;
      ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
      return;
    }
    ctx.fillStyle = (x + y) % 2 === 0 ? palette.floor : palette.floorAlt;
    ctx.fillRect(left, top, tile, tile);
    ctx.fillStyle = "rgba(255, 206, 124, 0.08)";
    ctx.fillRect(left + tile * 0.14, top + tile * 0.22, tile * 0.58, tile * 0.04);
    ctx.fillRect(left + tile * 0.24, top + tile * 0.62, tile * 0.52, tile * 0.04);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(left, top + tile * 0.94, tile, tile * 0.06);
    ctx.fillRect(left + tile * 0.94, top, tile * 0.06, tile);
    ctx.strokeStyle = palette.grid;
    ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
    return;
  }

  if (kind === "wall") {
    if (spriteSheet) {
      drawSheetSprite(ctx, spriteSheet, "wall", left, top, tile, tile, "cover");
      ctx.strokeStyle = palette.grid;
      ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
      return;
    }
    const brick = tile / 4;
    ctx.fillStyle = palette.wallShade;
    ctx.fillRect(left, top, tile, tile);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const offset = row % 2 ? brick * 0.5 : 0;
        ctx.fillStyle = (row + col) % 2 ? "#3d454d" : palette.wall;
        ctx.fillRect(left + col * brick - offset, top + row * brick, brick - 1, brick - 1);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(left + col * brick - offset + 2, top + row * brick + 2, brick * 0.55, 2);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(left, top + tile * 0.76, tile, tile * 0.24);
    ctx.strokeStyle = palette.grid;
    ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
    return;
  }

  drawTile(ctx, palette, "floor", x, y, tile, spriteSheet);
  const color = kind === "yellowDoor" ? palette.doorYellow : kind === "blueDoor" ? palette.doorBlue : palette.doorRed;
  if (spriteSheet) {
    const spriteName = kind === "yellowDoor" ? "yellowDoor" : kind === "blueDoor" ? "blueDoor" : "redDoor";
    drawSheetSprite(ctx, spriteSheet, spriteName, left + tile * 0.04, top - tile * 0.08, tile * 0.92, tile * 1.12, "contain");
    return;
  }
  roundedDoor(ctx, left, top, tile, color);
}

function drawContent(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  content: CellContent,
  x: number,
  y: number,
  tile: number,
  spriteSheet: HTMLImageElement | null,
) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;

  if (content.type === "monster") {
    drawMonster(ctx, content.monster, cx, cy, tile, spriteSheet);
  }

  if (content.type === "item") {
    drawItem(ctx, content.item, cx, cy, tile, spriteSheet);
  }

  if (content.type === "stairsUp" || content.type === "stairsDown") {
    if (spriteSheet) {
      drawSheetSprite(ctx, spriteSheet, "stairs", left + tile * 0.08, top + tile * 0.02, tile * 0.84, tile * 0.9, "contain");
      return;
    }
    drawStairs(ctx, left, top, tile);
  }

  if (content.type === "shop") {
    if (spriteSheet) {
      drawSheetSprite(ctx, spriteSheet, "shop", left - tile * 0.06, top - tile * 0.14, tile * 1.12, tile * 1.16, "contain");
      return;
    }
    ctx.fillStyle = "#f0c05a";
    ctx.fillRect(left + tile * 0.07, top + tile * 0.18, tile * 0.86, tile * 0.22);
    ctx.strokeStyle = "#221207";
    ctx.lineWidth = Math.max(2, tile * 0.04);
    ctx.strokeRect(left + tile * 0.08, top + tile * 0.18, tile * 0.84, tile * 0.22);
    ctx.fillStyle = "#1b1308";
    ctx.font = `900 ${tile * 0.22}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("SHOP", cx, top + tile * 0.35);
    drawMerchant(ctx, cx, cy + tile * 0.16, tile);
  }

  if (content.type === "princess") {
    if (spriteSheet) {
      drawSheetSprite(ctx, spriteSheet, "princess", left + tile * 0.1, top - tile * 0.15, tile * 0.8, tile * 1.12, "contain");
      return;
    }
    drawPrincess(ctx, cx, cy, tile);
  }
}

function drawMonster(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, tile: number, spriteSheet: HTMLImageElement | null) {
  if (spriteSheet) {
    const spriteName = monsterSprite(kind);
    if (spriteName === "towerWarden") {
      drawSheetSprite(ctx, spriteSheet, spriteName, cx - tile * 0.75, cy - tile * 0.92, tile * 1.5, tile * 1.52, "contain");
      return;
    }
    drawSheetSprite(ctx, spriteSheet, spriteName, cx - tile * 0.42, cy - tile * 0.45, tile * 0.84, tile * 0.9, "contain");
    return;
  }

  if (kind === "greenSlime") {
    ctx.fillStyle = "#80df2a";
    ctx.beginPath();
    ctx.arc(cx, cy + tile * 0.08, tile * 0.32, Math.PI, 0);
    ctx.lineTo(cx + tile * 0.34, cy + tile * 0.25);
    ctx.lineTo(cx - tile * 0.34, cy + tile * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3aa021";
    ctx.fillRect(cx - tile * 0.28, cy + tile * 0.19, tile * 0.56, tile * 0.08);
    drawEyes(ctx, cx, cy, tile, "#171b1f");
    ctx.fillStyle = "#dfffb0";
    ctx.fillRect(cx - tile * 0.18, cy - tile * 0.09, tile * 0.08, tile * 0.04);
    return;
  }

  if (kind === "nightBat") {
    ctx.fillStyle = "#6c3ba4";
    ctx.fillRect(cx - tile * 0.42, cy - tile * 0.08, tile * 0.22, tile * 0.2);
    ctx.fillRect(cx + tile * 0.2, cy - tile * 0.08, tile * 0.22, tile * 0.2);
    ctx.fillStyle = "#291935";
    pixelDiamond(ctx, cx, cy, tile * 0.26);
    ctx.fill();
    ctx.fillStyle = "#b78cff";
    ctx.fillRect(cx - tile * 0.12, cy - tile * 0.05, tile * 0.07, tile * 0.06);
    ctx.fillRect(cx + tile * 0.05, cy - tile * 0.05, tile * 0.07, tile * 0.06);
    return;
  }

  if (kind === "boneGuard") {
    ctx.fillStyle = "#efe5cf";
    ctx.fillRect(cx - tile * 0.16, cy - tile * 0.34, tile * 0.32, tile * 0.24);
    ctx.fillRect(cx - tile * 0.07, cy - tile * 0.08, tile * 0.14, tile * 0.38);
    ctx.fillRect(cx - tile * 0.32, cy + tile * 0.02, tile * 0.64, tile * 0.06);
    ctx.fillRect(cx - tile * 0.2, cy + tile * 0.3, tile * 0.12, tile * 0.08);
    ctx.fillRect(cx + tile * 0.08, cy + tile * 0.3, tile * 0.12, tile * 0.08);
    drawEyes(ctx, cx, cy - tile * 0.21, tile, "#111");
    return;
  }

  if (kind === "runeMage") {
    ctx.fillStyle = "#2b1641";
    ctx.fillRect(cx - tile * 0.26, cy - tile * 0.32, tile * 0.52, tile * 0.68);
    ctx.fillStyle = "#6f3fb1";
    ctx.fillRect(cx - tile * 0.34, cy - tile * 0.02, tile * 0.68, tile * 0.3);
    ctx.fillStyle = "#ffe26f";
    ctx.fillRect(cx - tile * 0.08, cy - tile * 0.11, tile * 0.06, tile * 0.05);
    ctx.fillRect(cx + tile * 0.04, cy - tile * 0.11, tile * 0.06, tile * 0.05);
    return;
  }

  if (kind === "ironKnight") {
    ctx.fillStyle = "#c6ccd0";
    ctx.fillRect(cx - tile * 0.24, cy - tile * 0.34, tile * 0.48, tile * 0.64);
    ctx.fillStyle = "#65707b";
    ctx.fillRect(cx - tile * 0.16, cy - tile * 0.2, tile * 0.32, tile * 0.12);
    ctx.fillStyle = "#f0d073";
    ctx.fillRect(cx - tile * 0.07, cy - tile * 0.17, tile * 0.14, tile * 0.04);
    return;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.45, 1.45);
  ctx.fillStyle = "#301011";
  ctx.fillRect(-tile * 0.22, -tile * 0.34, tile * 0.44, tile * 0.64);
  ctx.fillStyle = "#c43622";
  ctx.fillRect(-tile * 0.3, -tile * 0.1, tile * 0.6, tile * 0.32);
  ctx.fillStyle = "#ff7a32";
  ctx.fillRect(-tile * 0.42, -tile * 0.42, tile * 0.16, tile * 0.22);
  ctx.fillRect(tile * 0.26, -tile * 0.42, tile * 0.16, tile * 0.22);
  ctx.fillStyle = "#f2d071";
  ctx.fillRect(-tile * 0.09, -tile * 0.16, tile * 0.06, tile * 0.06);
  ctx.fillRect(tile * 0.03, -tile * 0.16, tile * 0.06, tile * 0.06);
  ctx.restore();
}

function drawItem(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, tile: number, spriteSheet: HTMLImageElement | null) {
  if (spriteSheet) {
    const spriteName = itemSprite(kind);
    drawSheetSprite(ctx, spriteSheet, spriteName, cx - tile * 0.34, cy - tile * 0.38, tile * 0.68, tile * 0.76, "contain");
    return;
  }

  if (kind.endsWith("Key")) {
    const color = kind === "yellowKey" ? "#e7c667" : kind === "blueKey" ? "#73a8ef" : "#f05d66";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, tile * 0.08);
    ctx.strokeRect(cx - tile * 0.3, cy - tile * 0.14, tile * 0.18, tile * 0.18);
    ctx.fillStyle = color;
    ctx.fillRect(cx - tile * 0.12, cy - tile * 0.02, tile * 0.46, tile * 0.08);
    ctx.fillRect(cx + tile * 0.12, cy + tile * 0.04, tile * 0.08, tile * 0.16);
    ctx.fillRect(cx + tile * 0.24, cy + tile * 0.04, tile * 0.08, tile * 0.1);
    return;
  }
  if (kind.includes("Potion")) {
    ctx.fillStyle = "#f3f0e2";
    ctx.fillRect(cx - tile * 0.11, cy - tile * 0.31, tile * 0.22, tile * 0.12);
    ctx.fillStyle = "#c9d3dd";
    ctx.fillRect(cx - tile * 0.18, cy - tile * 0.18, tile * 0.36, tile * 0.42);
    ctx.fillStyle = kind === "smallPotion" ? "#f05a50" : "#4f92ff";
    ctx.fillRect(cx - tile * 0.14, cy - tile * 0.04, tile * 0.28, tile * 0.25);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - tile * 0.1, cy - tile * 0.13, tile * 0.06, tile * 0.08);
    return;
  }
  ctx.fillStyle = kind === "redGem" ? "#ff5f72" : "#7fb7ff";
  pixelDiamond(ctx, cx, cy, tile * 0.23);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  pixelDiamond(ctx, cx - tile * 0.04, cy - tile * 0.04, tile * 0.08);
  ctx.fill();
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, spriteSheet: HTMLImageElement | null) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;
  if (spriteSheet) {
    drawSheetSprite(ctx, spriteSheet, "hero", left + tile * 0.06, top - tile * 0.16, tile * 0.88, tile * 1.16, "contain");
    return;
  }
  drawHeroSprite(ctx, cx, cy, tile);
}

function drawPrincess(ctx: CanvasRenderingContext2D, cx: number, cy: number, tile: number) {
  ctx.fillStyle = "#ffd94e";
  ctx.fillRect(cx - tile * 0.2, cy - tile * 0.38, tile * 0.4, tile * 0.18);
  ctx.fillStyle = "#ffe1bd";
  ctx.fillRect(cx - tile * 0.12, cy - tile * 0.21, tile * 0.24, tile * 0.16);
  ctx.fillStyle = "#ff79ad";
  ctx.fillRect(cx - tile * 0.28, cy - tile * 0.04, tile * 0.56, tile * 0.42);
  ctx.fillStyle = "#f8d8ff";
  ctx.fillRect(cx - tile * 0.18, cy + tile * 0.03, tile * 0.36, tile * 0.06);
}

function roundedDoor(ctx: CanvasRenderingContext2D, left: number, top: number, tile: number, color: string) {
  const x = left + tile * 0.22;
  const y = top + tile * 0.14;
  const w = tile * 0.56;
  const h = tile * 0.74;
  ctx.fillStyle = "#18100a";
  ctx.fillRect(x - tile * 0.06, y + tile * 0.16, w + tile * 0.12, h - tile * 0.08);
  ctx.fillStyle = "#f1c65d";
  ctx.fillRect(x - tile * 0.04, y + tile * 0.11, w + tile * 0.08, tile * 0.14);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + tile * 0.22, w, h - tile * 0.22);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + tile * 0.22, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + tile * 0.22);
  ctx.lineTo(x, y + tile * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1a0b04";
  ctx.lineWidth = Math.max(2, tile * 0.05);
  ctx.strokeRect(x + tile * 0.08, y + tile * 0.3, w - tile * 0.16, h - tile * 0.38);
  ctx.fillStyle = "#ffe7a8";
  ctx.fillRect(x + w * 0.62, y + h * 0.58, tile * 0.08, tile * 0.08);
}

function drawStairs(ctx: CanvasRenderingContext2D, left: number, top: number, tile: number) {
  ctx.fillStyle = "#272724";
  ctx.fillRect(left + tile * 0.2, top + tile * 0.15, tile * 0.58, tile * 0.7);
  ctx.fillStyle = "#efe5d0";
  for (let step = 0; step < 6; step += 1) {
    ctx.fillRect(left + tile * (0.23 + step * 0.045), top + tile * (0.76 - step * 0.105), tile * 0.55, tile * 0.075);
    ctx.fillStyle = step % 2 ? "#c8b89d" : "#efe5d0";
  }
  ctx.fillStyle = "rgba(0,0,0,0.36)";
  ctx.fillRect(left + tile * 0.22, top + tile * 0.2, tile * 0.48, tile * 0.08);
}

function drawMerchant(ctx: CanvasRenderingContext2D, cx: number, cy: number, tile: number) {
  ctx.fillStyle = "#2d1a0b";
  ctx.fillRect(cx - tile * 0.17, cy - tile * 0.2, tile * 0.34, tile * 0.38);
  ctx.fillStyle = "#df9a48";
  ctx.fillRect(cx - tile * 0.13, cy - tile * 0.09, tile * 0.26, tile * 0.15);
  ctx.fillStyle = "#2da542";
  ctx.fillRect(cx - tile * 0.23, cy + tile * 0.07, tile * 0.46, tile * 0.24);
  ctx.fillStyle = "#e4bd4b";
  ctx.fillRect(cx - tile * 0.2, cy - tile * 0.28, tile * 0.4, tile * 0.1);
}

function drawHeroSprite(ctx: CanvasRenderingContext2D, cx: number, cy: number, tile: number) {
  ctx.fillStyle = "#0b111a";
  ctx.fillRect(cx - tile * 0.17, cy - tile * 0.38, tile * 0.34, tile * 0.18);
  ctx.fillStyle = "#eab27d";
  ctx.fillRect(cx - tile * 0.12, cy - tile * 0.22, tile * 0.24, tile * 0.15);
  ctx.fillStyle = "#10284a";
  ctx.fillRect(cx - tile * 0.24, cy - tile * 0.05, tile * 0.48, tile * 0.42);
  ctx.fillStyle = "#2460a8";
  ctx.fillRect(cx - tile * 0.18, cy, tile * 0.36, tile * 0.22);
  ctx.fillStyle = "#d28a35";
  ctx.fillRect(cx - tile * 0.31, cy - tile * 0.02, tile * 0.12, tile * 0.32);
  ctx.fillRect(cx + tile * 0.19, cy - tile * 0.02, tile * 0.12, tile * 0.32);
  ctx.fillStyle = "#f5d07b";
  ctx.fillRect(cx - tile * 0.09, cy - tile * 0.17, tile * 0.04, tile * 0.04);
  ctx.fillRect(cx + tile * 0.05, cy - tile * 0.17, tile * 0.04, tile * 0.04);
  ctx.fillStyle = "#d7b56d";
  ctx.fillRect(cx + tile * 0.29, cy - tile * 0.36, tile * 0.07, tile * 0.5);
}

function drawSheetSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  name: SpriteName,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: "cover" | "contain",
) {
  const sprite = SPRITES[name];
  const scale =
    fit === "cover"
      ? Math.max(width / sprite.w, height / sprite.h)
      : Math.min(width / sprite.w, height / sprite.h);
  const drawWidth = sprite.w * scale;
  const drawHeight = sprite.h * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, sprite.x, sprite.y, sprite.w, sprite.h, drawX, drawY, drawWidth, drawHeight);
}

function monsterSprite(kind: string): SpriteName {
  switch (kind) {
    case "greenSlime":
      return "greenSlime";
    case "nightBat":
      return "nightBat";
    case "boneGuard":
      return "boneGuard";
    case "runeMage":
      return "runeMage";
    case "ironKnight":
      return "ironKnight";
    default:
      return "towerWarden";
  }
}

function itemSprite(kind: string): SpriteName {
  switch (kind) {
    case "smallPotion":
      return "smallPotion";
    case "largePotion":
      return "largePotion";
    case "redGem":
      return "redGem";
    case "blueGem":
      return "blueGem";
    case "yellowKey":
      return "yellowKey";
    case "blueKey":
      return "blueKey";
    default:
      return "redKey";
  }
}

function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, tile: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(cx - tile * 0.11, cy - tile * 0.05, tile * 0.07, tile * 0.07);
  ctx.fillRect(cx + tile * 0.04, cy - tile * 0.05, tile * 0.07, tile * 0.07);
}

function drawFrame(ctx: CanvasRenderingContext2D, palette: Palette, size: number, tile: number) {
  ctx.strokeStyle = palette.frame;
  ctx.lineWidth = Math.max(3, tile * 0.06);
  ctx.strokeRect(tile * 0.03, tile * 0.03, size - tile * 0.06, size - tile * 0.06);
}

function drawOverlay(ctx: CanvasRenderingContext2D, palette: Palette, size: number, title: string, subtitle: string) {
  ctx.fillStyle = palette.overlay;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = palette.text;
  ctx.textAlign = "center";
  ctx.font = "900 48px ui-monospace, monospace";
  ctx.fillText(title, size / 2, size / 2 - 12);
  ctx.font = "700 18px ui-monospace, monospace";
  ctx.fillText(subtitle, size / 2, size / 2 + 28);
}

function pixelDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();
}
