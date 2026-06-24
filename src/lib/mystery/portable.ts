import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newMysteryConfig } from "./types";
import type { MysteryConfig } from "./types";

/** Round-trippable Mystery Hunt config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<MysteryConfig>({
  kind: "mystery",
  version: 1,
  defaults: () => newMysteryConfig(DEFAULT_VERSION.packFormat),
});

export const MYSTERY_PORTABLE_TYPE = portable.type;
export const toPortableMystery = portable.toPortable;
export const fromPortableMystery = portable.fromPortable;
export const normalizeMysteryConfig = portable.normalize;
