import type { PokeType } from "../catalog/pokemon";
import type { WeatherTheme } from "../event/types";
import type { RewardAction } from "../reward/actions";

/** A consumable "entry ticket" item that welcomes a player into the zone. */
export interface SafariTicket {
  enabled: boolean;
  baseItem: string;
  glint: boolean;
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
  ticket: SafariTicket;
  /** Stated entry time limit (a rule; not auto-enforced). */
  timeLimitMinutes: number;
  rules: string[];
  reward: SafariReward;
  packFormat: number;
}
