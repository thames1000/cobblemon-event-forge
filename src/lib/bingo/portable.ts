import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newBingoConfig } from "./board";
import type { BingoConfig } from "./board";

/** Round-trippable Bingo board config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<BingoConfig>({
  kind: "bingo",
  version: 1,
  defaults: () => newBingoConfig(DEFAULT_VERSION.packFormat),
});

export const BINGO_PORTABLE_TYPE = portable.type;
export const toPortableBingo = portable.toPortable;
export const fromPortableBingo = portable.fromPortable;
export const normalizeBingoConfig = portable.normalize;
