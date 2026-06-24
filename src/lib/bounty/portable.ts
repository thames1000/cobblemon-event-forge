import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { BountyConfig } from "./types";

/** Round-trippable Bounty Board config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<BountyConfig>({
  kind: "bounty",
  version: 1,
  defaults: (): BountyConfig => ({
    title: "Bounty Board",
    daily: [],
    weekly: [],
    special: [],
    community: [],
    boardItem: true,
    packFormat: DEFAULT_VERSION.packFormat,
  }),
});

export const BOUNTY_PORTABLE_TYPE = portable.type;
export const toPortableBounty = portable.toPortable;
export const fromPortableBounty = portable.fromPortable;
export const normalizeBountyConfig = portable.normalize;
