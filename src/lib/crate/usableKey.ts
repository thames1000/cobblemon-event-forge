import type { GeneratedFile } from "../datapack/types";
import type { CrateKey } from "./types";
import { toId } from "../datapack/sanitize";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";
import type { UsableItemSpec } from "../datapack/usableItem";

/**
 * Usable crate-key item — a thin crate-flavoured wrapper over the generic
 * usable-item mechanic (see datapack/usableItem.ts). The key is tagged with
 * custom_data {cobble_crate:"<slug>"}; using it fires a consume_item advancement
 * whose reward is the crate's open function (which then re-arms via revoke).
 */
const CRATE_DATA_KEY = "cobble_crate";

function keySpec(opts: { slug: string; title: string; key: CrateKey; packFormat: number }): UsableItemSpec {
  return {
    baseItem: opts.key.baseItem,
    name: opts.title || "Crate Key",
    nameColor: "gold",
    lore: opts.key.lore || "Right-click & hold to open",
    glint: opts.key.glint,
    consumeSeconds: opts.key.consumeSeconds,
    dataKey: CRATE_DATA_KEY,
    dataValue: toId(opts.slug),
    packFormat: opts.packFormat,
  };
}

/** Resource-location id of the use advancement. */
export function keyAdvancementId(namespace: string, slug: string): string {
  return `${namespace}:use_${toId(slug)}`;
}

/** The full `/give` command line that hands out one key (targets @s). */
export function keyGiveCommand(opts: { namespace: string; slug: string; title: string; key: CrateKey; packFormat: number }): string {
  return usableGiveCommand(keySpec(opts));
}

export function buildKeyFiles(opts: {
  namespace: string;
  slug: string;
  title: string;
  key: CrateKey;
  packFormat: number;
  /** Resource id of the open function the advancement should reward. */
  openFunctionId: string;
}): GeneratedFile[] {
  if (!opts.key.enabled) return [];
  const ns = opts.namespace;
  const slug = toId(opts.slug);

  const advancement = consumeAdvancement({
    baseItem: opts.key.baseItem,
    dataKey: CRATE_DATA_KEY,
    dataValue: slug,
    rewardFunctionId: opts.openFunctionId,
  });

  const give = [
    `# Give one ${opts.title || "crate"} key to a player:`,
    `#   /execute as <player> run function ${ns}:give_${slug}_key`,
    keyGiveCommand({ namespace: ns, slug, title: opts.title, key: opts.key, packFormat: opts.packFormat }),
    `tellraw @s {"text":"You received a ${opts.title || "crate"} key!","color":"gold"}`,
    "",
  ];

  return [
    {
      path: `data/${ns}/advancement/use_${slug}.json`,
      contents: JSON.stringify(advancement, null, 2),
      kind: "advancement",
      label: "use-key advancement",
    },
    {
      path: `data/${ns}/function/give_${slug}_key.mcfunction`,
      contents: give.join("\n"),
      kind: "function",
      label: "give_key.mcfunction",
    },
  ];
}
