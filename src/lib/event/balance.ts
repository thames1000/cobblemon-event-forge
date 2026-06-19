import type { EventConfig } from "./types";
import { findReward } from "../catalog/items";

/**
 * Lightweight reward "balance" warnings — the kind of sanity check that stops an
 * owner from accidentally handing out a Master Ball in a weekly repeatable. These
 * are advisory only; they never block export.
 */
export interface BalanceWarning {
  level: "warn" | "info";
  message: string;
}

/** Rough total CobbleDollar value of a reward bundle, for the EV warning. */
export function rewardValue(config: EventConfig): number {
  let total = 0;
  for (const r of config.rewards) {
    const meta = findReward(r.itemId);
    if (!meta) continue;
    if (meta.category === "currency") total += r.count;
    else total += (meta.value ?? 0) * Math.max(1, r.count);
  }
  return total;
}

/** Reference EV: a typical Battle Tower run reward, used as the comparison bar. */
const BATTLE_TOWER_EV = 10000;

export function balanceWarnings(config: EventConfig): BalanceWarning[] {
  const out: BalanceWarning[] = [];

  for (const r of config.rewards) {
    const meta = findReward(r.itemId);
    if (!meta) continue;
    if (meta.id === "cobblemon:master_ball") {
      out.push({ level: "warn", message: "Master Ball is in the rewards — make sure this event isn't repeatable, or guarantees become trivial." });
    }
    if (meta.id === "cobblemon:gold_bottle_cap" && r.count > 1) {
      out.push({ level: "warn", message: `Gold Bottle Cap ×${r.count} is a lot — these hyper-train a perfect IV each.` });
    }
  }

  const ev = rewardValue(config);
  if (ev > BATTLE_TOWER_EV * 2) {
    out.push({
      level: "warn",
      message: `Reward value (~${ev.toLocaleString()} CobbleDollars) is well above a Battle Tower run (~${BATTLE_TOWER_EV.toLocaleString()}). Players may ignore other content.`,
    });
  } else if (ev > 0 && ev < BATTLE_TOWER_EV / 4) {
    out.push({ level: "info", message: `Reward value (~${ev.toLocaleString()}) is fairly low for a weekend event — consider sweetening it.` });
  }

  if (config.featured.length === 0) {
    out.push({ level: "info", message: "No featured Pokémon set — the event won't change any spawns." });
  }
  if (config.objectives.length === 0) {
    out.push({ level: "info", message: "No bounties set — players have nothing specific to chase." });
  }

  return out;
}
