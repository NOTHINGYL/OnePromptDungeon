import { describe, expect, it } from "vitest";
import { buildRouteHint, scanTower, summarizeSeed } from "./analysis";
import { getCurrentFloor, createGeneratedTower } from "./level";

describe("tower analysis", () => {
  it("summarizes generated seed structure", () => {
    const tower = createGeneratedTower({ prompt: "merchant economy tower with scarce keys", seed: "ABC123", difficulty: "normal" });
    const summary = summarizeSeed(tower);

    expect(summary.solvable).toBe(true);
    expect(summary.totalMonsters).toBeGreaterThan(0);
    expect(summary.totalDoors).toBeGreaterThan(0);
    expect(summary.equipment).toBeGreaterThan(0);
    expect(summary.style.length).toBeGreaterThan(0);
  });

  it("scans current floor resources and route hint", () => {
    const tower = createGeneratedTower({ prompt: "treasure-heavy tower", seed: "ROUTE1", difficulty: "easy" });
    const floor = getCurrentFloor(tower);
    const scan = scanTower(tower, floor);
    const hint = buildRouteHint(tower, floor, scan);

    expect(scan.walkableCells).toBeGreaterThan(0);
    expect(scan.reachablePercent).toBeGreaterThan(0);
    expect(scan.nextTarget.key).toMatch(/^scanner\.next\./);
    expect(hint[0][0].icon).toBe("hero");
  });
});
