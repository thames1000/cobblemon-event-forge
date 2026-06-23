import type { GeneratedFile } from "./types";
import type { FeaturedMon, WeatherTheme } from "../event/types";
import { findSpecies } from "../catalog/pokemon";
import { toId } from "./sanitize";

/**
 * Cobblemon spawn-pool generation.
 *
 * Cobblemon reads custom spawns from data/<namespace>/spawn_pool_world/*.json.
 * Each file declares one or more `spawns`, each with a rarity bucket, weight,
 * level range, spawn context, and a `condition` block. We translate the event's
 * featured Pokémon + weather theme into that schema.
 *
 * Refs: Cobblemon "Spawn File" docs (buckets common/uncommon/rare/ultra-rare;
 * contexts grounded/surface/submerged; condition keys canSeeSky / isThundering
 * / isRaining).
 */

interface SpawnCondition {
  canSeeSky?: boolean;
  isThundering?: boolean;
  isRaining?: boolean;
}

function weatherCondition(weather: WeatherTheme): SpawnCondition {
  switch (weather) {
    case "thunder":
      return { canSeeSky: true, isThundering: true };
    case "rain":
      return { canSeeSky: true, isRaining: true };
    case "clear":
      return { canSeeSky: true, isThundering: false, isRaining: false };
    case "any":
    default:
      return {};
  }
}

/**
 * Pick a spawn context for the species. Water (non-flying) mons default to "surface"
 * (on open water), but that fails where the water is frozen or absent — pass
 * `aquatic: "grounded"` to spawn them on the walkable surface instead (e.g. a frozen
 * lake arena, so they're always reachable on foot), or "submerged" for underwater.
 */
function contextFor(speciesId: string, aquatic: "surface" | "submerged" | "grounded"): string {
  const sp = findSpecies(speciesId);
  if (sp && sp.types.includes("water") && !sp.types.includes("flying")) {
    return aquatic;
  }
  return "grounded";
}

/**
 * One spawn file per featured species:
 *   data/<namespace>/spawn_pool_world/<species>.json
 */
export function buildSpawnFiles(opts: {
  namespace: string;
  eventSlug: string;
  weather: WeatherTheme;
  featured: FeaturedMon[];
  /** Optional biome ids/tags to restrict spawns to (e.g. "#minecraft:is_forest"). */
  biomes?: string[];
  /**
   * Optional dimension ids to restrict spawns to (e.g. "resource_world:zone"). More
   * robust than `biomes` for a mirrored / custom-biome arena, where the biome id may
   * not survive into the runtime world but the dimension id always matches.
   */
  dimensions?: string[];
  /** Spawn context for water mons. Default "surface"; safaris use "grounded" so they
   *  spawn on the walkable surface (catchable even on a frozen lake). */
  aquaticContext?: "surface" | "submerged" | "grounded";
  /**
   * Explicit list of blocks the mon may spawn ON (`neededBaseBlocks`), replacing the
   * "natural" preset. The default preset excludes ice/snow, so water mons can't spawn
   * on a frozen lake — listing those blocks here fixes that. Accepts block ids and #tags.
   */
  baseBlocks?: string[];
}): GeneratedFile[] {
  const weather = weatherCondition(opts.weather);
  const biomes = (opts.biomes ?? []).map((b) => b.trim()).filter(Boolean);
  const dimensions = (opts.dimensions ?? []).map((d) => d.trim()).filter(Boolean);
  const baseBlocks = (opts.baseBlocks ?? []).map((b) => b.trim()).filter(Boolean);
  const aquatic = opts.aquaticContext ?? "surface";
  const cond = {
    ...weather,
    ...(biomes.length ? { biomes } : {}),
    ...(dimensions.length ? { dimensions } : {}),
    ...(baseBlocks.length ? { neededBaseBlocks: baseBlocks } : {}),
  };
  return opts.featured.map((mon) => {
    const speciesId = toId(mon.species);
    const spawn = {
      id: `${opts.namespace}:${speciesId}_${opts.eventSlug}`,
      pokemon: speciesId,
      type: "pokemon",
      context: contextFor(speciesId, aquatic),
      bucket: mon.bucket,
      level: mon.level,
      weight: mon.weight,
      // An explicit base-block list replaces the "natural" preset (stacking both would
      // over-restrict). Fall back to the preset when no blocks are given (events).
      ...(baseBlocks.length ? {} : { presets: ["natural"] }),
      ...(Object.keys(cond).length > 0 ? { condition: cond } : {}),
    };
    const doc = {
      enabled: true,
      neededInstalledMods: [],
      neededUninstalledMods: [],
      spawns: [spawn],
    };
    return {
      path: `data/${opts.namespace}/spawn_pool_world/${speciesId}.json`,
      contents: JSON.stringify(doc, null, 2),
      kind: "spawn",
      label: `${mon.species} spawn`,
    };
  });
}
