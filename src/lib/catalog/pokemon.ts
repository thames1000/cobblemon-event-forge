/**
 * A small, hand-curated Pokémon catalog — enough to drive event themes and to
 * pick sensible spawn defaults (legendaries spawn ultra-rare at low weight).
 *
 * `id` is the Cobblemon species name as used in spawn files / commands
 * (lowercase, no spaces). The UI also allows free-text entry for anything not
 * listed here, so this list just needs to cover the common event headliners.
 */
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

export const POKEMON: Species[] = [
  // Electric (Electric Storm Weekend)
  { id: "pikachu", name: "Pikachu", types: ["electric"] },
  { id: "raichu", name: "Raichu", types: ["electric"] },
  { id: "electabuzz", name: "Electabuzz", types: ["electric"] },
  { id: "rotom", name: "Rotom", types: ["electric", "ghost"] },
  { id: "zapdos", name: "Zapdos", types: ["electric", "flying"], legendary: true },
  { id: "raikou", name: "Raikou", types: ["electric"], legendary: true },
  // Fire
  { id: "charmander", name: "Charmander", types: ["fire"] },
  { id: "growlithe", name: "Growlithe", types: ["fire"] },
  { id: "magmar", name: "Magmar", types: ["fire"] },
  { id: "moltres", name: "Moltres", types: ["fire", "flying"], legendary: true },
  { id: "entei", name: "Entei", types: ["fire"], legendary: true },
  // Water
  { id: "squirtle", name: "Squirtle", types: ["water"] },
  { id: "magikarp", name: "Magikarp", types: ["water"] },
  { id: "lapras", name: "Lapras", types: ["water", "ice"] },
  { id: "gyarados", name: "Gyarados", types: ["water", "flying"] },
  { id: "suicune", name: "Suicune", types: ["water"], legendary: true },
  // Ghost (Haunted Woods Safari)
  { id: "gastly", name: "Gastly", types: ["ghost", "poison"] },
  { id: "shuppet", name: "Shuppet", types: ["ghost"] },
  { id: "phantump", name: "Phantump", types: ["ghost", "grass"] },
  { id: "mimikyu", name: "Mimikyu", types: ["ghost", "fairy"] },
  { id: "dreepy", name: "Dreepy", types: ["dragon", "ghost"] },
  { id: "marshadow", name: "Marshadow", types: ["fighting", "ghost"], legendary: true },
  // Rock/Ground (Fossil Frenzy)
  { id: "geodude", name: "Geodude", types: ["rock", "ground"] },
  { id: "onix", name: "Onix", types: ["rock", "ground"] },
  { id: "aerodactyl", name: "Aerodactyl", types: ["rock", "flying"] },
  { id: "tyranitar", name: "Tyranitar", types: ["rock", "dark"] },
  // Bug (Bug-Catching Contest)
  { id: "caterpie", name: "Caterpie", types: ["bug"] },
  { id: "scyther", name: "Scyther", types: ["bug", "flying"] },
  { id: "pinsir", name: "Pinsir", types: ["bug"] },
  { id: "scizor", name: "Scizor", types: ["bug", "steel"] },
  // Dragon (Dragon Highlands)
  { id: "dratini", name: "Dratini", types: ["dragon"] },
  { id: "bagon", name: "Bagon", types: ["dragon"] },
  { id: "garchomp", name: "Garchomp", types: ["dragon", "ground"] },
  { id: "rayquaza", name: "Rayquaza", types: ["dragon", "flying"], legendary: true },
];

const BY_ID = new Map(POKEMON.map((p) => [p.id, p]));

export function findSpecies(id: string): Species | undefined {
  return BY_ID.get(id.toLowerCase());
}

export const ALL_TYPES: PokeType[] = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
  "steel", "fairy",
];
