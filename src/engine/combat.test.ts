import { describe, expect, it } from "vitest";
import { previewCombat } from "./combat";
import type { HeroStats } from "../types/game";

const hero: HeroStats = {
  hp: 430,
  maxHp: 430,
  atk: 36,
  def: 13,
  gold: 0,
  yellowKeys: 1,
  blueKeys: 0,
  redKeys: 0,
};

describe("previewCombat", () => {
  it("calculates deterministic Magic Tower-style combat", () => {
    const result = previewCombat(hero, "greenSlime");

    expect(result.canWin).toBe(true);
    expect(result.heroDamage).toBe(32);
    expect(result.monsterDamage).toBe(5);
    expect(result.rounds).toBe(2);
    expect(result.damageTaken).toBe(5);
  });

  it("marks combat impossible when the hero cannot pierce defense", () => {
    const result = previewCombat({ ...hero, atk: 20 }, "towerWarden");

    expect(result.canWin).toBe(false);
    expect(result.damageTaken).toBe(Number.POSITIVE_INFINITY);
  });
});
