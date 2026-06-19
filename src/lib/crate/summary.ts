import type { GeneratedFile } from "../datapack/types";
import type { CrateConfig } from "./types";
import { crateOdds, pct } from "./odds";
import { expectedValue } from "./balance";
import { crateLootId } from "../datapack/lootTable";
import { keyGiveCommand } from "./usableKey";
import { findReward } from "../catalog/items";

function itemName(itemId: string): string {
  const meta = findReward(itemId);
  if (meta) return meta.name;
  return (itemId.split(":").pop() ?? itemId)
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * drop_chances.md — the owner-facing summary: how to open the crate, the
 * /loot give command, the expected value, and a per-tier odds table. This is the
 * "reward command list + drop chance summary" export.
 */
export function buildCrateSummary(opts: {
  config: CrateConfig;
  namespace: string;
  slug: string;
}): GeneratedFile {
  const c = opts.config;
  const odds = crateOdds(c);
  const lootId = crateLootId(opts.namespace, opts.slug);
  const L: string[] = [];

  L.push(`# 🎁 ${c.title || "Crate"} — drop chances`);
  if (c.blurb) L.push(`\n*${c.blurb}*`);
  L.push("");
  L.push(`**Expected value per open:** ~${expectedValue(c).toLocaleString()} CobbleDollars`);
  L.push("");
  L.push("## How to open");
  L.push("```");
  L.push(`# directly to a player`);
  L.push(`execute as <player> run function ${opts.namespace}:open_${opts.slug}`);
  L.push(`# or roll the table straight to yourself`);
  L.push(`loot give @s loot ${lootId}`);
  L.push("```");
  L.push("");

  if (c.key.enabled) {
    L.push("## Usable crate key");
    L.push("Give a player a key item they right-click & hold to open this crate (consumes one key):");
    L.push("```");
    L.push(`# hand out a key`);
    L.push(`execute as <player> run function ${opts.namespace}:give_${opts.slug}_key`);
    L.push(`# ...or the raw give command:`);
    L.push(keyGiveCommand({ namespace: opts.namespace, slug: opts.slug, title: c.title, key: c.key, packFormat: c.packFormat }));
    L.push("```");
    L.push("");
  }

  for (const tier of odds) {
    L.push(`## ${tier.name}  ·  ${tier.rolls} roll${tier.rolls === 1 ? "" : "s"}  ·  pays out ${pct(tier.hitChance)} per open`);
    if (tier.entries.length === 0) {
      L.push("_(no items)_\n");
      continue;
    }
    L.push("| Item | Count | Per roll | At least once | Avg / open |");
    L.push("| --- | --- | --- | --- | --- |");
    for (const e of tier.entries) {
      L.push(
        `| ${itemName(e.itemId)} | ${e.count} | ${pct(e.perRoll)} | ${pct(e.atLeastOnce)} | ${e.expectedCount.toFixed(2)} |`,
      );
    }
    L.push("");
  }

  return {
    path: "drop_chances.md",
    contents: L.join("\n") + "\n",
    kind: "readme",
    label: "drop_chances.md",
  };
}
