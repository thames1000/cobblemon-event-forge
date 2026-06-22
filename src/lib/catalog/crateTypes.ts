import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { CrateConfig, CrateTier } from "../crate/types";

/**
 * Reward-crate presets. Each tier maps to a loot pool; picking a preset gives a
 * balanced starting point the owner can edit. Tiers follow the brainstorm's
 * Common / Rare / Ultra-Rare shape. `emptyWeight` on the rarer tiers makes them
 * a *chance* — e.g. an Ultra-Rare tier that pays out roughly 1 open in 10.
 *
 * Entries are [itemId, count, weight]. Currency is intentionally absent: loot
 * tables hand out real items only.
 */
interface PresetTier {
  name: string;
  rolls: number;
  emptyWeight: number;
  entries: [string, string, number][];
}

export interface CratePreset {
  id: string;
  name: string;
  emoji: string;
  accent: string;
  tagline: string;
  tiers: PresetTier[];
}

const COMMON = (entries: [string, string, number][]): PresetTier => ({ name: "Common", rolls: 2, emptyWeight: 0, entries });
const RARE = (entries: [string, string, number][]): PresetTier => ({ name: "Rare", rolls: 1, emptyWeight: 0, entries });
const ULTRA = (entries: [string, string, number][]): PresetTier => ({ name: "Ultra-Rare", rolls: 1, emptyWeight: 85, entries });

export const CRATE_PRESETS: CratePreset[] = [
  {
    id: "safari-crate",
    name: "Safari Crate",
    emoji: "🏕️",
    accent: "emerald",
    tagline: "Weekend Safari payout.",
    tiers: [
      COMMON([
        ["cobblemon:ultra_ball", "10", 60],
        ["cobblemon:rare_candy", "2", 40],
      ]),
      RARE([
        ["obc:bottle_cap", "1", 50],
        ["cobblemon:ability_capsule", "1", 30],
        ["cobblemon:choice_scarf", "1", 20],
      ]),
      ULTRA([
        ["obc:bottle_cap_gold", "1", 70],
        ["cobblemon:master_ball", "1", 30],
      ]),
    ],
  },
  {
    id: "daily-crate",
    name: "Daily Crate",
    emoji: "📅",
    accent: "sky",
    tagline: "Small daily login reward.",
    tiers: [
      COMMON([
        ["cobblemon:poke_ball", "5", 50],
        ["cobblemon:potion", "3", 30],
        ["cobblemon:great_ball", "3", 20],
      ]),
      RARE([
        ["cobblemon:rare_candy", "1", 60],
        ["cobblemon:exp_candy_xl", "1", 40],
      ]),
    ],
  },
  {
    id: "battle-crate",
    name: "Battle Crate",
    emoji: "⚔️",
    accent: "red",
    tagline: "Battle Tower / Factory rewards.",
    tiers: [
      COMMON([
        ["cobblemon:hyper_potion", "3", 50],
        ["cobblemon:ultra_ball", "5", 50],
      ]),
      RARE([
        ["cobblemon:choice_scarf", "1", 40],
        ["cobblemon:ability_capsule", "1", 35],
        ["obc:bottle_cap", "1", 25],
      ]),
      ULTRA([["obc:bottle_cap_gold", "1", 100]]),
    ],
  },
  {
    id: "fishing-crate",
    name: "Fishing Crate",
    emoji: "🎣",
    accent: "cyan",
    tagline: "Tournament fishing haul.",
    tiers: [
      COMMON([
        ["cobblemon:great_ball", "5", 60],
        ["cobblemon:rare_candy", "2", 40],
      ]),
      RARE([
        ["obc:bottle_cap", "1", 60],
        ["minecraft:diamond", "3", 40],
      ]),
    ],
  },
  {
    id: "legendary-crate",
    name: "Legendary Hunt Crate",
    emoji: "✨",
    accent: "amber",
    tagline: "Top-tier legendary event payout.",
    tiers: [
      COMMON([
        ["cobblemon:ultra_ball", "15", 100],
      ]),
      RARE([
        ["obc:bottle_cap", "2", 50],
        ["cobblemon:ability_capsule", "1", 50],
      ]),
      ULTRA([
        ["cobblemon:master_ball", "1", 60],
        ["obc:bottle_cap_gold", "1", 40],
      ]),
    ],
  },
  {
    id: "shiny-crate",
    name: "Shiny Hunter Crate",
    emoji: "🌟",
    accent: "fuchsia",
    tagline: "For the dedicated shiny hunters.",
    tiers: [
      COMMON([
        ["cobblemon:premier_ball", "10", 100],
      ]),
      RARE([
        ["cobblemon:exp_candy_xl", "2", 50],
        ["cobblemon:rare_candy", "3", 50],
      ]),
      ULTRA([
        ["obc:bottle_cap_gold", "1", 100],
      ]),
    ],
  },
  {
    id: "blank-crate",
    name: "Custom Crate",
    emoji: "🎛️",
    accent: "slate",
    tagline: "Start from scratch.",
    tiers: [{ name: "Common", rolls: 1, emptyWeight: 0, entries: [] }],
  },
];

const BY_ID = new Map(CRATE_PRESETS.map((p) => [p.id, p]));
export function findCratePreset(id: string): CratePreset | undefined {
  return BY_ID.get(id);
}

export function configFromCratePreset(presetId: string): CrateConfig {
  const p = findCratePreset(presetId) ?? CRATE_PRESETS[0];
  const tiers: CrateTier[] = p.tiers.map((t, i) => ({
    id: `tier_${i + 1}`,
    name: t.name,
    rolls: t.rolls,
    emptyWeight: t.emptyWeight,
    entries: t.entries.map(([itemId, count, weight]) => ({ itemId, count, weight })),
  }));
  return {
    presetId: p.id,
    title: p.id === "blank-crate" ? "" : p.name,
    blurb: p.tagline,
    tiers,
    key: {
      enabled: true,
      baseItem: "minecraft:nether_star",
      glint: true,
      lore: "Right-click & hold to open",
      consumeSeconds: 0.6,
    },
    packFormat: DEFAULT_VERSION.packFormat,
  };
}

/** Inert items that work well as crate-key icons (no conflicting right-click action). */
export const KEY_ICONS: { id: string; name: string }[] = [
  { id: "minecraft:nether_star", name: "Nether Star" },
  { id: "minecraft:echo_shard", name: "Echo Shard" },
  { id: "minecraft:heart_of_the_sea", name: "Heart of the Sea" },
  { id: "minecraft:nautilus_shell", name: "Nautilus Shell" },
  { id: "minecraft:popped_chorus_fruit", name: "Popped Chorus Fruit" },
  { id: "minecraft:prismarine_crystals", name: "Prismarine Crystals" },
  { id: "minecraft:emerald", name: "Emerald" },
  { id: "minecraft:gold_ingot", name: "Gold Ingot" },
  { id: "minecraft:paper", name: "Paper (ticket)" },
  { id: "minecraft:name_tag", name: "Name Tag" },
];
