import { DEFAULT_VERSION } from "../datapack/packMeta";
import { findSpecies } from "./pokemon";
import type { PokeType } from "./pokemon";
import { newObjective } from "../objective/types";
import type { RewardAction } from "../reward/actions";
import type { EventConfig, LegendaryTrigger, WeatherTheme } from "../event/types";

/** Map a preset reward [id,count] to a RewardAction (CobbleDollars → command). */
function rewardActionFor(itemId: string, count: number): RewardAction {
  if (itemId === "cobbledollars") return { kind: "command", command: `cobbledollars add @s ${count}` };
  return { kind: "item", itemId, count };
}

/**
 * Event-type presets. Picking one pre-fills the Forge with a sensible, themed
 * starting point the owner can then tweak. Every field is editable afterwards —
 * the preset just removes the blank-page problem.
 */
export interface EventPreset {
  id: string;
  name: string;
  emoji: string;
  /** Tailwind accent (used for the card border / chip). */
  accent: string;
  tagline: string;
  weather: WeatherTheme;
  /** Suggested featured species ids. */
  featured: string[];
  /** Suggested objective lines. */
  objectives: string[];
  /** Suggested reward lines as [itemId, count]. */
  rewards: [string, number][];
}

export const EVENT_PRESETS: EventPreset[] = [
  {
    id: "legendary-hunt",
    name: "Legendary Hunt",
    emoji: "✨",
    accent: "amber",
    tagline: "A legendary roams. Track it down before the weekend ends.",
    weather: "thunder",
    featured: ["zapdos", "raikou", "entei"],
    objectives: ["Catch 20 Electric-types to draw out the legendary", "Capture the featured legendary"],
    rewards: [["obc:bottle_cap_gold", 1], ["cobblemon:ultra_ball", 10], ["cobbledollars", 5000]],
  },
  {
    id: "outbreak",
    name: "Outbreak Event",
    emoji: "🌐",
    accent: "rose",
    tagline: "A species is swarming the overworld. Cash in while it lasts.",
    weather: "any",
    featured: ["magikarp", "geodude", "caterpie"],
    objectives: ["Catch 30 of the outbreak species", "Catch a shiny outbreak Pokémon"],
    rewards: [["cobblemon:rare_candy", 5], ["cobblemon:great_ball", 15], ["cobbledollars", 3000]],
  },
  {
    id: "safari-weekend",
    name: "Safari Weekend",
    emoji: "🏕️",
    accent: "emerald",
    tagline: "A themed safari zone opens for the weekend only.",
    weather: "any",
    featured: ["scyther", "pinsir", "lapras"],
    objectives: ["Catch 10 Pokémon in the safari zone", "Catch one rare safari encounter"],
    rewards: [["cobblemon:ultra_ball", 10], ["obc:bottle_cap", 1], ["cobbledollars", 2500]],
  },
  {
    id: "fishing-tournament",
    name: "Fishing Tournament",
    emoji: "🎣",
    accent: "cyan",
    tagline: "Reel in the biggest haul. Water-types only.",
    weather: "rain",
    featured: ["magikarp", "gyarados", "lapras"],
    objectives: ["Catch 25 Water-types", "Catch a Gyarados"],
    rewards: [["cobblemon:great_ball", 10], ["cobblemon:rare_candy", 3], ["cobbledollars", 3000]],
  },
  {
    id: "bug-catching-contest",
    name: "Bug-Catching Contest",
    emoji: "🐛",
    accent: "lime",
    tagline: "Classic contest rules. Most impressive bug wins.",
    weather: "clear",
    featured: ["caterpie", "scyther", "pinsir"],
    objectives: ["Catch 15 Bug-types", "Catch a Scyther or Pinsir"],
    rewards: [["cobblemon:exp_candy_xl", 3], ["cobblemon:great_ball", 10], ["cobbledollars", 2000]],
  },
  {
    id: "boss-raid",
    name: "Boss Raid Weekend",
    emoji: "💥",
    accent: "red",
    tagline: "A boss Pokémon appears. Team up to take it down.",
    weather: "thunder",
    featured: ["tyranitar", "garchomp", "gyarados"],
    objectives: ["Defeat 5 boss-tier Pokémon", "Land the final blow on the weekend boss"],
    rewards: [["cobblemon:master_ball", 1], ["obc:bottle_cap_gold", 1], ["cobbledollars", 8000]],
  },
  {
    id: "shiny-race",
    name: "Shiny Race",
    emoji: "🌟",
    accent: "fuchsia",
    tagline: "First to a shiny wins. Everyone else still gets paid.",
    weather: "any",
    featured: ["pikachu", "dratini", "growlithe"],
    objectives: ["Catch any shiny Pokémon", "Be the first server-wide shiny of the event"],
    rewards: [["obc:bottle_cap_gold", 1], ["cobblemon:ability_capsule", 1], ["cobbledollars", 6000]],
  },
  {
    id: "blank",
    name: "Custom Event",
    emoji: "🎛️",
    accent: "slate",
    tagline: "Start from scratch and build whatever you want.",
    weather: "any",
    featured: [],
    objectives: [],
    rewards: [],
  },
];

