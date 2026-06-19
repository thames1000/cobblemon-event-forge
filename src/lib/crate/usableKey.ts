import type { GeneratedFile } from "../datapack/types";
import type { CrateKey } from "./types";
import { toId } from "../datapack/sanitize";

/**
 * Usable crate-key item — tick-free.
 *
 * The key is an ordinary item carrying components that (a) make it right-click
 * "usable" and (b) tag it with custom_data. Using it fires a
 * `minecraft:consume_item` advancement whose item condition matches that
 * custom_data; the reward function runs `loot give` and then
 * `advancement revoke` so it re-arms for the next use. Consuming the item
 * removes one from the stack automatically.
 *
 * Component layout is version aware:
 *  - 1.21.2+ (pack_format >= 57): the `minecraft:consumable` component controls
 *    use (consume_seconds, animation, particles).
 *  - 1.21 / 1.21.1 (pack_format 48): there's no consumable component yet, so the
 *    `minecraft:food` component (with eat_seconds + can_always_eat) is used.
 */
const CONSUMABLE_SINCE = 57; // 1.21.2

/** Build a JSON text component wrapped as a single-quoted SNBT string. */
function snbtText(text: string, color: string, extra: Record<string, unknown> = {}): string {
  const json = JSON.stringify({ text, color, ...extra });
  return `'${json.replace(/'/g, "\\'")}'`;
}

/** The component block for the key item, version aware. */
function keyComponents(opts: { slug: string; title: string; key: CrateKey; packFormat: number }): string {
  const { slug, title, key, packFormat } = opts;
  const secs = Math.max(0.1, key.consumeSeconds);
  const parts: string[] = [
    `minecraft:custom_data={cobble_crate:"${slug}"}`,
    `minecraft:item_name=${snbtText(title || "Crate Key", "gold")}`,
    `minecraft:lore=[${snbtText(key.lore || "Right-click & hold to open", "gray", { italic: false })}]`,
  ];
  if (key.glint) parts.push(`minecraft:enchantment_glint_override=true`);

  if (packFormat >= CONSUMABLE_SINCE) {
    parts.push(`minecraft:consumable={consume_seconds:${secs}f,animation:"none",has_consume_particles:false}`);
  } else {
    parts.push(`minecraft:food={nutrition:0,saturation:0,can_always_eat:true,eat_seconds:${secs}f}`);
  }
  return parts.join(",");
}

/** Resource-location id of the use advancement. */
export function keyAdvancementId(namespace: string, slug: string): string {
  return `${namespace}:use_${toId(slug)}`;
}

/** The full `/give` command line that hands out one key (targets @s). */
export function keyGiveCommand(opts: { namespace: string; slug: string; title: string; key: CrateKey; packFormat: number }): string {
  const slug = toId(opts.slug);
  const base = opts.key.baseItem.includes(":") ? opts.key.baseItem : `minecraft:${opts.key.baseItem}`;
  return `give @s ${base}[${keyComponents({ slug, title: opts.title, key: opts.key, packFormat: opts.packFormat })}] 1`;
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
  const base = opts.key.baseItem.includes(":") ? opts.key.baseItem : `minecraft:${opts.key.baseItem}`;

  // advancement: fires when the tagged key is consumed
  const advancement = {
    criteria: {
      used: {
        trigger: "minecraft:consume_item",
        conditions: {
          item: {
            items: [base],
            predicates: { "minecraft:custom_data": { cobble_crate: slug } },
          },
        },
      },
    },
    requirements: [["used"]],
    rewards: { function: opts.openFunctionId },
  };

  // give function: hand a key to whoever it runs as
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
