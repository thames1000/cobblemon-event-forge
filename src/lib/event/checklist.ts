import type { GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { EventConfig } from "./types";
import { versionForFormat } from "../datapack/packMeta";
import { toId } from "../datapack/sanitize";
import { buildMotd } from "./discord";
import { legendarySummary } from "./legendary";
import { EVENT_OBJECTIVE, enabledFlag, legendFlag } from "./lifecycle";
import { describeObjective } from "../objective/triggers";

/**
 * admin_checklist.txt — the human runbook. Turns "I generated files" into "here
 * is exactly what to do to make this live on the server", in order. This is the
 * piece that makes the dashboard replace the weekly manual file-editing.
 */
export function buildChecklist(opts: {
  config: EventConfig;
  slug: string;
  namespace: string;
  datapackFileName: string;
  validation: ValidationResult;
}): GeneratedFile {
  const c = opts.config;
  const ver = versionForFormat(c.packFormat);
  const L: string[] = [];

  L.push(`ADMIN CHECKLIST — ${c.title}`);
  L.push("=".repeat(40));
  L.push(`Duration: ${c.duration}`);
  if (ver) L.push(`Target Minecraft: ${ver.mc} (pack_format ${c.packFormat})`);
  L.push("");

  L.push("VALIDATION");
  if (opts.validation.ok && opts.validation.issues.length === 0) {
    L.push("  [ok] No problems found — safe to upload.");
  } else {
    if (opts.validation.ok) L.push("  [ok] No blocking errors.");
    else L.push("  [!!] ERRORS present — fix before uploading (see below).");
    for (const i of opts.validation.issues) {
      L.push(`  [${i.severity === "error" ? "!!" : "->"}] ${i.message}${i.path ? ` (${i.path})` : ""}`);
    }
  }
  L.push("");

  L.push("SETUP STEPS");
  L.push(`  1. Upload ${opts.datapackFileName} to the server's world datapacks folder:`);
  L.push(`        <server>/world/datapacks/${opts.datapackFileName}`);
  L.push(`  2. Run in console:  /reload   (or restart the server)`);
  L.push(`  3. Confirm it loaded:  /datapack list   — you should see "${opts.namespace}".`);
  L.push(`  4. Spawns apply to NEWLY loaded chunks. Fly out / reset spawn-area chunks if needed.`);
  L.push(`  5. Set the MOTD in server.properties:`);
  L.push(`        motd=${buildMotd(c)}`);
  L.push(`  6. Paste discord_announcement.md into your Discord announcements channel.`);
  L.push("");

  const legend = legendarySummary(c.legendaryTrigger);
  if (legend) {
    L.push("LEGENDARY AUTO-SPAWN");
    L.push(`  - ${legend}`);
    L.push(`  - Runs automatically via a Cobblemon catch advancement — no command needed.`);
    if (c.legendaryTrigger.scope === "server-wide") {
      L.push(`  - Server-wide guard auto-resets on /reload. To re-arm it manually:`);
      L.push(`        /scoreboard players set ${legendFlag(opts.slug)} ${EVENT_OBJECTIVE} 0`);
    } else {
      L.push(`  - Per-player: each trainer earns their own once they hit the goal.`);
    }
    L.push("");
  }

  if (c.pack.enableFlag) {
    L.push("ENABLE / DISABLE");
    L.push(`  - Pause this event's summons without removing the pack:`);
    L.push(`        /scoreboard players set ${enabledFlag(opts.slug)} ${EVENT_OBJECTIVE} 0   (disable)`);
    L.push(`        /scoreboard players set ${enabledFlag(opts.slug)} ${EVENT_OBJECTIVE} 1   (enable)`);
    L.push("");
  }

  if (c.objectives.length) {
    L.push("BOUNTIES");
    c.objectives.forEach((o, i) => {
      const n = i + 1;
      if (o.mode === "auto") {
        L.push(`  - [auto] ${describeObjective(o)} — tracked in-game, rewards automatically.`);
      } else if (o.rewards.length) {
        L.push(`  - [manual] ${describeObjective(o)} — grant with:`);
        L.push(`        /execute as <player> run function ${opts.namespace}:bounty_${n}`);
      } else {
        L.push(`  - [manual] ${describeObjective(o)} — (no datapack reward; award by hand)`);
      }
    });
    L.push("");
  }

  const tiers = c.rewardTiers.filter((t) => t.actions.length);
  if (tiers.length) {
    L.push("REWARD TIERS");
    for (const t of tiers) {
      L.push(`  - ${t.name}: /execute as <player> run function ${opts.namespace}:reward_${toId(t.id || t.name)}`);
    }
    L.push(`  - Currency lines assume CobbleDollars — verify the command matches your economy mod.`);
    L.push("");
  }

  L.push("TEARDOWN (after the event)");
  let step = 1;
  if (c.pack.includeUninstall) {
    L.push(`  ${step++}. Run /function ${opts.namespace}:uninstall   (clears this event's scores).`);
  }
  L.push(`  ${step++}. Remove ${opts.datapackFileName} from the datapacks folder.`);
  L.push(`  ${step++}. Run /reload (or restart) so the temporary spawns stop.`);
  L.push(`  ${step++}. Post results / leaderboard in Discord.`);
  L.push("");

  return {
    path: "admin_checklist.txt",
    contents: L.join("\n") + "\n",
    kind: "checklist",
    label: "admin_checklist.txt",
  };
}
