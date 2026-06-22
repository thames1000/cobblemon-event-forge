/** Item Designer types: a library of custom named/lore items on top of base items. */

export interface LoreLine {
  text: string;
  color: string; // Minecraft color name
}

export type Rarity = "none" | "common" | "uncommon" | "rare" | "epic";

export interface ItemDef {
  id: string;
  /** Base item id, e.g. "minecraft:paper" / "cobblemon:poke_ball". */
  baseItem: string;
  /** Display name (item_name component — no italics). */
  name: string;
  nameColor: string;
  lore: LoreLine[];
  glint: boolean;
  /** Stack count for the /give command. */
  count: number;
  rarity: Rarity;
  /** Resource-pack model id; 0 = none. (Version-aware: int <1.21.4, floats list after.) */
  customModelData: number;
  unbreakable: boolean;
}

export interface ItemConfig {
  /** Collection name (drives the namespace + sheet title). */
  title: string;
  items: ItemDef[];
  packFormat: number;
}

/** Minecraft named text colors (for name + lore pickers). */
export const MC_COLORS = [
  "white",
  "gray",
  "dark_gray",
  "black",
  "red",
  "gold",
  "yellow",
  "green",
  "dark_green",
  "aqua",
  "dark_aqua",
  "blue",
  "dark_blue",
  "light_purple",
  "dark_purple",
] as const;

export const RARITIES: Rarity[] = ["none", "common", "uncommon", "rare", "epic"];

export function newItem(id: string, partial?: Partial<ItemDef>): ItemDef {
  return {
    id,
    baseItem: "minecraft:paper",
    name: "Custom Item",
    nameColor: "gold",
    lore: [],
    glint: false,
    count: 1,
    rarity: "none",
    customModelData: 0,
    unbreakable: false,
    ...partial,
  };
}
