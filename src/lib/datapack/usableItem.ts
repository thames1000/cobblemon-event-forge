import { toId } from "./sanitize";

/**
 * Generic "usable item" mechanic — tick-free.
 *
 * An ordinary item is given components that (a) make it right-click "usable" and
 * (b) tag it with custom_data. Using it fires a `minecraft:consume_item`
 * advancement whose item condition matches that custom_data; the reward function
 * does whatever you want (open a crate, enter a safari, …). Consuming the item
 * removes one from the stack automatically.
 *
 * Component layout is version aware:
 *  - 1.21.2+ (pack_format >= 57): the `minecraft:consumable` component controls use.
 *  - 1.21 / 1.21.1 (pack_format 48): the `minecraft:food` component (eat_seconds +
 *    can_always_eat) is used instead.
 */
const CONSUMABLE_SINCE = 57; // 1.21.2

export interface UsableItemSpec {
  baseItem: string;
  /** Display name shown on the item. */
  name: string;
  nameColor: string;
  lore: string;
  glint: boolean;
  consumeSeconds: number;
  /** custom_data key/value used to identify this item, e.g. "cobble_crate" / "<slug>". */
  dataKey: string;
  dataValue: string;
  packFormat: number;
}

function snbtText(text: string, color: string, extra: Record<string, unknown> = {}): string {
  const json = JSON.stringify({ text, color, ...extra });
  return `'${json.replace(/'/g, "\\'")}'`;
}

function withNamespace(item: string): string {
  return item.includes(":") ? item : `minecraft:${item}`;
}

/** The `[...]` component block for the usable item, version aware. */
export function usableItemComponents(spec: UsableItemSpec): string {
  const secs = Math.max(0.1, spec.consumeSeconds);
  const parts: string[] = [
    `minecraft:custom_data={${spec.dataKey}:"${spec.dataValue}"}`,
    `minecraft:item_name=${snbtText(spec.name || "Item", spec.nameColor)}`,
    `minecraft:lore=[${snbtText(spec.lore || "Right-click & hold to use", "gray", { italic: false })}]`,
  ];
  if (spec.glint) parts.push(`minecraft:enchantment_glint_override=true`);
  if (spec.packFormat >= CONSUMABLE_SINCE) {
    parts.push(`minecraft:consumable={consume_seconds:${secs}f,animation:"none",has_consume_particles:false}`);
  } else {
    parts.push(`minecraft:food={nutrition:0,saturation:0,can_always_eat:true,eat_seconds:${secs}f}`);
  }
  return parts.join(",");
}

/** Full `/give @s <item>[...] 1` line for the usable item. */
export function usableGiveCommand(spec: UsableItemSpec): string {
  return `give @s ${withNamespace(spec.baseItem)}[${usableItemComponents(spec)}] 1`;
}

/** The `minecraft:consume_item` advancement JSON that fires when the item is used. */
export function consumeAdvancement(opts: {
  baseItem: string;
  dataKey: string;
  dataValue: string;
  rewardFunctionId: string;
}): object {
  return {
    criteria: {
      used: {
        trigger: "minecraft:consume_item",
        conditions: {
          item: {
            items: [withNamespace(opts.baseItem)],
            // The custom_data item sub-predicate is an NbtPredicate, whose codec is a
            // STRING (parsed as SNBT at load), NOT a JSON object. Emitting an object
            // here makes the whole advancement fail to deserialize and silently drop,
            // so the consume is never detected. Must be the SNBT string form.
            predicates: { "minecraft:custom_data": `{${opts.dataKey}:"${opts.dataValue}"}` },
          },
        },
      },
    },
    requirements: [["used"]],
    rewards: { function: opts.rewardFunctionId },
  };
}

/** Stable id helper for a "use this item" advancement. */
export function useAdvId(namespace: string, slug: string): string {
  return `${namespace}:use_${toId(slug)}`;
}