const BY_ID = new Map(EVENT_PRESETS.map((p) => [p.id, p]));
export function findPreset(id: string): EventPreset | undefined {
  return BY_ID.get(id);
}

/** Default spawn level range and weight per bucket. */
const BUCKET_DEFAULTS: Record<string, { weight: number; level: string }> = {
  common: { weight: 60, level: "10-30" },
  uncommon: { weight: 30, level: "15-35" },
  rare: { weight: 8, level: "25-45" },
  "ultra-rare": { weight: 1, level: "40-60" },
};

/** Most common primary elemental type among a list of species ids. */
function dominantType(speciesIds: string[]): PokeType | "any" {
  const counts: Partial<Record<PokeType, number>> = {};
  let best: PokeType | "any" = "any";
  let bestN = 0;
  for (const id of speciesIds) {
    const t = findSpecies(id)?.types[0];
    if (!t) continue;
    const n = (counts[t] ?? 0) + 1;
    counts[t] = n;
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  }
  return best;
}

/** Highest level in a "min-max" range, defaulting to 70 for a legendary. */
function topLevel(range: string | undefined): number {
  const m = range?.match(/-(\d+)\s*$/);
  return m ? Number(m[1]) : 70;
}

/** Derive a sensible legendary auto-spawn trigger from a preset's featured list. */
function defaultTrigger(presetId: string, featured: EventConfig["featured"]): LegendaryTrigger {
  // prefer an actual legendary headliner; fall back to the first featured mon
  const legendaryMon = featured.find((f) => findSpecies(f.species)?.legendary) ?? featured[0];
  const enabled = (presetId === "legendary-hunt" || presetId === "boss-raid") && !!legendaryMon;
  return {
    enabled,
    legendary: legendaryMon?.species ?? "",
    type: dominantType(featured.map((f) => f.species)),
    count: 20,
    level: topLevel(legendaryMon?.level),
    scope: "per-player",
  };
}

/** Build a fresh EventConfig from a preset id. */
export function configFromPreset(presetId: string): EventConfig {
  const p = findPreset(presetId) ?? EVENT_PRESETS[0];
  const featured = p.featured.map((species, i) => {
    // headliner #1 stays rarer if it's clearly a legendary slot
    const bucket = i === 0 && p.id === "legendary-hunt" ? "ultra-rare" : i === 0 ? "uncommon" : "rare";
    const d = BUCKET_DEFAULTS[bucket];
    return { species, bucket: bucket as EventConfig["featured"][number]["bucket"], weight: d.weight, level: d.level };
  });
  return {
    presetId: p.id,
    title: p.id === "blank" ? "" : `${p.name}`,
    duration: "Friday 6 PM – Sunday 11 PM",
    blurb: p.tagline,
    weather: p.weather,
    featured,
    objectives: p.objectives.map((text, i) => newObjective(`b${i + 1}`, { label: text })),
    rewardTiers: [
      { id: "participation", name: "Participation", actions: [{ kind: "item", itemId: "cobblemon:poke_ball", count: 5 }] },
      { id: "winner", name: "Winner", actions: p.rewards.map(([itemId, count]) => rewardActionFor(itemId, count)) },
    ],
    legendaryTrigger: defaultTrigger(p.id, featured),
    pack: {
      includeLoad: true,
      includeUninstall: true,
      enableFlag: true,
      testBroadcast: false,
      advancedTimedLogic: false,
    },
    packFormat: DEFAULT_VERSION.packFormat,
  };
}

export { BUCKET_DEFAULTS };
