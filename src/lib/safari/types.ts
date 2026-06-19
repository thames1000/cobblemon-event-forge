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
 * A temporary arena world for the safari, via the Resource World mod
 * (`/resourceworld create|tp|delete`). Created once at setup, entered through the
 * ticket, and deleted on uninstall.
 */
export interface SafariArena {
  enabled: boolean;
  /**
   * "mirror": copy an existing dimension's generation.
   * "single-biome": generate a one-biome overworld dimension (a themed datapack
   * dimension) and mirror that — so the whole arena is the safari's biome.
   */
  mode: "mirror" | "single-biome";
  /** Dimension to mirror when mode = "mirror" (e.g. "minecraft:overworld"). */
  mirror: string;
  /** Biome id for the single-biome arena (e.g. "minecraft:dark_forest"). */
  biome: string;
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
  /** Stated entry time limit (a rule; not auto-enforced). */
  timeLimitMinutes: number;
  rules: string[];
  reward: SafariReward;
  packFormat: number;
}
