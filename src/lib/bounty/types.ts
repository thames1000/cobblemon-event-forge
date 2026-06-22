import type { PokeType } from "../catalog/pokemon";
import type { Objective } from "../objective/types";
import type { RewardAction } from "../reward/actions";

/**
 * A server-wide community goal. Cobblemon's count triggers are cumulative
 * per-player thresholds (no per-event hook to sum across players), so a literal
 * "catch 500 total" isn't datapack-trackable. Instead this is a PARTICIPATION
 * goal: each player who completes the personal task contributes 1 to a shared
 * counter, and reaching `targetPlayers` fires a one-time reward for everyone online.
 */
export interface CommunityGoal {
  id: string;
  /** Display label, e.g. "Catch a Water-type". */
  label: string;
  // the per-player contribution task (reuses the objective trigger machinery)
  triggerId: string;
  count: number;
  pokemonType: PokeType | "any";
  species: string;
  level: number;
  /** How many distinct players must complete the task to fire the community reward. */
  targetPlayers: number;
  /** Reward granted to everyone online when the goal is met. */
  rewards: RewardAction[];
}

export function newCommunityGoal(id: string): CommunityGoal {
  return {
    id,
    label: "",
    triggerId: "cobblemon:catch_pokemon",
    count: 5,
    pokemonType: "water",
    species: "",
    level: 50,
    targetPlayers: 20,
    rewards: [],
  };
}

/**
 * A Bounty Board: individual bounties grouped into Daily / Weekly / Special
 * (labels — rotation is by re-deploying the pack), plus participation-based
 * community goals, an in-game /board view, and an optional usable board item.
 */
export interface BountyConfig {
  title: string;
  daily: Objective[];
  weekly: Objective[];
  special: Objective[];
  community: CommunityGoal[];
  /** Emit a reusable "Bounty Board" item players right-click to view the board. */
  boardItem: boolean;
  packFormat: number;
}

export type BountyCategory = "daily" | "weekly" | "special";
export const CATEGORY_LABELS: Record<BountyCategory, string> = { daily: "Daily", weekly: "Weekly", special: "Special" };
