import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { MysteryConfig, MysteryStep } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { compileRewardLines } from "../reward/actions";
import { findTrigger } from "../objective/triggers";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";

export interface MysteryResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

const STEP = "myst_step"; // per-player current step (0 = not started, N+1 = done)
const PROG = "myst_prog"; // per-player progress within the current step

function fn(ns: string, name: string, lines: string[]): GeneratedFile {
  return { path: `data/${ns}/function/${name}.mcfunction`, contents: lines.join("\n") + "\n", kind: "function", label: `${name}.mcfunction` };
}
function adv(ns: string, name: string, doc: object): GeneratedFile {
  return { path: `data/${ns}/advancement/${name}.json`, contents: JSON.stringify(doc, null, 2), kind: "advancement", label: `${name} advancement` };
}

/** Count-LESS conditions for a step's task (type only for catch triggers). */
function taskConditions(step: MysteryStep): Record<string, unknown> {
  const t = findTrigger(step.triggerId);
  return t?.usesType && step.pokemonType !== "any" ? { type: step.pokemonType } : {};
}

/** "Catch 5 ghost-type Pokémon" / "Win 5 battles". */
export function describeTask(step: MysteryStep): string {
  const t = findTrigger(step.triggerId);
  const verb = t?.label ?? "Do";
  const typeStr = t?.usesType && step.pokemonType !== "any" ? ` ${step.pokemonType}-type` : "";
  return `${verb} ×${step.count}${typeStr}`;
}

export function generateMystery(config: MysteryConfig): MysteryResult {
  const slug = toId(config.title || "mystery");
  const ns = toNamespace(config.title || "mystery");
  const steps = config.steps;
  const N = steps.length;
  const DONE = N + 1;
  const files: GeneratedFile[] = [];

  files.push(buildPackMeta({ description: `${config.title} — mystery objectives, by Cobbleverse Event Forge`, packFormat: config.packFormat }));

  // ---- clue display per step ----
  steps.forEach((step, idx) => {
    const n = idx + 1;
    const L: string[] = [`# Show the clue for step ${n}/${N}.`];
    L.push(`tellraw @s ["",{"text":"🔮 Clue ${n}/${N}: ","color":"light_purple"},{"text":${JSON.stringify(step.clue || "…")},"color":"gray","italic":true}]`);
    if (config.revealTasks) {
      L.push(`tellraw @s ["",{"text":"   Objective: ","color":"dark_gray"},{"text":"${describeTask(step)} ","color":"dark_gray"},{"text":"(","color":"dark_gray"},{"score":{"name":"@s","objective":"${PROG}"},"color":"dark_gray"},{"text":"/${step.count})","color":"dark_gray"}]`);
    }
    files.push(fn(ns, `clue_${n}`, L));
  });

  // ---- enter_<n>: become step n, reset progress, show its clue ----
  steps.forEach((_step, idx) => {
    const n = idx + 1;
    files.push(fn(ns, `enter_${n}`, [`# Enter step ${n}.`, `scoreboard players set @s ${STEP} ${n}`, `scoreboard players set @s ${PROG} 0`, `function ${ns}:clue_${n}`]));
  });

  // ---- contribution + reveal per step ----
  steps.forEach((step, idx) => {
    const n = idx + 1;
    const t = findTrigger(step.triggerId);
    if (!t) return;
    files.push(adv(ns, `contrib_${n}`, { criteria: { did: { trigger: t.id, conditions: taskConditions(step) } }, requirements: [["did"]], rewards: { function: `${ns}:contribute_${n}` } }));
    files.push(
      fn(ns, `contribute_${n}`, [
        `# Tally toward step ${n}'s hidden task, only while the player is on step ${n}.`,
        `advancement revoke @s only ${ns}:contrib_${n}`,
        `execute unless score @s ${STEP} matches ${n} run return 0`,
        `scoreboard players add @s ${PROG} 1`,
        `execute if score @s ${PROG} matches ${Math.max(1, step.count)}.. run function ${ns}:reveal_${n}`,
      ]),
    );

    const reveal: string[] = [`# Step ${n} solved.`];
    const solved = step.solved.trim() || describeTask(step);
    reveal.push(`tellraw @s ["",{"text":"✓ Solved! ","color":"green"},{"text":${JSON.stringify(solved)},"color":"white"}]`);
    reveal.push(...compileRewardLines(step.reward, { packFormat: config.packFormat }));
    if (n < N) {
      reveal.push(`function ${ns}:enter_${n + 1}`);
    } else {
      reveal.push(`scoreboard players set @s ${STEP} ${DONE}`);
      reveal.push(`tellraw @s ["",{"text":"🏆 ","color":"gold"},{"text":"You've unraveled ${config.title}!","color":"gold"}]`);
      reveal.push(...compileRewardLines(config.finaleReward, { packFormat: config.packFormat }));
    }
    files.push(fn(ns, `reveal_${n}`, reveal));
  });

  // ---- begin / show_clue / clue item ----
  files.push(fn(ns, "begin", [`# Start the mystery at step 1.`, `function ${ns}:enter_1`]));

  const showClue: string[] = [`# Re-show the player's current clue (or a done message).`];
  for (let n = 1; n <= N; n++) showClue.push(`execute if score @s ${STEP} matches ${n} run function ${ns}:clue_${n}`);
  showClue.push(`execute if score @s ${STEP} matches ${DONE}.. run tellraw @s {"text":"You've already solved this mystery.","color":"gray"}`);
  files.push(fn(ns, "show_clue", showClue));

  const giveLine = usableGiveCommand({ baseItem: config.clueItemBase, name: `${config.title} — Clue`, nameColor: "light_purple", lore: `Right-click & hold to read your clue`, glint: true, consumeSeconds: 1, dataKey: "mystery", dataValue: slug, packFormat: config.packFormat });
  files.push(fn(ns, "give_clue_item", [`# Hand the runner the reusable clue item.`, giveLine]));
  files.push(adv(ns, "use_clue", consumeAdvancement({ baseItem: config.clueItemBase, dataKey: "mystery", dataValue: slug, rewardFunctionId: `${ns}:use_clue` })));
  files.push(
    fn(ns, "use_clue", [
      `# Clue item used: start the hunt if new, else re-read the current clue. Reusable.`,
      `advancement revoke @s only ${ns}:use_clue`,
      giveLine,
      `execute unless score @s ${STEP} matches 1.. run function ${ns}:begin`,
      `execute if score @s ${STEP} matches 1.. run function ${ns}:show_clue`,
    ]),
  );

  // ---- admin + lifecycle ----
  files.push(fn(ns, "reset_player", [`# Admin: reset the runner so they can start over.`, `scoreboard players set @s ${STEP} 0`, `scoreboard players set @s ${PROG} 0`, `tellraw @s {"text":"Your mystery progress was reset.","color":"gray"}`]));

  files.push(fn(ns, "load", [`# Load setup for: ${config.title}`, `scoreboard objectives add ${STEP} dummy`, `scoreboard objectives add ${PROG} dummy`]));
  files.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });

  files.push(
    fn(ns, "uninstall", [
      `# Uninstall: ${config.title}`,
      `# Run /function ${ns}:uninstall, then delete the datapack .zip.`,
      `clear @a ${config.clueItemBase}[minecraft:custom_data={mystery:"${slug}"}]`,
      `scoreboard objectives remove ${STEP}`,
      `scoreboard objectives remove ${PROG}`,
      `tellraw @a {"text":"${config.title} removed — safe to delete the datapack.","color":"gray"}`,
    ]),
  );

  // ---- side-cars ----
  files.push(buildOutline(config, slug, ns));
  files.push(buildChecklist(config, ns, slug));
  files.push(buildDiscord(config));

  const validation = validateDatapack(files);
  const bundle: Bundle = { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files };
  return { bundle, validation, datapackFileName: `${slug}.zip` };
}

