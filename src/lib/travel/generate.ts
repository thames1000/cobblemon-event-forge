import type { Bundle, GeneratedFile } from "../datapack/types";
import { toPortableTravel } from "./portable";
import type { ValidationResult } from "../datapack/validate";
import type { TravelConfig } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";

export interface TravelResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

function fn(ns: string, name: string, lines: string[]): GeneratedFile {
  return { path: `data/${ns}/function/${name}.mcfunction`, contents: lines.join("\n") + "\n", kind: "function", label: `${name}.mcfunction` };
}

/** `effect give @s …` lines for the arrival/rescue protection. */
function effectLines(c: TravelConfig, opts?: { rescue?: boolean }): string[] {
  const secs = Math.max(1, Math.round(c.arrival.seconds));
  const out: string[] = [];
  // rescue always protects hard; arrival uses the configured toggles
  if (opts?.rescue) {
    out.push(`effect give @s minecraft:resistance 15 4 true`);
    out.push(`effect give @s minecraft:slow_falling 15 0 true`);
    return out;
  }
  if (c.arrival.resistance) out.push(`effect give @s minecraft:resistance ${secs} 2 true`);
  if (c.arrival.slowFalling) out.push(`effect give @s minecraft:slow_falling ${secs} 0 true`);
  return out;
}

function tpToDest(c: TravelConfig): string {
  if (c.spread) {
    const r = Math.max(1, Math.round(c.spreadRadius));
    return `execute in ${c.destDimension} run spreadplayers ${c.destX} ${c.destZ} 0 ${r} false @s`;
  }
  return `execute in ${c.destDimension} run tp @s ${c.destX} ${c.destY} ${c.destZ}`;
}

export function generateTravel(config: TravelConfig): TravelResult {
  const slug = toId(config.title || "travel");
  const ns = toNamespace(config.title || "travel");
  const capture = config.returnMode === "capture";
  const awayTag = `${slug}_away`;
  const files: GeneratedFile[] = [];

  files.push(buildPackMeta({ description: `${config.title} — safe travel, by Cobbleverse Event Forge`, packFormat: config.packFormat }));

  // ---- travel/enter ----
  const enter: string[] = [`# Send the runner to the destination (safely).`];
  if (capture) {
    enter.push(`# remember where they came from so travel/exit can return them`);
    enter.push(`execute store result score @s tv_x run data get entity @s Pos[0]`);
    enter.push(`execute store result score @s tv_y run data get entity @s Pos[1]`);
    enter.push(`execute store result score @s tv_z run data get entity @s Pos[2]`);
  }
  enter.push(`tag @s add ${awayTag}`);
  enter.push(tpToDest(config));
  enter.push(...effectLines(config)); // applied after tp → effect follows the player
  enter.push(`tellraw @s {"text":"Travelling… hold tight.","color":"aqua"}`);
  files.push(fn(ns, "travel/enter", enter));

  // ---- travel/exit ----
  const exit: string[] = [`# Return the runner home.`, `tag @s remove ${awayTag}`];
  if (capture) {
    exit.push(`# read the remembered point into storage and macro-tp back`);
    exit.push(`execute store result storage ${ns}:travel x int 1 run scoreboard players get @s tv_x`);
    exit.push(`execute store result storage ${ns}:travel y int 1 run scoreboard players get @s tv_y`);
    exit.push(`execute store result storage ${ns}:travel z int 1 run scoreboard players get @s tv_z`);
    exit.push(`function ${ns}:travel/do_return with storage ${ns}:travel`);
    files.push(fn(ns, "travel/do_return", [`# Macro: tp back to the captured overworld point.`, `$execute in ${config.homeDimension} run tp @s $(x) $(y) $(z)`]));
  } else {
    exit.push(`execute in ${config.homeDimension} run tp @s ${config.homeX} ${config.homeY} ${config.homeZ}`);
  }
  exit.push(...effectLines(config)); // slow-fall on the way back too, just in case
  exit.push(`tellraw @s {"text":"Welcome back.","color":"aqua"}`);
  files.push(fn(ns, "travel/exit", exit));

  // ---- travel/rescue ----
  files.push(
    fn(ns, "travel/rescue", [
      `# Unstick a player from ANYWHERE: protect them and move them to the safe home pad.`,
      ...effectLines(config, { rescue: true }),
      `tag @s remove ${awayTag}`,
      `execute in ${config.homeDimension} run tp @s ${config.homeX} ${config.homeY} ${config.homeZ}`,
      `tellraw @s {"text":"Rescued — you've been moved to safety.","color":"green"}`,
    ]),
  );

  // ---- optional travel item ----
  if (config.giveTravelItem) {
    const giveLine = usableGiveCommand({
      baseItem: config.travelItemBase,
      name: `Travel: ${config.title}`,
      nameColor: "aqua",
      lore: `Right-click & hold to travel`,
      glint: true,
      consumeSeconds: 1,
      dataKey: "tv_travel",
      dataValue: slug,
      packFormat: config.packFormat,
    });
    files.push(fn(ns, "give_travel_item", [`# Hand the runner a reusable travel item.`, giveLine]));
    files.push({ path: `data/${ns}/advancement/use_travel.json`, contents: JSON.stringify(consumeAdvancement({ baseItem: config.travelItemBase, dataKey: "tv_travel", dataValue: slug, rewardFunctionId: `${ns}:travel_use` }), null, 2), kind: "advancement", label: "use_travel advancement" });
    files.push(fn(ns, "travel_use", [`# Travel item used → re-arm, travel, and hand the item back (reusable).`, `advancement revoke @s only ${ns}:use_travel`, `function ${ns}:travel/enter`, giveLine]));
  }

  // ---- lifecycle ----
  const load: string[] = [`# Load setup for: ${config.title}`];
  if (capture) load.push(`scoreboard objectives add tv_x dummy`, `scoreboard objectives add tv_y dummy`, `scoreboard objectives add tv_z dummy`);
  if (config.forceload) {
    load.push(`# keep the destination pad chunk generated + loaded so nobody lands in unloaded terrain`);
    load.push(`execute in ${config.destDimension} run forceload add ${config.destX} ${config.destZ}`);
  }
  if (load.length === 1) load.push(`# (nothing to set up)`);
  files.push(fn(ns, "load", load));
  files.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });

  const uninstall: string[] = [`# Uninstall: ${config.title}`, `# Run /function ${ns}:uninstall, then delete the datapack .zip.`];
  if (config.forceload) uninstall.push(`execute in ${config.destDimension} run forceload remove ${config.destX} ${config.destZ}`);
  if (capture) uninstall.push(`scoreboard objectives remove tv_x`, `scoreboard objectives remove tv_y`, `scoreboard objectives remove tv_z`);
  if (config.giveTravelItem) uninstall.push(`clear @a ${config.travelItemBase}[minecraft:custom_data={tv_travel:"${slug}"}]`);
  uninstall.push(`tellraw @a {"text":"${config.title} travel removed — safe to delete the datapack.","color":"gray"}`);
  files.push(fn(ns, "uninstall", uninstall));

  files.push(buildChecklist(config, ns, slug));
  // re-importable snapshot of this travel pack — drop it back into the page to edit/re-run later
  files.push({ path: "travel_config.json", contents: toPortableTravel(config), kind: "readme", label: "travel_config.json" });

  const validation = validateDatapack(files);
  const bundle: Bundle = { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files };
  return { bundle, validation, datapackFileName: `${slug}.zip` };
}

