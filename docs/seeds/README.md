# Community Seeds

`community-seeds.json` is the lightweight contribution format for shareable OnePromptDungeon challenges.

Each entry should include:

- `name`: short display name
- `seed`: stable seed text
- `difficulty`: `easy`, `normal`, or `hard`
- `wish`: prompt text used by Wish Forge
- `tags`: compact route identity tags
- `description`: one-sentence reason the seed is interesting

Before opening a pull request, load the seed in the GitHub Pages build or local dev server and confirm:

- The tower has five floors.
- The route is solvable.
- The seed has a clear identity such as key pressure, merchant economy, boss rush, weapon route, shield route, treasure trap, or precision combat.
- The result panel can export Replay JSON after a run.
