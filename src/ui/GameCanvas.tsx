import { useEffect, useMemo, useRef, useState } from "react";
import { ITEMS, MONSTERS } from "../data/catalog";
import { previewCombat } from "../engine/combat";
import type { CellContent, FloorState, TileKind, TowerState } from "../types/game";

type GameCanvasProps = {
  floor: FloorState;
  tower: TowerState;
};

const TILE_COLORS: Record<TileKind, string> = {
  floor: "#23283a",
  wall: "#111522",
  yellowDoor: "#d7a936",
  blueDoor: "#3976d8",
  redDoor: "#c74a4a",
};

export function GameCanvas({ floor, tower }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(640);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height, 720));
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

    return hoverPreviewFor(nearbyContent, tower);
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

    drawGame(ctx, floor, tower, size);
  }, [floor, tower, size]);

  return (
    <div className="board-shell" ref={shellRef}>
      <canvas aria-label="OnePromptDungeon game board" ref={canvasRef} />
      {hoverPreview ? (
        <div className={hoverPreview.canWin ? "combat-ribbon good-ribbon" : "combat-ribbon danger-ribbon"}>
          Fight: {hoverPreview.canWin ? "safe" : "danger"} / loss {Number.isFinite(hoverPreview.damageTaken) ? hoverPreview.damageTaken : "∞"} HP
        </div>
      ) : null}
    </div>
  );
}

function hoverPreviewFor(content: CellContent | undefined, tower: TowerState) {
  return content?.type === "monster" ? previewCombat(tower.hero, content.monster) : null;
}

function drawGame(ctx: CanvasRenderingContext2D, floor: FloorState, tower: TowerState, size: number) {
  const tile = size / floor.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      drawTile(ctx, floor.tiles[y][x], x, y, tile);
      drawContent(ctx, floor.contents[y][x], x, y, tile);
    }
  }

  drawHero(ctx, tower.player.x, tower.player.y, tile);
  drawFrame(ctx, size, tile);

  if (tower.won) {
    drawOverlay(ctx, size, "VICTORY", "The princess is free.");
  }
  if (tower.lost) {
    drawOverlay(ctx, size, "FALLEN", "Undo and choose another route.");
  }
}

function drawTile(ctx: CanvasRenderingContext2D, kind: TileKind, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  ctx.fillStyle = TILE_COLORS[kind];
  ctx.fillRect(left, top, tile, tile);

  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);

  if (kind === "wall") {
    ctx.fillStyle = "#1b2130";
    ctx.fillRect(left + tile * 0.08, top + tile * 0.16, tile * 0.84, tile * 0.1);
    ctx.fillRect(left + tile * 0.18, top + tile * 0.48, tile * 0.72, tile * 0.1);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(left, top + tile * 0.84, tile, tile * 0.16);
  }

  if (kind.endsWith("Door")) {
    ctx.fillStyle = "rgba(10, 8, 5, 0.28)";
    ctx.fillRect(left + tile * 0.18, top + tile * 0.12, tile * 0.64, tile * 0.76);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = Math.max(2, tile * 0.05);
    ctx.strokeRect(left + tile * 0.24, top + tile * 0.18, tile * 0.52, tile * 0.64);
    ctx.fillStyle = "#fff2bf";
    ctx.fillRect(left + tile * 0.58, top + tile * 0.49, tile * 0.08, tile * 0.08);
  }
}

