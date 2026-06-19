import type { GeneratedFile } from "../datapack/types";
import type { LegendaryTrigger } from "./types";
import { toId } from "../datapack/sanitize";
import { findSpecies } from "../catalog/pokemon";
import { EVENT_OBJECTIVE, enabledFlag, legendFlag } from "./lifecycle";

function titleCase(id: string): string {
  const known = findSpecies(id);
  if (known) return known.name;
  return id
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Build the "catch N of a type → auto-spawn a legendary" mechanic as datapack
 * files:
 *
 *  - data/<ns>/advancement/<name>.json   — silent cobblemon:catch_pokemon trigger
 *  - data/<ns>/function/summon_<mon>.mcfunction — reward fn that runs /spawnpokemon
 *
 * For "server-wide" scope the summon function uses a scoreboard guard so only
 * the first finisher spawns the legendary. The objective and its reset live in
 * the centralized load function (see lifecycle.ts), so this module only emits the
 * advancement and the summon function.
 *
 * The advancement has no `display` block, so it's invisible (no toast, hidden
 * from the advancements screen) — purely a counter. The reward function runs as
 * the triggering player at their position, so the legendary appears next to them.
 */
export function buildLegendaryFiles(opts: {
  namespace: string;
  eventSlug: string;
  trigger: LegendaryTrigger;
  /** When true, the summon is gated by the pack's enable/disable flag. */
  enableFlag: boolean;
}): GeneratedFile[] {
  const { trigger } = opts;
  if (!trigger.enabled || trigger.legendary.trim() === "") return [];

  const ns = opts.namespace;
  const legendary = toId(trigger.legendary);
  const typeId = trigger.type === "any" ? "any" : toId(trigger.type);
  const count = Math.max(1, Math.round(trigger.count));
  const level = Math.max(1, Math.round(trigger.level));
  const advName = `catch_${count}_${typeId}`;
  const summonFn = `summon_${legendary}`;
  const niceName = titleCase(legendary);

  // --- advancement ---
  const conditions: Record<string, unknown> = { count };
  if (trigger.type !== "any") conditions.type = typeId;
  const advancement = {
    criteria: {
      caught: { trigger: "cobblemon:catch_pokemon", conditions },
    },
    requirements: [["caught"]],
    rewards: { function: `${ns}:${summonFn}` },
  };

  const files: GeneratedFile[] = [
    {
      path: `data/${ns}/advancement/${advName}.json`,
      contents: JSON.stringify(advancement, null, 2),
      kind: "advancement",
      label: `${advName} advancement`,
    },
  ];

  // --- summon function ---
  const slug = toId(opts.eventSlug);
  const typeLabel = trigger.type === "any" ? "Pokémon" : `${typeId}-type Pokémon`;
  const fn: string[] = [];
  fn.push(`# Auto-summon ${niceName} after a player catches ${count} ${typeLabel}.`);
  fn.push(`# Triggered by advancement ${ns}:${advName}; runs as that player, at their location.`);
  if (opts.enableFlag) {
    fn.push(`# stop if the event has been disabled`);
    fn.push(`execute unless score ${enabledFlag(slug)} ${EVENT_OBJECTIVE} matches 1 run return 0`);
  }
  if (trigger.scope === "server-wide") {
    const flag = legendFlag(slug);
    fn.push(`# Server-wide: only the FIRST player to reach the goal spawns it.`);
    fn.push(`execute if score ${flag} ${EVENT_OBJECTIVE} matches 1 run return 0`);
    fn.push(`scoreboard players set ${flag} ${EVENT_OBJECTIVE} 1`);
    fn.push(`spawnpokemon ${legendary} level=${level}`);
    fn.push(`tellraw @a {"text":"⚡ ${niceName} has appeared somewhere in the world!","color":"gold"}`);
  } else {
    fn.push(`spawnpokemon ${legendary} level=${level}`);
    fn.push(`tellraw @s {"text":"Your hunt drew out ${niceName}!","color":"yellow"}`);
  }
  files.push({
    path: `data/${ns}/function/${summonFn}.mcfunction`,
    contents: fn.join("\n") + "\n",
    kind: "function",
    label: `${summonFn}.mcfunction`,
  });

  return files;
}

/** One-line human summary for the checklist / announcement. */
export function legendarySummary(trigger: LegendaryTrigger): string | null {
  if (!trigger.enabled || trigger.legendary.trim() === "") return null;
  const typeLabel = trigger.type === "any" ? "Pokémon" : `${trigger.type}-type`;
  const who = trigger.scope === "server-wide" ? "the first trainer to" : "any trainer who";
  return `Catch ${trigger.count} ${typeLabel} → ${who} reach the goal summons ${titleCase(toId(trigger.legendary))}.`;
}
