# Changelog

## v0.8.0

Five-floor equipment-growth tower.

- Expanded the tower from three floors to five persistent 15x15 floors.
- Added Iron Sword, Silver Sword, Iron Shield, and Silver Shield pickups.
- Added weapon and shield fields to hero state with old-save defaults and undo restoration.
- Updated handcrafted floor layouts so 3F/4F introduce equipment decisions and 5F holds the final boss and princess.
- Updated the local Wish Forge generator and variant slots so generated towers are always five floors.
- Added prompt keyword handling for sword/weapon and shield/defense wishes.
- Updated Tower Scanner, Seed Summary, and Route Hint logic to account for equipment rewards.
- Added Canvas rendering for equipment pickups and compact HUD equipment rows.
- Added tests for five-floor generation, equipment pickup, undo restoration, and equipment-aware analysis.
- Updated README, roadmap, package version, and local v0.8 notes.

## v0.7.1

Feedback cleanup fix.

- Cleared stale Canvas feedback on normal movement so blocked-move cross marks only appear when the player actually bumps into a wall or locked route.
- Added a Canvas-side guard that cancels and clears the previous animation when `feedback` becomes empty.

## v0.7.0

Game feel pass.

- Added Canvas feedback for combat hits, damage labels, pickups, door opens, blocked movement, stairs, shop purchases, undo, victory, and failure.
- Added local Web Audio sound effects with a saved SFX mute toggle.
- Added a floor Monster Book with remaining monster counts, stats, damage forecast, and can-win status.
- Added victory/failure result panels with seed, difficulty, moves, HP, gold, defeated monsters, opened doors, and shop purchases.
- Added run stats to tower state so result summaries and undo snapshots stay consistent.
- Updated README, roadmap, package version, and local v0.7 notes.

## v0.6.1

Tower Scanner layout fix.

- Moved the `Next` recommendation into the scanner metric grid.
- Reduced the scanner card height so it no longer clips behind the Seed panel on shorter browser viewports.

## v0.6.0

Route scanner and better local generator.

- Replaced the right-side Floor Map with `Tower Scanner`.
- Added `src/engine/analysis.ts` for reachable-area scans, key economy, safe fight counts, next target hints, and seed summaries.
- Added dynamic Route Hint rows generated from current tower state.
- Added Wish Forge presets for Key Puzzle, Boss Rush, Treasure, and Shop Route.
- Added a solvability report, seed shape summary, and recent seed history in Wish Forge.
- Added local save/restore for the current tower via `localStorage`.
- Added analysis unit tests.
- Updated README, roadmap, package version, and local v0.6 notes.

## v0.5.1

UI icon and layout polish.

- Added `public/assets/tower-ui-icons-v05.png` for the title shield and HP/ATK/DEF/Gold icons.
- Added UI icon metadata in `src/assets/uiIcons.ts`.
- Collapsed the language controls into a single toggle button.
- Added a compact Floor Map legend and adjusted minimap sizing to avoid clipping.
- Rebalanced the bottom HUD widths and refined Merchant upgrade card spacing.
- Added local planning notes for this small UI polish pass.

## v0.5.0

PNG sprite sheet and design-match tower UI.

- Added `public/assets/tower-sprites-v05.png` as the project sprite sheet.
- Added sprite metadata in `src/assets/sprites.ts`.
- Replaced Canvas primitive art for tiles, doors, keys, potions, gems, monsters, stairs, shop, hero, princess, and boss with PNG sprite rendering.
- Reused the sprite sheet in the React HUD for the hero portrait, route hints, items, keys, and monster forecast.
- Refined the UI toward the design mockups: darker classic tower panels, tighter HUD proportions, larger map priority, and less generic modern web styling.
- Added local v0.5 planning notes.
- Updated README, roadmap, and package version.

## v0.4.0

Premium Neo-Retro Tower UI and local seed generation.

- Rebuilt the app shell into a map-first Premium Neo-Retro Tower layout.
- Added the default collapsed `Wish Forge` button and right-side generator drawer.
- Added local `Wish + Seed + Difficulty` generation without requiring an API key.
- Added deterministic seed utilities and generator tests.
- Added right-side objective, monster forecast, minimap, and seed badge.
- Added bottom Forecast, Merchant, Tower Log, and Route Hint panels.
- Updated desktop layout checks so 1280x720 stays no-scroll in both collapsed and opened Forge states.
- Updated README, roadmap, package version, and local v0.4 plan notes.

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
