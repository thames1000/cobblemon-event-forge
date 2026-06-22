import type { GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { Objective } from "../objective/types";
import type { BountyConfig, CommunityGoal } from "./types";
import { describeObjective } from "../objective/triggers";
import { describeReward } from "../reward/actions";
import type { RewardAction } from "../reward/actions";

function rewardSummary(rewards: RewardAction[]): string {
  return rewards.length ? rewards.map(describeReward).join(", ") : "—";
}

function communityLabel(g: CommunityGoal): string {
  if (g.label.trim()) return g.label;
  const typeStr = g.pokemonType === "any" ? "Pokémon" : `${g.pokemonType}-type`;
  return `Catch ${g.count} ${typeStr}`;
}

/** bounty_board.txt — a printable copy of the board. */
export function buildBoardText(config: BountyConfig): GeneratedFile {
  const L: string[] = [];
  L.push(`${config.title} — BOUNTY BOARD`);
  L.push("");
  const section = (heading: string, items: Objective[]) => {
    if (!items.length) return;
    L.push(`${heading}`);
    for (const o of items) L.push(`  • ${describeObjective(o)}  →  ${rewardSummary(o.rewards)}`);
    L.push("");
  };
  section("DAILY", config.daily);
  section("WEEKLY", config.weekly);
  section("SPECIAL", config.special);
  if (config.community.length) {
    L.push("COMMUNITY GOALS (participation — N trainers each complete the task):");
    for (const g of config.community) L.push(`  • ${communityLabel(g)} — ${Math.max(1, Math.round(g.targetPlayers))} trainers  →  ${rewardSummary(g.rewards)} (for everyone online)`);
    L.push("");
  }
  L.push("Players view this in-game with the Bounty Board item (or /function <ns>:board).");
  return { path: "bounty_board.txt", contents: L.join("\n") + "\n", kind: "readme", label: "bounty board" };
}

/** discord_announcement.md */
export function buildBountyDiscord(config: BountyConfig): GeneratedFile {
  const L: string[] = [];
  L.push(`# 📋 ${config.title} — Bounty Board`);
  L.push("");
  const list = (heading: string, items: Objective[]) => {
    if (!items.length) return;
    L.push(`**${heading}**`);
    for (const o of items) L.push(`- ${describeObjective(o)} → **${rewardSummary(o.rewards)}**`);
    L.push("");
  };
  list("Daily", config.daily);
  list("Weekly", config.weekly);
  list("Special", config.special);
  if (config.community.length) {
    L.push("**Community goals** (everyone pitches in → everyone wins):");
    for (const g of config.community) L.push(`- ${communityLabel(g)} — ${Math.max(1, Math.round(g.targetPlayers))} trainers → **${rewardSummary(g.rewards)}**`);
    L.push("");
  }
  L.push("_Grab the Bounty Board item in-game to track your progress!_");
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord post" };
}

/** admin_checklist.txt */
export function buildBountyChecklist(config: BountyConfig, namespace: string, validation: ValidationResult): GeneratedFile {
  const L: string[] = [];
  const total = config.daily.length + config.weekly.length + config.special.length;
  L.push(`${config.title} — ADMIN CHECKLIST`);
  L.push("");
  L.push(`Validator: ${validation.ok ? "OK ✓" : `${validation.issues.length} issue(s)`}`);
  L.push("");
  let n = 1;
  L.push(`  ${n++}. Drop the .zip into <world>/datapacks/ and /reload.`);
  if (config.community.length) L.push(`        load.mcfunction creates the ${"bounty_comm"} scoreboard for the community goals.`);
  if (config.boardItem) {
    L.push(`  ${n++}. Hand out the board item: /execute as <player> run function ${namespace}:give_board`);
    L.push(`        Players right-click & hold it to view the board (it's returned, so it's reusable).`);
  }
  L.push(`  ${n++}. Or bind the board to an NPC/sign/command block: /function ${namespace}:board`);
  L.push(`  ${n++}. ${total} individual bounties auto-complete in-game (one-shot per player) and pay out.`);
  if (config.community.length) {
    L.push(`  ${n++}. Community goals fire once ${"their target # of trainers"} each finish the task — rewards go`);
    L.push(`        to everyone ONLINE at that moment (offline players miss it).`);
  }
  L.push(`  ${n++}. ROTATION is manual: swap/redeploy the datapack to refresh Daily/Weekly bounties.`);
  if (config.community.length) L.push(`  ${n++}. Teardown: /function ${namespace}:uninstall, then remove the datapack.`);
  L.push("");
  L.push("NOTE: bounties are one-shot per player (Cobblemon counts are cumulative, so they");
  L.push("      can't repeat). Community goals are participation-based, not a running total.");
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin checklist" };
}

/** bounties.json — structured seed for a future FTB Quests export. */
export function buildBountiesJson(config: BountyConfig, slug: string): GeneratedFile {
  const mapObjective = (o: Objective, category: string) => ({
    id: o.id,
    category,
    label: describeObjective(o),
    mode: o.mode,
    ...(o.mode === "auto" ? { trigger: o.triggerId, count: o.count, ...(o.pokemonType !== "any" ? { type: o.pokemonType } : {}), ...(o.species.trim() ? { species: o.species } : {}) } : {}),
    announce: o.announce,
    rewards: o.rewards,
  });
  const doc = {
    board: config.title,
    slug,
    bounties: [
      ...config.daily.map((o) => mapObjective(o, "daily")),
      ...config.weekly.map((o) => mapObjective(o, "weekly")),
      ...config.special.map((o) => mapObjective(o, "special")),
    ],
    community: config.community.map((g) => ({ id: g.id, label: communityLabel(g), trigger: g.triggerId, count: g.count, type: g.pokemonType, species: g.species || undefined, targetPlayers: Math.max(1, Math.round(g.targetPlayers)), rewards: g.rewards })),
  };
  return { path: "bounties.json", contents: JSON.stringify(doc, null, 2), kind: "bounties", label: "bounties.json" };
}
