# OnePromptDungeon

OnePromptDungeon is a browser-playable, Magic Tower-like dungeon game designed for GitHub Pages.

v0.2 turns the first prototype into a compact three-floor tower: route through doors, manage keys, fight deterministic battles, climb floors, spend gold at the merchant, undo mistakes, defeat the Crystal Warden, and rescue the princess.

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
- Shop: stand on the merchant tile and buy ATK, DEF, or HP upgrades
- Goal: climb to 3F, defeat the Crystal Warden, and rescue the princess

## What v0.2 Includes

- Three handcrafted 15x15 floors
- Persistent floor state when moving up and down stairs
- Deterministic Magic Tower-style combat preview
- Yellow, blue, and red doors with matching keys
- Potions, gems, monsters, boss, princess, stairs, and merchant
- Shop upgrades: `20 gold` for `+12 ATK`, `+12 DEF`, or `+250 HP`
- Undo history for the last 30 meaningful actions
- Full-screen retro-modern game HUD with desktop no-scroll layout
- Canvas-rendered original pixel-style visuals
- GitHub Pages deployment workflow

## Design Direction

The project is inspired by deterministic tower RPGs: the fun comes from route planning, not random combat. Every enemy has predictable damage, every key matters, and every shop purchase changes which fights become possible.

The prompt box remains as the future "one prompt" entry point, but v0.2 intentionally focuses on making the base game feel good before generated levels arrive.

## Roadmap

- v0.1: Fixed one-floor playable prototype
- v0.2: Three-floor polished Magic Tower-like experience
- v0.3: Local prompt parser, seed-based map generation, JSON export/import
- v0.4: Optional AI mode for story/theme/level JSON generation

More detail lives in [docs/ROADMAP.md](docs/ROADMAP.md).

## Project Structure

```txt
src/
  data/       Item, monster, and shop catalog
  engine/     Combat, tower movement, shops, undo, and handcrafted floors
  types/      Shared game types
  ui/         Canvas board renderer
  App.tsx     Game HUD and controls
docs/
  CHANGELOG.md
  ROADMAP.md
```

Original visuals are drawn in Canvas. No classic Magic Tower art, maps, names, or copyrighted materials are copied.
