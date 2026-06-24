import type { Bundle, GeneratedFile } from "../datapack/types";
import { toPortableEscalation } from "./portable";
import type { ValidationResult } from "../datapack/validate";
import type { EscalationConfig, EscalationStage } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { compileRewardLines } from "../reward/actions";
import { findTrigger } from "../objective/triggers";

export interface EscalationResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

const OBJ = "esc"; // shared dummy objective for #stage / #prog / #init

function fn(ns: string, name: string, lines: string[]): GeneratedFile {
  return { path: `data/${ns}/function/${name}.mcfunction`, contents: lines.join("\n") + "\n", kind: "function", label: `${name}.mcfunction` };
}
function adv(ns: string, name: string, doc: object): GeneratedFile {
  return { path: `data/${ns}/advancement/${name}.json`, contents: JSON.stringify(doc, null, 2), kind: "advancement", label: `${name} advancement` };
}

/** Count-LESS advancement conditions for a stage's goal trigger (type only for catch). */
function goalConditions(stage: EscalationStage): Record<string, unknown> {
  const t = findTrigger(stage.goalTrigger);
  return t?.usesType && stage.goalType !== "any" ? { type: stage.goalType } : {};
}

/** Human goal phrase, e.g. "Catch 25 ghost-type Pokémon" / "Win 15 battles". */
export function describeGoal(stage: EscalationStage): string {
  const t = findTrigger(stage.goalTrigger);
  const verb = t?.label ?? "Do";
  const typeStr = t?.usesType && stage.goalType !== "any" ? ` ${stage.goalType}-type` : "";
  return `${verb} ×${stage.goalCount}${typeStr}`;
}

export function generateEscalation(config: EscalationConfig): EscalationResult {
  const slug = toId(config.title || "escalation");
  const ns = toNamespace(config.title || "escalation");
  const bar = `${ns}:progress`;
  const stages = config.stages;
  const N = stages.length;
  const files: GeneratedFile[] = [];

  files.push(buildPackMeta({ description: `${config.title} — escalating event, by Cobbleverse Event Forge`, packFormat: config.packFormat }));

  // ---- enter_<k>: become stage k (1-based), reset progress, fire effects ----
  stages.forEach((stage, idx) => {
    const k = idx + 1;
    const terminal = k === N;
    const L: string[] = [`# Enter stage ${k}/${N}: ${stage.label}`];
    L.push(`scoreboard players set #stage ${OBJ} ${k}`);
    L.push(`scoreboard players set #prog ${OBJ} 0`);
    if (config.progressBar) {
      if (terminal) {
        L.push(`bossbar set ${bar} visible false`);
      } else {
        L.push(`bossbar set ${bar} name ${JSON.stringify([{ text: `${stage.label} `, color: "light_purple" }, { text: `— ${describeGoal(stage)} (stage ${k}/${N})`, color: "gray" }])}`);
        L.push(`bossbar set ${bar} max ${Math.max(1, stage.goalCount)}`);
        L.push(`bossbar set ${bar} value 0`);
        L.push(`bossbar set ${bar} color purple`);
        L.push(`bossbar set ${bar} players @a`);
        L.push(`bossbar set ${bar} visible true`);
      }
    }
    if (stage.announce.trim()) {
      if (stage.bigTitle) {
        L.push(`title @a title ${JSON.stringify({ text: stage.announce, color: "light_purple" })}`);
      } else {
        L.push(`tellraw @a ${JSON.stringify([{ text: "✦ ", color: "light_purple" }, { text: stage.announce, color: "white" }])}`);
      }
    }
    const effectLines = compileRewardLines(stage.effects, { packFormat: config.packFormat });
    if (effectLines.length) {
      // effects apply to every online player (spawns land at each player's feet)
      L.push(`execute as @a at @s run function ${ns}:grant_${k}`);
      files.push(fn(ns, `grant_${k}`, [`# Stage ${k} effects, applied to each online player.`, ...effectLines]));
    }
    files.push(fn(ns, `enter_${k}`, L));
  });

  // ---- contribution detection for each non-terminal stage ----
  stages.slice(0, Math.max(0, N - 1)).forEach((stage, idx) => {
    const n = idx + 1;
    const t = findTrigger(stage.goalTrigger);
    if (!t) return;
    files.push(adv(ns, `contrib_${n}`, { criteria: { did: { trigger: t.id, conditions: goalConditions(stage) } }, requirements: [["did"]], rewards: { function: `${ns}:contribute_${n}` } }));
    const L: string[] = [
      `# Counts toward stage ${n}'s goal (${describeGoal(stage)}), server-wide.`,
      `advancement revoke @s only ${ns}:contrib_${n}`,
      `execute unless score #stage ${OBJ} matches ${n} run return 0`,
      `scoreboard players add #prog ${OBJ} 1`,
    ];
    if (config.progressBar) L.push(`execute store result bossbar ${bar} value run scoreboard players get #prog ${OBJ}`);
    L.push(`execute if score #prog ${OBJ} matches ${Math.max(1, stage.goalCount)}.. run function ${ns}:enter_${n + 1}`);
    files.push(fn(ns, `contribute_${n}`, L));
  });

  // ---- start / lifecycle ----
  const start: string[] = [`# Begin the event at stage 1 (runs once; the load guard stops re-runs on /reload).`, `scoreboard players set #init ${OBJ} 1`];
  if (config.progressBar) start.push(`bossbar add ${bar} ${JSON.stringify([{ text: config.title }])}`);
  start.push(`function ${ns}:enter_1`);
  files.push(fn(ns, "start", start));

  files.push(fn(ns, "load", [`# Load setup for: ${config.title}`, `scoreboard objectives add ${OBJ} dummy`, `execute unless score #init ${OBJ} matches 1 run function ${ns}:start`]));
  files.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });

  // status (admin): print where the story is right now
  files.push(
    fn(ns, "status", [
      `# Print the current stage + progress to chat.`,
      `tellraw @a [{"text":"${config.title} — stage ","color":"gold"},{"score":{"name":"#stage","objective":"${OBJ}"},"color":"yellow"},{"text":"/${N}","color":"gold"}]`,
      `tellraw @a [{"text":"Progress this stage: ","color":"gray"},{"score":{"name":"#prog","objective":"${OBJ}"},"color":"white"}]`,
      ...(config.progressBar ? [`bossbar set ${bar} players @a`] : []),
    ]),
  );

  // force_advance (admin): jump to the next stage regardless of progress
  const fa: string[] = [`# Admin: skip ahead to the next stage.`];
  for (let n = 1; n < N; n++) fa.push(`execute if score #stage ${OBJ} matches ${n} run function ${ns}:enter_${n + 1}`);
  files.push(fn(ns, "force_advance", fa));

  // restart (admin): wipe progress and replay from stage 1
  const restart: string[] = [`# Admin: restart the whole story from stage 1.`];
  if (config.progressBar) restart.push(`bossbar remove ${bar}`);
  restart.push(`function ${ns}:start`);
  files.push(fn(ns, "restart", restart));

  const uninstall: string[] = [`# Uninstall: ${config.title}`, `# Run /function ${ns}:uninstall, then delete the datapack .zip.`];
  if (config.progressBar) uninstall.push(`bossbar remove ${bar}`);
  uninstall.push(`scoreboard objectives remove ${OBJ}`);
  uninstall.push(`tellraw @a {"text":"${config.title} ended — safe to remove the datapack.","color":"gray"}`);
  files.push(fn(ns, "uninstall", uninstall));

  // ---- side-cars ----
  files.push(buildOutline(config, slug));
  files.push(buildChecklist(config, ns, slug));
  files.push(buildDiscord(config));
  // re-importable snapshot of this event — drop it back into the page to edit/re-run later
  files.push({ path: "escalation_config.json", contents: toPortableEscalation(config), kind: "readme", label: "escalation_config.json" });

  const validation = validateDatapack(files);
  const bundle: Bundle = { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files };
  return { bundle, validation, datapackFileName: `${slug}.zip` };
}

