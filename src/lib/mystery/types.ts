import type { PokeType } from "../catalog/pokemon";
import type { RewardAction } from "../reward/actions";

/**
 * Mystery Objectives — a per-player chain of cryptic steps. A player only ever
 * sees the CURRENT step's clue; the real task is hidden. When they figure it out
 * and complete it, the step is "solved" (revealing what it was), a reward drops,
 * and the next clue unlocks. Great for legendary hunts and scavenger lore.
 *
 * Tick-free: per-player step/progress counters + count-LESS, self-re-arming
 * Cobblemon advancements that only tally while their step is the active one (so
 * "catch 5 since this step started" works despite cumulative catch counts).
 */
export interface MysteryStep {
  id: string;
  /** The cryptic clue shown while this step is active. */
  clue: string;
  /** Reveal line shown on completion ("" → auto-generated from the task). */
  solved: string;
  // --- the hidden task ---
  triggerId: string;
  count: number;
  pokemonType: PokeType | "any";
  /** Reward granted when the step is solved. */
  reward: RewardAction[];
}

export interface MysteryConfig {
  title: string;
  blurb: string;
  steps: MysteryStep[];
  /** Also show the explicit objective next to each clue (less mysterious, more guided). */
  revealTasks: boolean;
  /** Bonus reward for solving the entire chain. */
  finaleReward: RewardAction[];
  /** Base item for the reusable clue item (starts the hunt + re-reads the current clue). */
  clueItemBase: string;
  packFormat: number;
}

export function newMysteryStep(id: string, partial?: Partial<MysteryStep>): MysteryStep {
  return { id, clue: "", solved: "", triggerId: "cobblemon:catch_pokemon", count: 5, pokemonType: "any", reward: [], ...partial };
}

export function newMysteryConfig(packFormat: number): MysteryConfig {
  return {
    title: "The Whispering Hunt",
    blurb: "A string of cryptic omens leads somewhere only the persistent will find…",
    revealTasks: false,
    finaleReward: [{ kind: "item", itemId: "cobblemon:master_ball", count: 1 }],
    clueItemBase: "minecraft:paper",
    steps: [
      newMysteryStep("m1", { clue: "Something watches from the forest after dusk…", triggerId: "cobblemon:catch_pokemon", count: 5, pokemonType: "ghost", reward: [{ kind: "item", itemId: "cobblemon:rare_candy", count: 3 }] }),
      newMysteryStep("m2", { clue: "The restless dead grow bolder when challenged.", triggerId: "cobblemon:battles_won", count: 5, pokemonType: "any", reward: [{ kind: "item", itemId: "cobblemon:ultra_ball", count: 10 }] }),
      newMysteryStep("m3", { clue: "Only a true spirit-tamer earns the final audience.", triggerId: "cobblemon:catch_pokemon", count: 3, pokemonType: "ghost", reward: [{ kind: "item", itemId: "obc:bottle_cap_gold", count: 1 }] }),
    ],
    packFormat,
  };
}
