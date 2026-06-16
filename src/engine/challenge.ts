import { summarizeSeed } from "./analysis";
import type { TowerState } from "../types/game";

export type ChallengeResult = {
  rank: "S" | "A" | "B" | "C" | "D";
  score: number;
  pressure: number;
  identity: string;
};

export function getChallengeResult(tower: TowerState): ChallengeResult {
  const summary = summarizeSeed(tower);
  if (!tower.won) {
    return {
      rank: "D",
      score: Math.max(1, Math.round(25 + tower.currentFloorIndex * 10 + getRunSummary(tower).defeated)),
      pressure: summary.pressureScore,
      identity: summary.routeIdentity,
    };
  }

  const difficultyBonus = tower.difficulty === "hard" ? 12 : tower.difficulty === "normal" ? 7 : 3;
  const hpRatio = tower.hero.maxHp > 0 ? tower.hero.hp / tower.hero.maxHp : 0;
  const pressureBonus = Math.round(summary.pressureScore / 8);
  const movePenalty = Math.round(tower.moves / 18);
  const shopPenalty = getRunSummary(tower).shops * 2;
  const score = Math.max(1, Math.min(100, Math.round(72 + difficultyBonus + hpRatio * 18 + pressureBonus - movePenalty - shopPenalty)));
  const rank = score >= 92 ? "S" : score >= 82 ? "A" : score >= 68 ? "B" : score >= 52 ? "C" : "D";

  return {
    rank,
    score,
    pressure: summary.pressureScore,
    identity: summary.routeIdentity,
  };
}

export function formatChallengeText(tower: TowerState, challenge: ChallengeResult, baseUrl: string) {
  const status = tower.won ? "cleared" : "attempted";
  const url = `${baseUrl}?seed=${encodeURIComponent(tower.seed)}&difficulty=${tower.difficulty}&wish=${encodeURIComponent(tower.prompt)}`;
  return `I ${status} OnePromptDungeon seed ${tower.seed} (${tower.difficulty}) with Rank ${challenge.rank} / ${challenge.score}, ${tower.moves} moves, ${tower.hero.hp} HP left. Play: ${url}`;
}

export function buildReplayExport(tower: TowerState, challenge: ChallengeResult) {
  return {
    game: "OnePromptDungeon",
    version: "1.0.0",
    seed: tower.seed,
    difficulty: tower.difficulty,
    wish: tower.prompt,
    result: {
      won: tower.won,
      lost: tower.lost,
      rank: challenge.rank,
      score: challenge.score,
      moves: tower.moves,
      hp: tower.hero.hp,
      maxHp: tower.hero.maxHp,
      gold: tower.hero.gold,
      level: tower.hero.level,
      pressure: challenge.pressure,
      identity: challenge.identity,
      stats: getRunSummary(tower),
    },
    replay: tower.replay ?? [],
  };
}

export function buildShareCardSvg(tower: TowerState, challenge: ChallengeResult) {
  const title = "OnePromptDungeon";
  const status = tower.won ? "Tower Cleared" : "Tower Attempt";
  const lines = [
    `Seed ${tower.seed} · ${tower.difficulty.toUpperCase()}`,
    `Rank ${challenge.rank} / ${challenge.score} · Pressure ${challenge.pressure}`,
    `${tower.moves} moves · ${tower.hero.hp}/${tower.hero.maxHp} HP · Lv ${tower.hero.level}`,
    tower.prompt,
  ];
  const escapedLines = lines.map(escapeXml);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#061015"/>
      <stop offset="0.52" stop-color="#0b1f26"/>
      <stop offset="1" stop-color="#160c05"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="34" y="34" width="1132" height="562" fill="none" stroke="#d59a45" stroke-width="5"/>
  <rect x="58" y="58" width="1084" height="514" fill="rgba(0,0,0,0.22)" stroke="#1fd7ff" stroke-width="2"/>
  <text x="92" y="122" fill="#ffd58a" font-family="Georgia, serif" font-size="58" font-weight="700">${escapeXml(title)}</text>
  <text x="92" y="182" fill="#35e2ff" font-family="Trebuchet MS, sans-serif" font-size="30" font-weight="700">${escapeXml(status)}</text>
  <text x="92" y="286" fill="#ffffff" font-family="Trebuchet MS, sans-serif" font-size="110" font-weight="900">Rank ${escapeXml(challenge.rank)}</text>
  <text x="420" y="286" fill="#8eff3e" font-family="Trebuchet MS, sans-serif" font-size="58" font-weight="800">${challenge.score}</text>
  <text x="94" y="370" fill="#f5d39a" font-family="Trebuchet MS, sans-serif" font-size="34">${escapedLines[0]}</text>
  <text x="94" y="422" fill="#f5d39a" font-family="Trebuchet MS, sans-serif" font-size="34">${escapedLines[1]}</text>
  <text x="94" y="474" fill="#f5d39a" font-family="Trebuchet MS, sans-serif" font-size="34">${escapedLines[2]}</text>
  <text x="94" y="536" fill="#8cecff" font-family="Trebuchet MS, sans-serif" font-size="28">${escapedLines[3].slice(0, 90)}</text>
  <text x="872" y="542" fill="#ffd58a" font-family="Trebuchet MS, sans-serif" font-size="26">nothingyl.github.io/OnePromptDungeon</text>
</svg>`;
}

function getRunSummary(tower: TowerState) {
  return tower.runStats ?? { defeated: 0, doors: 0, pickups: 0, shops: 0 };
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "\"": "&quot;",
    "'": "&apos;",
  })[char] ?? char);
}
