import { configFromPreset } from "../src/lib/catalog/eventTypes";
import { generateEvent } from "../src/lib/event/generate";
import { validateDatapack } from "../src/lib/datapack/validate";
import { DATAPACK_KINDS } from "../src/lib/datapack/types";
import { newObjective } from "../src/lib/objective/types";
import { POKEMON, findSpecies } from "../src/lib/catalog/pokemon";

// catalog: the full National Dex (#1–1025) with Cobblemon-style ids + legendary flags
const errors: string[] = [];
if (POKEMON.length < 1025) errors.push(`catalog: expected >=1025 species, got ${POKEMON.length}`);
if (findSpecies("miraidon")?.legendary !== true) errors.push("catalog: gen9 legendary (miraidon) missing/not flagged");
if (!findSpecies("greattusk")) errors.push("catalog: gen9 paradox (greattusk) missing");
if (findSpecies("greattusk")?.legendary) errors.push("catalog: paradox should not be flagged legendary");
if (new Set(POKEMON.map((p) => p.id)).size !== POKEMON.length) errors.push("catalog: duplicate species ids");

// Reproduce the brainstorm's flagship "Electric Storm Weekend".
const cfg = configFromPreset("legendary-hunt");
cfg.title = "Electric Storm Weekend";
cfg.weather = "thunder";
cfg.featured = [
  { species: "pikachu", bucket: "common", weight: 60, level: "5-15" },
  { species: "rotom", bucket: "uncommon", weight: 25, level: "20-30" },
  { species: "electabuzz", bucket: "rare", weight: 8, level: "30-40" },
  { species: "zapdos", bucket: "ultra-rare", weight: 1, level: "50-60" },
  { species: "raikou", bucket: "ultra-rare", weight: 1, level: "50-60" },
];
cfg.objectives = [
  newObjective("b1", {
    mode: "auto",
    triggerId: "cobblemon:catch_pokemon",
    count: 30,
    pokemonType: "electric",
    announce: true,
    rewards: [
      { kind: "item", itemId: "cobblemon:ultra_ball", count: 10 },
      { kind: "crate-key", crateName: "Safari Crate", baseItem: "minecraft:nether_star", glint: true },
      { kind: "spawn", species: "pikachu", level: 25 },
    ],
  }),
  newObjective("b2", { mode: "manual", label: "Win the costume contest", rewards: [{ kind: "command", command: "/give @s minecraft:diamond 5" }] }),
];
cfg.rewardTiers = [
  { id: "participation", name: "Participation", actions: [{ kind: "item", itemId: "cobblemon:poke_ball", count: 5 }] },
  {
    id: "winner",
    name: "Winner",
    actions: [
      { kind: "item", itemId: "cobblemon:bottle_cap", count: 1 },
      { kind: "command", command: "cobbledollars add @s 5000" },
    ],
  },
];

const { bundle, validation, datapackFileName } = generateEvent(cfg);

console.log("=== FILES ===");
for (const f of bundle.files) {
  const tag = DATAPACK_KINDS.has(f.kind) ? "datapack" : "side-car";
  console.log(`[${tag}] ${f.path}`);
}

console.log("\n=== VALIDATION (datapack) ===");
console.log("ok:", validation.ok, "| issues:", validation.issues.length);
for (const i of validation.issues) console.log(` - ${i.severity}: ${i.message} ${i.path ?? ""}`);

console.log("\n=== datapack file name:", datapackFileName);

// Assertions (errors[] declared at top, with the catalog checks)
if (!validation.ok) errors.push("validation reported errors");
if (!bundle.files.some((f) => f.path === "pack.mcmeta")) errors.push("missing pack.mcmeta");
if (!bundle.files.some((f) => f.path.includes("spawn_pool_world/zapdos.json"))) errors.push("missing zapdos spawn");
// every json datapack file parses
for (const f of bundle.files) {
  if (f.path.endsWith(".json")) {
    try { JSON.parse(f.contents); } catch { errors.push(`bad json: ${f.path}`); }
  }
}
// validator catches the LegendaryEncounters trap
const trap = validateDatapack([
  { path: "data/MyPack/LegendaryEncounters/x.json", contents: "{}", kind: "spawn", label: "x" },
]);
if (trap.ok) errors.push("validator FAILED to catch uppercase-path trap");

