/**
 * Reward item catalog. `id` is the full item resource location used in a
 * `/give` command. Cobblemon items live under the `cobblemon:` namespace;
 * vanilla rewards under `minecraft:`.
 *
 * `currency` items are not real Minecraft items — they're economy payouts
 * (CobbleDollars etc.) handled by a mod command. We model them here so rewards
 * are a single uniform list in the UI, but the generator emits a command
 * template for them instead of `/give` (and flags it as "verify the syntax",
 * since economy mod commands vary).
 */
export interface RewardItem {
  id: string;
  name: string;
  category: "pokeball" | "held" | "medicine" | "valuable" | "currency" | "vanilla";
  /** Approximate per-unit value, used only by the balance warnings. */
  value?: number;
}

export const REWARD_ITEMS: RewardItem[] = [
  // Poké Balls
  { id: "cobblemon:poke_ball", name: "Poké Ball", category: "pokeball", value: 200 },
  { id: "cobblemon:great_ball", name: "Great Ball", category: "pokeball", value: 600 },
  { id: "cobblemon:ultra_ball", name: "Ultra Ball", category: "pokeball", value: 1200 },
  { id: "cobblemon:premier_ball", name: "Premier Ball", category: "pokeball", value: 200 },
  { id: "cobblemon:master_ball", name: "Master Ball", category: "pokeball", value: 50000 },
  // Held / battle items
  { id: "cobblemon:choice_scarf", name: "Choice Scarf", category: "held", value: 3000 },
  { id: "cobblemon:ability_capsule", name: "Ability Capsule", category: "held", value: 4000 },
  { id: "cobblemon:exp_share", name: "Exp. Share", category: "held", value: 2000 },
  // Valuables / IV-EV items
  { id: "cobblemon:exp_candy_l", name: "Exp. Candy L", category: "valuable", value: 1500 },
  { id: "cobblemon:rare_candy", name: "Rare Candy", category: "valuable", value: 2500 },
  { id: "cobblemon:exp_candy_xl", name: "Exp. Candy XL", category: "valuable", value: 3000 },
  // Bottle Caps — from the "Only Bottle Caps" mod (namespace `obc`), not base Cobblemon.
  { id: "obc:bottle_cap", name: "Bottle Cap", category: "valuable", value: 5000 },
  { id: "obc:bottle_cap_gold", name: "Gold Bottle Cap", category: "valuable", value: 20000 },
  // Medicine
  { id: "cobblemon:potion", name: "Potion", category: "medicine", value: 150 },
  { id: "cobblemon:hyper_potion", name: "Hyper Potion", category: "medicine", value: 600 },
  { id: "cobblemon:full_restore", name: "Full Restore", category: "medicine", value: 1500 },
  // Vanilla treats
  { id: "minecraft:diamond", name: "Diamond", category: "vanilla", value: 1000 },
  { id: "minecraft:netherite_ingot", name: "Netherite Ingot", category: "vanilla", value: 8000 },
  // Currency (economy mod payouts, not real items)
  { id: "cobbledollars", name: "CobbleDollars", category: "currency", value: 1 },
];

const BY_ID = new Map(REWARD_ITEMS.map((i) => [i.id, i]));
export function findReward(id: string): RewardItem | undefined {
  return BY_ID.get(id);
}
