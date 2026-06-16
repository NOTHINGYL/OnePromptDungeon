# Roadmap

## v0.1 - Playable Tower Prototype

Goal: prove the core deterministic combat loop.

- Fixed one-floor handcrafted level
- Key and door routing
- Combat preview
- Rescue objective
- GitHub Pages deployment

## v0.2 - Three-Floor Magic Tower Experience

Goal: make the game feel like a compact, replayable tower rather than a rules demo.

- Full-screen retro-modern HUD
- Three persistent handcrafted floors
- Upstairs/downstairs traversal
- Merchant shop upgrades
- Undo one step
- Stronger route-planning pressure

## v0.3 - Classic UI and Localization

Goal: make the project read as a classic Magic Tower-style web game at first glance.

- Chinese/English UI switching
- Classic light/dark theme switching
- Classic game-window layout
- Original pixel-style Canvas art
- Translatable log events
- Desktop no-scroll preservation

## v0.4 - Premium UI and Local Wish Forge

Goal: make the game look star-worthy while finally making the project live up to the name without requiring an API key.

- Premium Neo-Retro Tower UI with a larger map-first layout
- Collapsible `Wish Forge` drawer that never covers the main map
- Parse prompt keywords into generator pressure such as scarce keys, risky shops, boss rush, treasure, and defense paths
- Generate a three-floor tower from a reproducible seed
- Keep a stable UI while replacing tower data after generation
- Export tower JSON to clipboard
- Share links with `?seed=`, `?difficulty=`, and encoded wish

## v0.5 - PNG Sprite Sheet and Design-Match UI

Goal: make the playable app look much closer to the design mockups by moving character, item, monster, and tile art out of CSS primitives and into a project PNG sprite sheet.

- Add project PNG sprite sheet
- Render map tiles, doors, items, monsters, hero, princess, merchant, stairs, and boss via Canvas `drawImage`
- Reuse sprite assets in HUD panels and route hints
- Refine classic dark tower UI away from modern web styling
- Keep 1280x720 desktop no-scroll checks

## v0.6 - Route Scanner and Better Local Generator

Goal: make generated towers easier to understand, compare, and share as route puzzles.

- Add named generator presets
- Replace Floor Map with Tower Scanner
- Add reachable area, safe fight, key economy, blocked door, next target, and solvability summaries
- Add dynamic route hints
- Add recent seed history and local save
- Add basic analysis tests

## v0.6.x - Shareability Polish

Goal: improve sharing and onboarding around generated towers.

- Import tower JSON
- Curated seed gallery examples
- Route pressure score
- Optional animated README GIF

## v0.7 - Game Feel Pass

Goal: make the tower feel more like a game instead of a static route planner.

- Add movement outcome feedback for combat, pickups, doors, blocked moves, stairs, shops, undo, victory, and failure
- Add local SFX with a saved mute toggle
- Add a current-floor Monster Book
- Add victory/failure run summary panels
- Track defeated monsters, opened doors, pickups, and shop purchases in undoable tower state

## v0.8 - Five-Floor Equipment Tower

Goal: make OnePromptDungeon feel more like a complete compact Magic Tower run with visible growth choices.

- Expand generated and handcrafted towers from three floors to five
- Add weapon and shield pickups with persistent hero equipment state
- Put equipment growth pressure on 3F and 4F before the final 5F boss route
- Teach Wish Forge prompt analysis about sword, weapon, shield, and defense wishes
- Update Tower Scanner, Seed Summary, and Route Hint to surface equipment rewards
- Keep the 15x15 board and GitHub Pages-only static deployment

## v0.9 - Generator Identity Pass

Goal: make OnePromptDungeon feel like a prompt/seed-generated route puzzle rather than only a fixed Magic Tower clone.

- Add curated Seed Gallery examples
- Add EXP and level growth
- Add route pressure scoring
- Add seed identity labels
- Improve Wish Forge summaries
- Keep the project fully static and GitHub Pages-friendly

## v1.0 - Shareable Challenge Launch

Goal: make OnePromptDungeon easier to share, replay, and star as a complete GitHub Pages game.

- Add challenge rank scoring
- Add share cards and copyable challenge text
- Add Replay JSON export
- Add community seed format
- Upgrade README and project presentation

## v1.1 - Optional AI Mode

Goal: let LLMs produce flavor and structured level data while the local engine remains authoritative.

- Bring-your-own-key API settings
- AI-generated title, quest text, monster names, and theme pack
- Validation for generated `level.json`
- Auto-repair pass for invalid level data
- Ollama/local model adapter exploration

## Star-Friendly Polish Ideas

- README GIF showing a full five-floor clear.
- "Add your first monster in 60 seconds" contributor section.
- Example community tower seeds.
- A small solvability report for generated levels and seed gallery pages.
