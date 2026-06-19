/**
 * Core datapack primitives shared by every generator.
 *
 * A `Datapack` is just a namespace + a flat list of files. Generators (events,
 * crates, safari zones, ...) all produce `GeneratedFile[]`, which then get
 * validated and zipped. Keeping this representation dumb and flat makes the
 * validator and the zipper trivial and lets the UI preview any single file.
 */

/** One file destined for the output zip. `path` is relative to the zip root. */
export interface GeneratedFile {
  /** e.g. "data/electric_storm/spawn_pool_world/pikachu.json" */
  path: string;
  /** UTF-8 text contents. */
  contents: string;
  /**
   * Where this file is meant to go / what it's for. Drives the UI preview
   * grouping and the admin checklist ("put this in the datapack", "run this
   * command", "paste this in Discord").
   */
  kind: FileKind;
  /** Human label for the preview tab, e.g. "Pikachu spawn". */
  label: string;
}

export type FileKind =
  | "pack-meta" // pack.mcmeta
  | "spawn" // Cobblemon spawn_pool_world JSON
  | "function" // .mcfunction
  | "loot-table" // datapack loot table JSON
  | "advancement" // datapack advancement JSON (catch trigger)
  | "tag" // datapack tag JSON (e.g. minecraft:load)
  | "bounties" // event_bounties.json (owner-side data)
  | "discord" // discord_announcement.md
  | "checklist" // admin_checklist.txt
  | "readme"; // human notes

/** Which generated files actually belong inside the datapack zip. */
export const DATAPACK_KINDS: ReadonlySet<FileKind> = new Set<FileKind>([
  "pack-meta",
  "spawn",
  "function",
  "loot-table",
  "advancement",
  "tag",
]);

export interface Datapack {
  namespace: string;
  /** Friendly pack name shown in the world's datapack list. */
  name: string;
  description: string;
  /** Datapack pack_format for the target Minecraft version. */
  packFormat: number;
  files: GeneratedFile[];
}

/** A full bundle: the datapack plus the side-car files (discord, checklist). */
export interface Bundle {
  /** Base file name (no extension), e.g. "electric_storm_weekend". */
  slug: string;
  /** Display title, e.g. "Electric Storm Weekend". */
  title: string;
  namespace: string;
  packFormat: number;
  /** Every file we produced, datapack and side-car alike. */
  files: GeneratedFile[];
}
