import type { PokeType } from "../catalog/pokemon";

/**
 * Static catalog for the Battle Factory rental-team generator: natures, a held-item
 * pool (verified Cobblemon ids), and the format/theme/difficulty option lists.
 *
 * All ids are in the form Cobblemon's Pokémon Properties expects: nature ids feed
 * `nature=<id>`, held-item ids feed `held_item=<id>`.
 */

export type BattleFormat = "singles" | "doubles";
export type BattleTheme = "balanced" | "monotype" | "legendary";
export type BattleDifficulty = "casual" | "competitive";

export const FORMATS: { id: BattleFormat; name: string; blurb: string }[] = [
  { id: "singles", name: "Singles (6v6)", blurb: "One Pokémon out at a time." },
  { id: "doubles", name: "Doubles (6v6)", blurb: "Two Pokémon out per side." },
];

export const THEMES: { id: BattleTheme; name: string; blurb: string }[] = [
  { id: "balanced", name: "Balanced", blurb: "Any non-legendary species." },
  { id: "monotype", name: "Monotype", blurb: "Every rental shares one type." },
  { id: "legendary", name: "Legendary", blurb: "Legendaries & mythicals only." },
];

export const DIFFICULTIES: { id: BattleDifficulty; name: string; blurb: string }[] = [
  { id: "casual", name: "Casual", blurb: "Random IVs, no EVs — a fun, level playing field." },
  { id: "competitive", name: "Competitive", blurb: "6× perfect IVs + a 252/252/4 EV spread." },
];

/** Natures the generator assigns, keyed by the role it fits. Display names for sheets. */
export const NATURES: Record<string, string> = {
  adamant: "Adamant", // +Atk -SpA
  jolly: "Jolly", // +Spe -SpA
  modest: "Modest", // +SpA -Atk
  timid: "Timid", // +Spe -Atk
};

export interface HeldItem {
  id: string;
  name: string;
  /** Which attacking role this item suits; "any"/"defensive" fit either. */
  role: "physical" | "special" | "any" | "defensive";
}

/** Cobblemon held items (ids verified against the Cobblemon en_us lang). */
export const HELD_ITEMS: HeldItem[] = [
  { id: "cobblemon:choice_band", name: "Choice Band", role: "physical" },
  { id: "cobblemon:muscle_band", name: "Muscle Band", role: "physical" },
  { id: "cobblemon:choice_specs", name: "Choice Specs", role: "special" },
  { id: "cobblemon:wise_glasses", name: "Wise Glasses", role: "special" },
  { id: "cobblemon:choice_scarf", name: "Choice Scarf", role: "any" },
  { id: "cobblemon:life_orb", name: "Life Orb", role: "any" },
  { id: "cobblemon:expert_belt", name: "Expert Belt", role: "any" },
  { id: "cobblemon:focus_sash", name: "Focus Sash", role: "any" },
  { id: "cobblemon:leftovers", name: "Leftovers", role: "defensive" },
  { id: "cobblemon:assault_vest", name: "Assault Vest", role: "defensive" },
  { id: "cobblemon:rocky_helmet", name: "Rocky Helmet", role: "defensive" },
  { id: "cobblemon:sitrus_berry", name: "Sitrus Berry", role: "any" },
];

/** Standard battle clauses, stated in the ruleset side-car (not engine-enforced). */
export const STANDARD_CLAUSES = [
  "Species Clause — no two Pokémon of the same species on a team.",
  "Sleep Clause — only one of the opponent's Pokémon may be asleep at a time.",
  "Item Clause — no two Pokémon may hold the same item.",
  "Evasion Clause — no Double Team / Minimize.",
  "OHKO Clause — no Fissure / Guillotine / Horn Drill / Sheer Cold.",
];

export const ALL_THEME_TYPES: PokeType[] = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];
