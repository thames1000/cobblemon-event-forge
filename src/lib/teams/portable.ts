import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newTeamsConfig } from "./types";
import type { TeamsConfig } from "./types";

/** Round-trippable Team vs Team config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<TeamsConfig>({
  kind: "teams",
  version: 1,
  defaults: () => newTeamsConfig(DEFAULT_VERSION.packFormat),
});

export const TEAMS_PORTABLE_TYPE = portable.type;
export const toPortableTeams = portable.toPortable;
export const fromPortableTeams = portable.fromPortable;
export const normalizeTeamsConfig = portable.normalize;
