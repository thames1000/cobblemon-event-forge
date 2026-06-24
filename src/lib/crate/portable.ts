import { makePortable } from "../portable";
import { configFromCratePreset } from "../catalog/crateTypes";
import type { CrateConfig } from "./types";

/** Round-trippable Reward Crate config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<CrateConfig>({
  kind: "crate",
  version: 1,
  defaults: () => configFromCratePreset("safari-crate"),
});

export const CRATE_PORTABLE_TYPE = portable.type;
export const toPortableCrate = portable.toPortable;
export const fromPortableCrate = portable.fromPortable;
export const normalizeCrateConfig = portable.normalize;
