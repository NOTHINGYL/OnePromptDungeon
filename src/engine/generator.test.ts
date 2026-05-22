import { describe, expect, it } from "vitest";
import { createGeneratedTower, makeSeed } from "./level";

describe("local seed generator", () => {
  it("creates deterministic towers from the same wish, seed, and difficulty", () => {
    const options = {
      prompt: "three-floor tower, scarce blue keys, one risky shop route",
      seed: "7F3A9B1C",
      difficulty: "normal" as const,
    };

    const first = createGeneratedTower(options);
    const second = createGeneratedTower(options);

    expect(first.seed).toBe("7F3A9B1C");
    expect(first.floors).toEqual(second.floors);
    expect(first.hero).toEqual(second.hero);
  });

  it("changes tower content when the seed changes", () => {
    const prompt = "many monsters and treasure";
    const first = createGeneratedTower({ prompt, seed: "AAAA1111", difficulty: "normal" });
    const second = createGeneratedTower({ prompt, seed: "BBBB2222", difficulty: "normal" });

    expect(first.floors).not.toEqual(second.floors);
  });

  it("derives a stable seed from wish text", () => {
    expect(makeSeed("defense gem detour")).toBe(makeSeed("defense gem detour"));
    expect(makeSeed("defense gem detour")).not.toBe(makeSeed("boss rush"));
  });
});
