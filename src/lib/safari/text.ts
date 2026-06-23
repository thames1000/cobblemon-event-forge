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
  if (config.safariBalls > 0) {
    L.push(`**🎁 On entry:** ${Math.round(config.safariBalls)} free Safari Balls (1.5× catch rate)!`);
    L.push("");
  }
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
  let s = 1;
  L.push(`  ${s++}. Upload ${opts.datapackFileName} to <server>/world/datapacks/.`);
  if (config.arena.enabled && config.arena.mode === "single-biome") {
    L.push(`  ${s++}. RESTART the server (full stop/start — NOT /reload). The single-biome`);
    L.push(`        arena dimension ${namespace}:zone only registers on restart; create_arena`);
    L.push(`        (next step) mirrors it, so run that AFTER the restart.`);
  } else {
    L.push(`  ${s++}. Run /reload (or restart).`);
  }
  L.push(`  ${s++}. Confirm with /datapack list — you should see "${namespace}".`);
  if (config.arena.enabled) {
    L.push(`  ${s++}. Create the arena world ONCE (mirrors ${namespace}:zone, inheriting the`);
    L.push(`        exclusive biome) — needs the Resource World mod:`);
    L.push(`           /function ${namespace}:create_arena`);
    L.push(`        Tickets then warp players IN with vanilla teleports (no op level); the zone`);
    L.push(`        AUTO-RESETS via the mod the moment the last player leaves.`);
    if (config.arena.exclusive !== false) {
      L.push(`        EXCLUSIVE SPAWNS: the arena uses a custom biome, so ONLY your selected`);
      L.push(`        Pokémon spawn there (no default Cobblemon spawns, no vanilla mobs).`);
    }
  } else if (config.biomes.length) {
    L.push(`  ${s++}. Spawns are restricted to: ${config.biomes.join(", ")}. Host the safari there.`);
  } else {
    L.push(`  ${s++}. Spawns are NOT biome-restricted — they can appear anywhere overworld.`);
  }
  L.push(`  ${s++}. Post discord_announcement.md, place sign_text.txt at the entrance, and set up an NPC with npc_dialogue.txt.`);
  L.push("");

  if (config.ticket.enabled) {
    L.push("ENTRY TICKETS");
    L.push(`  - Give a player a ticket: /execute as <player> run function ${namespace}:give_${slug}_ticket`);
    L.push(`  - They right-click & hold it to "enter" (greets them, ${config.arena.enabled ? "warps them in, " : ""}states the rules).`);
    if (config.safariBalls > 0) {
      L.push(`  - On entry they get ${Math.round(config.safariBalls)} Safari Balls (1.5x catch rate — the in-zone catch boost).`);
    }
    L.push("");
  }
  if (config.timer.enabled) {
    const warns = [...config.timer.warnings].filter((m) => m > 0 && m < config.timeLimitMinutes).sort((a, b) => b - a);
    L.push("TIMER (enforced)");
    L.push(`  - On entry a ${config.timeLimitMinutes}-minute countdown starts.`);
    if (config.timer.bossbar !== false)
      L.push(`  - A boss bar at the top of the player's screen shows their time left (M:SS), no client mod needed.`);
    if (warns.length) L.push(`  - Warnings (with a sound) at: ${warns.map((m) => `${m} min`).join(", ")} remaining.`);
    L.push(`  - At 0 the player is returned to exactly where they entered from, automatically.`);
    L.push(`  - Runs as a 1-second loop that only ticks while someone is inside.`);
    L.push("");
  }
  if (config.leaveEarly !== false && config.ticket.enabled && (config.arena.enabled || config.timer.enabled)) {
    L.push("LEAVE EARLY");
    L.push(`  - On entry players also get a one-use "Leave ${config.title}" clock.`);
    L.push(`  - Right-click & hold it to exit early — returns them home and ends their timer.`);
    L.push(`  - Works for non-op players (advancement reward function, no permissions needed).`);
    L.push("");
  }
  if (config.reward.enabled) {
    L.push("REWARD");
    L.push(`  - Catching the target is tracked automatically and rewards the player in-game.`);
    L.push("");
  }

  L.push("TEARDOWN");
  const hasUninstall = config.arena.enabled || config.timer.enabled;
  if (hasUninstall) {
    L.push(`  1. Run /function ${namespace}:uninstall — clears scores${config.arena.enabled ? " and DELETES the resource world" : ""}.`);
    if (config.arena.enabled) {
      L.push(`        Make sure no players are inside the arena first (the timer returns them).`);
      L.push(`        Reset anytime WITHOUT a restart by emptying the zone — it auto-wipes — or`);
      L.push(`        run /function ${namespace}:reset_zone_${slug} (resourceworld reset) yourself.`);
    }
    L.push(`  2. Remove the datapack and /reload. Spawns stop immediately.`);
  } else {
    L.push(`  1. Remove the datapack and /reload. The zone's spawns stop immediately.`);
  }
  L.push("");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}
