import type { CrateConfig, CrateTier } from "./types";

/**
 * Drop-chance maths. Minecraft loot pools roll `rolls` times with replacement,
 * each roll picking weighted from the tier's entries (an `empty` slot counts as
 * "nothing"). So per roll an entry's probability is weight / totalWeight, and we
 * report both the per-open expected count and the chance of seeing it at least
 * once.
 */
export interface EntryOdds {
  itemId: string;
  count: string;
  weight: number;
  /** Probability this entry is chosen on a single roll. */
  perRoll: number;
  /** P(at least one across all rolls in the tier). */
  atLeastOnce: number;
  /** Expected number of this item per crate open. */
  expectedCount: number;
}

export interface TierOdds {
  id: string;
  name: string;
  rolls: number;
  /** P(this tier yields at least one item per open). */
  hitChance: number;
  entries: EntryOdds[];
}

function avgCount(count: string): number {
  const m = count.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return (Number(m[1]) + Number(m[2])) / 2;
  const n = Number(count);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function tierOdds(tier: CrateTier): TierOdds {
  const items = tier.entries.filter((e) => e.itemId.trim() !== "");
  const totalWeight = items.reduce((s, e) => s + Math.max(1, e.weight), 0) + Math.max(0, tier.emptyWeight);
  const rolls = Math.max(1, Math.round(tier.rolls));
  const emptyPerRoll = totalWeight > 0 ? Math.max(0, tier.emptyWeight) / totalWeight : 1;

  const entries: EntryOdds[] = items.map((e) => {
    const perRoll = totalWeight > 0 ? Math.max(1, e.weight) / totalWeight : 0;
    return {
      itemId: e.itemId,
      count: e.count,
      weight: e.weight,
      perRoll,
      atLeastOnce: 1 - Math.pow(1 - perRoll, rolls),
      expectedCount: perRoll * rolls * avgCount(e.count),
    };
  });

  return {
    id: tier.id,
    name: tier.name,
    rolls,
    hitChance: 1 - Math.pow(emptyPerRoll, rolls),
    entries,
  };
}

export function crateOdds(config: CrateConfig): TierOdds[] {
  return config.tiers.map(tierOdds);
}

export function pct(p: number): string {
  if (p <= 0) return "0%";
  if (p < 0.001) return "<0.1%";
  if (p > 0.9995) return "~100%";
  return `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
}