function buildChecklist(config: TravelConfig, ns: string, slug: string): GeneratedFile {
  const L: string[] = [];
  L.push(`ADMIN CHECKLIST — ${config.title} (Travel helper)`);
  L.push("=".repeat(46));
  L.push("SETUP");
  L.push(`  1. Upload ${slug}.zip to <server>/world/datapacks/`);
  L.push(`  2. /reload`);
  if (config.forceload) L.push(`     (the destination pad at ${config.destX} ${config.destZ} in ${config.destDimension} is force-loaded)`);
  L.push("");
  L.push("DESTINATION");
  L.push(`  ${config.destDimension} @ ${config.destX} ${config.destY} ${config.destZ}${config.spread ? `  (spread ±${config.spreadRadius})` : ""}`);
  L.push(`  Return: ${config.returnMode === "capture" ? "back to where each player entered from" : `${config.homeDimension} @ ${config.homeX} ${config.homeY} ${config.homeZ}`}`);
  L.push(`  Rescue/safe pad: ${config.homeDimension} @ ${config.homeX} ${config.homeY} ${config.homeZ}`);
  L.push("");
  L.push("MOVING PLAYERS");
  if (config.giveTravelItem) {
    L.push(`  Give the travel item:  /execute as @a run function ${ns}:give_travel_item`);
    L.push(`  Players right-click-hold it to travel (it's reusable).`);
  }
  L.push(`  Send a specific player:  /execute as <player> run function ${ns}:travel/enter`);
  L.push(`  Bring them back:         /execute as <player> run function ${ns}:travel/exit`);
  L.push("");
  L.push("IF SOMEONE GETS STUCK (void / unloaded chunk / desync)");
  L.push(`  /execute as <player> run function ${ns}:travel/rescue`);
  L.push("  → gives Resistance + Slow Falling and tps them to the safe home pad.");
  L.push("");
  L.push("TEARDOWN");
  L.push(`  /function ${ns}:uninstall  →  remove ${slug}.zip  →  /reload`);
  if (config.forceload) L.push("  (uninstall releases the force-loaded chunk)");
  L.push("");
  L.push("TIP: arrival gives Slow Falling/Resistance so nobody takes fall or");
  L.push("suffocation damage while the destination chunks finish loading.");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}
