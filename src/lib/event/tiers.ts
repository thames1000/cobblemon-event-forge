import type { GeneratedFile } from "../datapack/types";
import type { RewardTier } from "./types";
import { compileRewardLines, describeReward } from "../reward/actions";
import { toId } from "../datapack/sanitize";

/** The bare function id (no namespace) a tier compiles to, e.g. "reward_winner". */
export function tierFnId(tier: RewardTier): string {
  return `reward_${toId(tier.id || tier.name)}`;
}

/** Does this tier actually compile to anything (and thus get a function emitted)? */
export function tierHasFunction(tier: RewardTier, packFormat: number): boolean {
  return compileRewardLines(tier.actions, { packFormat }).length > 0;
}

/**
 * Reward-tier functions. Each tier becomes one function the owner runs against
 * the relevant players:
 *   /execute as <player> run function <ns>:reward_<tier>
 * Empty tiers (no actions that compile to anything) are skipped.
 */
export function buildTierFiles(opts: {
  namespace: string;
  tiers: RewardTier[];
  packFormat: number;
}): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  for (const tier of opts.tiers) {
    const lines = compileRewardLines(tier.actions, { packFormat: opts.packFormat });
    if (lines.length === 0) continue;
    const fn = tierFnId(tier);
    const L = [
      `# ${tier.name} reward tier`,
      `# /execute as <player> run function ${opts.namespace}:${fn}`,
      "",
      ...lines,
      `tellraw @s ${JSON.stringify({ text: `You received the ${tier.name} reward!`, color: "gold" })}`,
      "",
    ];
    files.push({
      path: `data/${opts.namespace}/function/${fn}.mcfunction`,
      contents: L.join("\n"),
      kind: "function",
      label: `${fn}.mcfunction`,
    });
  }
  return files;
}

/** "Participation: Poké Ball ×5" style summary for a tier. */
export function describeTier(tier: RewardTier): string {
  if (tier.actions.length === 0) return `${tier.name}: —`;
  return `${tier.name}: ${tier.actions.map(describeReward).join(", ")}`;
}
