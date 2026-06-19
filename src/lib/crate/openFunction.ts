import type { GeneratedFile } from "../datapack/types";
import { crateLootId } from "../datapack/lootTable";
import { toId } from "../datapack/sanitize";

/**
 * The "open this crate" function. Owners (or a command block / key item) run it
 * against a player to roll the crate's loot table straight into their inventory:
 *   /execute as <player> run function <ns>:open_<slug>
 *
 * When `revokeAdvancement` is set, the function also re-arms that advancement so
 * a usable crate key can fire it again next time (see usableKey.ts). Running it
 * by hand with no such advancement granted is harmless.
 */
export function buildOpenFunction(opts: {
  namespace: string;
  slug: string;
  title: string;
  revokeAdvancement?: string;
}): GeneratedFile {
  const slug = toId(opts.slug);
  const lootId = crateLootId(opts.namespace, slug);
  const lines = [
    `# Open the ${opts.title} for a player:`,
    `#   /execute as <player> run function ${opts.namespace}:open_${slug}`,
    "",
    `loot give @s loot ${lootId}`,
  ];
  if (opts.revokeAdvancement) {
    lines.push(`# re-arm the key so it can be used again`);
    lines.push(`advancement revoke @s only ${opts.revokeAdvancement}`);
  }
  lines.push(`tellraw @s {"text":"You opened a ${opts.title}!","color":"gold"}`, "");
  return {
    path: `data/${opts.namespace}/function/open_${slug}.mcfunction`,
    contents: lines.join("\n"),
    kind: "function",
    label: "open_crate.mcfunction",
  };
}
