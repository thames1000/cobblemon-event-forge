import type { Bundle, GeneratedFile } from "../datapack/types";
import { toPortableItems } from "./portable";
import type { ValidationResult } from "../datapack/validate";
import type { ItemConfig, ItemDef, TextFormat } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";

export interface ItemGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  itemCount: number;
}

// Version thresholds for the version-sensitive components:
const CMD_STRUCT_SINCE = 61; // 1.21.4: custom_model_data int → {floats:[…]}
const GENERIC_PREFIX_UNTIL = 57; // <57 (1.21.1) attribute ids use "minecraft:generic.<x>"; 1.21.2+ drop it
const DAMAGE_RESISTANT_SINCE = 71; // 1.21.5 replaced minecraft:fire_resistant with damage_resistant

function withNamespace(item: string): string {
  return item.includes(":") ? item : `minecraft:${item}`;
}

/** SNBT text component with style flags. `italic` is always emitted so lore isn't italic by default. */
function fmtText(text: string, color: string, f: TextFormat): string {
  const extra: Record<string, unknown> = { italic: f.italic };
  if (f.bold) extra.bold = true;
  if (f.underlined) extra.underlined = true;
  if (f.strikethrough) extra.strikethrough = true;
  if (f.obfuscated) extra.obfuscated = true;
  return `'${JSON.stringify({ text, color, ...extra }).replace(/'/g, "\\'")}'`;
}

/** The `[...]` component block for an item (without the surrounding brackets). */
export function itemComponents(item: ItemDef, packFormat: number): string {
  const parts: string[] = [];
  if (item.name.trim()) parts.push(`minecraft:item_name=${fmtText(item.name, item.nameColor, item.nameFormat)}`);

  const lore = item.lore.filter((l) => l.text.trim()).map((l) => fmtText(l.text, l.color, l.format));
  if (lore.length) parts.push(`minecraft:lore=[${lore.join(",")}]`);

  const enchants = item.enchantments.filter((e) => e.id && e.level > 0).map((e) => `"${e.id}":${Math.round(e.level)}`);
  if (enchants.length) parts.push(`minecraft:enchantments={levels:{${enchants.join(",")}}}`);

  const mods = item.attributes
    .filter((a) => a.type && a.amount !== 0)
    .map((a, i) => {
      const type = `${packFormat < GENERIC_PREFIX_UNTIL ? "minecraft:generic." : "minecraft:"}${a.type}`;
      return `{type:"${type}",amount:${a.amount},operation:"${a.operation}",slot:"${a.slot}",id:"eventforge:mod_${i}"}`;
    });
  if (mods.length) parts.push(`minecraft:attribute_modifiers=[${mods.join(",")}]`);

  if (item.glint) parts.push(`minecraft:enchantment_glint_override=true`);
  if (item.rarity !== "none") parts.push(`minecraft:rarity="${item.rarity}"`);
  if (item.unbreakable) parts.push(`minecraft:unbreakable={}`);
  if (item.customModelData > 0) {
    const n = Math.round(item.customModelData);
    parts.push(packFormat >= CMD_STRUCT_SINCE ? `minecraft:custom_model_data={floats:[${n}f]}` : `minecraft:custom_model_data=${n}`);
  }
  if (item.customDataKey.trim()) parts.push(`minecraft:custom_data={${toId(item.customDataKey)}:"${item.customDataValue}"}`);
  if (item.maxStackSize > 0) parts.push(`minecraft:max_stack_size=${Math.min(99, Math.max(1, Math.round(item.maxStackSize)))}`);
  if (item.fireResistant) parts.push(packFormat >= DAMAGE_RESISTANT_SINCE ? `minecraft:damage_resistant={types:"#minecraft:is_fire"}` : `minecraft:fire_resistant={}`);
  if (item.headOwner.trim() && /player_head/.test(item.baseItem)) parts.push(`minecraft:profile={name:"${item.headOwner.trim()}"}`);

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
  const sideCars: GeneratedFile[] = [
    { path: "give_commands.txt", contents: sheet.join("\n") + "\n", kind: "readme", label: "give commands" },
    // re-importable snapshot of this item collection — drop it back into the page to edit/re-run later
    { path: "items_config.json", contents: toPortableItems(config), kind: "readme", label: "items_config.json" },
  ];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    itemCount: config.items.length,
  };
}
