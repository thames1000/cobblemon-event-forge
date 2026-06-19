# 🎮 Cobbleverse Event Forge

> Build weekly events, bounties, rewards, and Safari zones for your Cobbleverse
> server in minutes — without hand-editing datapack files every week.

An external owner dashboard ("Game Master console") that turns a few form fields
into everything you need to run a rotating server event:

- a **validated Cobblemon datapack** (`.zip`) with themed spawns,
- **auto-tracked bounties** — objectives compile to Cobblemon advancements
  (catch / shiny / evolve / hatch / win-battles / defeat / level-up) that detect
  completion in-game and run a customizable reward (items, a **crate key**, a
  spawned Pokémon, raw commands) with an optional server-wide announcement;
  manual objectives get a reward function you run by hand,
- an optional **legendary auto-spawn** — catch N of a type → a `cobblemon:catch_pokemon`
  advancement fires a `/spawnpokemon` reward function (per-player or server-wide),
- a **reward `.mcfunction`** you run against winners,
- an **`event_bounties.json`** owner-side record (the seed for future questlines),
- a **`discord_announcement.md`** ready to paste, and
- an **`admin_checklist.txt`** runbook for upload / reload / teardown.

Plus a **Pack Safety / Cleanup** section: safe lifecycle defaults (uninstall + enable
flag, **never a `tick.json`** unless you opt into timed logic) and a live
**namespace preview** so you always know files land under `data/<namespace>/`.

Three generators are live: the **Event Forge**, the **Reward Crate Builder**, and
a **Bingo Board** generator (randomized objective grid with tick-free line/blackout
rewards). The Forge also has a **🎲 Generate Full Event** button with a
Casual→Chaos difficulty, and **tiered rewards** (Participation / Winner / Champion).

The **Event Forge** and the **Reward Crate Builder**
(tiers, weighted items, live drop odds + expected-value balance warnings, loot
tables, and an optional **usable crate-key item** — right-click & hold to open,
detected tick-free via a `consume_item` advancement). The remaining sections (Bounty Board, Safari Zones, Battle Factory, Item
Designer, Questlines) are scaffolded and build on the same bundle format.

## Requirements

- **Node 20+** (the system Node may be too old — this repo pins `20` in
  `.nvmrc`). With nvm: `nvm use`.

## Run it

```bash
nvm use                 # or: nvm install 20
npm install
npm run dev             # http://localhost:3000  →  open /forge
```

Other scripts:

```bash
npm run build           # production build (also type-checks + lints)
npm run smoke           # generates the "Electric Storm Weekend" event and asserts the output is valid
```

## How to use a generated event on your server

1. In **/forge**, pick a template, tweak the fields, and click **Datapack .zip**.
2. Upload the zip to `‹server›/world/datapacks/‹event›.zip`.
3. Run `/reload` in the server console (or restart).
4. Confirm with `/datapack list` — your event namespace should appear.
5. Hand out rewards: `/execute as ‹player› run function ‹namespace›:‹slug›_rewards`.
6. Paste `discord_announcement.md` into Discord; set the MOTD from the checklist.
7. After the event: remove the zip and `/reload` again.

> The **Everything** button also bundles the side-car files (Discord post,
> checklist, bounties JSON) next to the datapack for your own records.

## Why a validator?

Minecraft silently ignores datapacks with the wrong folder case or nesting (the
classic "LegendaryEncounters" trap). Before export, the Forge checks for
uppercase/illegal paths, a missing `pack.mcmeta`, unparseable JSON, the right
Cobblemon `spawn_pool_world/` location, and the 1.21 `function/` rename — so you
never upload a pack that won't load.

## Architecture

Generation is **pure, framework-agnostic TypeScript** (no React/DOM), so it's
testable in Node and reusable by future sections and a possible direct-deploy
feature.

```
src/lib/
  datapack/        core primitives — independent of any one feature
    types.ts         GeneratedFile / Datapack / Bundle, datapack-vs-sidecar split
    sanitize.ts      resource-location id/namespace coercion
    packMeta.ts      pack.mcmeta + Minecraft version → pack_format map
    spawns.ts        Cobblemon spawn_pool_world JSON
    mcfunction.ts    reward .mcfunction
    validate.ts      pre-export validator (the "LegendaryEncounters" guard)
    zip.ts           fflate packaging (datapack-only zip vs. full bundle)
  catalog/         editable data tables
    pokemon.ts  items.ts  eventTypes.ts (presets)
  event/           the Event Forge feature
    types.ts  generate.ts (orchestrator)  bounties.ts  discord.ts  checklist.ts  balance.ts
  crate/           the Reward Crate feature
    types.ts  generate.ts (orchestrator)  odds.ts  balance.ts  openFunction.ts  summary.ts
  nav.ts  download.ts

src/app/            Next.js App Router UI
  page.tsx           console home
  forge/page.tsx     the Event Forge editor (MVP)
  ‹section›/page.tsx  planned sections (Bounty Board, Crates, Safari, …)
```

**Data flow:** `EventConfig` → `generateEvent()` → `{ bundle, validation }` →
preview + `zip` → download. Everything the UI shows is derived from the same
pure functions the smoke test exercises.

## Roadmap

The planned sections each reuse this pipeline: Bounty Board (incl. server-wide
community goals), Safari Zone generator, Battle Factory manager (rental-team
generator), Custom Item designer, and Questlines (with **FTB Quests** export —
`event_bounties.json` is already the structured seed for it).
