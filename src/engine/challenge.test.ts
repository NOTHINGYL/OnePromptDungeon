import { describe, expect, it } from "vitest";
import { buildReplayExport, buildShareCardSvg, formatChallengeText, getChallengeResult } from "./challenge";
import { createGeneratedTower } from "./level";

describe("challenge exports", () => {
  it("scores cleared towers and formats share text", () => {
    const tower = createGeneratedTower({ prompt: "sword first tower", seed: "SWORD909", difficulty: "normal" });
    tower.won = true;
    tower.moves = 180;
    tower.hero.hp = 650;
    tower.runStats = { defeated: 12, doors: 8, pickups: 10, shops: 2 };
    tower.replay = [
      {
        step: 1,
        action: "move:right",
        floor: 1,
        to: { x: 2, y: 13 },
        hero: { hp: 700, atk: 38, def: 16, gold: 1000, level: 1 },
      },
    ];

    const challenge = getChallengeResult(tower);
    const text = formatChallengeText(tower, challenge, "https://example.test/OnePromptDungeon/");
    const replay = buildReplayExport(tower, challenge);
    const card = buildShareCardSvg(tower, challenge);

    expect(["S", "A", "B", "C", "D"]).toContain(challenge.rank);
    expect(challenge.score).toBeGreaterThan(0);
    expect(text).toContain("SWORD909");
    expect(text).toContain("Rank");
    expect(replay.replay).toHaveLength(1);
    expect(replay.result.rank).toBe(challenge.rank);
    expect(card).toContain("<svg");
    expect(card).toContain("OnePromptDungeon");
  });
});
