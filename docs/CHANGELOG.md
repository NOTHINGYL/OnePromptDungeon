# Changelog

## v0.3.0

Classic Magic Tower UI and localization.

- Added full Chinese/English UI switching with saved language preference.
- Added classic light/dark theme switching with saved theme preference.
- Reworked the layout into a classic game window with title bar, left status board, right map, and bottom log/forecast strip.
- Converted engine logs into translatable log events.
- Reworked Canvas visuals toward original pixel-style Magic Tower-inspired characters, monsters, items, doors, stairs, merchant, boss, and princess.
- Updated README and roadmap to move local prompt generation to v0.4.
- Added i18n tests.

## v0.2.0

Three-floor Magic Tower-like experience.

- Reworked the game model from a single level into a persistent tower state.
- Added three handcrafted 15x15 floors with upstairs/downstairs traversal.
- Added merchant shops with `20 gold` upgrades for ATK, DEF, and HP.
- Added undo history for the last 30 meaningful actions.
- Added stairs, shop, and red key/red door gameplay.
- Rebuilt the UI as a full-screen retro-modern game HUD.
- Upgraded Canvas rendering with more pixel-like tiles, doors, monsters, items, stairs, shop, boss, and princess.
- Added tests for doors, floor traversal, shop purchases, and undo.
- Updated README and roadmap for the v0.2 direction.

## v0.1.0

Initial playable prototype.

- Added Vite + React + TypeScript app shell.
- Added a handcrafted 15x15 tower level.
- Added deterministic Magic Tower-style combat.
- Added HP, ATK, DEF, gold, key, move, and seal state.
- Added potions, gems, yellow keys, blue key, doors, monsters, boss, and princess objective.
- Added Canvas board rendering with original tile visuals.
- Added adjacent combat preview.
- Added keyboard and on-screen movement controls.
- Added responsive modern UI.
- Added GitHub Pages deployment workflow.
- Added README, roadmap, and local planning note structure.