function buildOutline(config: EscalationConfig, slug: string): GeneratedFile {
  const L: string[] = [];
  L.push(`STORY OUTLINE — ${config.title}`);
  L.push("=".repeat(44));
  config.stages.forEach((s, i) => {
    const k = i + 1;
    const terminal = k === config.stages.length;
    L.push(`STAGE ${k}: ${s.label}${terminal ? "  (finale)" : ""}`);
    if (s.announce.trim()) L.push(`  says: ${s.bigTitle ? "[big title] " : ""}${s.announce.trim()}`);
    if (s.effects.length) L.push(`  effects: ${s.effects.length} (applied to everyone online on entry)`);
    if (!terminal) L.push(`  advance when (server-wide): ${describeGoal(s)}`);
    L.push("");
  });
  L.push(`Slug: ${slug}`);
  return { path: "story_outline.txt", contents: L.join("\n") + "\n", kind: "readme", label: "story_outline.txt" };
}

function buildChecklist(config: EscalationConfig, ns: string, slug: string): GeneratedFile {
  const L: string[] = [];
  L.push(`ADMIN CHECKLIST — ${config.title} (Escalation)`);
  L.push("=".repeat(44));
  L.push("SETUP");
  L.push(`  1. Upload ${slug}.zip to <server>/world/datapacks/`);
  L.push(`  2. /reload  — the story starts automatically at stage 1.`);
  L.push("");
  L.push("HOW IT WORKS");
  L.push("  The WHOLE server contributes toward each stage's goal. When the goal is");
  L.push("  met, the next stage announces itself and its effects fire for everyone.");
  L.push(`  ${config.progressBar ? "A boss bar shows live progress toward the current goal." : "(progress bar disabled)"}`);
  L.push("");
  L.push("ADMIN COMMANDS");
  L.push(`  Where are we?      /function ${ns}:status`);
  L.push(`  Skip a stage:      /function ${ns}:force_advance`);
  L.push(`  Restart the story: /function ${ns}:restart`);
  L.push("");
  L.push("END THE EVENT");
  L.push(`  /function ${ns}:uninstall  →  remove ${slug}.zip  →  /reload`);
  L.push("");
  L.push("NOTE: progress is global (a fake-player score), so it survives /reload.");
  L.push("Use restart to wipe it and replay from the top.");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}

function buildDiscord(config: EscalationConfig): GeneratedFile {
  const L: string[] = [];
  L.push(`# ✦ ${config.title}`);
  L.push("");
  if (config.blurb.trim()) L.push(`> ${config.blurb.trim()}`);
  L.push("");
  L.push(`A **${config.stages.length}-stage** server-wide event — the whole server pushes it forward, and it escalates as you go. No spoilers… you'll see when it happens. 👀`);
  L.push("");
  L.push("Get online and start hunting.");
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord_announcement.md" };
}
