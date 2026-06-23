import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { LeaderboardConfig } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";

export interface LeaderboardResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

function fn(ns: string, name: string, lines: string[]): GeneratedFile {
  return { path: `data/${ns}/function/${name}.mcfunction`, contents: lines.join("\n") + "\n", kind: "function", label: `${name}.mcfunction` };
}
function adv(ns: string, name: string, doc: object): GeneratedFile {
  return { path: `data/${ns}/advancement/${name}.json`, contents: JSON.stringify(doc, null, 2), kind: "advancement", label: `${name} advancement` };
}

/** Positive, whole, de-duplicated, ascending; falls back to [1]. */
function cleanAmounts(amounts: number[]): number[] {
  const set = Array.from(new Set(amounts.filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.floor(n)))).sort((a, b) => a - b);
  return set.length ? set : [1];
}

export function generateLeaderboard(config: LeaderboardConfig): LeaderboardResult {
  const slug = toId(config.title || "leaderboard");
  const ns = toNamespace(config.title || "leaderboard");
  const obj = (config.objective.trim() ? toId(config.objective.trim()) : slug).slice(0, 40);
  const unit = config.unit.trim() || "points";
  const sidebarTitle = config.sidebarTitle.trim() || config.title || "Leaderboard";
  const amounts = cleanAmounts(config.amounts);
  const top = Math.max(1, Math.min(25, Math.round(config.top)));
  const files: GeneratedFile[] = [];

  files.push(buildPackMeta({ description: `${config.title} — leaderboard, by Cobbleverse Event Forge`, packFormat: config.packFormat }));

  // ---- admin scoring functions (under score/) ----
  for (const n of amounts) {
    files.push(fn(ns, `score/add_${n}`, [`# +${n} to the runner's score. Run: /execute as <player> run function ${ns}:score/add_${n}`, `scoreboard players add @s ${obj} ${n}`]));
    files.push(fn(ns, `score/take_${n}`, [`# -${n} from the runner's score.`, `scoreboard players remove @s ${obj} ${n}`]));
  }
  files.push(fn(ns, "score/reset_player", [`# Reset the runner's score to 0. Run: /execute as <player> run function ${ns}:score/reset_player`, `scoreboard players set @s ${obj} 0`]));
  files.push(fn(ns, "score/reset_all", [`# Reset EVERY online player's score to 0.`, `scoreboard players set @a ${obj} 0`, `tellraw @a {"text":"${sidebarTitle}: scores reset.","color":"gray"}`]));
  files.push(
    fn(ns, "score/show", [
      `# Broadcast the standings to chat. The sidebar is the live, auto-sorted ranking;`,
      `# this dump is unsorted (vanilla can't sort in a function without a tick).`,
      `tellraw @a {"text":"━━ ${sidebarTitle} ━━","color":"gold"}`,
      `execute as @a run tellraw @a [{"selector":"@s","color":"yellow"},{"text":": ","color":"gray"},{"score":{"name":"@s","objective":"${obj}"},"color":"white"},{"text":" ${unit}","color":"gray"}]`,
    ]),
  );

  // ---- optional auto-scoring (count-less, self-re-arming advancements) ----
  const autoFn = (name: string, trigger: string, conditions: object, amount: number, note: string) => {
    files.push(adv(ns, name, { criteria: { hit: { trigger, conditions } }, requirements: [["hit"]], rewards: { function: `${ns}:${name}` } }));
    files.push(fn(ns, name, [`# ${note}`, `advancement revoke @s only ${ns}:${name}`, `scoreboard players add @s ${obj} ${amount}`]));
  };
  if (config.autoCatch.enabled) autoFn("auto_catch", "cobblemon:catch_pokemon", config.autoCatch.type !== "any" ? { type: config.autoCatch.type } : {}, config.autoCatch.amount, `+${config.autoCatch.amount} per ${config.autoCatch.type === "any" ? "" : config.autoCatch.type + "-type "}catch`);
  if (config.autoBattle.enabled) autoFn("auto_battle", "cobblemon:battles_won", {}, config.autoBattle.amount, `+${config.autoBattle.amount} per battle won`);
  if (config.autoShiny.enabled) autoFn("auto_shiny", "cobblemon:catch_shiny_pokemon", {}, config.autoShiny.amount, `+${config.autoShiny.amount} per shiny caught`);

  // ---- lifecycle ----
  const load: string[] = [`# Load setup for: ${config.title}`, `scoreboard objectives add ${obj} dummy ${JSON.stringify([{ text: sidebarTitle, color: "gold" }])}`];
  if (config.sidebar) load.push(`scoreboard objectives setdisplay sidebar ${obj}`);
  files.push(fn(ns, "load", load));
  files.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });

  const uninstall: string[] = [`# Uninstall: ${config.title}`, `# Run /function ${ns}:uninstall, then delete the datapack .zip.`];
  if (config.sidebar) uninstall.push(`scoreboard objectives setdisplay sidebar`);
  uninstall.push(`scoreboard objectives remove ${obj}`);
  uninstall.push(`tellraw @a {"text":"${config.title} leaderboard uninstalled — safe to remove the datapack.","color":"gray"}`);
  files.push(fn(ns, "uninstall", uninstall));

  // ---- side-cars ----
  files.push(buildCommandsRef(config, ns, slug, obj, unit, amounts));
  files.push(buildTemplate(config, sidebarTitle, unit, top));
  files.push(buildJson(config, obj, unit, top));
  files.push(buildChecklist(config, ns, slug, obj, amounts));

  const validation = validateDatapack(files);
  const bundle: Bundle = { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files };
  return { bundle, validation, datapackFileName: `${slug}.zip` };
}

