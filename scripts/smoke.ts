import { configFromPreset } from "../src/lib/catalog/eventTypes";
import { generateEvent } from "../src/lib/event/generate";
import { validateDatapack } from "../src/lib/datapack/validate";
import { DATAPACK_KINDS } from "../src/lib/datapack/types";
import { newObjective } from "../src/lib/objective/types";

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
cfg.rewards = [
  { itemId: "cobblemon:bottle_cap", count: 1 },
  { itemId: "cobblemon:ultra_ball", count: 10 },
  { itemId: "cobbledollars", count: 5000 },
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

// Assertions
const errors: string[] = [];
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
if (!bundle.files.some((f) => f.path.endsWith("summon_zapdos.mcfunction"))) errors.push("legendary: missing summon function");
console.log("\n=== sample: advancement ===");
console.log(adv?.contents);
console.log("\n=== sample: summon function ===");
console.log(bundle.files.find((f) => f.path.endsWith("summon_zapdos.mcfunction"))?.contents);

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
  if (!fnB1.contents.includes("spawnpokemon pikachu level=25")) errors.push("objective: spawn reward missing");
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
  if (doc.criteria?.used?.conditions?.item?.predicates?.["minecraft:custom_data"]?.cobble_crate !== "safari_crate")
    errors.push("crate key: custom_data predicate not wired");
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

if (errors.length) {
  console.error("\nSMOKE FAILED:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("\nSMOKE OK ✅");
