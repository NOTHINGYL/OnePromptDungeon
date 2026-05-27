# OnePromptDungeon

OnePromptDungeon is a browser-playable, Magic Tower-like dungeon game designed for GitHub Pages.

v0.5 turns the project into a sprite-driven Premium Neo-Retro Tower: a large playable 15x15 map, dense classic RPG HUD, right-side tactical panel, collapsible Wish Forge, and a PNG sprite sheet for hero, monsters, doors, items, tiles, princess, merchant, and boss.

## Play

Online build:

```txt
https://nothingyl.github.io/OnePromptDungeon/
```

No login, backend, or API key is required.

## Run Locally

```bash
git clone https://github.com/NOTHINGYL/OnePromptDungeon.git
cd OnePromptDungeon
npm install
npm run dev
```

Build the static GitHub Pages site:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Controls

- Move: `WASD`, arrow keys, or on-screen arrow buttons
- Undo: `Z` or the `Undo` button
- Language: use the title-bar language button to switch `中文 / English`
- Theme: use the title-bar theme button to switch classic light/dark
- Wish Forge: click the `Wish Forge` button or press `I` to open the local generator
- Shop: stand on the merchant tile and buy ATK, DEF, or HP upgrades
- Goal: climb to 3F, defeat the Crystal Warden, and rescue the princess

## What v0.5 Includes

- PNG sprite sheet rendering via `public/assets/tower-sprites-v05.png`
- Sprite metadata in `src/assets/sprites.ts`
- Canvas `drawImage` rendering for floor, wall, doors, keys, potions, gems, monsters, hero, princess, merchant, stairs, and boss
- UI icons and hero portrait reuse the same sprite sheet for a more coherent Magic Tower look
- Classic dark tower HUD refinements to move away from generic modern web UI
- Premium Neo-Retro Tower UI inspired by classic tower RPGs, rebuilt with a larger map-first layout
- Collapsible `Wish Forge` drawer for Wish, Seed, Difficulty, Generate, Export JSON, and Share Link
- Local seed generator: `Wish + Seed + Difficulty + v0.5` creates reproducible three-floor towers
- Prompt keyword handling for routes such as scarce blue keys, risky shops, boss rush, treasure, and defense paths
- Right-side tactical panel with objective, monster forecast, minimap, and seed badge
- Bottom HUD for battle forecast, merchant choices, tower log, and route hint
- Full Chinese/English UI switch with saved preference
- Classic light/dark theme switch with saved preference
- Original project PNG pixel-style hero, monsters, items, stairs, merchant, boss, and princess
- Three 15x15 floors with deterministic seed-based variation
- Persistent floor state when moving up and down stairs
- Deterministic Magic Tower-style combat preview
- Yellow, blue, and red doors with matching keys
- Potions, gems, monsters, boss, princess, stairs, and merchant
- Shop upgrades: `20 gold` for `+12 ATK`, `+12 DEF`, or `+250 HP`
- Undo history for the last 30 meaningful actions
- Desktop no-scroll layout
- GitHub Pages deployment workflow

## Design Direction

The project is inspired by deterministic tower RPGs: the fun comes from route planning, not random combat. Every enemy has predictable damage, every key matters, and every shop purchase changes which fights become possible.

`Generate Tower` does not replace the whole UI. It replaces the tower data behind the UI: floor contents, route pressure, monsters, rewards, seed, wish, and log. The game frame stays stable so players can focus on planning.

## Roadmap

- v0.1: Fixed one-floor playable prototype
- v0.2: Three-floor polished Magic Tower-like experience
- v0.3: Classic Magic Tower-style UI, bilingual text, and light/dark themes
- v0.4: Premium Neo-Retro UI, Wish Forge drawer, local seed generator
- v0.5: PNG sprite sheet, design-match tower UI, stronger visual identity
- v0.6: Stronger generator presets, solvability reports, import/export polish
- v0.7: Optional AI mode for story/theme/level JSON generation

More detail lives in [docs/ROADMAP.md](docs/ROADMAP.md).

## Project Structure

```txt
src/
  assets/     Sprite sheet metadata
  data/       Item, monster, and shop catalog
  engine/     Combat, tower movement, shops, undo, and local seed generation
  types/      Shared game types
  i18n.ts     Chinese/English translation dictionary
  ui/         Canvas board renderer
  App.tsx     Game HUD and controls
docs/
  CHANGELOG.md
  ROADMAP.md
public/
  assets/     PNG sprite sheet
```

Original visuals are rendered from project PNG sprites and Canvas. No classic Magic Tower art, maps, names, or copyrighted materials are copied.
