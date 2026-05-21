import { MONSTERS } from "../data/catalog";
import type { HeroStats, MonsterKind } from "../types/game";

export type CombatPreview = {
  canWin: boolean;
  rounds: number;
  damageTaken: number;
  heroDamage: number;
  monsterDamage: number;
};

export function previewCombat(hero: HeroStats, monsterKind: MonsterKind): CombatPreview {
  const monster = MONSTERS[monsterKind];
  const heroDamage = Math.max(hero.atk - monster.def, 0);
  const monsterDamage = Math.max(monster.atk - hero.def, 0);

  if (heroDamage <= 0) {
    return {
      canWin: false,
      rounds: Number.POSITIVE_INFINITY,
      damageTaken: Number.POSITIVE_INFINITY,
      heroDamage,
      monsterDamage,
    };
  }

  const rounds = Math.ceil(monster.hp / heroDamage);
  const damageTaken = Math.max(rounds - 1, 0) * monsterDamage;

  return {
    canWin: hero.hp > damageTaken,
    rounds,
    damageTaken,
    heroDamage,
    monsterDamage,
  };
}
