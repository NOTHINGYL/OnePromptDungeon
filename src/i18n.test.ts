import { describe, expect, it } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  it("returns localized strings", () => {
    expect(translate("zh", "status.hp")).toBe("生命");
    expect(translate("en", "status.hp")).toBe("HP");
  });

  it("falls back to English for missing localized keys", () => {
    expect(translate("zh", "missing.key")).toBe("missing.key");
  });

  it("interpolates log params", () => {
    expect(translate("en", "log.defeated", { monster: "Green Slime", loss: 7, gold: 3 })).toBe(
      "Defeated Green Slime. Lost 7 HP, gained 3 gold.",
    );
    expect(translate("zh", "log.defeated", { monster: "绿色史莱姆", loss: 7, gold: 3 })).toBe(
      "击败 绿色史莱姆。损失 7 生命，获得 3 金币。",
    );
  });
});
