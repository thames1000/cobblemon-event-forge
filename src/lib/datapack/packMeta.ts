import type { GeneratedFile } from "./types";

/**
 * Datapack `pack_format` values per Minecraft version. Datapacks are version
 * sensitive: load one with the wrong format and the world rejects it. We expose
 * a short menu of the versions Cobbleverse realistically runs on.
 *
 * Source: minecraft.wiki "Pack format" table. Values are the *data* pack format
 * (not the resource pack format, which differs).
 */
export interface McVersion {
  label: string;
  /** Minecraft version id, e.g. "1.21.1". */
  mc: string;
  packFormat: number;
}

// Only 1.21+ is offered: that's where Cobbleverse lives, and where the datapack
// folders are singular (function/, advancement/, loot_table/). Keeping the menu
// here means every generated pack uses the same, correct folder layout.
export const MC_VERSIONS: McVersion[] = [
  { label: "1.21 / 1.21.1", mc: "1.21.1", packFormat: 48 },
  { label: "1.21.2 / 1.21.3", mc: "1.21.3", packFormat: 57 },
  { label: "1.21.4", mc: "1.21.4", packFormat: 61 },
  { label: "1.21.5", mc: "1.21.5", packFormat: 71 },
];

/** Cobbleverse currently tracks Cobblemon on 1.21.1, so default there. */
export const DEFAULT_VERSION: McVersion = MC_VERSIONS[0];

export function versionForFormat(packFormat: number): McVersion | undefined {
  return MC_VERSIONS.find((v) => v.packFormat === packFormat);
}

/**
 * Build pack.mcmeta. We include `supported_formats` as a small range so the
 * pack doesn't get loudly rejected on neighbouring point releases.
 */
export function buildPackMeta(opts: {
  description: string;
  packFormat: number;
}): GeneratedFile {
  const meta = {
    pack: {
      pack_format: opts.packFormat,
      description: opts.description,
      supported_formats: {
        min_inclusive: opts.packFormat,
        max_inclusive: opts.packFormat + 9,
      },
    },
  };
  return {
    path: "pack.mcmeta",
    contents: JSON.stringify(meta, null, 2),
    kind: "pack-meta",
    label: "pack.mcmeta",
  };
}
