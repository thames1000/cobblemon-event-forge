/**
 * The full Pokémon catalog — National Dex #1–1025, generated into ./pokemonDex.ts.
 *
 * `id` is the Cobblemon species name as used in spawn files / commands (lowercase,
 * alphanumeric — e.g. nidoranf, mrmime). The UI also allows free-text entry for forms
 * or anything not listed (e.g. "charizard").
 */
import { POKEDEX } from "./pokemonDex";
export type PokeType =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice" | "fighting"
  | "poison" | "ground" | "flying" | "psychic" | "bug" | "rock" | "ghost"
  | "dragon" | "dark" | "steel" | "fairy";

export interface Species {
  id: string;
  name: string;
  types: PokeType[];
  legendary?: boolean;
}

export const POKEMON: Species[] = POKEDEX;

const BY_ID = new Map(POKEMON.map((p) => [p.id, p]));

export function findSpecies(id: string): Species | undefined {
  return BY_ID.get(id.toLowerCase());
}

export const ALL_TYPES: PokeType[] = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
  "steel", "fairy",
];
