import type { PokeType } from "../catalog/pokemon";
import type { WeatherTheme } from "../event/types";
import type { RewardAction } from "../reward/actions";

/** A consumable "entry ticket" item that welcomes a player into the zone. */
export interface SafariTicket {
  enabled: boolean;
  baseItem: string;
  glint: boolean;
}

/**
 * A standalone arena dimension for the safari, defined by this datapack and
 * entered with VANILLA teleports (no Resource World mod — its commands can't run
 * from datapack functions). The ticket warps players in; the timer/exit returns
 * them to where they came from.
 */
export interface SafariArena {
  enabled: boolean;
  /**
   * "single-biome": generate a one-biome overworld dimension — the whole arena is
   * the safari's biome.
   * "mirror": generate a separate, normal overworld dimension.
   */
  mode: "mirror" | "single-biome";
  /** Legacy/unused: retained for config compatibility (mirror mode is a plain overworld). */
  mirror: string;
  /** Biome id for the single-biome arena (e.g. "minecraft:dark_forest"). */
  biome: string;
  /**
   * Exclusive spawns: generate a custom, Cobblemon-tagless biome for the arena so
   * NONE of Cobblemon's default biome spawns apply there — only the safari's
   * selected Pokémon spawn (conditioned to that biome). Also disables vanilla mob
   * spawns inside the arena. Defaults to on; set false to fall back to the themed
   * vanilla biome where the selected Pokémon are merely boosted on top of defaults.
   */
  exclusive?: boolean;
}

/**
 * Per-player countdown: starts on entry, warns at the given minute-marks, and
 * returns the player to where they entered from when it runs out. Implemented
 * as a 1-second self-rescheduling loop that only runs while someone is inside.
 */
export interface SafariTimer {
  enabled: boolean;
  /** Minutes-remaining marks to warn at, e.g. [15, 5, 1]. */
  warnings: number[];
  /**
   * Show each player a persistent boss bar at the top of their screen counting
   * down their remaining time (M:SS, shrinks as time runs out, turns red in the
   * final minute). Pure vanilla `bossbar` commands — no client mod required.
   * Defaults to on; set false to keep chat-only warnings.
   */
  bossbar?: boolean;
}

/** Optional "catch N of a type" reward objective for finishing the safari. */
export interface SafariReward {
  enabled: boolean;
  type: PokeType | "any";
  count: number;
  rewards: RewardAction[];
}

/**
 * A themed temporary Safari Zone. Generates tiered spawns (optionally
 * biome-locked), an entry-ticket item, a reward objective, and the player-facing
 * text (rules board, NPC dialogue, sign, announcement).
 */
export interface SafariConfig {
  title: string;
  blurb: string;
  themeId: string;
  /** Species ids per rarity tier. */
  common: string[];
  rare: string[];
  ultraRare: string[];
  /** Biome ids/tags to restrict spawns to ("" list = anywhere — good for a built arena). */
  biomes: string[];
  weather: WeatherTheme;
  /** Temporary Resource World arena for the zone. */
  arena: SafariArena;
  ticket: SafariTicket;
  /** Safari Balls handed out on entry (1.5× catch rate — the in-zone boost). 0 = none. */
  safariBalls: number;
  /** Entry time limit in minutes (the timer total; also stated in the rules). */
  timeLimitMinutes: number;
  /** Enforced countdown + warnings + return-home. */
  timer: SafariTimer;
  /**
   * Give players a one-use "leave early" item on entry so they can exit before
   * the timer ends (returns them home / stops their countdown). Works for non-op
   * players via an advancement reward function. Defaults to on. Requires a ticket
   * (to hand the item out) and an arena or timer (something to leave).
   */
  leaveEarly?: boolean;
  rules: string[];
  reward: SafariReward;
  packFormat: number;
}