console.log("\n=== sample: zapdos spawn ===");
console.log(bundle.files.find((f) => f.path.endsWith("zapdos.json"))?.contents);
console.log("\n=== sample: rewards function ===");
console.log(bundle.files.find((f) => f.kind === "function" && f.path.includes("_rewards"))?.contents);

// --- legendary auto-spawn (per-player, default for legendary-hunt) ---
const adv = bundle.files.find((f) => f.kind === "advancement");
if (!adv) errors.push("legendary: missing advancement");
if (adv) {
  if (!adv.path.includes("/advancement/catch_20_electric.json")) errors.push(`legendary: unexpected advancement path ${adv.path}`);
  const doc = JSON.parse(adv.contents);
  if (doc.criteria?.caught?.trigger !== "cobblemon:catch_pokemon") errors.push("legendary: wrong trigger id");
  if (doc.criteria?.caught?.conditions?.type !== "electric") errors.push("legendary: wrong type condition");
  if (doc.criteria?.caught?.conditions?.count !== 20) errors.push("legendary: wrong count condition");
  if (!String(doc.rewards?.function).endsWith(":summon_zapdos")) errors.push("legendary: reward function not wired");
}
const summonFn = bundle.files.find((f) => f.path.endsWith("summon_zapdos.mcfunction"));
if (!summonFn) errors.push("legendary: missing summon function");
// the spawn MUST be positioned at the player — reward functions run at world spawn, not @s's location
if (summonFn && !/execute at @s run spawnpokemonat ~ ~ ~ zapdos level=60/.test(summonFn.contents))
  errors.push("legendary: summon not positioned at the player (would spawn at world spawn)");
if (summonFn && /\n\s*spawnpokemon zapdos/.test(summonFn.contents))
  errors.push("legendary: still uses bare spawnpokemon (unpositioned)");
console.log("\n=== sample: advancement ===");
console.log(adv?.contents);
console.log("\n=== sample: summon function ===");
console.log(bundle.files.find((f) => f.path.endsWith("summon_zapdos.mcfunction"))?.contents);

// --- randomizer: every difficulty produces a valid, complete, generatable event ---
import { randomEvent, DIFFICULTIES } from "../src/lib/event/randomize";
for (const d of DIFFICULTIES) {
  const r = generateEvent(randomEvent(d.id));
  if (!r.validation.ok) errors.push(`randomize(${d.id}): generated an invalid datapack`);
  if (r.bundle.title.trim() === "") errors.push(`randomize(${d.id}): empty title`);
  for (const f of r.bundle.files) {
    if (f.path.endsWith(".json")) {
      try { JSON.parse(f.contents); } catch { errors.push(`randomize(${d.id}): bad json ${f.path}`); }
    }
  }
}

// --- reward tiers: each non-empty tier => reward_<id> function ---
if (!bundle.files.some((f) => f.path.endsWith("/function/reward_participation.mcfunction"))) errors.push("tiers: missing participation fn");
const winnerFn = bundle.files.find((f) => f.path.endsWith("/function/reward_winner.mcfunction"));
if (!winnerFn) errors.push("tiers: missing winner fn");
if (winnerFn && !winnerFn.contents.includes("give @s cobblemon:bottle_cap 1")) errors.push("tiers: winner item missing");
if (winnerFn && !winnerFn.contents.includes("cobbledollars add @s 5000")) errors.push("tiers: winner currency command missing");

