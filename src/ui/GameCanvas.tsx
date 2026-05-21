import { useEffect, useMemo, useRef, useState } from "react";
import { MONSTERS } from "../data/catalog";
import { previewCombat } from "../engine/combat";
import { translate, type Language } from "../i18n";
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
    floor: "#9a6038",
    floorAlt: "#85502f",
    wall: "#323b43",
    wallShade: "#222930",
    grid: "rgba(40, 21, 12, 0.28)",
    frame: "#245db4",
    doorYellow: "#e9c675",
    doorBlue: "#77a6dc",
    doorRed: "#d85b68",
    text: "#f8f0da",
    overlay: "rgba(30, 18, 10, 0.78)",
  },
  "classic-dark": {
    floor: "#4b321f",
    floorAlt: "#3d291b",
    wall: "#1c2533",
    wallShade: "#111722",
    grid: "rgba(255, 230, 170, 0.12)",
    frame: "#d8b86b",
    doorYellow: "#d2a63d",
    doorBlue: "#4f7fc6",
    doorRed: "#b94856",
    text: "#fff6d7",
    overlay: "rgba(4, 6, 12, 0.82)",
  },
};

export function GameCanvas({ floor, language, theme, tower }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(640);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height, 672));
      setSize(Math.max(nextSize, 320));
    });

    observer.observe(shellRef.current);
    return () => observer.disconnect();
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

    drawGame(ctx, floor, language, PALETTES[theme], tower, size);
  }, [floor, language, theme, tower, size]);

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

function drawGame(ctx: CanvasRenderingContext2D, floor: FloorState, language: Language, palette: Palette, tower: TowerState, size: number) {
  const tile = size / floor.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      drawTile(ctx, palette, floor.tiles[y][x], x, y, tile);
      drawContent(ctx, palette, floor.contents[y][x], x, y, tile);
    }
  }

  drawHero(ctx, tower.player.x, tower.player.y, tile);
  drawFrame(ctx, palette, size, tile);

  if (tower.won) {
    drawOverlay(ctx, palette, size, translate(language, "overlay.victory"), translate(language, "overlay.victorySub"));
  }
  if (tower.lost) {
    drawOverlay(ctx, palette, size, translate(language, "overlay.fallen"), translate(language, "overlay.fallenSub"));
  }
}

function drawTile(ctx: CanvasRenderingContext2D, palette: Palette, kind: TileKind, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;

  if (kind === "floor") {
    ctx.fillStyle = (x + y) % 2 === 0 ? palette.floor : palette.floorAlt;
    ctx.fillRect(left, top, tile, tile);
    ctx.strokeStyle = palette.grid;
    ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
    drawBrickNoise(ctx, left, top, tile, "rgba(255,255,255,0.08)");
    return;
  }

  if (kind === "wall") {
    ctx.fillStyle = palette.wall;
    ctx.fillRect(left, top, tile, tile);
    ctx.fillStyle = palette.wallShade;
    ctx.fillRect(left, top + tile * 0.72, tile, tile * 0.28);
    drawBrickNoise(ctx, left, top, tile, "rgba(255,255,255,0.1)");
    ctx.strokeStyle = palette.grid;
    ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);
    return;
  }

  drawTile(ctx, palette, "floor", x, y, tile);
  const color = kind === "yellowDoor" ? palette.doorYellow : kind === "blueDoor" ? palette.doorBlue : palette.doorRed;
  ctx.fillStyle = color;
  ctx.fillRect(left + tile * 0.2, top + tile * 0.12, tile * 0.6, tile * 0.76);
  ctx.strokeStyle = "rgba(40, 20, 10, 0.45)";
  ctx.lineWidth = Math.max(2, tile * 0.045);
  ctx.strokeRect(left + tile * 0.27, top + tile * 0.2, tile * 0.46, tile * 0.58);
  ctx.fillStyle = "#fff2bc";
  ctx.fillRect(left + tile * 0.58, top + tile * 0.49, tile * 0.08, tile * 0.08);
}

