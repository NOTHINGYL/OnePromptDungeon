import type { Position } from "./game";

export type FeedbackKind = "combat" | "pickup" | "door" | "blocked" | "stairs" | "shop" | "victory" | "fallen" | "undo";

export type FeedbackEvent = {
  id: number;
  kind: FeedbackKind;
  floorIndex: number;
  from: Position;
  to: Position;
  damage?: number;
  label?: string;
  strong?: boolean;
};
