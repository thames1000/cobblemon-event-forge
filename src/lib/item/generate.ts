import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { ItemConfig, ItemDef } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";

export interface ItemGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  itemCount: number;
}

// custom_model_data became a structured component (floats/flags/strings/colors) in
// 1.21.4 (pack 61); before that it's a bare integer.
const CMD_STRUCT_SINCE = 61;

function snbtText(text: string, color: string, extra: Record<string, unknown> = {}): string {
  const json = JSON.stringify({ text, color, ...extra });
  return `'${json.replace(/'/g, "\\'")}'`;
}

function withNamespace(item: string): string {
  return item.includes(":") ? item : `minecraft:${item}`;
}

/** The `[...]` component block for an item (without the surrounding brackets). */
export function itemComponents(item: ItemDef, packFormat: number): string {
  const parts: string[] = [];
  if (item.name.trim()) parts.push(`minecraft:item_name=${snbtText(item.name, item.nameColor)}`);
  const lore = item.lore.filter((l) => l.text.trim()).map((l) => snbtText(l.text, l.color, { italic: false }));
  if (lore.length) parts.push(`minecraft:lore=[${lore.join(",")}]`);
  if (item.glint) parts.push(`minecraft:enchantment_glint_override=true`);
  if (item.rarity !== "none") parts.push(`minecraft:rarity="${item.rarity}"`);
  if (item.unbreakable) parts.push(`minecraft:unbreakable={}`);
  if (item.customModelData > 0) {
    const n = Math.round(item.customModelData);
    parts.push(packFormat >= CMD_STRUCT_SINCE ? `minecraft:custom_model_data={floats:[${n}f]}` : `minecraft:custom_model_data=${n}`);
  }
  return parts.join(",");
}

/** A full `/give <target> <item>[...] <count>` command (no leading slash). */
export function giveCommand(item: ItemDef, packFormat: number, target = "@p"): string {
  const comps = itemComponents(item, packFormat);
  const base = withNamespace(item.baseItem || "minecraft:paper");
  const count = Math.max(1, Math.round(item.count));
  return `give ${target} ${base}${comps ? `[${comps}]` : ""} ${count}`;
}

export function generateItems(config: ItemConfig): ItemGenerateResult {
  const slug = toId(config.title || "custom_items");
  const ns = toNamespace(config.title || "owner_items");

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — custom items, by Cobbleverse Event Forge`, packFormat: config.packFormat }),
  ];

  // One give function per item (run as the target player), with unique file names.
  const seen = new Map<string, number>();
  const fnSlugs: string[] = [];
  for (const item of config.items) {
    let s = toId(item.name) || "item";
    const dup = seen.get(s);
    if (dup) {
      seen.set(s, dup + 1);
      s = `${s}_${dup + 1}`;
    } else {
      seen.set(s, 1);
    }
    fnSlugs.push(s);
    datapackFiles.push({
      path: `data/${ns}/function/give_${s}.mcfunction`,
      contents: [
        `# Give "${item.name}": /execute as <player> run function ${ns}:give_${s}`,
        giveCommand(item, config.packFormat, "@s"),
        `tellraw @s ${JSON.stringify({ text: `You received ${item.name}!`, color: item.nameColor })}`,
        "",
      ].join("\n"),
      kind: "function",
      label: `give_${s}.mcfunction`,
    });
  }

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;

  // Side-car: copy-paste /give commands.
  const sheet: string[] = [`${config.title} — CUSTOM ITEMS`, ""];
  config.items.forEach((item, i) => {
    sheet.push(`${item.name || "(unnamed)"}  [${withNamespace(item.baseItem)}]   ·   /function ${ns}:give_${fnSlugs[i]}`);
    sheet.push(`  /${giveCommand(item, config.packFormat, "@p")}`);
    sheet.push("");
  });
  const sideCars: GeneratedFile[] = [{ path: "give_commands.txt", contents: sheet.join("\n") + "\n", kind: "readme", label: "give commands" }];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    itemCount: config.items.length,
  };
}
