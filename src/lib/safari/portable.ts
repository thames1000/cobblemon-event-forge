import { makePortable } from "../portable";
import { configFromSafariTheme } from "../catalog/safariThemes";
import type { SafariConfig } from "./types";

/** Round-trippable Safari Zone config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<SafariConfig>({
  kind: "safari",
  version: 1,
  defaults: () => configFromSafariTheme("haunted-woods"),
});

export const SAFARI_PORTABLE_TYPE = portable.type;
export const toPortableSafari = portable.toPortable;
export const fromPortableSafari = portable.fromPortable;
export const normalizeSafariConfig = portable.normalize;
