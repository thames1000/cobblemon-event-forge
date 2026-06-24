import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newLeaderboardConfig } from "./types";
import type { LeaderboardConfig } from "./types";

/** Round-trippable Leaderboard config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<LeaderboardConfig>({
  kind: "leaderboard",
  version: 1,
  defaults: () => newLeaderboardConfig(DEFAULT_VERSION.packFormat),
});

export const LEADERBOARD_PORTABLE_TYPE = portable.type;
export const toPortableLeaderboard = portable.toPortable;
export const fromPortableLeaderboard = portable.fromPortable;
export const normalizeLeaderboardConfig = portable.normalize;
