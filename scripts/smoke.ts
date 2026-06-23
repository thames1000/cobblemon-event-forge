import { configFromPreset } from "../src/lib/catalog/eventTypes";
import { generateEvent } from "../src/lib/event/generate";
import { validateDatapack } from "../src/lib/datapack/validate";
import { DATAPACK_KINDS } from "../src/lib/datapack/types";
import { newObjective } from "../src/lib/objective/types";
import { POKEMON, findSpecies } from "../src/lib/catalog/pokemon";
import { generateBattleFactory } from "../src/lib/battle/generate";
import type { BattleConfig } from "../src/lib/battle/types";
import { generateBattleTower } from "../src/lib/battle/tower";
import type { TowerConfig } from "../src/lib/battle/tower";
import { generateBountyBoard } from "../src/lib/bounty/generate";
import { newCommunityGoal } from "../src/lib/bounty/types";
import type { BountyConfig } from "../src/lib/bounty/types";
import { generateItems, giveCommand } from "../src/lib/item/generate";
import { newItem, NO_FORMAT } from "../src/lib/item/types";
import type { ItemConfig } from "../src/lib/item/types";
import { generateQuestline } from "../src/lib/quest/generate";
import { newQuest, newTask } from "../src/lib/quest/types";
import type { QuestConfig } from "../src/lib/quest/types";

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
  { id: "participation", name: "Participation", award: "participation", actions: [{ kind: "item", itemId: "cobblemon:poke_ball", count: 5 }] },
  {
    id: "winner",
    name: "Winner",
    award: "completion-each",
    actions: [
      { kind: "item", itemId: "cobblemon:bottle_cap", count: 1 },
      { kind: "command", command: "cobbledollars give @s 5000" },
    ],
  },
  {
    id: "champion",
    name: "Champion",
    award: "completion-first",
    actions: [
      { kind: "spawn", species: "rayquaza", level: 70 },
      { kind: "item", itemId: "obc:bottle_cap_gold", count: 1 },
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
if (winnerFn && !winnerFn.contents.includes("cobbledollars give @s 5000")) errors.push("tiers: winner currency command missing");

// --- reward tiers auto-grant on completion (the reported bug) ---
const ns = bundle.namespace;
// a spawn placed in a TIER must be positioned at the player, same as a bounty spawn
const champFn = bundle.files.find((f) => f.path.endsWith("/function/reward_champion.mcfunction"));
if (!champFn) errors.push("tiers: missing champion fn");
if (champFn && !/execute at @s run spawnpokemonat ~ ~ ~ rayquaza level=70/.test(champFn.contents))
  errors.push("tiers: champion spawn reward not positioned at the player (would never spawn — the reported bug)");
// check_complete fires the tiers once all auto objectives are done
const checkC = bundle.files.find((f) => f.path.endsWith("/function/check_complete.mcfunction"));
if (!checkC) errors.push("tiers: missing check_complete (tiers would never auto-fire)");
if (checkC) {
  if (!/execute unless score @s \w+_prog matches 1\.\. run return 0/.test(checkC.contents)) errors.push("tiers: check_complete missing the all-objectives guard");
  if (!/execute if score @s \w+_won matches 1 run return 0/.test(checkC.contents)) errors.push("tiers: check_complete missing the once-per-player guard");
  if (!/scoreboard players set @s \w+_won 1/.test(checkC.contents)) errors.push("tiers: check_complete doesn't mark the player done");
  if (!checkC.contents.includes(`function ${ns}:reward_winner`)) errors.push("tiers: check_complete doesn't grant the Winner tier to each completer");
  if (!/execute if score #\w+_champ cobble_events matches 1 run return 0/.test(checkC.contents)) errors.push("tiers: check_complete missing the first-only Champion guard");
  if (!checkC.contents.includes(`function ${ns}:reward_champion`)) errors.push("tiers: check_complete doesn't grant the Champion tier");
}
// the auto objective bumps progress and runs the check
const fnBounty1 = bundle.files.find((f) => f.path.endsWith("/function/bounty_1.mcfunction"));
if (fnBounty1 && !/scoreboard players add @s \w+_prog 1/.test(fnBounty1.contents)) errors.push("tiers: auto objective doesn't count toward completion");
if (fnBounty1 && !fnBounty1.contents.includes(`function ${ns}:check_complete`)) errors.push("tiers: auto objective doesn't trigger the completion check");
// load sets up the completion scoreboards + champion guard; uninstall grants participation then cleans up
const loadC = bundle.files.find((f) => f.path.endsWith("/function/load.mcfunction"));
if (loadC && !/scoreboard objectives add \w+_prog dummy/.test(loadC.contents)) errors.push("tiers: load doesn't create the progress objective");
if (loadC && !/scoreboard players set #\w+_champ cobble_events 0/.test(loadC.contents)) errors.push("tiers: load doesn't arm the champion guard");
const uninstallC = bundle.files.find((f) => f.path.endsWith("/function/uninstall.mcfunction"));
if (uninstallC && !new RegExp(`execute as @a\\[scores=\\{\\w+_prog=1\\.\\.\\}\\] unless score @s \\w+_won matches 1 run function ${ns}:reward_participation`).test(uninstallC.contents))
  errors.push("tiers: uninstall doesn't grant Participation to non-completers");
if (uninstallC && !/scoreboard objectives remove \w+_prog/.test(uninstallC.contents)) errors.push("tiers: uninstall doesn't clean up the progress objective");

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
// exclusive (default) gates the featured spawns on the resource-world DIMENSION (robust
// against the custom biome not surviving the mod's mirror), not on the biome
const gastly = sfres.bundle.files.find((f) => f.path.endsWith("spawn_pool_world/gastly.json"));
if (gastly && !/"dimensions"\s*:\s*\[\s*"resource_world:haunted_woods_safari"/.test(gastly.contents))
  errors.push("safari: exclusive spawn not conditioned to the arena dimension");
if (gastly && /"biomes"/.test(gastly.contents)) errors.push("safari: exclusive spawn should not use a biome condition");
// entry ticket: advancement + give + enter
if (!sfres.bundle.files.some((f) => f.path.endsWith("/advancement/use_haunted_woods_safari.json"))) errors.push("safari: missing ticket advancement");
const enterFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/enter_haunted_woods_safari.mcfunction"));
if (!enterFn || !enterFn.contents.includes("Welcome to the")) errors.push("safari: missing/empty enter function");
const giveTicket = sfres.bundle.files.find((f) => /give_.*_ticket\.mcfunction$/.test(f.path));
if (!giveTicket || !/give @s minecraft:name_tag\[.*safari:"haunted_woods_safari"/.test(giveTicket.contents)) errors.push("safari: ticket give command wrong");
// per-visit catch bounty: a COUNT-LESS catch advancement (an event, not a cumulative
// milestone) feeds a tick that counts only in-zone catches and re-arms itself
const catchAdv = sfres.bundle.files.find((f) => f.path.endsWith("/advancement/catch_haunted_woods_safari.json"));
if (!catchAdv) errors.push("safari: missing catch-bounty advancement");
else {
  const d = JSON.parse(catchAdv.contents);
  if (d.criteria?.caught?.trigger !== "cobblemon:catch_pokemon") errors.push("safari: catch bounty wrong trigger");
  if (d.criteria?.caught?.conditions?.type !== "ghost") errors.push("safari: catch bounty wrong type");
  if (d.criteria?.caught?.conditions?.count != null) errors.push("safari: catch bounty must be count-less (cumulative count re-fires on revoke)");
}
const catchTick = sfres.bundle.files.find((f) => f.path.endsWith("/function/catch_tick_haunted_woods_safari.mcfunction"));
if (!catchTick || !/tag=haunted_woods_safari_inzone\] run scoreboard players add @s safari_caught 1/.test(catchTick.contents))
  errors.push("safari: catch tick doesn't count in-zone catches");
if (catchTick && !/advancement revoke @s only haunted_woods_safari:catch_haunted_woods_safari/.test(catchTick.contents))
  errors.push("safari: catch tick doesn't re-arm the advancement");
const rewardFn = sfres.bundle.files.find((f) => f.path.endsWith("/function/reward_haunted_woods_safari.mcfunction"));
if (!rewardFn || !/scoreboard players set @s safari_caught 0/.test(rewardFn.contents)) errors.push("safari: reward doesn't reset the per-visit counter");
if (enterFn && !(/scoreboard players set @s safari_caught 0/.test(enterFn.contents) && /advancement revoke @s only haunted_woods_safari:catch_haunted_woods_safari/.test(enterFn.contents)))
  errors.push("safari: enter doesn't arm the catch bounty");
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
// The mod owns the world lifecycle (create/reset) but never the teleport. create_arena
// mirrors :zone into the resettable resource world; reset_zone wipes it live.
const createArena = sfres.bundle.files.find((f) => f.path.endsWith("/function/create_arena.mcfunction"));
if (!createArena || !/resourceworld create haunted_woods_safari mirror haunted_woods_safari:zone/.test(createArena.contents))
  errors.push("safari: create_arena doesn't mirror :zone into the resource world");
const resetZone = sfres.bundle.files.find((f) => f.path.endsWith("/function/reset_zone_haunted_woods_safari.mcfunction"));
if (!resetZone || !/resourceworld reset haunted_woods_safari/.test(resetZone.contents))
  errors.push("safari: reset_zone doesn't run resourceworld reset");
// reset is a MANUAL admin command, guarded so it won't wipe the world while players are inside
if (resetZone && !/unless entity @a\[tag=haunted_woods_safari_inzone\] run resourceworld reset/.test(resetZone.contents))
  errors.push("safari: reset_zone isn't guarded against resetting while occupied");
if (sfres.bundle.files.some((f) => f.path.endsWith("/function/reset_watch_haunted_woods_safari.mcfunction")))
  errors.push("safari: stray auto-reset watcher (reset should be manual)");
// non-exclusive falls back to the themed vanilla biome + spawn tags, and emits no custom biome
const themed = generateSafari({ ...safari, arena: { ...safari.arena, exclusive: false } });
const tdim = themed.bundle.files.find((f) => f.path.endsWith("/dimension/zone.json"));
if (!tdim || JSON.parse(tdim.contents).generator?.biome_source?.biome !== "minecraft:dark_forest")
  errors.push("safari: non-exclusive single-biome wrong biome source");
if (themed.bundle.files.some((f) => f.path.endsWith("/worldgen/biome/zone_biome.json"))) errors.push("safari: custom biome present when not exclusive");
// spawns are never gated by biome or weather (any biome, any weather, always); with an
// arena they're dimension-locked, and the condition must carry no biome/weather keys
const themedGastly = themed.bundle.files.find((f) => f.path.endsWith("spawn_pool_world/gastly.json"));
if (themedGastly && !/"dimensions"\s*:\s*\[\s*"resource_world:haunted_woods_safari"/.test(themedGastly.contents))
  errors.push("safari: spawn not dimension-locked to the arena");
if (themedGastly && /"biomes"|"isRaining"|"isThundering"|"canSeeSky"/.test(themedGastly.contents))
  errors.push("safari: spawn should not be gated by biome or weather");
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
if (!warpFn || !/execute in resource_world:haunted_woods_safari run spreadplayers .* @s/.test(warpFn.contents))
  errors.push("safari: warp doesn't spreadplayers into the resource-world dim");
if (warpFn && /\bresourceworld\b/.test(warpFn.contents)) errors.push("safari: warp must use vanilla tp, not a resourceworld command");
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
// on-screen action-bar timer (default on): tick refreshes it; nothing persistent to clean up
if (tickFn && !/function haunted_woods_safari:hud_update_haunted_woods_safari/.test(tickFn.contents))
  errors.push("safari: tick doesn't refresh the action-bar timer");
if (homeFn && !/tag @s remove haunted_woods_safari_inzone/.test(homeFn.contents))
  errors.push("safari: home doesn't remove the inzone tag");
const hudApply = sfres.bundle.files.find((f) => f.path.endsWith("/function/hud_apply_haunted_woods_safari.mcfunction"));
if (!hudApply || !/\$title @s actionbar /.test(hudApply.contents))
  errors.push("safari: hud_apply macro doesn't write the action bar");
if (loadFnS && !/scoreboard objectives add safari_calc dummy/.test(loadFnS.contents)) errors.push("safari: load doesn't create the timer calc objective");
// the timer loop must be scoped to THIS zone's players so multiple safaris don't cross-talk
if (tickFn && !/tag=haunted_woods_safari_inzone/.test(tickFn.contents)) errors.push("safari: tick not scoped by inzone tag");
// the on-screen timer is a transient action bar — nothing should ever create a saved bossbar
if (sfres.bundle.files.some((f) => /\bbossbar\b/.test(f.contents))) errors.push("safari: uses bossbar (should be a transient action bar)");
// opt-out: timer.hud === false drops the on-screen timer plumbing
const noBar = generateSafari({ ...safari, timer: { ...safari.timer, hud: false } });
if (noBar.bundle.files.some((f) => /\/function\/hud_(update|apply)_/.test(f.path)))
  errors.push("safari: hud functions present when on-screen timer disabled");
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

// === Battle Factory (rental-team generator) ===
const bcfg: BattleConfig = {
  title: "Frontier Factory", format: "singles", level: 50, teamSize: 3, poolSize: 12,
  draftMode: "runtime", theme: "balanced", themeType: "fire", difficulty: "competitive",
  seed: 777, bannedSpecies: [], clauses: ["Species Clause"], draftItem: true, packFormat: 48,
};
const file = (b: ReturnType<typeof generateBattleFactory>, suffix: string) => b.bundle.files.find((f) => f.path.endsWith(suffix));

// --- RUNTIME mode (default): pool baked, team assembled in-game ---
const bf = generateBattleFactory(bcfg);
if (!bf.validation.ok) errors.push("battle: invalid datapack (runtime)");
if (bf.pool.length !== 12) errors.push(`battle: expected 12-set pool, got ${bf.pool.length}`);
if (new Set(bf.pool.map((m) => m.species)).size !== bf.pool.length) errors.push("battle: pool has duplicate species");
if (bf.bundle.files.some((f) => /\/function\/give_team_/.test(f.path))) errors.push("battle: runtime mode should not bake give_team functions");
const bload = file(bf, "/function/load.mcfunction");
if (!bload || !/scoreboard objectives add battle_rng dummy/.test(bload.contents)) errors.push("battle: load doesn't create the rng objective");
if (!bload || !/data modify storage frontier_factory:draft pool set value \[/.test(bload.contents)) errors.push("battle: load doesn't seed the set pool");
const bdr = file(bf, "/function/draft_random.mcfunction");
if (!bdr || !/data modify storage frontier_factory:draft work set from storage frontier_factory:draft pool/.test(bdr.contents)) errors.push("battle: draft_random doesn't copy the pool to a working list");
if (bdr && (bdr.contents.match(/function frontier_factory:draft_pick/g) ?? []).length !== 3) errors.push("battle: draft_random should call draft_pick teamSize (3) times");
const bpick = file(bf, "/function/draft_pick.mcfunction");
if (!bpick || !/execute store result score #len battle_rng run data get storage frontier_factory:draft work/.test(bpick.contents)) errors.push("battle: draft_pick missing the list-length read");
const broll = file(bf, "/function/draft_roll.mcfunction");
if (!broll || !/\$execute store result storage frontier_factory:draft r int 1 run random value 0\.\.\$\(m\)/.test(broll.contents)) errors.push("battle: draft_roll macro malformed");
const bgive = file(bf, "/function/draft_give.mcfunction");
if (!bgive || !/\$givepokemonother @s \$\(set\)/.test(bgive.contents)) errors.push("battle: draft_give macro malformed");
// the baked pool entries are well-formed property strings with verified keys
if (bload && !/"[a-z0-9]+ level=50 nature=\w+ ability=\w+ held_item=cobblemon:\w+ min_perfect_ivs=6 (attack_ev|special_attack_ev)=252/.test(bload.contents))
  errors.push("battle: pooled set string malformed / missing verified property keys");
if (!file(bf, "/advancement/use_frontier_factory_draft.json")) errors.push("battle: missing draft-ticket advancement");
if (!bf.bundle.files.some((f) => f.path === "team_sheets.txt")) errors.push("battle: missing team-sheet sidecar");
// determinism: same seed → identical pool seed line
const bload2 = file(generateBattleFactory(bcfg), "/function/load.mcfunction");
if (bload && bload2 && bload.contents !== bload2.contents) errors.push("battle: generation not deterministic for a fixed seed");
// monotype: every pooled rental shares the type; casual: no EVs / perfect IVs
const bmono = generateBattleFactory({ ...bcfg, theme: "monotype", themeType: "water" });
if (bmono.pool.some((m) => !m.types.includes("water"))) errors.push("battle: monotype pool has off-type mons");
const bcas = generateBattleFactory({ ...bcfg, difficulty: "casual" });
if (bcas.pool.some((m) => m.minPerfectIvs !== 0 || Object.keys(m.evs).length > 0)) errors.push("battle: casual rentals should have no EVs/perfect IVs");
// draftItem off → no ticket plumbing
if (generateBattleFactory({ ...bcfg, draftItem: false }).bundle.files.some((f) => /draft_token|use_frontier_factory_draft|give_draft_ticket/.test(f.path)))
  errors.push("battle: ticket files present when draftItem off");

// --- FIXED mode: pre-built teams; draft picks one ---
const bff = generateBattleFactory({ ...bcfg, draftMode: "fixed", poolSize: 4 });
if (!bff.validation.ok) errors.push("battle: invalid datapack (fixed)");
if (bff.teams.length !== 4 || bff.teams.some((t) => t.mons.length !== 3)) errors.push("battle: fixed mode wrong team shape");
if (bff.teams.some((t) => new Set(t.mons.map((m) => m.species)).size !== t.mons.length)) errors.push("battle: Species Clause violated in a fixed team");
const bg1 = file(bff, "/function/give_team_1.mcfunction");
if (!bg1 || !/givepokemonother @s [a-z0-9]+ level=50 nature=\w+ ability=\w+ held_item=cobblemon:\w+ min_perfect_ivs=6/.test(bg1.contents))
  errors.push("battle: fixed give_team_1 missing a well-formed givepokemonother line");
const bffdraft = file(bff, "/function/draft_random.mcfunction");
if (!bffdraft || !/random value 1\.\.4/.test(bffdraft.contents)) errors.push("battle: fixed draft_random missing the team roll");
if (bff.bundle.files.some((f) => /\/function\/draft_(pick|roll|extract|give)\./.test(f.path))) errors.push("battle: fixed mode should not emit runtime draft macros");
console.log("\n=== battle: runtime draft_random + draft_pick ===");
console.log(bdr?.contents + "\n---\n" + bpick?.contents);

// === NPC Battle Tower (RCT defeat_count ladder) ===
const tcfg: TowerConfig = {
  title: "Sky Tower", floors: 8, scope: "type", trainerType: "NORMAL", trainerIds: [],
  perFloorReward: [{ kind: "item", itemId: "cobblemon:rare_candy", count: 1 }],
  milestones: [{ floor: 5, rewards: [{ kind: "item", itemId: "cobblemon:exp_candy_xl", count: 5 }] }],
  packFormat: 48,
};
const tw = generateBattleTower(tcfg);
if (!tw.validation.ok) errors.push("tower: invalid datapack");
if (tw.floors !== 8) errors.push(`tower: expected 8 floors, got ${tw.floors}`);
const floorAdvs = tw.bundle.files.filter((f) => /\/advancement\/floor_\d+\.json$/.test(f.path));
if (floorAdvs.length !== 8) errors.push(`tower: expected 8 floor advancements, got ${floorAdvs.length}`);
const adv5 = tw.bundle.files.find((f) => f.path.endsWith("/advancement/floor_5.json"));
if (adv5) {
  const d = JSON.parse(adv5.contents);
  if (d.criteria?.cleared?.trigger !== "rctmod:defeat_count") errors.push("tower: floor advancement wrong trigger");
  if (d.criteria?.cleared?.conditions?.count !== 5 || d.criteria?.cleared?.conditions?.trainer_type !== "NORMAL") errors.push("tower: floor 5 conditions wrong");
  if (String(d.rewards?.function) !== "sky_tower:floor_5") errors.push("tower: floor 5 reward fn not wired");
} else errors.push("tower: missing floor_5 advancement");
const tf5 = tw.bundle.files.find((f) => f.path.endsWith("/function/floor_5.mcfunction"));
if (!tf5 || !/scoreboard players set @s tower_rank 5/.test(tf5.contents)) errors.push("tower: floor_5 fn doesn't set rank");
if (!tf5 || !/give @s cobblemon:rare_candy 1/.test(tf5.contents)) errors.push("tower: floor_5 fn missing per-floor reward");
if (!tf5 || !/Milestone bonus/.test(tf5.contents) || !/give @s cobblemon:exp_candy_xl 5/.test(tf5.contents)) errors.push("tower: floor_5 fn missing milestone bonus");
const tf3 = tw.bundle.files.find((f) => f.path.endsWith("/function/floor_3.mcfunction"));
if (tf3 && /Milestone bonus/.test(tf3.contents)) errors.push("tower: non-milestone floor 3 should have no bonus");
const tload = tw.bundle.files.find((f) => f.path.endsWith("/function/load.mcfunction"));
if (!tload || !/scoreboard objectives add tower_rank dummy/.test(tload.contents)) errors.push("tower: load doesn't create the rank objective");
if (!tw.bundle.files.some((f) => f.path === "reward_table.txt")) errors.push("tower: missing reward-table sidecar");
// scope by ids → trainer_ids condition, no trainer_type
const twIds = generateBattleTower({ ...tcfg, scope: "ids", trainerIds: ["leader_brock_019e", "rival_gary_001"] });
const idAdv = twIds.bundle.files.find((f) => f.path.endsWith("/advancement/floor_1.json"));
if (idAdv) {
  const c = JSON.parse(idAdv.contents).criteria?.cleared?.conditions;
  if (!Array.isArray(c?.trainer_ids) || c.trainer_type) errors.push("tower: ids scope should use trainer_ids, not trainer_type");
}
console.log("\n=== tower: floor_5 function ===");
console.log(tf5?.contents);

// === Bounty Board ===
const bbcfg: BountyConfig = {
  title: "Weekly Bounties", packFormat: 48, boardItem: true,
  daily: [newObjective("d1", { mode: "auto", triggerId: "cobblemon:catch_pokemon", count: 10, pokemonType: "electric", announce: true, rewards: [{ kind: "item", itemId: "cobblemon:rare_candy", count: 2 }] })],
  weekly: [newObjective("w1", { mode: "auto", triggerId: "cobblemon:battles_won", count: 20, rewards: [{ kind: "item", itemId: "obc:bottle_cap", count: 1 }] })],
  special: [],
  community: [{ ...newCommunityGoal("c1"), label: "Catch a Water-type", count: 1, pokemonType: "water", targetPlayers: 25, rewards: [{ kind: "crate-key", crateName: "Fishing Crate", baseItem: "minecraft:nether_star", glint: true }] }],
};
const bb = generateBountyBoard(bbcfg);
const bbf = (s: string) => bb.bundle.files.find((f) => f.path.endsWith(s));
if (!bb.validation.ok) errors.push("bounty: invalid datapack");
if (bb.bountyCount !== 2) errors.push(`bounty: expected 2 individual bounties, got ${bb.bountyCount}`);
// individual bounties reuse the objective machinery (flat bounty_<n>)
const b1 = bbf("/function/bounty_1.mcfunction");
if (!b1 || !/give @s cobblemon:rare_candy 2/.test(b1.contents)) errors.push("bounty: bounty_1 reward missing");
if (!bbf("/advancement/bounty_1.json")) errors.push("bounty: bounty_1 advancement missing");
// community goal: contribute → guarded complete → grant-to-all
const cAdv = bbf("/advancement/community_1.json");
if (!cAdv || JSON.parse(cAdv.contents).rewards?.function !== "weekly_bounties:community_1_contribute") errors.push("bounty: community advancement not wired");
const cContrib = bbf("/function/community_1_contribute.mcfunction");
if (!cContrib || !/scoreboard players add #c1 bounty_comm 1/.test(cContrib.contents)) errors.push("bounty: community contribute doesn't bump the counter");
if (!cContrib || !/execute if score #c1 bounty_comm matches 25\.\. unless score #d1 bounty_comm matches 1 run function weekly_bounties:community_1_complete/.test(cContrib.contents))
  errors.push("bounty: community contribute missing the guarded completion check");
const cComplete = bbf("/function/community_1_complete.mcfunction");
if (!cComplete || !/scoreboard players set #d1 bounty_comm 1/.test(cComplete.contents) || !/execute as @a run function weekly_bounties:community_1_grant/.test(cComplete.contents))
  errors.push("bounty: community complete doesn't lock + grant to all");
const cGrant = bbf("/function/community_1_grant.mcfunction");
if (!cGrant || !/give @s minecraft:nether_star\[.*cobble_crate:"fishing_crate"/.test(cGrant.contents)) errors.push("bounty: community grant missing the reward");
// load sets up + initializes the community counter
const bbload = bbf("/function/load.mcfunction");
if (!bbload || !/scoreboard objectives add bounty_comm dummy/.test(bbload.contents) || !/scoreboard players set #c1 bounty_comm 0/.test(bbload.contents))
  errors.push("bounty: load doesn't set up the community counter");
// /board shows live community progress via a score component
const board = bbf("/function/board.mcfunction");
if (!board || !/"score":\{"name":"#c1","objective":"bounty_comm"\}/.test(board.contents)) errors.push("bounty: board missing live community progress");
// reusable board item: open shows board, re-gives the item, re-arms
const openB = bbf("/function/open_board.mcfunction");
if (!openB || !/function weekly_bounties:board/.test(openB.contents) || !/give @s minecraft:paper\[/.test(openB.contents) || !/advancement revoke @s only weekly_bounties:use_weekly_bounties_board/.test(openB.contents))
  errors.push("bounty: open_board not reusable (board + re-give + re-arm)");
if (!bbf("/advancement/use_weekly_bounties_board.json")) errors.push("bounty: missing board-item advancement");
if (!bb.bundle.files.some((f) => f.path === "bounties.json")) errors.push("bounty: missing bounties.json sidecar");
// boardItem off → no board-item plumbing
if (generateBountyBoard({ ...bbcfg, boardItem: false }).bundle.files.some((f) => /open_board|give_board|use_weekly_bounties_board/.test(f.path)))
  errors.push("bounty: board-item files present when boardItem off");
console.log("\n=== bounty: board + community_1_contribute ===");
console.log(board?.contents + "\n---\n" + cContrib?.contents);

// === Item Designer ===
const itemcfg: ItemConfig = {
  title: "Event Items", packFormat: 48,
  items: [
    newItem("i1", {
      baseItem: "minecraft:netherite_sword", name: "Champion's Blade", nameColor: "gold", nameFormat: { ...NO_FORMAT, bold: true }, glint: true, rarity: "epic", count: 1,
      lore: [{ text: "Forged for the bold", color: "yellow", format: { ...NO_FORMAT, italic: true } }],
      enchantments: [{ id: "minecraft:sharpness", level: 5 }, { id: "minecraft:unbreaking", level: 3 }],
      attributes: [{ type: "attack_damage", amount: 6, operation: "add_value", slot: "mainhand" }],
      unbreakable: true, customDataKey: "event item", customDataValue: "champion", fireResistant: true, maxStackSize: 1, customModelData: 7,
    }),
    newItem("i2", { baseItem: "minecraft:player_head", name: "Gym Leader", nameColor: "aqua", headOwner: "Notch" }),
    newItem("i3", { baseItem: "minecraft:netherite_sword", name: "Champion's Blade" }), // dup name → distinct file
  ],
};
const items = generateItems(itemcfg);
if (!items.validation.ok) errors.push("item: invalid datapack");
if (items.itemCount !== 3) errors.push(`item: expected 3 items, got ${items.itemCount}`);
const cmd1 = giveCommand(itemcfg.items[0], 48);
if (!/^give @p minecraft:netherite_sword\[/.test(cmd1)) errors.push("item: give target/base wrong");
if (!/minecraft:item_name='\{"text":"Champion\\'s Blade","color":"gold","italic":false,"bold":true\}'/.test(cmd1)) errors.push("item: item_name formatting wrong");
if (!/minecraft:lore=\['\{"text":"Forged for the bold","color":"yellow","italic":true\}'\]/.test(cmd1)) errors.push("item: lore formatting wrong");
if (!/minecraft:enchantments=\{levels:\{"minecraft:sharpness":5,"minecraft:unbreaking":3\}\}/.test(cmd1)) errors.push("item: enchantments component wrong");
if (!/minecraft:rarity="epic"/.test(cmd1) || !/minecraft:enchantment_glint_override=true/.test(cmd1)) errors.push("item: glint/rarity missing");
if (!/minecraft:custom_data=\{event_item:"champion"\}/.test(cmd1)) errors.push("item: custom_data key not sanitized/emitted");
if (!/minecraft:max_stack_size=1/.test(cmd1)) errors.push("item: max_stack_size missing");
// attribute_modifiers: structure + version-aware generic. prefix
if (!/minecraft:attribute_modifiers=\[\{type:"minecraft:generic\.attack_damage",amount:6,operation:"add_value",slot:"mainhand",id:"eventforge:mod_0"\}\]/.test(cmd1))
  errors.push("item: pack-48 attribute should use the generic. prefix + full structure");
if (!/type:"minecraft:attack_damage"/.test(giveCommand(itemcfg.items[0], 57))) errors.push("item: pack-57 attribute should drop the generic. prefix");
// fire_resistant → damage_resistant at 1.21.5 (pack 71)
if (!/minecraft:fire_resistant=\{\}/.test(cmd1)) errors.push("item: pack-48 should use fire_resistant");
if (!/minecraft:damage_resistant=\{types:"#minecraft:is_fire"\}/.test(giveCommand(itemcfg.items[0], 71))) errors.push("item: pack-71 should use damage_resistant");
// version-aware custom_model_data
if (!/minecraft:custom_model_data=7\b/.test(cmd1)) errors.push("item: pack-48 custom_model_data should be an int");
if (!/minecraft:custom_model_data=\{floats:\[7f\]\}/.test(giveCommand(itemcfg.items[0], 61))) errors.push("item: pack-61 custom_model_data should be the floats structure");
// player head profile (only on player_head base)
if (!/minecraft:profile=\{name:"Notch"\}/.test(giveCommand(itemcfg.items[1], 48))) errors.push("item: player_head profile missing");
// no custom_data when key blank (toId fallback bug guard)
if (/custom_data/.test(giveCommand(itemcfg.items[1], 48))) errors.push("item: empty custom_data key should emit nothing");
// datapack give functions, with dedup on duplicate names
const giveFns = items.bundle.files.filter((f) => /\/function\/give_.*\.mcfunction$/.test(f.path));
if (giveFns.length !== 3 || new Set(giveFns.map((f) => f.path)).size !== 3) errors.push("item: give-function dedup failed");
if (!items.bundle.files.some((f) => f.path === "give_commands.txt")) errors.push("item: missing give_commands.txt sidecar");
console.log("\n=== item: give command ===");
console.log("/" + cmd1);

// === Questlines (vanilla advancement tree + FTB Quests chapter) ===
const qcfg: QuestConfig = {
  title: "Pro Research", icon: "cobblemon:poke_ball", packFormat: 48, exportAdvancements: true, exportFtb: true,
  quests: [
    newQuest("q1", { title: "First Catch", description: ["Catch one."], task: newTask({ kind: "objective", triggerId: "cobblemon:catch_pokemon", count: 1 }), rewards: [{ kind: "item", itemId: "cobblemon:poke_ball", count: 5 }], x: 0, y: 0 }),
    newQuest("q2", { title: "Electric Spec", task: newTask({ kind: "objective", count: 10, pokemonType: "electric" }), dependencies: ["q1"], rewards: [{ kind: "spawn", species: "pikachu", level: 25 }], x: 3, y: 0 }),
    newQuest("q3", { title: "Bring a Stone", task: newTask({ kind: "item", itemId: "cobblemon:thunder_stone", itemCount: 1 }), dependencies: ["q1"], rewards: [], x: 3, y: 2 }),
  ],
};
const ql = generateQuestline(qcfg);
const qf = (s: string) => ql.bundle.files.find((f) => f.path.endsWith(s));
if (!ql.validation.ok) errors.push("quest: invalid datapack");
if (ql.questCount !== 3) errors.push(`quest: expected 3 quests, got ${ql.questCount}`);
// vanilla advancement tree: root + per-quest advancement (display+parent+criteria+reward fn)
if (!qf("/advancement/root.json")) errors.push("quest: missing root advancement");
const qa2 = qf("/advancement/q_q2.json");
if (qa2) {
  const d = JSON.parse(qa2.contents);
  if (d.parent !== "pro_research:q_q1") errors.push("quest: q2 parent (branch) wrong");
  if (d.criteria?.done?.trigger !== "cobblemon:catch_pokemon" || d.criteria?.done?.conditions?.type !== "electric") errors.push("quest: q2 criteria wrong");
  if (d.rewards?.function !== "pro_research:q_q2_reward") errors.push("quest: q2 reward fn not wired");
} else errors.push("quest: missing q_q2 advancement");
const qa3 = qf("/advancement/q_q3.json");
if (qa3 && JSON.parse(qa3.contents).criteria?.done?.trigger !== "minecraft:inventory_changed") errors.push("quest: item-task criterion should be inventory_changed");
const qr = qf("/function/q_q2_reward.mcfunction");
if (!qr || !/execute at @s run spawnpokemonat ~ ~ ~ pikachu level=25/.test(qr.contents)) errors.push("quest: reward fn missing positioned spawn");
// FTB chapter: a config/ftbquests .snbt with branching deps + advancement/item tasks + rewards
const snbt = ql.bundle.files.find((f) => f.path === "config/ftbquests/quests/chapters/pro_research.snbt");
if (!snbt) errors.push("quest: missing FTB chapter .snbt at config/ftbquests path");
else {
  const c = snbt.contents;
  if (!/filename: "pro_research"/.test(c) || !/quests: \[/.test(c)) errors.push("quest: FTB chapter header malformed");
  if (!/type: "advancement"/.test(c) || !/advancement: "pro_research:fq_q1"/.test(c)) errors.push("quest: FTB objective task should bridge via advancement");
  if (!/item: "cobblemon:thunder_stone" type: "item"/.test(c)) errors.push("quest: FTB item task malformed");
  if (!/type: "command"/.test(c) || !/spawnpokemonat ~ ~ ~ pikachu/.test(c)) errors.push("quest: FTB spawn reward should be a command reward");
  if (!/dependencies: \["[0-9A-F]{16}"\]/.test(c)) errors.push("quest: FTB branching dependencies missing/!hex");
}
// FTB bridge advancements (silent) for objective tasks only
if (!qf("/advancement/fq_q1.json") || !qf("/advancement/fq_q2.json")) errors.push("quest: missing FTB bridge advancements");
if (qf("/advancement/fq_q3.json")) errors.push("quest: item task should not get an FTB bridge advancement");
// opt-out: FTB off → no .snbt / fq_ advancements
const qNoFtb = generateQuestline({ ...qcfg, exportFtb: false });
if (qNoFtb.bundle.files.some((f) => f.path.endsWith(".snbt") || /\/advancement\/fq_/.test(f.path))) errors.push("quest: FTB files present when exportFtb off");
console.log("\n=== quest: FTB chapter ===");
console.log(snbt?.contents);

if (errors.length) {
  console.error("\nSMOKE FAILED:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("\nSMOKE OK ✅");
