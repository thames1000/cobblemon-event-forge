import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { PokeType } from "./pokemon";
import type { SafariConfig } from "../safari/types";
import type { WeatherTheme } from "../event/types";

/**
 * Safari Zone themes. Picking one pre-fills tiered spawns, biomes, weather, rules
 * and a reward type. Species ids come from the Pokémon catalog; everything is
 * editable afterwards.
 */
export interface SafariTheme {
  id: string;
  name: string;
  emoji: string;
  accent: string;
  blurb: string;
  common: string[];
  rare: string[];
  ultraRare: string[];
  biomes: string[];
  /** Concrete biome for a single-biome arena (kept inside the spawn `biomes` tag). */
  arenaBiome: string;
  weather: WeatherTheme;
  rules: string[];
  rewardType: PokeType | "any";
}

const COMMON_RULES = ["30-minute entry per ticket", "No Master Balls", "No flying mounts inside the zone"];

export const SAFARI_THEMES: SafariTheme[] = [
  {
    id: "haunted-woods",
    name: "Haunted Woods",
    emoji: "👻",
    accent: "violet",
    blurb: "A fog-choked forest where ghosts drift between the trees.",
    common: ["gastly", "shuppet", "phantump"],
    rare: ["mimikyu", "dreepy"],
    ultraRare: ["marshadow"],
    biomes: ["#minecraft:is_forest"],
    arenaBiome: "minecraft:dark_forest",
    weather: "any",
    rules: [...COMMON_RULES, "Reward for catching 10 Ghost-types"],
    rewardType: "ghost",
  },
  {
    id: "volcanic",
    name: "Volcanic Crater",
    emoji: "🌋",
    accent: "orange",
    blurb: "Scorched badlands crawling with Fire-types.",
    common: ["growlithe", "magmar"],
    rare: ["charmander"],
    ultraRare: ["moltres", "entei"],
    biomes: ["minecraft:badlands", "minecraft:desert"],
    arenaBiome: "minecraft:badlands",
    weather: "clear",
    rules: [...COMMON_RULES, "Bring burn heal — it's hot out here"],
    rewardType: "fire",
  },
  {
    id: "frozen-lake",
    name: "Frozen Lake",
    emoji: "❄️",
    accent: "cyan",
    blurb: "An icy shoreline where Water and Ice Pokémon gather.",
    common: ["magikarp", "lapras"],
    rare: ["gyarados"],
    ultraRare: ["suicune"],
    biomes: ["minecraft:frozen_river", "#minecraft:is_river"],
    arenaBiome: "minecraft:frozen_river",
    weather: "rain",
    rules: [...COMMON_RULES, "Reward for catching 10 Water-types"],
    rewardType: "water",
  },
  {
    id: "fossil-canyon",
    name: "Fossil Canyon",
    emoji: "🦴",
    accent: "amber",
    blurb: "Wind-carved canyons hiding ancient Rock-types.",
    common: ["geodude", "onix"],
    rare: ["aerodactyl"],
    ultraRare: ["tyranitar"],
    biomes: ["minecraft:badlands", "#minecraft:is_hill"],
    arenaBiome: "minecraft:eroded_badlands",
    weather: "clear",
    rules: [...COMMON_RULES, "Reward for catching 10 Rock-types"],
    rewardType: "rock",
  },
  {
    id: "dragon-highlands",
    name: "Dragon Highlands",
    emoji: "🐉",
    accent: "indigo",
    blurb: "Towering peaks where Dragons make their nests.",
    common: ["dratini", "bagon"],
    rare: ["garchomp"],
    ultraRare: ["rayquaza"],
    biomes: ["#minecraft:is_mountain"],
    arenaBiome: "minecraft:jagged_peaks",
    weather: "thunder",
    rules: [...COMMON_RULES, "Reward for catching 8 Dragon-types"],
    rewardType: "dragon",
  },
  {
    id: "bug-thicket",
    name: "Bug Thicket",
    emoji: "🐛",
    accent: "lime",
    blurb: "A buzzing thicket alive with Bug-types.",
    common: ["caterpie", "scyther"],
    rare: ["pinsir"],
    ultraRare: ["scizor"],
    biomes: ["#minecraft:is_forest", "minecraft:jungle"],
    arenaBiome: "minecraft:jungle",
    weather: "clear",
    rules: [...COMMON_RULES, "Reward for catching 12 Bug-types"],
    rewardType: "bug",
  },
  {
    id: "blank",
    name: "Custom Zone",
    emoji: "🏕️",
    accent: "slate",
    blurb: "Start from scratch and build your own safari.",
    common: [],
    rare: [],
    ultraRare: [],
    biomes: [],
    arenaBiome: "minecraft:plains",
    weather: "any",
    rules: [...COMMON_RULES],
    rewardType: "any",
  },
];

const BY_ID = new Map(SAFARI_THEMES.map((t) => [t.id, t]));
export function findSafariTheme(id: string): SafariTheme | undefined {
  return BY_ID.get(id);
}

const REWARD_COUNT_BY_TYPE = 10;

export function configFromSafariTheme(themeId: string): SafariConfig {
  const t = findSafariTheme(themeId) ?? SAFARI_THEMES[0];
  return {
    title: t.id === "blank" ? "" : `${t.name} Safari`,
    blurb: t.blurb,
    themeId: t.id,
    common: [...t.common],
    rare: [...t.rare],
    ultraRare: [...t.ultraRare],
    biomes: [...t.biomes],
    weather: t.weather,
    arena: { enabled: true, mode: "single-biome", mirror: "minecraft:overworld", biome: t.arenaBiome },
    ticket: { enabled: true, baseItem: "minecraft:name_tag", glint: true },
    safariBalls: 30,
    timeLimitMinutes: 30,
    timer: { enabled: true, warnings: [15, 5, 1] },
    rules: [...t.rules],
    reward: {
      enabled: t.rewardType !== "any",
      type: t.rewardType,
      count: REWARD_COUNT_BY_TYPE,
      rewards: [
        { kind: "item", itemId: "cobblemon:rare_candy", count: 3 },
        { kind: "crate-key", crateName: `${t.name} Crate`, baseItem: "minecraft:nether_star", glint: true },
      ],
    },
    packFormat: DEFAULT_VERSION.packFormat,
  };
}
