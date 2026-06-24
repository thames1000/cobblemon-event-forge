"use client";

import { useMemo, useRef, useState } from "react";
import { generateItems, giveCommand } from "@/lib/item/generate";
import { newItem, NO_FORMAT, MC_COLORS, RARITIES, ENCHANTMENTS, ATTRIBUTES, OPERATIONS, SLOTS } from "@/lib/item/types";
import type { ItemConfig, ItemDef, LoreLine, TextFormat } from "@/lib/item/types";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableItems, fromPortableItems } from "@/lib/item/portable";

const COLOR_HEX: Record<string, string> = {
  black: "#000000", dark_blue: "#0000AA", dark_green: "#00AA00", dark_aqua: "#00AAAA", dark_red: "#AA0000",
  dark_purple: "#AA00AA", gold: "#FFAA00", gray: "#AAAAAA", dark_gray: "#555555", blue: "#5555FF",
  green: "#55FF55", aqua: "#55FFFF", red: "#FF5555", light_purple: "#FF55FF", yellow: "#FFFF55", white: "#FFFFFF",
};
const hex = (c: string) => COLOR_HEX[c] ?? "#FFFFFF";
const FMT_KEYS: [keyof TextFormat, string][] = [["bold", "B"], ["italic", "I"], ["underlined", "U"], ["strikethrough", "S"], ["obfuscated", "O"]];

function fmtStyle(f: TextFormat) {
  return {
    fontWeight: f.bold ? 700 : undefined,
    fontStyle: f.italic ? "italic" : undefined,
    textDecoration: [f.underlined ? "underline" : "", f.strikethrough ? "line-through" : ""].filter(Boolean).join(" ") || undefined,
  } as const;
}

const DEFAULT_CONFIG: ItemConfig = {
  title: "Event Items",
  packFormat: 48,
  items: [
    newItem("i1", { baseItem: "minecraft:name_tag", name: "Safari Ticket", nameColor: "green", glint: true, rarity: "rare", lore: [{ text: "Right-click & hold to enter the zone", color: "gray", format: { ...NO_FORMAT } }] }),
  ],
};

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="input w-24 text-xs" value={value} onChange={(e) => onChange(e.target.value)} style={{ color: hex(value) }}>
      {MC_COLORS.map((c) => (
        <option key={c} value={c} style={{ color: hex(c) }}>
          {c}
        </option>
      ))}
    </select>
  );
}

