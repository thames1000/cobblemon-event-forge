import type { GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { SafariConfig } from "./types";
import { findSafariTheme } from "../catalog/safariThemes";
import { findSpecies } from "../catalog/pokemon";
import { describeReward } from "../reward/actions";

function emoji(config: SafariConfig): string {
  return findSafariTheme(config.themeId)?.emoji ?? "🏕️";
}
function monName(id: string): string {
  return findSpecies(id)?.name ?? id;
}
function tierList(ids: string[]): string {
  return ids.map(monName).join(", ") || "—";
}

/** safari_rules.txt — the player-facing rules board. */
export function buildRulesBoard(config: SafariConfig): GeneratedFile {
  const L = [
    `${emoji(config)} ${config.title.toUpperCase()}`,
    "=".repeat(40),
    config.blurb,
    "",
    "RULES",
  ];
  config.rules.forEach((r) => L.push(`  • ${r}`));
  L.push("", `Time limit: ${config.timeLimitMinutes} minutes per entry.`, "");
  L.push("ENCOUNTERS");
  L.push(`  Common:     ${tierList(config.common)}`);
  L.push(`  Rare:       ${tierList(config.rare)}`);
  L.push(`  Ultra-Rare: ${tierList(config.ultraRare)}`);
  L.push("");
  return { path: "safari_rules.txt", contents: L.join("\n") + "\n", kind: "readme", label: "safari_rules.txt" };
}

/** npc_dialogue.txt — greeting lines for a ranger NPC / book. */
export function buildNpcDialogue(config: SafariConfig): GeneratedFile {
  const ranger = "Ranger";
  const L = [
    `# NPC dialogue for the ${config.title} entrance`,
    "",
    `${ranger}: Welcome, trainer! This is the ${config.title}.`,
    `${ranger}: ${config.blurb}`,
    `${ranger}: You'll have ${config.timeLimitMinutes} minutes once you enter — make them count.`,
    `${ranger}: Keep an eye out for rare ones: ${tierList(config.rare)}.`,
    config.ultraRare.length ? `${ranger}: And if you're very lucky... ${tierList(config.ultraRare)} has been spotted here.` : "",
    `${ranger}: Remember the rules: ${config.rules.join("; ")}.`,
    `${ranger}: Good luck out there!`,
  ].filter(Boolean);
  return { path: "npc_dialogue.txt", contents: L.join("\n") + "\n", kind: "readme", label: "npc_dialogue.txt" };
}

/** sign_text.txt — 4-line entrance sign. */
export function buildSignText(config: SafariConfig): GeneratedFile {
  const lines = [`${emoji(config)} ${config.title}`, "— ENTER —", `${config.timeLimitMinutes} min limit`, "Use your ticket"];
  const L = ["Entrance sign (4 lines):", "", ...lines.map((l, i) => `  Line ${i + 1}: ${l}`), ""];
  return { path: "sign_text.txt", contents: L.join("\n") + "\n", kind: "readme", label: "sign_text.txt" };
}

/** discord_announcement.md — ready to paste. */
export function buildSafariDiscord(config: SafariConfig): GeneratedFile {
  const L = [`# ${emoji(config)} ${config.title}`, "", `> ${config.blurb}`, ""];
  L.push("## Encounters");
  L.push(`- **Common:** ${tierList(config.common)}`);
  if (config.rare.length) L.push(`- **Rare:** ${tierList(config.rare)}`);
  if (config.ultraRare.length) L.push(`- **Ultra-Rare:** ${tierList(config.ultraRare)}`);
  L.push("");
  L.push("## Rules");
  config.rules.forEach((r) => L.push(`- ${r}`));
  L.push("");
  if (config.reward.enabled) {
    const typeStr = config.reward.type === "any" ? "Pokémon" : `${config.reward.type}-type`;
    L.push("## Reward");
    L.push(`Catch **${config.reward.count} ${typeStr}** in the zone → ${config.reward.rewards.map(describeReward).join(", ")}`);
    L.push("");
  }
  L.push("———");
  L.push(`*Grab a ticket and step inside. The zone is only open for the weekend!* ${emoji(config)}`);
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord_announcement.md" };
}

/** admin_checklist.txt — setup & teardown runbook. */
export function buildSafariChecklist(opts: {
  config: SafariConfig;
  namespace: string;
  slug: string;
  datapackFileName: string;
  validation: ValidationResult;
}): GeneratedFile {
  const { config, namespace, slug } = opts;
  const L = [`ADMIN CHECKLIST — ${config.title}`, "=".repeat(40), ""];

  L.push("VALIDATION");
  if (opts.validation.ok && opts.validation.issues.length === 0) L.push("  [ok] No problems found.");
  else {
    if (opts.validation.ok) L.push("  [ok] No blocking errors.");
    else L.push("  [!!] ERRORS present — fix before uploading.");
    for (const i of opts.validation.issues) L.push(`  [${i.severity === "error" ? "!!" : "->"}] ${i.message}${i.path ? ` (${i.path})` : ""}`);
  }
  L.push("");

  L.push("SETUP");
  L.push(`  1. Upload ${opts.datapackFileName} to <server>/world/datapacks/ and run /reload.`);
  L.push(`  2. Confirm with /datapack list — you should see "${namespace}".`);
  if (config.biomes.length) L.push(`  3. Spawns are restricted to: ${config.biomes.join(", ")}. Host the safari there.`);
  else L.push(`  3. Spawns are NOT biome-restricted — they can appear anywhere overworld.`);
  L.push(`  4. Post discord_announcement.md, place sign_text.txt at the entrance, and set up an NPC with npc_dialogue.txt.`);
  L.push("");

  if (config.ticket.enabled) {
    L.push("ENTRY TICKETS");
    L.push(`  - Give a player a ticket: /execute as <player> run function ${namespace}:give_${slug}_ticket`);
    L.push(`  - They right-click & hold it to "enter" (it greets them and states the rules).`);
    L.push("");
  }
  if (config.reward.enabled) {
    L.push("REWARD");
    L.push(`  - Catching the target is tracked automatically and rewards the player in-game.`);
    L.push("");
  }

  L.push("TEARDOWN");
  L.push(`  1. Run /function ${namespace}:uninstall (if present), then remove the datapack and /reload.`);
  L.push(`  2. The zone's spawns stop immediately on reload.`);
  L.push("");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}
