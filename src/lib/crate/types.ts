/** One item line inside a crate tier. */
export interface CrateEntry {
  /** Reward item id from the catalog (real items only — loot tables can't pay currency). */
  itemId: string;
  /** Count as "10" or a range "1-3". */
  count: string;
  /** Relative weight within the tier. */
  weight: number;
}

/**
 * A crate tier = one loot pool. `rolls` items are drawn from it per open.
 * `emptyWeight` is the weight of drawing *nothing*, which turns a rare tier into
 * a chance rather than a guaranteed payout.
 */
export interface CrateTier {
  id: string;
  name: string;
  rolls: number;
  emptyWeight: number;
  entries: CrateEntry[];
}

/**
 * A usable "crate key" item. Right-click-and-hold consumes one and opens the
 * crate, via a `minecraft:consume_item` advancement → reward function (no tick,
 * no scoreboard). The icon is any inert item; the consumable/food component is
 * what makes it usable.
 */
export interface CrateKey {
  enabled: boolean;
  /** Icon item id, e.g. "minecraft:nether_star". */
  baseItem: string;
  /** Enchantment-glint sparkle. */
  glint: boolean;
  /** Lore instruction line under the name. */
  lore: string;
  /** Hold time in seconds before it opens (and consumes one). */
  consumeSeconds: number;
}

export interface CrateConfig {
  presetId: string;
  title: string;
  /** Flavour line for the summary / announcement. */
  blurb: string;
  tiers: CrateTier[];
  /** Usable crate-key item. */
  key: CrateKey;
  /** Target MC datapack pack_format. */
  packFormat: number;
}
