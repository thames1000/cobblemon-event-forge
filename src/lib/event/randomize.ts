import { EVENT_PRESETS, configFromPreset } from "../catalog/eventTypes";
import { POKEMON, ALL_TYPES } from "../catalog/pokemon";
import { newObjective } from "../objective/types";
import { TRIGGERS } from "../objective/triggers";
import type { EventConfig, Bucket } from "./types";
import type { RewardAction } from "../reward/actions";

/**
 * "Generate Full Event" — fills a complete EventConfig (title, featured spawns,
 * auto objectives, tiered rewards, weather) scaled by difficulty. Pure
 * browser-side (uses Math.random); only ever called from a click handler.
 */
export type Difficulty = "casual" | "normal" | "hard" | "chaos";

export const DIFFICULTIES: { id: Difficulty; label: string; emoji: string }[] = [
  { id: "casual", label: "Casual", emoji: "🌱" },
  { id: "normal", label: "Normal", emoji: "⚖️" },
  { id: "hard", label: "Hard", emoji: "🔥" },
  { id: "chaos", label: "Chaos", emoji: "💥" },
];

interface DiffParams {
  objectives: number;
  featured: number;
  countMul: number; // scales objective target counts
  rewardMul: number; // scales reward quantities
  rewardsPerObjective: number;
  champion: boolean; // add a Champion tier
}

const PARAMS: Record<Difficulty, DiffParams> = {
  casual: { objectives: 2, featured: 3, countMul: 0.6, rewardMul: 0.6, rewardsPerObjective: 1, champion: false },
  normal: { objectives: 3, featured: 4, countMul: 1, rewardMul: 1, rewardsPerObjective: 1, champion: false },
  hard: { objectives: 4, featured: 5, countMul: 1.6, rewardMul: 1.6, rewardsPerObjective: 2, champion: true },
  chaos: { objectives: 5, featured: 6, countMul: 2.6, rewardMul: 2.6, rewardsPerObjective: 2, champion: true },
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

const ADJECTIVES = ["Wild", "Blazing", "Frenzied", "Epic", "Stormy", "Mega", "Golden", "Feral", "Cosmic"];
const ITEM_POOL = [
  "cobblemon:rare_candy",
  "cobblemon:ultra_ball",
  "cobblemon:great_ball",
  "obc:bottle_cap",
  "cobblemon:exp_candy_xl",
  "cobblemon:ability_capsule",
  "cobblemon:choice_scarf",
];

function scaledCount(base: number, mul: number): number {
  return Math.max(1, Math.round(base * mul));
}

function randomReward(theme: string, mul: number): RewardAction {
  const roll = Math.random();
  if (roll < 0.15) return { kind: "crate-key", crateName: `${theme} Crate`, baseItem: "minecraft:nether_star", glint: true };
  if (roll < 0.3) return { kind: "spawn", species: pick(POKEMON).id, level: randInt(20, 45) };
  return { kind: "item", itemId: pick(ITEM_POOL), count: scaledCount(randInt(1, 4), mul) };
}

/** Build a random auto objective using one of the supported triggers. */
function randomObjective(id: string, p: DiffParams, theme: string, announce: boolean) {
  const t = pick(TRIGGERS);
  const o = newObjective(id, { mode: "auto", triggerId: t.id, announce });
  if (t.usesLevel) {
    o.level = randInt(40, 80);
  } else {
    o.count = scaledCount(t.id === "cobblemon:catch_shiny_pokemon" ? randInt(1, 3) : randInt(8, 25), p.countMul);
  }
  if (t.usesType && Math.random() < 0.7) o.pokemonType = pick(ALL_TYPES);
  o.rewards = Array.from({ length: p.rewardsPerObjective }, () => randomReward(theme, p.rewardMul));
  return o;
}

export function randomEvent(difficulty: Difficulty): EventConfig {
  const p = PARAMS[difficulty];
  const preset = pick(EVENT_PRESETS.filter((x) => x.id !== "blank"));
  const cfg = configFromPreset(preset.id);

  const theme = preset.name.replace(/ (Event|Weekend|Night|Contest|Hunt)$/i, "");
  cfg.title = `${pick(ADJECTIVES)} ${preset.name}`;
  cfg.weather = pick(["any", "clear", "rain", "thunder"] as const);

  // featured spawns
  const mons = sample(POKEMON, p.featured);
  cfg.featured = mons.map((m, i) => {
    const bucket: Bucket = i === 0 ? "uncommon" : i < 3 ? "rare" : "ultra-rare";
    const top = bucket === "uncommon" ? 35 : bucket === "rare" ? 50 : 60;
    return { species: m.id, bucket, weight: bucket === "uncommon" ? 30 : bucket === "rare" ? 8 : 1, level: `${top - 20}-${top}` };
  });

  // objectives (announce more on higher difficulty)
  cfg.objectives = Array.from({ length: p.objectives }, (_, i) =>
    randomObjective(`b${i + 1}`, p, theme, difficulty === "hard" || difficulty === "chaos"),
  );

  // tiered rewards
  const winnerCount = difficulty === "chaos" ? 3 : 2;
  cfg.rewardTiers = [
    { id: "participation", name: "Participation", actions: [{ kind: "item", itemId: "cobblemon:poke_ball", count: scaledCount(5, p.rewardMul) }] },
    { id: "winner", name: "Winner", actions: Array.from({ length: winnerCount }, () => randomReward(theme, p.rewardMul)) },
  ];
  if (p.champion) {
    cfg.rewardTiers.push({
      id: "champion",
      name: "Champion",
      actions: [
        { kind: "item", itemId: "obc:bottle_cap_gold", count: 1 },
        randomReward(theme, p.rewardMul),
      ],
    });
  }

  // optionally crown it with a legendary auto-spawn
  const legendaries = POKEMON.filter((m) => m.legendary);
  if ((difficulty === "hard" || difficulty === "chaos") && legendaries.length) {
    const leg = pick(legendaries);
    cfg.legendaryTrigger = {
      enabled: true,
      legendary: leg.id,
      type: mons[0]?.types[0] ?? "any",
      count: scaledCount(20, p.countMul),
      level: randInt(60, 80),
      scope: difficulty === "chaos" ? "server-wide" : "per-player",
    };
  }

  return cfg;
}
