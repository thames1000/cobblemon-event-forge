import type { GeneratedFile } from "./types";
import type { CrateTier } from "../crate/types";
import { toId } from "./sanitize";

/**
 * Minecraft loot-table generation for reward crates.
 *
 * A crate is a loot table with one *pool per tier*. Each pool rolls `rolls`
 * times; on each roll an entry is chosen weighted by `weight`. A tier can also
 * carry an `emptyWeight` (a `minecraft:empty` entry) so rarer tiers only
 * *sometimes* pay out — that's how you make an "ultra-rare" tier a chance rather
 * than a guarantee.
 *
 * Folder: data/<ns>/loot_table/crates/<slug>.json. Note the 1.21 singular
 * `loot_table/` (renamed from `loot_tables/`).
 */

/** A loot-table number provider for an item count ("10" -> 10, "1-3" -> uniform). */
export function countProvider(count: string): number | { type: string; min: number; max: number } {
  const m = count.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    if (max > min) return { type: "minecraft:uniform", min, max };
    return min;
  }
  const n = Number(count);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function tierToPool(tier: CrateTier) {
  const entries: object[] = tier.entries
    .filter((e) => e.itemId.trim() !== "")
    .map((e) => {
      const id = e.itemId.includes(":") ? e.itemId : `minecraft:${e.itemId}`;
      const count = countProvider(e.count);
      const entry: Record<string, unknown> = {
        type: "minecraft:item",
        name: id,
        weight: Math.max(1, Math.round(e.weight)),
      };
      // only attach set_count when it isn't a plain single item
      if (!(typeof count === "number" && count === 1)) {
        entry.functions = [{ function: "minecraft:set_count", count }];
      }
      return entry;
    });

  if (tier.emptyWeight && tier.emptyWeight > 0) {
    entries.push({ type: "minecraft:empty", weight: Math.round(tier.emptyWeight) });
  }

  return {
    rolls: Math.max(1, Math.round(tier.rolls)),
    entries,
  };
}

export function buildCrateLootTable(opts: {
  namespace: string;
  slug: string;
  tiers: CrateTier[];
}): GeneratedFile {
  const pools = opts.tiers
    .map(tierToPool)
    .filter((p) => p.entries.length > 0);

  const doc = {
    type: "minecraft:chest",
    pools,
  };

  return {
    path: `data/${opts.namespace}/loot_table/crates/${toId(opts.slug)}.json`,
    contents: JSON.stringify(doc, null, 2),
    kind: "loot-table",
    label: `${opts.slug} loot table`,
  };
}

/** Resource-location id for the crate's loot table (for /loot give). */
export function crateLootId(namespace: string, slug: string): string {
  return `${namespace}:crates/${toId(slug)}`;
}
