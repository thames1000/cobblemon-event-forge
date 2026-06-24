import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { BattleConfig } from "./types";

/** Round-trippable Battle Factory config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<BattleConfig>({
  kind: "battle",
  version: 1,
  defaults: (): BattleConfig => ({
    title: "Battle Factory",
    format: "singles",
    level: 50,
    teamSize: 3,
    poolSize: 60,
    draftMode: "runtime",
    theme: "balanced",
    themeType: "fire",
    difficulty: "competitive",
    seed: 1,
    bannedSpecies: [],
    clauses: [],
    draftItem: true,
    packFormat: DEFAULT_VERSION.packFormat,
  }),
});

export const BATTLE_PORTABLE_TYPE = portable.type;
export const toPortableBattle = portable.toPortable;
export const fromPortableBattle = portable.fromPortable;
export const normalizeBattleConfig = portable.normalize;
