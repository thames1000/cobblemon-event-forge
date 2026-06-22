import type { CrateConfig } from "./types";
import { crateOdds } from "./odds";
import { findReward } from "../catalog/items";

/** Advisory crate-balance warnings (never block export). */
export interface CrateWarning {
  level: "warn" | "info";
  message: string;
}

/** Reference: a typical Battle Tower run payout, used as the EV comparison bar. */
const BATTLE_TOWER_EV = 10000;

/** Expected CobbleDollar value of one crate open. */
export function expectedValue(config: CrateConfig): number {
  let ev = 0;
  for (const tier of crateOdds(config)) {
    for (const e of tier.entries) {
      const meta = findReward(e.itemId);
      ev += (meta?.value ?? 0) * e.expectedCount;
    }
  }
  return Math.round(ev);
}

export function crateWarnings(config: CrateConfig): CrateWarning[] {
  const out: CrateWarning[] = [];
  const odds = crateOdds(config);

  for (const tier of odds) {
    for (const e of tier.entries) {
      if (e.itemId === "cobblemon:master_ball") {
        const chance = e.atLeastOnce;
        out.push({
          level: chance > 0.05 ? "warn" : "info",
          message: `Master Ball drops ~${(chance * 100).toFixed(1)}% per open in "${tier.name}". Keep crates like this rare/non-repeatable.`,
        });
      }
      if (e.itemId === "obc:bottle_cap_gold" && e.expectedCount > 0.5) {
        out.push({
          level: "warn",
          message: `Gold Bottle Cap averages ${e.expectedCount.toFixed(2)} per open — that hyper-trains a perfect IV very often.`,
        });
      }
    }
    const hasItems = tier.entries.length > 0;
    if (!hasItems) {
      out.push({ level: "info", message: `Tier "${tier.name}" has no items and will be skipped.` });
    }
  }

  const ev = expectedValue(config);
  if (ev > BATTLE_TOWER_EV * 2) {
    out.push({
      level: "warn",
      message: `Expected value per open (~${ev.toLocaleString()} CobbleDollars) is well above a Battle Tower run (~${BATTLE_TOWER_EV.toLocaleString()}).`,
    });
  } else if (ev > 0 && ev < 500) {
    out.push({ level: "info", message: `Expected value per open is only ~${ev.toLocaleString()} — players may find it underwhelming.` });
  }

  return out;
}