function drawContent(ctx: CanvasRenderingContext2D, content: CellContent, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;

  if (content.type === "monster") {
    const monster = MONSTERS[content.monster];
    const boss = Boolean(monster.boss);
    ctx.fillStyle = boss ? "#f05a4f" : monsterColor(content.monster);
    pixelDiamond(ctx, cx, cy, tile * (boss ? 0.38 : 0.32));
    ctx.fill();
    ctx.fillStyle = "#080b12";
    ctx.fillRect(cx - tile * 0.18, cy - tile * 0.04, tile * 0.1, tile * 0.1);
    ctx.fillRect(cx + tile * 0.08, cy - tile * 0.04, tile * 0.1, tile * 0.1);
    ctx.fillStyle = "#fff6d7";
    ctx.font = `800 ${tile * 0.18}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(boss ? "B" : monster.name[0], cx, top + tile * 0.87);
  }

  if (content.type === "item") {
    drawItem(ctx, content.item, cx, cy, tile);
  }

  if (content.type === "stairsUp" || content.type === "stairsDown") {
    ctx.fillStyle = content.type === "stairsUp" ? "#e8d08a" : "#90a8c7";
    for (let step = 0; step < 4; step += 1) {
      const width = tile * (0.28 + step * 0.12);
      ctx.fillRect(cx - width / 2, cy + tile * (0.2 - step * 0.14), width, tile * 0.08);
    }
    ctx.fillStyle = "#101521";
    ctx.font = `900 ${tile * 0.18}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(content.type === "stairsUp" ? "UP" : "DN", cx, top + tile * 0.86);
  }

  if (content.type === "shop") {
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(left + tile * 0.22, top + tile * 0.24, tile * 0.56, tile * 0.48);
    ctx.fillStyle = "#6d3d1f";
    ctx.fillRect(left + tile * 0.28, top + tile * 0.3, tile * 0.44, tile * 0.1);
    ctx.fillRect(left + tile * 0.36, top + tile * 0.5, tile * 0.28, tile * 0.22);
    ctx.fillStyle = "#101521";
    ctx.font = `900 ${tile * 0.2}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("$", cx, cy + tile * 0.08);
  }

  if (content.type === "princess") {
    ctx.fillStyle = "#ffd971";
    ctx.fillRect(cx - tile * 0.16, cy - tile * 0.3, tile * 0.32, tile * 0.18);
    ctx.fillStyle = "#f497b6";
    ctx.fillRect(cx - tile * 0.22, cy - tile * 0.12, tile * 0.44, tile * 0.42);
    ctx.fillStyle = "#fff6d7";
    ctx.fillRect(cx - tile * 0.1, cy - tile * 0.22, tile * 0.2, tile * 0.14);
  }
}

function drawItem(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, tile: number) {
  ctx.fillStyle = itemColor(kind);
  if (kind.endsWith("Key")) {
    ctx.fillRect(cx - tile * 0.2, cy - tile * 0.04, tile * 0.38, tile * 0.08);
    ctx.strokeStyle = itemColor(kind);
    ctx.lineWidth = Math.max(2, tile * 0.06);
    ctx.strokeRect(cx - tile * 0.3, cy - tile * 0.1, tile * 0.16, tile * 0.16);
    ctx.fillRect(cx + tile * 0.05, cy + tile * 0.02, tile * 0.06, tile * 0.16);
    return;
  }
  if (kind.includes("Potion")) {
    ctx.fillRect(cx - tile * 0.14, cy - tile * 0.2, tile * 0.28, tile * 0.4);
    ctx.fillStyle = "#fff6d7";
    ctx.fillRect(cx - tile * 0.08, cy - tile * 0.28, tile * 0.16, tile * 0.08);
    return;
  }
  pixelDiamond(ctx, cx, cy, tile * 0.24);
  ctx.fill();
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;
  ctx.fillStyle = "#6ee7ff";
  ctx.fillRect(cx - tile * 0.18, cy - tile * 0.24, tile * 0.36, tile * 0.5);
  ctx.fillStyle = "#fff6d7";
  ctx.fillRect(cx - tile * 0.12, cy - tile * 0.34, tile * 0.24, tile * 0.16);
  ctx.fillStyle = "#111522";
  ctx.fillRect(cx - tile * 0.12, cy - tile * 0.03, tile * 0.24, tile * 0.07);
}

function drawFrame(ctx: CanvasRenderingContext2D, size: number, tile: number) {
  ctx.strokeStyle = "#cfae65";
  ctx.lineWidth = Math.max(3, tile * 0.06);
  ctx.strokeRect(tile * 0.04, tile * 0.04, size - tile * 0.08, size - tile * 0.08);
}

function drawOverlay(ctx: CanvasRenderingContext2D, size: number, title: string, subtitle: string) {
  ctx.fillStyle = "rgba(5, 7, 12, 0.78)";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff6d7";
  ctx.textAlign = "center";
  ctx.font = "900 48px ui-monospace, monospace";
  ctx.fillText(title, size / 2, size / 2 - 12);
  ctx.fillStyle = "#e8d08a";
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

function monsterColor(kind: string) {
  if (kind === "greenSlime") return "#59d36f";
  if (kind === "nightBat") return "#a86ee8";
  if (kind === "boneGuard") return "#d6d2c2";
  if (kind === "runeMage") return "#5da8ff";
  if (kind === "ironKnight") return "#a5a9b8";
  return "#f05a4f";
}

function itemColor(kind: string) {
  if (kind === "yellowKey") return "#f2c14e";
  if (kind === "blueKey") return "#5ca2ff";
  if (kind === "redKey") return "#ff675d";
  if (kind === "redGem") return "#ff5f72";
  if (kind === "blueGem") return "#62d4ff";
  return "#6fe0a0";
}