function autoSummary(config: LeaderboardConfig): string[] {
  const out: string[] = [];
  if (config.autoCatch.enabled) out.push(`+${config.autoCatch.amount} per ${config.autoCatch.type === "any" ? "" : config.autoCatch.type + "-type "}catch`);
  if (config.autoBattle.enabled) out.push(`+${config.autoBattle.amount} per battle won`);
  if (config.autoShiny.enabled) out.push(`+${config.autoShiny.amount} per shiny caught`);
  return out;
}

function buildCommandsRef(config: LeaderboardConfig, ns: string, slug: string, obj: string, unit: string, amounts: number[]): GeneratedFile {
  const L: string[] = [];
  L.push(`${config.title.toUpperCase()} — SCORE COMMANDS`);
  L.push("=".repeat(40));
  L.push(`Objective: ${obj}   (unit: ${unit})`);
  L.push("");
  L.push("ADD / REMOVE (run against a player):");
  for (const n of amounts) {
    L.push(`  +${n}:  /execute as <player> run function ${ns}:score/add_${n}`);
    L.push(`  -${n}:  /execute as <player> run function ${ns}:score/take_${n}`);
  }
  L.push("");
  L.push("RESET:");
  L.push(`  one player:  /execute as <player> run function ${ns}:score/reset_player`);
  L.push(`  everyone:    /function ${ns}:score/reset_all`);
  L.push("");
  L.push("SHOW STANDINGS (to chat):");
  L.push(`  /function ${ns}:score/show`);
  L.push("");
  const auto = autoSummary(config);
  if (auto.length) {
    L.push("AUTO-SCORING (no commands needed):");
    for (const a of auto) L.push(`  - ${a}`);
    L.push("");
  }
  L.push("Tip: the live ranking is the sidebar (auto-sorted high→low). You can also");
  L.push(`set any score directly:  /scoreboard players set <player> ${obj} <value>`);
  return { path: "score_commands.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "score_commands.txt" };
}

function buildTemplate(config: LeaderboardConfig, sidebarTitle: string, unit: string, top: number): GeneratedFile {
  const medals = ["🥇", "🥈", "🥉"];
  const L: string[] = [];
  L.push(`# 🏆 ${sidebarTitle} — Results`);
  L.push("");
  if (config.title.trim()) L.push(`_${config.title.trim()}_`);
  L.push("");
  L.push(`| Rank | Player | ${unit} |`);
  L.push(`|------|--------|--------|`);
  for (let i = 0; i < top; i++) {
    const rank = i < 3 ? `${medals[i]} ${i + 1}` : `${i + 1}`;
    L.push(`| ${rank} |  |  |`);
  }
  L.push("");
  L.push("Fill in from the in-game sidebar (sorted high→low) or `/function …:score/show`.");
  return { path: "leaderboard_template.md", contents: L.join("\n") + "\n", kind: "discord", label: "leaderboard_template.md" };
}

function buildJson(config: LeaderboardConfig, obj: string, unit: string, top: number): GeneratedFile {
  const standings = Array.from({ length: top }, (_, i) => ({ rank: i + 1, player: "", [unit]: 0 }));
  const doc = { title: config.title, objective: obj, unit, generated: "fill in the standings from the in-game sidebar", standings };
  return { path: "leaderboard.json", contents: JSON.stringify(doc, null, 2) + "\n", kind: "readme", label: "leaderboard.json" };
}

function buildChecklist(config: LeaderboardConfig, ns: string, slug: string, obj: string, amounts: number[]): GeneratedFile {
  const L: string[] = [];
  L.push(`ADMIN CHECKLIST — ${config.title} (Leaderboard)`);
  L.push("=".repeat(44));
  L.push("SETUP");
  L.push(`  1. Upload ${slug}.zip to <server>/world/datapacks/`);
  L.push(`  2. /reload  (creates the "${obj}" objective${config.sidebar ? " + shows the sidebar" : ""})`);
  L.push("");
  L.push("DURING THE EVENT");
  if (autoSummary(config).length) {
    L.push("  - Scores update automatically:");
    for (const a of autoSummary(config)) L.push(`      ${a}`);
    L.push("  - You can still adjust by hand:");
  } else {
    L.push("  - Award points by hand, e.g.:");
  }
  L.push(`      /execute as <player> run function ${ns}:score/add_${amounts[0]}`);
  L.push(`  - Show standings:  /function ${ns}:score/show`);
  L.push("  (full command list: score_commands.txt)");
  L.push("");
  L.push("END THE EVENT");
  L.push(`  1. Screenshot the sidebar or run /function ${ns}:score/show`);
  L.push("  2. Post results with leaderboard_template.md");
  L.push(`  3. Tear down:  /function ${ns}:uninstall  →  remove ${slug}.zip  →  /reload`);
  L.push("");
  L.push("NOTE: only one datapack can own the sidebar at a time. If another pack");
  L.push("(e.g. a Team vs Team event) also uses the sidebar, expect them to clash.");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}
