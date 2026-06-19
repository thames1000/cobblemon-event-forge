import type { PokeType } from "../catalog/pokemon";

/** Cobblemon spawn rarity buckets, lowest -> highest rarity. */
export type Bucket = "common" | "uncommon" | "rare" | "ultra-rare";

/** Weather condition applied to spawns and described in the announcement. */
export type WeatherTheme = "any" | "clear" | "rain" | "thunder";

/** One headliner Pokémon in an event, with its spawn tuning. */
export interface FeaturedMon {
  /** Cobblemon species id, e.g. "pikachu". */
  species: string;
  bucket: Bucket;
  /** Spawn weight within the bucket. */
  weight: number;
  /** Level range as "min-max". */
  level: string;
}

/** A single reward line (item, currency, or raw command). */
export interface RewardLine {
  /** Item id from the catalog, "cobbledollars", or "command". */
  itemId: string;
  count: number;
  /** Only used when itemId === "command": a raw mcfunction line. */
  rawCommand?: string;
}

/** A quest/bounty objective attached to the event. */
export interface Objective {
  text: string;
  /** Optional structured hint for future quest export (FTB etc.). */
  kind?: "catch-count" | "catch-type" | "defeat" | "custom";
  count?: number;
  type?: PokeType;
}

/**
 * Auto-spawn a legendary once a player has caught enough of a given type.
 * Implemented as a Cobblemon `cobblemon:catch_pokemon` advancement (count+type)
 * whose reward function runs `/spawnpokemon`. See event/legendary.ts.
 */
export interface LegendaryTrigger {
  enabled: boolean;
  /** Cobblemon species to summon, e.g. "zapdos". */
  legendary: string;
  /** Elemental type to count toward the trigger, or "any". */
  type: PokeType | "any";
  /** How many of that type must be caught. */
  count: number;
  /** Level the summoned legendary spawns at. */
  level: number;
  /** "per-player": each player earns their own; "server-wide": first to finish spawns one. */
  scope: "per-player" | "server-wide";
}

/**
 * Pack Safety / Cleanup options — control which lifecycle files get generated.
 * Defaults are deliberately conservative: NO tick logic, NO test broadcast, but
 * an uninstall function and an enable/disable flag so the pack is easy to turn
 * off and clean up. (Lesson learned the hard way: never ship a tick.json you
 * don't need.)
 */
export interface PackOptions {
  /** Emit load.mcfunction + minecraft load tag. Forced on if other options need it. */
  includeLoad: boolean;
  /** Emit uninstall.mcfunction that resets this pack's scores. */
  includeUninstall: boolean;
  /** Emit an enable/disable scoreboard flag (gates summons & tick logic). */
  enableFlag: boolean;
  /** Print a "datapack loaded ✓" message on load (off by default — keep packs quiet). */
  testBroadcast: boolean;
  /** Emit a per-tick function + tick tag. OFF unless you really need timed logic. */
  advancedTimedLogic: boolean;
}

export interface EventConfig {
  /** Event-type preset id this was created from. */
  presetId: string;
  title: string;
  /** Human duration text, e.g. "Friday 6 PM - Sunday 11 PM". */
  duration: string;
  blurb: string;
  weather: WeatherTheme;
  featured: FeaturedMon[];
  objectives: Objective[];
  rewards: RewardLine[];
  /** Optional auto-spawn-a-legendary mechanic. */
  legendaryTrigger: LegendaryTrigger;
  /** Pack Safety / Cleanup options. */
  pack: PackOptions;
  /** Target MC datapack pack_format. */
  packFormat: number;
}
