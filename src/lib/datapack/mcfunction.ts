import type { GeneratedFile } from "./types";
import type { RewardLine } from "../event/types";
import { findReward } from "../catalog/items";
import { toId } from "./sanitize";

/**
 * Reward function generation.
 *
 * Rewards become a single .mcfunction the owner runs against the winner(s):
 *   /execute as <player> run function <namespace>:<slug>_rewards
 *
 * - Item rewards -> `give @s <id> <count>`
 * - Currency rewards -> an economy-mod command (flagged: syntax varies by mod)
 * - Raw commands -> emitted verbatim
 *
 * The folder is the 1.21+ singular `function/` (renamed from `functions/`).
 */
export function buildRewardFunction(opts: {
  namespace: string;
  eventSlug: string;
  eventTitle: string;
  rewards: RewardLine[];
}): GeneratedFile {
  const lines: string[] = [];
  lines.push(`# Rewards for: ${opts.eventTitle}`);
  lines.push(`# Run against the winner, e.g.:`);
  lines.push(`#   /execute as <player> run function ${opts.namespace}:${opts.eventSlug}_rewards`);
  lines.push(`# Or simply target yourself in-game and run the function while it's selected.`);
  lines.push("");

  let flaggedCurrency = false;
  for (const r of opts.rewards) {
    if (r.itemId === "command") {
      if (r.rawCommand && r.rawCommand.trim()) {
        lines.push(r.rawCommand.trim().replace(/^\//, ""));
      }
      continue;
    }
    const meta = findReward(r.itemId);
    if (meta?.category === "currency") {
      if (!flaggedCurrency) {
        lines.push(`# CobbleDollars payout below — confirm the command matches your economy mod.`);
        flaggedCurrency = true;
      }
      // Common CobbleDollars syntax; owner can adjust if their mod differs.
      lines.push(`cobbledollars add @s ${r.count}`);
      continue;
    }
    // Plain item give.
    const id = r.itemId.includes(":") ? r.itemId : `minecraft:${r.itemId}`;
    lines.push(`give @s ${id} ${Math.max(1, r.count)}`);
  }

  lines.push("");
  lines.push(`tellraw @s {"text":"You received your ${opts.eventTitle} rewards!","color":"gold"}`);

  return {
    path: `data/${opts.namespace}/function/${opts.eventSlug}_rewards.mcfunction`,
    contents: lines.join("\n") + "\n",
    kind: "function",
    label: "event_rewards.mcfunction",
  };
}

/** Standalone helper kept for symmetry/testing. */
export function rewardFunctionPath(namespace: string, eventSlug: string): string {
  return `data/${toId(namespace)}/function/${toId(eventSlug)}_rewards.mcfunction`;
}