function buildOutline(config: MysteryConfig, slug: string, ns: string): GeneratedFile {
  const L: string[] = [];
  L.push(`MYSTERY ANSWER KEY — ${config.title}`);
  L.push("=".repeat(46));
  L.push("(For your eyes only — players only ever see the current clue.)");
  L.push("");
  config.steps.forEach((s, i) => {
    L.push(`STEP ${i + 1}`);
    L.push(`  Clue:   ${s.clue || "(none)"}`);
    L.push(`  Task:   ${describeTask(s)}`);
    if (s.solved.trim()) L.push(`  Reveal: ${s.solved.trim()}`);
    L.push("");
  });
  L.push(`Hand out the clue item: /execute as @a run function ${ns}:give_clue_item`);
  L.push(`Slug: ${slug}`);
  return { path: "mystery_outline.txt", contents: L.join("\n") + "\n", kind: "readme", label: "mystery_outline.txt" };
}

function buildChecklist(config: MysteryConfig, ns: string, slug: string): GeneratedFile {
  const L: string[] = [];
  L.push(`ADMIN CHECKLIST — ${config.title} (Mystery)`);
  L.push("=".repeat(44));
  L.push("SETUP");
  L.push(`  1. Upload ${slug}.zip to <server>/world/datapacks/`);
  L.push(`  2. /reload`);
  L.push("");
  L.push("RUN IT");
  L.push(`  Hand out the clue item:  /execute as @a run function ${ns}:give_clue_item`);
  L.push("  Players right-click-hold it to start the hunt and to re-read their current clue.");
  L.push(`  Each player works through ${config.steps.length} steps at their own pace;`);
  L.push("  they only ever see the clue for the step they're on. Completing the hidden");
  L.push("  task reveals it, drops a reward, and unlocks the next clue.");
  L.push("");
  L.push("ADMIN");
  L.push(`  Reset a player:  /execute as <player> run function ${ns}:reset_player`);
  L.push("  Full answer key: mystery_outline.txt");
  L.push("");
  L.push("TEARDOWN");
  L.push(`  /function ${ns}:uninstall  →  remove ${slug}.zip  →  /reload`);
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}

function buildDiscord(config: MysteryConfig): GeneratedFile {
  const L: string[] = [];
  L.push(`# 🔮 ${config.title}`);
  L.push("");
  if (config.blurb.trim()) L.push(`> ${config.blurb.trim()}`);
  L.push("");
  L.push(`A **${config.steps.length}-step** mystery hunt. Grab a clue from an admin and follow the omens — each riddle you solve reveals the next. No spoilers. 👀`);
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord_announcement.md" };
}
