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

/** Pick a spawn context that won't look silly for the species. */
function contextFor(speciesId: string): string {
  const sp = findSpecies(speciesId);
  if (sp && sp.types.includes("water") && !sp.types.includes("flying")) {
    return "surface";
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
}): GeneratedFile[] {
  const weather = weatherCondition(opts.weather);
  const biomes = (opts.biomes ?? []).map((b) => b.trim()).filter(Boolean);
  const cond = { ...weather, ...(biomes.length ? { biomes } : {}) };
  return opts.featured.map((mon) => {
    const speciesId = toId(mon.species);
    const spawn = {
      id: `${opts.namespace}:${speciesId}_${opts.eventSlug}`,
      pokemon: speciesId,
      type: "pokemon",
      context: contextFor(speciesId),
      bucket: mon.bucket,
      level: mon.level,
      weight: mon.weight,
      presets: ["natural"],
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
