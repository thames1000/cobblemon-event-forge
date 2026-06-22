/** Item Designer types: a library of custom named/lore items on top of base items. */

/** Text-component style flags (apply to the name and each lore line). */
export interface TextFormat {
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
}
export const NO_FORMAT: TextFormat = { bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false };

export interface LoreLine {
  text: string;
  color: string; // Minecraft color name
  format: TextFormat;
}

export type Rarity = "none" | "common" | "uncommon" | "rare" | "epic";

/** One enchantment entry (id includes namespace, e.g. "minecraft:sharpness"). */
export interface EnchantEntry {
  id: string;
  level: number;
}

/** One attribute modifier. `type` is the bare attribute (e.g. "attack_damage"); the
 *  generator adds the namespace + the version-aware "generic." prefix. */
export interface AttributeMod {
  type: string;
  amount: number;
  operation: string; // add_value | add_multiplied_base | add_multiplied_total
  slot: string; // any | mainhand | offhand | head | chest | legs | feet | hand | armor
}

export interface ItemDef {
  id: string;
  /** Base item id, e.g. "minecraft:paper" / "cobblemon:poke_ball". */
  baseItem: string;
  /** Display name (item_name component — no italics by default). */
  name: string;
  nameColor: string;
  nameFormat: TextFormat;
  lore: LoreLine[];
  glint: boolean;
  /** Stack count for the /give command. */
  count: number;
  rarity: Rarity;
  /** Resource-pack model id; 0 = none. (Version-aware: int <1.21.4, floats list after.) */
  customModelData: number;
  unbreakable: boolean;
  // --- add-ons ---
  enchantments: EnchantEntry[];
  attributes: AttributeMod[];
  /** custom_data tag — both blank = none. */
  customDataKey: string;
  customDataValue: string;
  /** max_stack_size; 0 = leave default. */
  maxStackSize: number;
  fireResistant: boolean;
  /** Player-head owner username (only used when baseItem is a player_head); "" = none. */
  headOwner: string;
}

export interface ItemConfig {
  /** Collection name (drives the namespace + sheet title). */
  title: string;
  items: ItemDef[];
  packFormat: number;
}

/** Minecraft named text colors (for name + lore pickers). */
export const MC_COLORS = [
  "white", "gray", "dark_gray", "black", "red", "gold", "yellow", "green", "dark_green",
  "aqua", "dark_aqua", "blue", "dark_blue", "light_purple", "dark_purple",
] as const;

export const RARITIES: Rarity[] = ["none", "common", "uncommon", "rare", "epic"];

/** Common enchantments: id (with namespace) + display name + max level. */
export const ENCHANTMENTS: { id: string; name: string; max: number }[] = [
  { id: "minecraft:sharpness", name: "Sharpness", max: 5 },
  { id: "minecraft:smite", name: "Smite", max: 5 },
  { id: "minecraft:bane_of_arthropods", name: "Bane of Arthropods", max: 5 },
  { id: "minecraft:knockback", name: "Knockback", max: 2 },
  { id: "minecraft:fire_aspect", name: "Fire Aspect", max: 2 },
  { id: "minecraft:looting", name: "Looting", max: 3 },
  { id: "minecraft:sweeping_edge", name: "Sweeping Edge", max: 3 },
  { id: "minecraft:unbreaking", name: "Unbreaking", max: 3 },
  { id: "minecraft:mending", name: "Mending", max: 1 },
  { id: "minecraft:efficiency", name: "Efficiency", max: 5 },
  { id: "minecraft:fortune", name: "Fortune", max: 3 },
  { id: "minecraft:silk_touch", name: "Silk Touch", max: 1 },
  { id: "minecraft:power", name: "Power", max: 5 },
  { id: "minecraft:punch", name: "Punch", max: 2 },
  { id: "minecraft:flame", name: "Flame", max: 1 },
  { id: "minecraft:infinity", name: "Infinity", max: 1 },
  { id: "minecraft:protection", name: "Protection", max: 4 },
  { id: "minecraft:fire_protection", name: "Fire Protection", max: 4 },
  { id: "minecraft:blast_protection", name: "Blast Protection", max: 4 },
  { id: "minecraft:projectile_protection", name: "Projectile Protection", max: 4 },
  { id: "minecraft:feather_falling", name: "Feather Falling", max: 4 },
  { id: "minecraft:thorns", name: "Thorns", max: 3 },
  { id: "minecraft:depth_strider", name: "Depth Strider", max: 3 },
  { id: "minecraft:respiration", name: "Respiration", max: 3 },
  { id: "minecraft:aqua_affinity", name: "Aqua Affinity", max: 1 },
  { id: "minecraft:soul_speed", name: "Soul Speed", max: 3 },
  { id: "minecraft:swift_sneak", name: "Swift Sneak", max: 3 },
  { id: "minecraft:lure", name: "Lure", max: 3 },
  { id: "minecraft:luck_of_the_sea", name: "Luck of the Sea", max: 3 },
];

/** Attributes in the "generic" category (uniform version-aware prefix handling). */
export const ATTRIBUTES: { type: string; name: string }[] = [
  { type: "max_health", name: "Max Health" },
  { type: "attack_damage", name: "Attack Damage" },
  { type: "attack_speed", name: "Attack Speed" },
  { type: "movement_speed", name: "Movement Speed" },
  { type: "armor", name: "Armor" },
  { type: "armor_toughness", name: "Armor Toughness" },
  { type: "knockback_resistance", name: "Knockback Resistance" },
  { type: "luck", name: "Luck" },
];

export const OPERATIONS = ["add_value", "add_multiplied_base", "add_multiplied_total"] as const;
export const SLOTS = ["any", "mainhand", "offhand", "hand", "head", "chest", "legs", "feet", "armor"] as const;

export function newItem(id: string, partial?: Partial<ItemDef>): ItemDef {
  return {
    id,
    baseItem: "minecraft:paper",
    name: "Custom Item",
    nameColor: "gold",
    nameFormat: { ...NO_FORMAT },
    lore: [],
    glint: false,
    count: 1,
    rarity: "none",
    customModelData: 0,
    unbreakable: false,
    enchantments: [],
    attributes: [],
    customDataKey: "",
    customDataValue: "",
    maxStackSize: 0,
    fireResistant: false,
    headOwner: "",
    ...partial,
  };
}
