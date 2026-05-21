import { useEffect, useMemo, useRef, useState } from "react";
import { ITEMS, MONSTERS } from "../data/catalog";
import { previewCombat } from "../engine/combat";
import type { CellContent, LevelState } from "../types/game";

type GameCanvasProps = {
  level: LevelState;
};

const TILE_COLORS = {
  floor: "#172033",
  wall: "#07111f",
  yellowDoor: "#d6a742",
  blueDoor: "#4c8df6",
  redDoor: "#d25757",
};

export function GameCanvas({ level }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(720);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.floor(Math.min(entry.contentRect.width, 760));
      setSize(Math.max(nextSize, 320));
    });

    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, []);

  const hoverPreview = useMemo(() => {
    const nearby = [
      { x: level.player.x, y: level.player.y - 1 },
      { x: level.player.x + 1, y: level.player.y },
      { x: level.player.x, y: level.player.y + 1 },
      { x: level.player.x - 1, y: level.player.y },
    ]
      .filter((pos) => pos.x >= 0 && pos.y >= 0 && pos.x < level.width && pos.y < level.height)
      .map((pos) => level.contents[pos.y][pos.x])
      .find((content) => content.type === "monster");

    return nearby?.type === "monster" ? previewCombat(level.hero, nearby.monster) : null;
  }, [level]);

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

    drawGame(ctx, level, size);
  }, [level, size]);

  return (
    <div className="board-shell" ref={shellRef}>
      <canvas aria-label="OnePromptDungeon game board" ref={canvasRef} />
      {hoverPreview ? (
        <div className="combat-ribbon">
          Nearby fight: {hoverPreview.canWin ? "winnable" : "danger"} / loss {Number.isFinite(hoverPreview.damageTaken) ? hoverPreview.damageTaken : "∞"} HP
        </div>
      ) : null}
    </div>
  );
}

function drawGame(ctx: CanvasRenderingContext2D, level: LevelState, size: number) {
  const tile = size / level.width;
  ctx.clearRect(0, 0, size, size);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#111a2b");
  gradient.addColorStop(1, "#07111f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      drawTile(ctx, level.tiles[y][x], x, y, tile);
      drawContent(ctx, level.contents[y][x], x, y, tile);
    }
  }

  drawHero(ctx, level.player.x, level.player.y, tile);

  if (level.won) {
    drawOverlay(ctx, size, "VICTORY", "The tower opens to the sky.");
  }
  if (level.lost) {
    drawOverlay(ctx, size, "FALLEN", "Restart and choose a cleaner route.");
  }
}

function drawTile(ctx: CanvasRenderingContext2D, kind: keyof typeof TILE_COLORS, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  ctx.fillStyle = TILE_COLORS[kind];
  ctx.fillRect(left, top, tile, tile);

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top + 0.5, tile - 1, tile - 1);

  if (kind === "wall") {
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fillRect(left + tile * 0.14, top + tile * 0.18, tile * 0.72, tile * 0.1);
    ctx.fillRect(left + tile * 0.18, top + tile * 0.54, tile * 0.64, tile * 0.1);
  }

  if (kind.endsWith("Door")) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    roundRect(ctx, left + tile * 0.24, top + tile * 0.16, tile * 0.52, tile * 0.68, tile * 0.08);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.arc(left + tile * 0.61, top + tile * 0.51, tile * 0.055, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = boss ? "#f36b5f" : "#b86dff";
    ctx.beginPath();
    ctx.arc(cx, cy, tile * (boss ? 0.34 : 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(cx - tile * 0.16, cy - tile * 0.04, tile * 0.1, tile * 0.08);
    ctx.fillRect(cx + tile * 0.06, cy - tile * 0.04, tile * 0.1, tile * 0.08);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = `700 ${tile * 0.19}px Inter, system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(boss ? "W" : monster.name[0], cx, top + tile * 0.88);
  }

  if (content.type === "item") {
    const item = ITEMS[content.item];
    const isKey = content.item.endsWith("Key");
    const isPotion = content.item.includes("Potion");
    ctx.fillStyle = itemColor(content.item);

    if (isKey) {
      ctx.fillRect(cx - tile * 0.18, cy - tile * 0.05, tile * 0.32, tile * 0.1);
      ctx.beginPath();
      ctx.arc(cx - tile * 0.22, cy, tile * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = itemColor(content.item);
      ctx.lineWidth = tile * 0.06;
      ctx.stroke();
      ctx.fillRect(cx + tile * 0.05, cy + tile * 0.02, tile * 0.07, tile * 0.14);
    } else if (isPotion) {
      roundRect(ctx, cx - tile * 0.16, cy - tile * 0.2, tile * 0.32, tile * 0.4, tile * 0.08);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillRect(cx - tile * 0.08, cy - tile * 0.27, tile * 0.16, tile * 0.08);
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - tile * 0.22);
      ctx.lineTo(cx + tile * 0.2, cy);
      ctx.lineTo(cx, cy + tile * 0.22);
      ctx.lineTo(cx - tile * 0.2, cy);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (content.type === "princess") {
    ctx.fillStyle = "#f6d36b";
    ctx.beginPath();
    ctx.arc(cx, cy - tile * 0.06, tile * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f09ab6";
    roundRect(ctx, cx - tile * 0.22, cy + tile * 0.1, tile * 0.44, tile * 0.24, tile * 0.06);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(cx - tile * 0.18, cy - tile * 0.32, tile * 0.36, tile * 0.06);
  }
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number) {
  const left = x * tile;
  const top = y * tile;
  const cx = left + tile / 2;
  const cy = top + tile / 2;

  ctx.shadowColor = "rgba(93, 232, 255, 0.45)";
  ctx.shadowBlur = tile * 0.28;
  ctx.fillStyle = "#5de8ff";
  roundRect(ctx, cx - tile * 0.22, cy - tile * 0.24, tile * 0.44, tile * 0.52, tile * 0.1);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#07111f";
  ctx.fillRect(cx - tile * 0.13, cy - tile * 0.05, tile * 0.26, tile * 0.06);
}

function drawOverlay(ctx: CanvasRenderingContext2D, size: number, title: string, subtitle: string) {
  ctx.fillStyle = "rgba(5, 10, 20, 0.72)";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 48px Inter, system-ui";
  ctx.fillText(title, size / 2, size / 2 - 10);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "500 18px Inter, system-ui";
  ctx.fillText(subtitle, size / 2, size / 2 + 28);
}

function itemColor(kind: string) {
  if (kind === "yellowKey") return "#f6c75f";
  if (kind === "blueKey") return "#6aa4ff";
  if (kind === "redKey") return "#ff6a6a";
  if (kind === "redGem") return "#ff5f72";
  if (kind === "blueGem") return "#62d4ff";
  return "#70e08b";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
