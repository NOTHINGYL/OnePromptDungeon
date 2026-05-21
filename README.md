# OnePromptDungeon

OnePromptDungeon is a browser-playable, Magic Tower-like dungeon game designed for GitHub Pages.

The v0.1 release is a polished fixed-level prototype: choose routes, collect keys, open doors, predict deterministic combat, defeat the Tower Warden, and rescue the princess. The long-term direction is prompt-generated dungeon creation with no required backend and optional bring-your-own-key AI mode.

## Play

GitHub Pages deployment is included through `.github/workflows/deploy.yml`.

After the first push to `main`, enable Pages for GitHub Actions in repository settings and use:

```txt
https://nothingyl.github.io/OnePromptDungeon/
```

## Run Locally

```bash
git clone https://github.com/NOTHINGYL/OnePromptDungeon.git
cd OnePromptDungeon
npm install
npm run dev
```

Build the static site:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## What v0.1 Includes

- Vite + React + TypeScript frontend
- Canvas-rendered 15x15 dungeon board
- Magic Tower-style deterministic combat
- Movement through WASD, arrow keys, and on-screen controls
- Yellow and blue doors with matching keys
- Potions, gems, monsters, boss fight, and rescue objective
- Adjacent fight preview with expected HP loss
- Modern responsive UI for desktop and mobile
- GitHub Pages workflow
- Version notes and roadmap docs

## Game Concept

The tower listens to wishes. A single prompt becomes the shape of a dungeon, and the player enters that dungeon as a route-planning RPG challenge.

The current prototype uses a handcrafted level named **The Whispering Tower**. The prompt box is already present as the future entry point, but v0.1 intentionally keeps the map fixed so the combat loop and UI can be tested first.

## Roadmap

- v0.1: Fixed playable Magic Tower-like prototype
- v0.2: Local prompt parser, seed-based map generation, JSON export
- v0.3: Multi-floor tower, undo, shops, solvability checks
- v0.4: Optional AI mode for story/theme/level JSON generation

More detail lives in [docs/ROADMAP.md](docs/ROADMAP.md).

## Project Structure

```txt
src/
  data/       Item and monster catalog
  engine/     Combat, movement, and fixed level state
  types/      Shared game types
  ui/         Canvas board renderer
  App.tsx     Main application shell
docs/
  CHANGELOG.md
  ROADMAP.md
```

## Design Notes

This project is inspired by deterministic tower RPGs: the important question is not whether random combat goes well, but whether the player chose the right route before spending health and keys.

Original assets are drawn in Canvas. No classic Magic Tower art, maps, names, or copyrighted materials are copied.
