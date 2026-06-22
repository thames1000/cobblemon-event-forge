import type { PokeType } from "../catalog/pokemon";
import type { BattleFormat, BattleTheme, BattleDifficulty } from "./catalog";

/** One generated rental Pokémon (natural level-up moves; set via /givepokemonother). */
export interface RentalMon {
  species: string; // Cobblemon species id
  name: string; // display name
  types: PokeType[];
  level: number;
  nature: string; // nature id
  ability: string; // ability id
  heldItem: string; // item id
  heldItemName: string;
  /** min_perfect_ivs value (0 = random IVs). */
  minPerfectIvs: number;
  /** EV spread by Cobblemon stat key (attack/special_attack/speed/hp/…). Empty = none. */
  evs: Record<string, number>;
}

/** A full rental team a player can draft. */
export interface RentalTeam {
  index: number; // 1-based
  mons: RentalMon[];
}

/**
 * Battle Factory config: a ruleset + a pool of rental teams. Generation is
 * deterministic given `seed`, so the same config always yields the same teams.
 */
export interface BattleConfig {
  title: string;
  format: BattleFormat;
  /** Flat level applied to every rental. */
  level: number;
  /** Pokémon per team (1–6). */
  teamSize: number;
  /** runtime: number of sets in the baked pool; fixed: number of pre-built teams. */
  poolSize: number;
  /**
   * "runtime": the pack bakes a pool of `poolSize` sets and assembles a fresh random
   * team in-game on each draft (sampling without replacement → Species Clause).
   * "fixed": the dashboard pre-builds `poolSize` fixed teams; a draft picks one.
   */
  draftMode: "runtime" | "fixed";
  theme: BattleTheme;
  /** Type for the monotype theme. */
  themeType: PokeType;
  difficulty: BattleDifficulty;
  /** Deterministic generation seed. */
  seed: number;
  /** Species ids banned from the pool. */
  bannedSpecies: string[];
  /** Clauses to print in the ruleset (display-only). */
  clauses: string[];
  /** Emit a usable "Rental Draft Ticket" that drafts a random team on use. */
  draftItem: boolean;
  packFormat: number;
}