// --- objectives: auto compiles to advancement + reward fn; manual = fn only ---
const advB1 = bundle.files.find((f) => f.path.endsWith("/advancement/bounty_1.json"));
const fnB1 = bundle.files.find((f) => f.path.endsWith("/function/bounty_1.mcfunction"));
if (!advB1) errors.push("objective: missing bounty_1 advancement");
if (advB1) {
  const d = JSON.parse(advB1.contents);
  if (d.criteria?.done?.trigger !== "cobblemon:catch_pokemon") errors.push("objective: wrong trigger");
  if (d.criteria?.done?.conditions?.count !== 30 || d.criteria?.done?.conditions?.type !== "electric")
    errors.push("objective: wrong conditions");
  if (!String(d.rewards?.function).endsWith(":bounty_1")) errors.push("objective: advancement not wired to reward fn");
}
if (fnB1) {
  if (!fnB1.contents.includes("give @s cobblemon:ultra_ball 10")) errors.push("objective: item reward missing");
  if (!fnB1.contents.includes("execute at @s run spawnpokemonat ~ ~ ~ pikachu level=25")) errors.push("objective: spawn reward missing/not positioned at player");
  if (!/give @s minecraft:nether_star\[.*cobble_crate:"safari_crate"/.test(fnB1.contents)) errors.push("objective: crate-key reward missing");
  if (!fnB1.contents.includes('"selector":"@s"')) errors.push("objective: announce broadcast missing");
}
// manual objective: reward fn but NO advancement
if (!bundle.files.some((f) => f.path.endsWith("/function/bounty_2.mcfunction"))) errors.push("objective: manual reward fn missing");
if (bundle.files.some((f) => f.path.endsWith("/advancement/bounty_2.json"))) errors.push("objective: manual objective should not have an advancement");
const fnB2 = bundle.files.find((f) => f.path.endsWith("/function/bounty_2.mcfunction"));
if (fnB2 && !fnB2.contents.includes("give @s minecraft:diamond 5")) errors.push("objective: manual raw command missing");
console.log("\n=== bounty_1 reward function ===");
console.log(fnB1?.contents);

// --- pack lifecycle: default event has load + uninstall, NO tick ---
if (!bundle.files.some((f) => f.path.endsWith("/function/load.mcfunction"))) errors.push("lifecycle: missing load.mcfunction");
if (!bundle.files.some((f) => f.path.endsWith("/function/uninstall.mcfunction"))) errors.push("lifecycle: missing uninstall.mcfunction");
if (bundle.files.some((f) => f.path.includes("tags/function/tick.json"))) errors.push("lifecycle: tick.json present by default (should not be!)");
if (bundle.files.some((f) => f.path.endsWith("/function/tick.mcfunction"))) errors.push("lifecycle: tick.mcfunction present by default (should not be!)");
const loadFn = bundle.files.find((f) => f.path.endsWith("/function/load.mcfunction"));
if (loadFn && !loadFn.contents.includes("cobble_events")) errors.push("lifecycle: load doesn't set up the objective");

// --- legendary server-wide: centralized load tag + guard, no separate init ---
const swCfg = { ...cfg, legendaryTrigger: { ...cfg.legendaryTrigger, scope: "server-wide" as const } };
const sw = generateEvent(swCfg);
if (!sw.bundle.files.some((f) => f.path === "data/minecraft/tags/function/load.json")) errors.push("server-wide: missing load tag");
if (sw.bundle.files.some((f) => f.path.endsWith("_hunt_init.mcfunction"))) errors.push("server-wide: stray hunt_init function (should be centralized)");
const swLoadTag = sw.bundle.files.find((f) => f.path === "data/minecraft/tags/function/load.json");
if (swLoadTag && !JSON.parse(swLoadTag.contents).values.includes(`${sw.bundle.namespace}:load`)) errors.push("server-wide: load tag doesn't point at :load");
const swLoad = sw.bundle.files.find((f) => f.path.endsWith("/function/load.mcfunction"));
if (swLoad && !swLoad.contents.includes("_leg")) errors.push("server-wide: load doesn't reset the legendary guard");
if (!sw.validation.ok) errors.push("server-wide: validation errors");

// --- advanced timed logic ON: now (and only now) we emit tick files ---
const tickCfg = { ...cfg, pack: { ...cfg.pack, advancedTimedLogic: true } };
const tick = generateEvent(tickCfg);
if (!tick.bundle.files.some((f) => f.path.includes("tags/function/tick.json"))) errors.push("tick: tick.json missing when advancedTimedLogic on");
if (!tick.bundle.files.some((f) => f.path.endsWith("/function/tick.mcfunction"))) errors.push("tick: tick.mcfunction missing when advancedTimedLogic on");

console.log("\n=== default load.mcfunction ===");
console.log(loadFn?.contents);
console.log("=== default uninstall.mcfunction ===");
console.log(bundle.files.find((f) => f.path.endsWith("/function/uninstall.mcfunction"))?.contents);

// ---------------------------------------------------------------------------
// Reward Crate: Safari Crate
// ---------------------------------------------------------------------------
import { configFromCratePreset } from "../src/lib/catalog/crateTypes";
import { generateCrate } from "../src/lib/crate/generate";
import { crateOdds } from "../src/lib/crate/odds";
import { expectedValue } from "../src/lib/crate/balance";

const crate = configFromCratePreset("safari-crate");
const cres = generateCrate(crate);

console.log("\n=== CRATE FILES ===");
for (const f of cres.bundle.files) {
  const tag = DATAPACK_KINDS.has(f.kind) ? "datapack" : "side-car";
  console.log(`[${tag}] ${f.path}`);
}
console.log("crate validation ok:", cres.validation.ok, "| issues:", cres.validation.issues.length);

const loot = cres.bundle.files.find((f) => f.kind === "loot-table");
if (!loot) errors.push("crate: missing loot table");
if (loot && !loot.path.includes("/loot_table/crates/")) errors.push("crate: loot table not under loot_table/crates/");
if (!cres.validation.ok) errors.push("crate: validation reported errors");
for (const f of cres.bundle.files) {
  if (f.path.endsWith(".json")) {
    try { JSON.parse(f.contents); } catch { errors.push(`crate: bad json ${f.path}`); }
  }
}

// odds for each tier must sum to <= 1 per roll, and item perRoll values are in [0,1]
for (const tier of crateOdds(crate)) {
  const sum = tier.entries.reduce((s, e) => s + e.perRoll, 0);
  if (sum > 1.0001) errors.push(`crate: tier ${tier.name} perRoll sum ${sum} > 1`);
  for (const e of tier.entries) {
    if (e.perRoll < 0 || e.perRoll > 1) errors.push(`crate: ${e.itemId} perRoll out of range`);
  }
}
console.log("\n=== Safari Crate odds ===");
for (const t of crateOdds(crate)) {
  console.log(` ${t.name} (${t.rolls} rolls, pays out ${(t.hitChance * 100).toFixed(0)}%):`);
  for (const e of t.entries) console.log(`   - ${e.itemId} x${e.count}: ${(e.perRoll * 100).toFixed(1)}%/roll, avg ${e.expectedCount.toFixed(2)}/open`);
}
console.log("expected value/open:", expectedValue(crate).toLocaleString(), "CobbleDollars");

console.log("\n=== loot table JSON ===");
console.log(loot?.contents);

// --- usable crate key (tick-free) ---
const keyAdv = cres.bundle.files.find((f) => f.kind === "advancement");
if (!keyAdv) errors.push("crate key: missing use advancement");
if (keyAdv) {
  const doc = JSON.parse(keyAdv.contents);
  if (doc.criteria?.used?.trigger !== "minecraft:consume_item") errors.push("crate key: wrong trigger");
  // custom_data sub-predicate must be the SNBT STRING form (object form fails to load)
  if (doc.criteria?.used?.conditions?.item?.predicates?.["minecraft:custom_data"] !== '{cobble_crate:"safari_crate"}')
    errors.push("crate key: custom_data predicate not the SNBT string form");
  if (!String(doc.rewards?.function).endsWith(":open_safari_crate")) errors.push("crate key: reward not the open function");
}
if (!cres.bundle.files.some((f) => f.path.endsWith("give_safari_crate_key.mcfunction"))) errors.push("crate key: missing give function");
const openFn = cres.bundle.files.find((f) => f.path.endsWith("/function/open_safari_crate.mcfunction"));
if (openFn && !openFn.contents.includes("advancement revoke")) errors.push("crate key: open fn missing revoke (not repeatable)");
// crates must NOT introduce a tick
if (cres.bundle.files.some((f) => f.path.includes("tags/function/tick.json"))) errors.push("crate key: introduced a tick.json (should be tick-free!)");
// version-aware components: 1.21.1 (48) uses food.eat_seconds; 1.21.2+ (57) uses consumable
const give48 = generateCrate({ ...crate, packFormat: 48 }).bundle.files.find((f) => f.path.endsWith("give_safari_crate_key.mcfunction"));
const give57 = generateCrate({ ...crate, packFormat: 57 }).bundle.files.find((f) => f.path.endsWith("give_safari_crate_key.mcfunction"));
if (give48 && (give48.contents.includes("consumable") || !give48.contents.includes("eat_seconds")))
  errors.push("crate key: 1.21.1 should use food.eat_seconds, not consumable");
if (give57 && (!give57.contents.includes("minecraft:consumable") || give57.contents.includes("eat_seconds")))
  errors.push("crate key: 1.21.2+ should use the consumable component, not food.eat_seconds");
console.log("\n=== crate key give (1.21.1 / pack 48 → food.eat_seconds) ===");
console.log(give48?.contents);
console.log("=== crate key give (1.21.2+ / pack 57 → consumable) ===");
console.log(give57?.contents);

// ---------------------------------------------------------------------------
// Bingo board
// ---------------------------------------------------------------------------
import { newBingoConfig, centerIndex } from "../src/lib/bingo/board";
import { generateBingo } from "../src/lib/bingo/generate";

const bingo = newBingoConfig(48);
const bres = generateBingo(bingo);
console.log("\n=== BINGO ===");
console.log("validation ok:", bres.validation.ok, "| files:", bres.bundle.files.length);
if (!bres.validation.ok) errors.push("bingo: invalid datapack");
const center = centerIndex(bingo.size, bingo.freeCenter);
const expectedCells = bingo.size * bingo.size - (center >= 0 ? 1 : 0);
const cellAdvs = bres.bundle.files.filter((f) => /\/advancement\/cell_\d+\.json$/.test(f.path));
if (cellAdvs.length !== expectedCells) errors.push(`bingo: expected ${expectedCells} cell advancements, got ${cellAdvs.length}`);
for (const f of bres.bundle.files) {
  if (f.path.endsWith(".json")) { try { JSON.parse(f.contents); } catch { errors.push(`bingo: bad json ${f.path}`); } }
}
const checkFn = bres.bundle.files.find((f) => f.path.endsWith("/function/check.mcfunction"));
if (checkFn && !/advancements=\{.*cell_\d+=true.*\}/.test(checkFn.contents)) errors.push("bingo: check missing advancement line test");
if (checkFn && !checkFn.contents.includes(":win")) errors.push("bingo: check doesn't call win");
const winFn = bres.bundle.files.find((f) => f.path.endsWith("/function/win.mcfunction"));
if (winFn && !winFn.contents.includes('"selector":"@s"')) errors.push("bingo: win missing announce");
if (winFn && !/scoreboard players set @s bingo 1/.test(winFn.contents)) errors.push("bingo: win missing flag set");
if (!bres.bundle.files.some((f) => f.path === "data/minecraft/tags/function/load.json")) errors.push("bingo: missing load tag");
if (bres.bundle.files.some((f) => f.path.includes("tags/function/tick.json"))) errors.push("bingo: introduced a tick (should be tick-free!)");
console.log("first 12 lines of check.mcfunction:");
console.log(checkFn?.contents.split("\n").slice(0, 12).join("\n"));

// ---------------------------------------------------------------------------
// Safari Zone
// ---------------------------------------------------------------------------
import { configFromSafariTheme } from "../src/lib/catalog/safariThemes";
import { generateSafari } from "../src/lib/safari/generate";

const safari = configFromSafariTheme("haunted-woods");
const sfres = generateSafari(safari);
console.log("\n=== SAFARI: Haunted Woods ===");
for (const f of sfres.bundle.files) console.log(`[${DATAPACK_KINDS.has(f.kind) ? "datapack" : "side-car"}] ${f.path}`);
console.log("validation ok:", sfres.validation.ok);
if (!sfres.validation.ok) errors.push("safari: invalid datapack");
for (const f of sfres.bundle.files) {
  if (f.path.endsWith(".json")) { try { JSON.parse(f.contents); } catch { errors.push(`safari: bad json ${f.path}`); } }
}
// spawns carry the biome condition — exclusive (default) ties them to the custom arena biome
const gastly = sfres.bundle.files.find((f) => f.path.endsWith("spawn_pool_world/gastly.json"));
if (gastly && !/"biomes"\s*:\s*\[\s*"haunted_woods_safari:zone_biome"/.test(gastly.contents)) errors.push("safari: exclusive spawn not conditioned to the custom biome");
// entry ticket: advancement + give + enter
if (!sfres.bundle.files.some((f) => f.path.endsWith("/advancement/use_haunted_woods_safari.json"))) errors.push("safari: missing ticket advancement");
const enterFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/enter_haunted_woods_safari.mcfunction"));
if (!enterFn || !enterFn.contents.includes("Welcome to the")) errors.push("safari: missing/empty enter function");
const giveTicket = sfres.bundle.files.find((f) => /give_.*_ticket\.mcfunction$/.test(f.path));
if (!giveTicket || !/give @s minecraft:name_tag\[.*safari:"haunted_woods_safari"/.test(giveTicket.contents)) errors.push("safari: ticket give command wrong");
// reward objective advancement (catch ghost)
const rewardAdv = sfres.bundle.files.find((f) => f.path.endsWith("/advancement/bounty_1.json"));
if (rewardAdv) {
  const d = JSON.parse(rewardAdv.contents);
  if (d.criteria?.done?.conditions?.type !== "ghost") errors.push("safari: reward objective wrong type");
}
// side-cars present
for (const p of ["safari_rules.txt", "npc_dialogue.txt", "sign_text.txt", "discord_announcement.md", "admin_checklist.txt"]) {
  if (!sfres.bundle.files.some((f) => f.path === p)) errors.push(`safari: missing side-car ${p}`);
}
// arena dimension: exclusive (default) => custom biome source; entered with VANILLA teleports
const dim = sfres.bundle.files.find((f) => f.path.endsWith("/dimension/zone.json"));
if (!dim) errors.push("safari: missing arena dimension");
if (dim) {
  const d = JSON.parse(dim.contents);
  if (d.generator?.biome_source?.type !== "minecraft:fixed" || d.generator?.biome_source?.biome !== "haunted_woods_safari:zone_biome")
    errors.push("safari: exclusive arena should use the custom biome source");
}
// exclusive custom biome: copies the dark_forest LOOK (effects + vegetation) but has
// every vanilla mob spawner empty
const zoneBiome = sfres.bundle.files.find((f) => f.path.endsWith("/worldgen/biome/zone_biome.json"));
if (!zoneBiome) errors.push("safari: missing custom arena biome");
else {
  const zb = JSON.parse(zoneBiome.contents);
  const cats = Object.values(zb.spawners ?? {});
  if (!cats.length || cats.some((c) => Array.isArray(c) && c.length > 0))
    errors.push("safari: arena biome should spawn no vanilla mobs");
  if (zb.effects?.grass_color_modifier !== "dark_forest") errors.push("safari: arena biome didn't copy the dark_forest effects");
  if (!Array.isArray(zb.features) || !zb.features.some((step: unknown[]) => Array.isArray(step) && step.length > 0))
    errors.push("safari: arena biome didn't copy the biome's vegetation features");
}
// Resource World commands can't run from functions — none should appear anywhere
if (sfres.bundle.files.some((f) => /\bresourceworld\b/.test(f.contents))) errors.push("safari: must not use resourceworld commands");
if (sfres.bundle.files.some((f) => f.path.endsWith("/function/create_arena.mcfunction"))) errors.push("safari: stray create_arena function");
// non-exclusive falls back to the themed vanilla biome + spawn tags, and emits no custom biome
const themed = generateSafari({ ...safari, arena: { ...safari.arena, exclusive: false } });
const tdim = themed.bundle.files.find((f) => f.path.endsWith("/dimension/zone.json"));
if (!tdim || JSON.parse(tdim.contents).generator?.biome_source?.biome !== "minecraft:dark_forest")
  errors.push("safari: non-exclusive single-biome wrong biome source");
if (themed.bundle.files.some((f) => f.path.endsWith("/worldgen/biome/zone_biome.json"))) errors.push("safari: custom biome present when not exclusive");
const themedGastly = themed.bundle.files.find((f) => f.path.endsWith("spawn_pool_world/gastly.json"));
if (themedGastly && !/"biomes"\s*:\s*\[\s*"#minecraft:is_forest"/.test(themedGastly.contents))
  errors.push("safari: non-exclusive spawn missing the themed biome tag");
// mirror mode (non-exclusive) still emits a dimension as a normal multi_noise overworld
const mirrorMode = generateSafari({ ...safari, arena: { ...safari.arena, mode: "mirror", exclusive: false } });
const mdim = mirrorMode.bundle.files.find((f) => f.path.endsWith("/dimension/zone.json"));
if (!mdim || JSON.parse(mdim.contents).generator?.biome_source?.type !== "minecraft:multi_noise")
  errors.push("safari: mirror mode should emit a multi_noise dimension");
const uninstall = sfres.bundle.files.find((f) => f.path.endsWith("/function/uninstall.mcfunction"));
if (!uninstall || !/scoreboard players reset @a safari_time/.test(uninstall.contents)) errors.push("safari: uninstall doesn't reset timer scores");
// warp IN: enter captures the entry point, then calls warp_<slug> (spreadplayers in the arena dim)
if (enterFn && !/function haunted_woods_safari:warp_haunted_woods_safari/.test(enterFn.contents)) errors.push("safari: enter doesn't warp into arena");
if (enterFn && !/store result score @s safari_ret_x run data get entity @s Pos\[0\]/.test(enterFn.contents)) errors.push("safari: enter doesn't capture the return point");
const warpFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/warp_haunted_woods_safari.mcfunction"));
if (!warpFn || !/execute in haunted_woods_safari:zone run spreadplayers .* @s/.test(warpFn.contents)) errors.push("safari: warp doesn't spreadplayers into the arena dim");
// entry kit: 30 safari balls
if (enterFn && !/give @s cobblemon:safari_ball 30/.test(enterFn.contents)) errors.push("safari: enter doesn't give 30 safari balls");
// timer: enter sets 1800s + starts loop; tick warns at 900/300/60 + sends home; load creates objective
if (enterFn && !/scoreboard players set @s safari_time 1800/.test(enterFn.contents)) errors.push("safari: timer not started on enter (1800s)");
if (enterFn && !/schedule function haunted_woods_safari:safari_tick 1s replace/.test(enterFn.contents)) errors.push("safari: loop not scheduled on enter");
const tickFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/safari_tick.mcfunction"));
if (!tickFn) errors.push("safari: missing safari_tick");
if (tickFn) {
  for (const s of [900, 300, 60]) if (!new RegExp(`safari_time=${s}\\}`).test(tickFn.contents)) errors.push(`safari: missing ${s}s warning`);
  if (!/safari_time=0\}.*run function haunted_woods_safari:safari_home/.test(tickFn.contents)) errors.push("safari: tick doesn't send expired players home");
  if (!/schedule function haunted_woods_safari:safari_tick 1s replace/.test(tickFn.contents)) errors.push("safari: tick doesn't keep the loop alive");
}
// warp BACK: safari_home -> return_<slug> -> do_return macro tp to captured overworld coords
const homeFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/safari_home.mcfunction"));
if (!homeFn || !/function haunted_woods_safari:return_haunted_woods_safari/.test(homeFn.contents)) errors.push("safari: safari_home doesn't return the player");
const retFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/do_return_haunted_woods_safari.mcfunction"));
if (!retFn || !/\$execute in minecraft:overworld run tp @s \$\(x\) \$\(y\) \$\(z\)/.test(retFn.contents)) errors.push("safari: do_return macro tp wrong");
const loadFnS = sfres.bundle.files.find((f) => f.path.endsWith("/function/load.mcfunction"));
if (!loadFnS || !/scoreboard objectives add safari_time dummy/.test(loadFnS.contents)) errors.push("safari: load doesn't create the timer objective");
if (!loadFnS || !/scoreboard objectives add safari_ret_x dummy/.test(loadFnS.contents)) errors.push("safari: load doesn't create the return objective");
if (!sfres.bundle.files.some((f) => f.path === "data/minecraft/tags/function/load.json")) errors.push("safari: missing load tag");
// on-screen boss bar (default on): enter creates a per-player bar, tick refreshes it, home removes it
if (enterFn && !/function haunted_woods_safari:bar_create_haunted_woods_safari with storage/.test(enterFn.contents))
  errors.push("safari: enter doesn't create the boss bar");
if (tickFn && !/function haunted_woods_safari:bar_update_haunted_woods_safari/.test(tickFn.contents))
  errors.push("safari: tick doesn't refresh the boss bar");
if (homeFn && !/function haunted_woods_safari:bar_remove_haunted_woods_safari/.test(homeFn.contents))
  errors.push("safari: home doesn't remove the boss bar");
const barApply = sfres.bundle.files.find((f) => f.path.endsWith("/function/bar_apply_haunted_woods_safari.mcfunction"));
if (!barApply || !/\$bossbar set haunted_woods_safari:t\$\(id\) value \$\(secs\)/.test(barApply.contents))
  errors.push("safari: bar_apply macro doesn't set the per-player bar value");
if (loadFnS && !/scoreboard objectives add safari_bar dummy/.test(loadFnS.contents)) errors.push("safari: load doesn't create the bar id objective");
// opt-out: timer.bossbar === false drops all bar plumbing
const noBar = generateSafari({ ...safari, timer: { ...safari.timer, bossbar: false } });
if (noBar.bundle.files.some((f) => /\/function\/bar_(create|update|apply|remove|delete)_/.test(f.path)))
  errors.push("safari: bar functions present when bossbar disabled");
if (noBar.bundle.files.some((f) => /\bbossbar\b/.test(f.contents))) errors.push("safari: bossbar commands present when disabled");
// leave-early item (default on): given on entry, advancement reward exits via a non-op function
if (enterFn && !/give @s minecraft:clock\[.*safari:"haunted_woods_safari_leave"/.test(enterFn.contents))
  errors.push("safari: enter doesn't hand out the leave-early item");
const leaveAdv = sfres.bundle.files.find((f) => f.path.endsWith("/advancement/use_haunted_woods_safari_leave.json"));
if (!leaveAdv) errors.push("safari: missing leave-early advancement");
else {
  const d = JSON.parse(leaveAdv.contents);
  if (d.criteria?.used?.trigger !== "minecraft:consume_item") errors.push("safari: leave advancement wrong trigger");
  if (String(d.rewards?.function) !== "haunted_woods_safari:leave_haunted_woods_safari") errors.push("safari: leave advancement wrong reward");
}
const leaveFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/leave_haunted_woods_safari.mcfunction"));
if (!leaveFn || !/execute if score @s safari_time matches 1\.\. run function haunted_woods_safari:do_leave_haunted_woods_safari/.test(leaveFn.contents))
  errors.push("safari: leave function doesn't guard on an active session");
if (leaveFn && !/advancement revoke @s only haunted_woods_safari:use_haunted_woods_safari_leave/.test(leaveFn.contents))
  errors.push("safari: leave function doesn't re-arm its advancement");
const doLeaveFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/do_leave_haunted_woods_safari.mcfunction"));
if (!doLeaveFn || !/function haunted_woods_safari:return_haunted_woods_safari/.test(doLeaveFn.contents))
  errors.push("safari: do_leave doesn't return the player home");
const leaveClear = /clear @s minecraft:clock\[minecraft:custom_data=\{safari:"haunted_woods_safari_leave"\}\]/;
if (!doLeaveFn || !leaveClear.test(doLeaveFn.contents)) errors.push("safari: do_leave doesn't reclaim the leave item");
if (homeFn && !leaveClear.test(homeFn.contents)) errors.push("safari: timer home doesn't reclaim the leave item");
// opt-out: leaveEarly === false drops the item + its functions
const noLeave = generateSafari({ ...safari, leaveEarly: false });
if (noLeave.bundle.files.some((f) => /\/function\/(leave|do_leave)_/.test(f.path) || /_leave\.json$/.test(f.path)))
  errors.push("safari: leave functions present when leaveEarly disabled");
if (noLeave.bundle.files.some((f) => /minecraft:clock\[/.test(f.contents))) errors.push("safari: leave item present when leaveEarly disabled");
console.log("\n=== safari_tick ===");
console.log(tickFn?.contents);
// arena disabled => no dimension / warp / return
const noArena = generateSafari({ ...safari, arena: { ...safari.arena, enabled: false } });
if (noArena.bundle.files.some((f) => f.path.endsWith("/dimension/zone.json"))) errors.push("safari: dimension present when arena disabled");
if (noArena.bundle.files.some((f) => /spreadplayers|:warp_/.test(f.contents))) errors.push("safari: warp present when arena disabled");

console.log("\n=== enter function ===");
console.log(enterFn?.contents);
console.log("=== warp function ===");
console.log(warpFn?.contents);

if (errors.length) {
  console.error("\nSMOKE FAILED:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("\nSMOKE OK ✅");
