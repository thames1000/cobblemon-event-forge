import { zipSync, strToU8 } from "fflate";
import type { GeneratedFile } from "./types";
import { DATAPACK_KINDS } from "./types";

/**
 * Pack the datapack-bound files into a .zip (Uint8Array). Only files whose kind
 * belongs inside a datapack are included; side-car files (discord, checklist,
 * bounties) are delivered separately so the owner doesn't accidentally ship a
 * Discord post to the server.
 */
export function zipDatapack(files: GeneratedFile[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    if (!DATAPACK_KINDS.has(f.kind)) continue;
    entries[f.path] = strToU8(f.contents);
  }
  // mtime omitted on purpose: deterministic zips diff cleanly between exports.
  return zipSync(entries, { level: 6 });
}

/** Zip absolutely everything (datapack + side-cars) under a folder. */
export function zipAll(folder: string, files: GeneratedFile[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    const top = DATAPACK_KINDS.has(f.kind) ? `${folder}/datapack` : folder;
    entries[`${top}/${f.path}`] = strToU8(f.contents);
  }
  return zipSync(entries, { level: 6 });
}
