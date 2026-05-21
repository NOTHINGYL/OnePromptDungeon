# Roadmap

## v0.1 - Playable Tower Prototype

Goal: prove the game loop is fun before adding generation.

- Fixed handcrafted level
- Deterministic combat preview
- Key and door routing
- Rescue objective
- GitHub Pages deployment

## v0.2 - Local Prompt Dungeon Generator

Goal: make the project live up to the name without requiring an API key.

- Parse prompt keywords into theme, objective, boss flavor, and tile palette.
- Generate a one-floor map from a seed.
- Guarantee a basic route from start to objective.
- Place monsters and rewards using difficulty bands.
- Export and import `level.json`.
- Share links with `?seed=` and encoded prompt.

## v0.3 - Better Magic Tower Depth

Goal: increase strategic planning.

- Multi-floor tower
- Shops and upgrade choices
- Undo one step
- Route hints after a failed run
- Solvability checks for generated levels
- Community level gallery folder

## v0.4 - Optional AI Mode

Goal: let LLMs produce flavor and structured level data while the local engine remains authoritative.

- Bring-your-own-key API settings
- AI-generated title, quest text, monster names, and theme pack
- Zod validation for generated `level.json`
- Auto-repair pass for invalid level data
- Ollama/local model adapter exploration

## Star-Friendly Polish Ideas

- GIF in README showing prompt to playable map.
- "Add your first monster in 60 seconds" contributor section.
- A small benchmark of generated levels and solvability rate.
- Example levels submitted by contributors.
- Issue templates for theme packs and map seeds.
