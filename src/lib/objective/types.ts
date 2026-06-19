import type { PokeType } from "../catalog/pokemon";
import type { RewardAction } from "../reward/actions";

export type ObjectiveMode = "auto" | "manual";

/**
 * A customizable objective / bounty.
 *
 * - `auto`  : compiles to a Cobblemon advancement (see triggers.ts) that detects
 *             completion in-game and fires the reward function.
 * - `manual`: free text; the owner grants the reward by hand via the generated
 *             reward function.
 */
export interface Objective {
  /** Stable id used for advancement/function file names. */
  id: string;
  mode: ObjectiveMode;
  /** Display label; auto objectives fall back to an auto-generated phrase. */
  label: string;
  // ---- auto-tracking params (used per the selected trigger) ----
  triggerId: string;
  count: number;
  pokemonType: PokeType | "any";
  /** Optional species filter, e.g. "pikachu" ("" = any). */
  species: string;
  /** Used by level-based triggers. */
  level: number;
  // ---- behaviour ----
  /** Broadcast "<player> completed: …!" to the whole server on completion. */
  announce: boolean;
  rewards: RewardAction[];
}

/** A fresh objective with sensible defaults. */
export function newObjective(id: string, partial?: Partial<Objective>): Objective {
  return {
    id,
    mode: "manual",
    label: "",
    triggerId: "cobblemon:catch_pokemon",
    count: 10,
    pokemonType: "any",
    species: "",
    level: 50,
    announce: false,
    rewards: [],
    ...partial,
  };
}