function drawBrickNoise(ctx: CanvasRenderingContext2D, left: number, top: number, tile: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(left + tile * 0.12, top + tile * 0.18, tile * 0.72, tile * 0.05);
  ctx.fillRect(left + tile * 0.2, top + tile * 0.5, tile * 0.66, tile * 0.05);
}

function drawContent(ctx: CanvasRenderingContext2D, palette: Palette, content: CellContent, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;

  if (content.type === "monster") {
    drawMonster(ctx, content.monster, cx, cy, tile);
  }

  if (content.type === "item") {
    drawItem(ctx, content.item, cx, cy, tile);
  }

  if (content.type === "stairsUp" || content.type === "stairsDown") {
    ctx.fillStyle = content.type === "stairsUp" ? "#d7d7d7" : "#9fb0c4";
    for (let step = 0; step < 5; step += 1) {
      ctx.fillRect(cx - tile * 0.3 + step * tile * 0.05, top + tile * (0.72 - step * 0.12), tile * 0.58, tile * 0.08);
    }
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(cx - tile * 0.24, top + tile * 0.18, tile * 0.48, tile * 0.12);
  }

  if (content.type === "shop") {
    ctx.fillStyle = "#f0c05a";
    ctx.fillRect(left + tile * 0.22, top + tile * 0.22, tile * 0.56, tile * 0.5);
    ctx.fillStyle = "#8d512e";
    ctx.fillRect(left + tile * 0.28, top + tile * 0.3, tile * 0.44, tile * 0.1);
    ctx.fillRect(left + tile * 0.36, top + tile * 0.48, tile * 0.28, tile * 0.24);
    ctx.fillStyle = "#1b1308";
    ctx.font = `900 ${tile * 0.28}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("$", cx, cy + tile * 0.1);
  }

  if (content.type === "princess") {
    drawPrincess(ctx, cx, cy, tile);
  }
}

function drawMonster(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, tile: number) {
  if (kind === "greenSlime") {
    ctx.fillStyle = "#b5e5bd";
    ctx.beginPath();
    ctx.arc(cx, cy + tile * 0.05, tile * 0.27, Math.PI, 0);
    ctx.lineTo(cx + tile * 0.27, cy + tile * 0.22);
    ctx.lineTo(cx - tile * 0.27, cy + tile * 0.22);
    ctx.closePath();
    ctx.fill();
    drawEyes(ctx, cx, cy, tile, "#e9574f");
    return;
  }

  if (kind === "nightBat") {
    ctx.fillStyle = "#8f7bd8";
    pixelDiamond(ctx, cx, cy, tile * 0.22);
    ctx.fill();
    ctx.fillRect(cx - tile * 0.38, cy - tile * 0.08, tile * 0.24, tile * 0.16);
    ctx.fillRect(cx + tile * 0.14, cy - tile * 0.08, tile * 0.24, tile * 0.16);
    drawEyes(ctx, cx, cy, tile, "#101521");
    return;
  }

  if (kind === "boneGuard") {
    ctx.fillStyle = "#f1eadb";
    ctx.fillRect(cx - tile * 0.15, cy - tile * 0.28, tile * 0.3, tile * 0.22);
    ctx.fillRect(cx - tile * 0.08, cy - tile * 0.06, tile * 0.16, tile * 0.34);
    ctx.fillRect(cx - tile * 0.25, cy + tile * 0.06, tile * 0.5, tile * 0.07);
    drawEyes(ctx, cx, cy - tile * 0.16, tile, "#222");
    return;
  }

  if (kind === "runeMage") {
    ctx.fillStyle = "#b7b0ff";
    ctx.fillRect(cx - tile * 0.18, cy - tile * 0.26, tile * 0.36, tile * 0.52);
    ctx.fillStyle = "#4a3c9a";
    ctx.fillRect(cx - tile * 0.28, cy - tile * 0.1, tile * 0.56, tile * 0.32);
    drawEyes(ctx, cx, cy - tile * 0.1, tile, "#fff");
    return;
  }

  if (kind === "ironKnight") {
    ctx.fillStyle = "#aab0b8";
    ctx.fillRect(cx - tile * 0.2, cy - tile * 0.28, tile * 0.4, tile * 0.56);
    ctx.fillStyle = "#596271";
    ctx.fillRect(cx - tile * 0.12, cy - tile * 0.18, tile * 0.24, tile * 0.1);
    return;
  }

  ctx.fillStyle = "#594a99";
  ctx.fillRect(cx - tile * 0.28, cy - tile * 0.3, tile * 0.56, tile * 0.6);
  ctx.fillStyle = "#202033";
  ctx.fillRect(cx - tile * 0.38, cy - tile * 0.1, tile * 0.76, tile * 0.18);
  drawEyes(ctx, cx, cy - tile * 0.06, tile, "#ff5a5a");
}

function drawItem(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, tile: number) {
  if (kind.endsWith("Key")) {
    const color = kind === "yellowKey" ? "#e7c667" : kind === "blueKey" ? "#73a8ef" : "#f05d66";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, tile * 0.08);
    ctx.strokeRect(cx - tile * 0.28, cy - tile * 0.12, tile * 0.18, tile * 0.18);
    ctx.fillStyle = color;
    ctx.fillRect(cx - tile * 0.1, cy - tile * 0.02, tile * 0.38, tile * 0.08);
    ctx.fillRect(cx + tile * 0.12, cy + tile * 0.04, tile * 0.07, tile * 0.16);
    return;
  }
  if (kind.includes("Potion")) {
    ctx.fillStyle = kind === "smallPotion" ? "#ff6b72" : "#b7bcff";
    ctx.fillRect(cx - tile * 0.14, cy - tile * 0.18, tile * 0.28, tile * 0.36);
    ctx.fillStyle = "#f3f0e2";
    ctx.fillRect(cx - tile * 0.09, cy - tile * 0.28, tile * 0.18, tile * 0.1);
    return;
  }
  ctx.fillStyle = kind === "redGem" ? "#ff5f72" : "#7fb7ff";
  pixelDiamond(ctx, cx, cy, tile * 0.23);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  pixelDiamond(ctx, cx - tile * 0.04, cy - tile * 0.04, tile * 0.08);
  ctx.fill();
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;
  ctx.fillStyle = "#e7d9bd";
  ctx.fillRect(cx - tile * 0.12, cy - tile * 0.33, tile * 0.24, tile * 0.16);
  ctx.fillStyle = "#89b4ff";
  ctx.fillRect(cx - tile * 0.22, cy - tile * 0.15, tile * 0.44, tile * 0.36);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - tile * 0.3, cy - tile * 0.13, tile * 0.12, tile * 0.22);
  ctx.fillRect(cx + tile * 0.18, cy - tile * 0.13, tile * 0.12, tile * 0.22);
  ctx.fillStyle = "#d7b56d";
  ctx.fillRect(cx + tile * 0.24, cy - tile * 0.34, tile * 0.08, tile * 0.46);
}

function drawPrincess(ctx: CanvasRenderingContext2D, cx: number, cy: number, tile: number) {
  ctx.fillStyle = "#ffe07d";
  ctx.fillRect(cx - tile * 0.16, cy - tile * 0.34, tile * 0.32, tile * 0.16);
  ctx.fillStyle = "#fff0d2";
  ctx.fillRect(cx - tile * 0.1, cy - tile * 0.2, tile * 0.2, tile * 0.14);
  ctx.fillStyle = "#f39bbd";
  ctx.fillRect(cx - tile * 0.24, cy - tile * 0.05, tile * 0.48, tile * 0.34);
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
