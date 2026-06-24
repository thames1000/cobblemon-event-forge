import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newTravelConfig } from "./types";
import type { TravelConfig } from "./types";

/** Round-trippable Safe Travel config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<TravelConfig>({
  kind: "travel",
  version: 1,
  defaults: () => newTravelConfig(DEFAULT_VERSION.packFormat),
});

export const TRAVEL_PORTABLE_TYPE = portable.type;
export const toPortableTravel = portable.toPortable;
export const fromPortableTravel = portable.fromPortable;
export const normalizeTravelConfig = portable.normalize;