function FormatToggles({ value, onChange }: { value: TextFormat; onChange: (f: TextFormat) => void }) {
  return (
    <div className="flex gap-0.5">
      {FMT_KEYS.map(([k, lbl]) => (
        <button
          key={k}
          type="button"
          title={k}
          onClick={() => onChange({ ...value, [k]: !value[k] })}
          className={`h-6 w-6 rounded text-[11px] ${value[k] ? "bg-amber-400/30 text-amber-200" : "bg-[var(--panel-2)] text-slate-500"}`}
          style={fmtStyle({ ...NO_FORMAT, bold: k === "bold", italic: k === "italic", underlined: k === "underlined", strikethrough: k === "strikethrough" })}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

function ItemCard({ item, packFormat, onChange, onRemove }: { item: ItemDef; packFormat: number; onChange: (p: Partial<ItemDef>) => void; onRemove: () => void }) {
  const [copied, setCopied] = useState(false);
  const cmd = giveCommand(item, packFormat);
  const setLore = (i: number, p: Partial<LoreLine>) => onChange({ lore: item.lore.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const copy = () =>
    navigator.clipboard?.writeText("/" + cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  const isHead = /player_head/.test(item.baseItem);

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-4">
      {/* name */}
      <div className="flex flex-wrap items-center gap-2">
        <input className="input min-w-[8rem] flex-1" placeholder="Display name" value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
        <ColorSelect value={item.nameColor} onChange={(nameColor) => onChange({ nameColor })} />
        <FormatToggles value={item.nameFormat} onChange={(nameFormat) => onChange({ nameFormat })} />
        <button className="btn-ghost px-2 py-1 text-xs" onClick={onRemove} title="Remove item">
          ✕
        </button>
      </div>

      {/* base / rarity / count */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input className="input col-span-2 font-mono text-xs" placeholder="minecraft:paper" value={item.baseItem} onChange={(e) => onChange({ baseItem: e.target.value })} title="base item id" />
        <select className="input text-xs" value={item.rarity} onChange={(e) => onChange({ rarity: e.target.value as ItemDef["rarity"] })} title="rarity">
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r === "none" ? "no rarity" : r}
            </option>
          ))}
        </select>
        <input type="number" min={1} max={99} className="input text-xs" value={item.count} onChange={(e) => onChange({ count: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })} title="give count" />
      </div>

      {/* flags */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
        {([["glint", "Glint"], ["unbreakable", "Unbreakable"], ["fireResistant", "Fire-resistant"]] as const).map(([k, lbl]) => (
          <label key={k} className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5 accent-amber-400" checked={item[k]} onChange={(e) => onChange({ [k]: e.target.checked })} /> {lbl}
          </label>
        ))}
        <label className="flex items-center gap-1.5">
          Model #
          <input type="number" min={0} className="input w-16 text-xs" value={item.customModelData} onChange={(e) => onChange({ customModelData: Math.max(0, Number(e.target.value) || 0) })} title="custom_model_data (0 = none)" />
        </label>
        <label className="flex items-center gap-1.5">
          Max stack
          <input type="number" min={0} max={99} className="input w-16 text-xs" value={item.maxStackSize} onChange={(e) => onChange({ maxStackSize: Math.max(0, Number(e.target.value) || 0) })} title="max_stack_size (0 = default)" />
        </label>
      </div>

      {/* lore */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="field-label">Lore</span>
          <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => onChange({ lore: [...item.lore, { text: "", color: "gray", format: { ...NO_FORMAT } }] })}>
            + Line
          </button>
        </div>
        {item.lore.map((l, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input className="input min-w-[8rem] flex-1 text-xs" placeholder="lore line" value={l.text} onChange={(e) => setLore(i, { text: e.target.value })} />
            <ColorSelect value={l.color} onChange={(color) => setLore(i, { color })} />
            <FormatToggles value={l.format} onChange={(format) => setLore(i, { format })} />
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange({ lore: item.lore.filter((_, j) => j !== i) })}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* enchantments */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="field-label">Enchantments</span>
          <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => onChange({ enchantments: [...item.enchantments, { id: "minecraft:sharpness", level: 1 }] })}>
            + Add
          </button>
        </div>
        {item.enchantments.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <select className="input flex-1 text-xs" value={e.id} onChange={(ev) => onChange({ enchantments: item.enchantments.map((x, j) => (j === i ? { ...x, id: ev.target.value } : x)) })}>
              {ENCHANTMENTS.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.name} (max {en.max})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={255}
              className="input w-16 text-xs"
              value={e.level}
              onChange={(ev) => onChange({ enchantments: item.enchantments.map((x, j) => (j === i ? { ...x, level: Math.max(1, Number(ev.target.value) || 1) } : x)) })}
            />
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange({ enchantments: item.enchantments.filter((_, j) => j !== i) })}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* attribute modifiers */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="field-label">Attribute modifiers</span>
          <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => onChange({ attributes: [...item.attributes, { type: "attack_damage", amount: 1, operation: "add_value", slot: "mainhand" }] })}>
            + Add
          </button>
        </div>
        {item.attributes.map((a, i) => {
          const upd = (p: Partial<ItemDef["attributes"][number]>) => onChange({ attributes: item.attributes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
          return (
            <div key={i} className="grid grid-cols-2 items-center gap-1 sm:grid-cols-[1fr_4rem_1fr_1fr_auto]">
              <select className="input text-xs" value={a.type} onChange={(e) => upd({ type: e.target.value })}>
                {ATTRIBUTES.map((at) => (
                  <option key={at.type} value={at.type}>
                    {at.name}
                  </option>
                ))}
              </select>
              <input type="number" step="0.1" className="input text-xs" value={a.amount} onChange={(e) => upd({ amount: Number(e.target.value) || 0 })} title="amount" />
              <select className="input text-xs" value={a.operation} onChange={(e) => upd({ operation: e.target.value })} title="operation">
                {OPERATIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.replace("add_", "")}
                  </option>
                ))}
              </select>
              <select className="input text-xs" value={a.slot} onChange={(e) => upd({ slot: e.target.value })} title="slot">
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange({ attributes: item.attributes.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* extras: custom_data + head */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input className="input text-xs" placeholder="custom_data key" value={item.customDataKey} onChange={(e) => onChange({ customDataKey: e.target.value })} title="custom_data key (tag your item)" />
        <input className="input text-xs" placeholder="value" value={item.customDataValue} onChange={(e) => onChange({ customDataValue: e.target.value })} />
        {isHead && <input className="input col-span-2 text-xs" placeholder="head owner username" value={item.headOwner} onChange={(e) => onChange({ headOwner: e.target.value })} title="player_head profile" />}
      </div>

      {/* tooltip preview */}
      <div className="rounded border border-[var(--border)] bg-[#100a1c] px-3 py-2">
        <div className="font-semibold" style={{ color: hex(item.nameColor), ...fmtStyle(item.nameFormat) }}>
          {item.name || "(unnamed)"} {item.glint && <span title="glint">✨</span>}
        </div>
        {item.lore
          .filter((l) => l.text.trim())
          .map((l, i) => (
            <div key={i} className="text-[12px]" style={{ color: hex(l.color), ...fmtStyle(l.format) }}>
              {l.text}
            </div>
          ))}
        {item.enchantments.length > 0 && (
          <div className="text-[11px]" style={{ color: hex("gray") }}>
            {item.enchantments.map((e) => `${ENCHANTMENTS.find((x) => x.id === e.id)?.name ?? e.id} ${e.level}`).join(", ")}
          </div>
        )}
        {item.attributes.length > 0 && <div className="text-[11px] text-blue-300">{item.attributes.map((a) => `${a.amount > 0 ? "+" : ""}${a.amount} ${a.type.replace(/_/g, " ")}`).join(", ")}</div>}
        {item.rarity !== "none" && <div className="text-[11px] text-slate-500">rarity: {item.rarity}</div>}
      </div>

      {/* give command */}
      <div className="flex items-center gap-2">
        <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap rounded bg-[#0a0e18] px-2 py-1.5 text-[11px] text-slate-300">/{cmd}</code>
        <button className="btn-ghost shrink-0 px-2.5 py-1.5 text-xs" onClick={copy}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [config, setConfig] = useState<ItemConfig>(DEFAULT_CONFIG);
  const [activeFile, setActiveFile] = useState("");
  const counter = useRef(1000);

  const result = useMemo(() => generateItems(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];
  const patch = (p: Partial<ItemConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchItem = (i: number, p: Partial<ItemDef>) => patch({ items: config.items.map((it, j) => (j === i ? { ...it, ...p } : it)) });

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <div className="chip mb-3">🏷️ Item Designer</div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-100">Design Custom Items</h1>
          <ConfigPortIO
            config={config}
            filename={`${result.bundle.slug}.items.json`}
            toPortable={toPortableItems}
            fromPortable={fromPortableItems}
            onImport={(c) => { setConfig(c); setActiveFile(""); }}
            exportDisabled={!config.title}
            hint="Export this item collection as JSON, or import a saved one (or the items_config.json from a downloaded bundle) to edit & re-run."
          />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Named/lore items on any base item — name &amp; lore (with formatting + colours), rarity, glint, enchantments, attribute
          modifiers, model data, custom data, heads &amp; more. Copy the <code>/give</code> or download a datapack of give functions.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT — items */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Collection name</label>
                <input className="input" value={config.title} placeholder="Event Items" onChange={(e) => patch({ title: e.target.value })} />
                <p className="mt-1.5 text-xs text-slate-500">
                  namespace <code className="text-amber-300">{result.bundle.namespace}</code>
                </p>
              </div>
              <div>
                <label className="field-label">Target Minecraft</label>
                <select className="input" value={config.packFormat} onChange={(e) => patch({ packFormat: Number(e.target.value) })}>
                  {MC_VERSIONS.map((v) => (
                    <option key={v.packFormat} value={v.packFormat}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {config.items.map((item, i) => (
              <ItemCard key={item.id} item={item} packFormat={config.packFormat} onChange={(p) => patchItem(i, p)} onRemove={() => patch({ items: config.items.filter((_, j) => j !== i) })} />
            ))}
            <button className="btn-ghost w-full py-2 text-sm" onClick={() => patch({ items: [...config.items, newItem(`i${counter.current++}`)] })}>
              + Add item
            </button>
          </div>
        </div>

        {/* RIGHT — preview / download */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
              {result.validation.ok ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">✓ Valid datapack</span>
              ) : (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">✕ errors</span>
              )}
              <span className="chip ml-auto">{result.itemCount} items</span>
            </div>
            {result.validation.issues.length > 0 && (
              <ul className="mb-3 space-y-1 text-xs">
                {result.validation.issues.map((iss, idx) => (
                  <li key={idx} className={iss.severity === "error" ? "text-red-300" : "text-amber-300"}>
                    {iss.severity === "error" ? "✕" : "!"} {iss.message}
                    {iss.path ? ` (${iss.path})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>
                ⬇ Everything
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Or copy a /give command from any item card. Attribute ids are version-aware (generic. on 1.21.1).</p>
          </section>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
              {result.bundle.files.map((f) => {
                const active = (selected?.path ?? "") === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`rounded px-2 py-1 text-[11px] transition ${active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"}`}
                    title={f.path}
                  >
                    {DATAPACK_KINDS.has(f.kind) ? "📦" : "📄"} {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500">
              <code className="truncate">{selected?.path}</code>
              <button className="shrink-0 text-slate-400 hover:text-slate-200" onClick={() => selected && downloadText(selected.contents, selected.path.split("/").pop()!)}>
                download file
              </button>
            </div>
            <pre className="scroll-thin max-h-[460px] overflow-auto bg-[#0a0e18] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {selected?.contents}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
