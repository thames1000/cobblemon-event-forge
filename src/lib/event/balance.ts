import type { EventConfig } from "./types";
import type { RewardAction } from "../reward/actions";
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

/** Every reward action in the event: tier rewards + per-objective rewards. */
function allActions(config: EventConfig): RewardAction[] {
  return [...config.rewardTiers.flatMap((t) => t.actions), ...config.objectives.flatMap((o) => o.rewards)];
}

/** Rough total CobbleDollar value of all rewards, for the EV warning. */
export function rewardValue(config: EventConfig): number {
  let total = 0;
  for (const a of allActions(config)) {
    if (a.kind === "item") total += (findReward(a.itemId)?.value ?? 0) * Math.max(1, a.count);
    else if (a.kind === "command") {
      const m = a.command.match(/cobbledollars\s+add\s+\S+\s+(\d+)/i);
      if (m) total += Number(m[1]);
    }
  }
  return total;
}

/** Reference EV: a typical Battle Tower run reward, used as the comparison bar. */
const BATTLE_TOWER_EV = 10000;

export function balanceWarnings(config: EventConfig): BalanceWarning[] {
  const out: BalanceWarning[] = [];

  for (const a of allActions(config)) {
    if (a.kind !== "item") continue;
    if (a.itemId === "cobblemon:master_ball") {
      out.push({ level: "warn", message: "Master Ball is in the rewards — make sure this event isn't repeatable, or guarantees become trivial." });
    }
    if (a.itemId === "cobblemon:gold_bottle_cap" && a.count > 1) {
      out.push({ level: "warn", message: `Gold Bottle Cap ×${a.count} is a lot — these hyper-train a perfect IV each.` });
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
