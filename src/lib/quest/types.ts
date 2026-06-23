import type { PokeType } from "../catalog/pokemon";
import type { RewardAction } from "../reward/actions";

/**
 * A branching questline that exports to BOTH a vanilla advancement tree (no mod) and
 * an FTB Quests chapter (.snbt). Tasks reuse the objective trigger catalog for the
 * Cobblemon-tracked kinds; item/location/manual are handled directly.
 */
export type TaskKind = "objective" | "item" | "location" | "manual";

export interface QuestTask {
  kind: TaskKind;
  // objective (Cobblemon advancement trigger)
  triggerId: string;
  count: number;
  pokemonType: PokeType | "any";
  species: string;
  level: number;
  // item (submit/have)
  itemId: string;
  itemCount: number;
  // location (reach a dimension)
  dimension: string;
}

export interface Quest {
  /** Short stable id used for file names + dependency references (e.g. "q1"). */
  id: string;
  title: string;
  description: string[];
  /** Item id shown as the quest icon. */
  icon: string;
  /** FTB layout position (the vanilla tree auto-lays out from parents). */
  x: number;
  y: number;
  /** Prerequisite quest ids (multiple = branching). */
  dependencies: string[];
  task: QuestTask;
  rewards: RewardAction[];
}

export interface QuestConfig {
  /** Questline / chapter title. */
  title: string;
  /** Chapter icon item id. */
  icon: string;
  quests: Quest[];
  /** Emit the vanilla advancement-tree datapack. */
  exportAdvancements: boolean;
  /** Emit the FTB Quests chapter .snbt (+ the advancements its Cobblemon tasks reference). */
  exportFtb: boolean;
  packFormat: number;
}

export function newTask(partial?: Partial<QuestTask>): QuestTask {
  return {
    kind: "objective",
    triggerId: "cobblemon:catch_pokemon",
    count: 5,
    pokemonType: "any",
    species: "",
    level: 50,
    itemId: "minecraft:diamond",
    itemCount: 1,
    dimension: "minecraft:overworld",
    ...partial,
  };
}

export function newQuest(id: string, partial?: Partial<Quest>): Quest {
  return {
    id,
    title: "New Quest",
    description: [],
    icon: "cobblemon:poke_ball",
    x: 0,
    y: 0,
    dependencies: [],
    task: newTask(),
    rewards: [],
    ...partial,
  };
}
