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

## v0.4 - Local Prompt Dungeon Generator

Goal: make the project live up to the name without requiring an API key.

- Parse prompt keywords into theme, objective, boss flavor, and tile palette
- Generate a three-floor tower from a seed
- Guarantee basic reachability from start to objective
- Place monsters, keys, doors, and rewards using difficulty bands
- Export and import `level.json`
- Share links with `?seed=` and encoded prompt

## v0.5 - Optional AI Mode

Goal: let LLMs produce flavor and structured level data while the local engine remains authoritative.

- Bring-your-own-key API settings
- AI-generated title, quest text, monster names, and theme pack
- Validation for generated `level.json`
- Auto-repair pass for invalid level data
- Ollama/local model adapter exploration

## Star-Friendly Polish Ideas

- README GIF showing a full three-floor clear.
- "Add your first monster in 60 seconds" contributor section.
- Example community tower seeds.
- A small solvability report for generated levels once v0.3 lands.
