import { toId } from "../datapack/sanitize";
import { findSpecies } from "../catalog/pokemon";
import type { Objective } from "./types";

/**
 * Catalog of supported Cobblemon advancement triggers (the ones with native
 * `count` support, so "do X N times" objectives work without any tick logic).
 *
 * Each entry knows which inputs it uses (so the UI shows the right fields), how
 * to build the advancement `conditions`, and how to phrase itself.
 *
 * Trigger ids/fields per the Cobblemon Wiki "Advancements" page.
 */
export interface TriggerDef {
  id: string;
  label: string;
  usesCount: boolean;
  usesType: boolean;
  usesSpecies: boolean;
  usesLevel: boolean;
  conditions(o: Objective): Record<string, unknown>;
  describe(o: Objective): string;
}

function speciesName(species: string): string {
  return findSpecies(toId(species))?.name ?? species;
}

function speciesCond(species: string): Record<string, unknown> {
  return species.trim() ? { species: `cobblemon:${toId(species)}` } : {};
}

export const TRIGGERS: TriggerDef[] = [
  {
    id: "cobblemon:catch_pokemon",
    label: "Catch Pokémon",
    usesCount: true,
    usesType: true,
    // Cobblemon's catch_pokemon criterion (CaughtPokemonCriterion) supports ONLY `type`
    // + `count` — its `species` field is commented out in the mod, so emitting `species`
    // would be ignored (or fail to load). Don't offer it; use "Evolve Pokémon" or a
    // manual objective for species-specific goals.
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({
      count: o.count,
      ...(o.pokemonType !== "any" ? { type: o.pokemonType } : {}),
    }),
    describe: (o) => {
      const typeStr = o.pokemonType !== "any" ? `${o.pokemonType}-type ` : "";
      return `Catch ${o.count} ${typeStr}Pokémon`;
    },
  },
  {
    id: "cobblemon:catch_shiny_pokemon",
    label: "Catch shiny Pokémon",
    usesCount: true,
    usesType: false,
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({ count: o.count }),
    describe: (o) => `Catch ${o.count} shiny Pokémon`,
  },
  {
    id: "cobblemon:pokemon_evolved",
    label: "Evolve Pokémon",
    usesCount: true,
    usesType: false,
    usesSpecies: true,
    usesLevel: false,
    conditions: (o) => ({ count: o.count, ...speciesCond(o.species) }),
    describe: (o) => `Evolve ${o.count} ${o.species.trim() ? speciesName(o.species) : "Pokémon"}`,
  },
  {
    id: "cobblemon:eggs_hatched",
    label: "Hatch eggs",
    usesCount: true,
    usesType: false,
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({ count: o.count }),
    describe: (o) => `Hatch ${o.count} eggs`,
  },
  {
    id: "cobblemon:eggs_collected",
    label: "Collect eggs",
    usesCount: true,
    usesType: false,
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({ count: o.count }),
    describe: (o) => `Collect ${o.count} eggs`,
  },
  {
    id: "cobblemon:battles_won",
    label: "Win battles",
    usesCount: true,
    usesType: false,
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({ count: o.count }),
    describe: (o) => `Win ${o.count} battles`,
  },
  {
    id: "cobblemon:pokemon_defeated",
    label: "Defeat Pokémon",
    usesCount: true,
    usesType: false,
    usesSpecies: false,
    usesLevel: false,
    conditions: (o) => ({ count: o.count }),
    describe: (o) => `Defeat ${o.count} Pokémon`,
  },
  {
    id: "cobblemon:level_up",
    label: "Level a Pokémon to…",
    usesCount: false,
    usesType: false,
    usesSpecies: false,
    usesLevel: true,
    conditions: (o) => ({ level: o.level }),
    describe: (o) => `Level a Pokémon to ${o.level}`,
  },
];

export function findTrigger(id: string): TriggerDef | undefined {
  return TRIGGERS.find((t) => t.id === id);
}

/** The effective display label for an objective. */
export function describeObjective(o: Objective): string {
  if (o.label.trim()) return o.label.trim();
  if (o.mode === "manual") return "Custom objective";
  return findTrigger(o.triggerId)?.describe(o) ?? "Objective";
}
