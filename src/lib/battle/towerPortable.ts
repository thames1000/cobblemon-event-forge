import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { TowerConfig } from "./tower";

/** Round-trippable NPC Battle Tower config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<TowerConfig>({
  kind: "tower",
  version: 1,
  defaults: (): TowerConfig => ({
    title: "Battle Tower",
    floors: 10,
    scope: "type",
    trainerType: "NORMAL",
    trainerIds: [],
    perFloorReward: [],
    milestones: [],
    packFormat: DEFAULT_VERSION.packFormat,
  }),
});

export const TOWER_PORTABLE_TYPE = portable.type;
export const toPortableTower = portable.toPortable;
export const fromPortableTower = portable.fromPortable;
export const normalizeTowerConfig = portable.normalize;
