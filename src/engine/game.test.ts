import { describe, expect, it } from "vitest";
import { buyUpgrade, moveHero, undo } from "./game";
import { createInitialTower, getCurrentFloor } from "./level";

describe("tower movement", () => {
  it("opens a yellow door and consumes a yellow key", () => {
    const tower = createInitialTower();
    tower.player = { x: 6, y: 13 };

    const next = moveHero(tower, "right");

    expect(next.hero.yellowKeys).toBe(0);
    expect(next.player).toEqual({ x: 7, y: 13 });
    expect(getCurrentFloor(next).tiles[13][7]).toBe("floor");
  });

  it("does not open a door without the matching key", () => {
    const tower = createInitialTower();
    tower.hero.yellowKeys = 0;
    tower.player = { x: 6, y: 13 };

    const next = moveHero(tower, "right");

    expect(next.hero.yellowKeys).toBe(0);
    expect(next.player).toEqual({ x: 6, y: 13 });
    expect(getCurrentFloor(next).tiles[13][7]).toBe("yellowDoor");
  });

  it("climbs stairs and preserves floor state", () => {
    const tower = createInitialTower();
    tower.player = { x: 11, y: 1 };

    const next = moveHero(tower, "right");

    expect(next.currentFloorIndex).toBe(1);
    expect(next.player).toEqual({ x: 1, y: 1 });
    expect(next.floors[0].contents[1][12]).toEqual({ type: "stairsUp" });
  });
});

describe("shop and undo", () => {
  it("buys an upgrade when the hero stands on a shop", () => {
    const tower = createInitialTower();
    tower.currentFloorIndex = 1;
    tower.player = { x: 6, y: 5 };
    tower.hero.gold = 20;

    const next = buyUpgrade(tower, "atk");

    expect(next.hero.gold).toBe(0);
    expect(next.hero.atk).toBe(50);
    expect(next.history).toHaveLength(1);
  });

  it("does not buy an upgrade without enough gold", () => {
    const tower = createInitialTower();
    tower.currentFloorIndex = 1;
    tower.player = { x: 6, y: 5 };
    tower.hero.gold = 19;

    const next = buyUpgrade(tower, "def");

    expect(next.hero.gold).toBe(19);
    expect(next.hero.def).toBe(16);
    expect(next.history).toHaveLength(0);
  });

  it("undo restores the previous tower snapshot", () => {
    const tower = createInitialTower();
    tower.currentFloorIndex = 1;
    tower.player = { x: 6, y: 5 };
    tower.hero.gold = 20;

    const bought = buyUpgrade(tower, "hp");
    const restored = undo(bought);

    expect(restored.hero.gold).toBe(20);
    expect(restored.hero.hp).toBe(540);
    expect(restored.history).toHaveLength(0);
  });
});
