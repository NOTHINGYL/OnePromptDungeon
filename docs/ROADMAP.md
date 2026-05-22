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

## v0.5 - Stronger Local Generator

Goal: make generated towers feel less template-like and easier to share.

- Add named generator presets
- Add import JSON
- Add seed gallery examples
- Add basic reachability/solvability report
- Add route pressure score and generated tower summary
- Add optional animated README GIF

## v0.6 - Optional AI Mode

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
