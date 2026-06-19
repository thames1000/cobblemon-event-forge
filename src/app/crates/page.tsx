"use client";

import { useMemo, useState } from "react";
import { CRATE_PRESETS, configFromCratePreset, KEY_ICONS } from "@/lib/catalog/crateTypes";
import { REWARD_ITEMS } from "@/lib/catalog/items";
import { MC_VERSIONS, versionForFormat } from "@/lib/datapack/packMeta";
import { generateCrate } from "@/lib/crate/generate";
import { crateWarnings, expectedValue } from "@/lib/crate/balance";
import { crateOdds, pct } from "@/lib/crate/odds";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import type { CrateConfig, CrateTier } from "@/lib/crate/types";

// Loot tables hand out real items only — currency is excluded.
const CRATE_ITEMS = REWARD_ITEMS.filter((i) => i.category !== "currency");

export default function CratesPage() {
  const [config, setConfig] = useState<CrateConfig>(() => configFromCratePreset("safari-crate"));
  const [activeFile, setActiveFile] = useState<string>("");

  const result = useMemo(() => generateCrate(config), [config]);
  const odds = useMemo(() => crateOdds(config), [config]);
  const warnings = useMemo(() => crateWarnings(config), [config]);
  const ev = useMemo(() => expectedValue(config), [config]);

  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<CrateConfig>) => setConfig((c) => ({ ...c, ...p }));
  const applyPreset = (id: string) => {
    setConfig(configFromCratePreset(id));
    setActiveFile("");
  };

  const patchKey = (p: Partial<CrateConfig["key"]>) => setConfig((c) => ({ ...c, key: { ...c.key, ...p } }));
  const setTier = (i: number, t: CrateTier) => {
    const tiers = [...config.tiers];
    tiers[i] = t;
    patch({ tiers });
  };
  const addTier = () =>
    patch({
      tiers: [...config.tiers, { id: `tier_${config.tiers.length + 1}`, name: "New tier", rolls: 1, emptyWeight: 0, entries: [] }],
    });

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  const errorCount = result.validation.issues.filter((i) => i.severity === "error").length;
  const warnCount = result.validation.issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <div className="chip mb-3">🎁 Reward Crate Builder</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a reward crate</h1>
        <p className="mt-1 text-sm text-slate-400">
          Design tiers and weighted items, see live drop odds, and download a valid loot-table datapack — no
          hand-written JSON.
        </p>
      </header>

      {/* preset picker */}
      <section className="mb-8">
        <div className="field-label">Crate template</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {CRATE_PRESETS.map((p) => {
            const active = config.presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`panel flex flex-col items-center gap-1 p-3 text-center transition ${
                  active ? "border-amber-400/70 bg-amber-400/10" : "hover:border-slate-500"
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[11px] leading-tight text-slate-300">{p.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------- LEFT: form ---------- */}
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Crate details</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Crate name</label>
                <input
                  className="input"
                  value={config.title}
                  placeholder="Safari Crate"
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Blurb</label>
                <input className="input" value={config.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Target Minecraft version</label>
                <select
                  className="input"
                  value={config.packFormat}
                  onChange={(e) => patch({ packFormat: Number(e.target.value) })}
                >
                  {MC_VERSIONS.map((v) => (
                    <option key={v.packFormat} value={v.packFormat}>
                      {v.label} (pack_format {v.packFormat})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* tiers */}
          {config.tiers.map((tier, ti) => (
            <section key={tier.id} className="panel p-5">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <label className="field-label">Tier name</label>
                  <input className="input" value={tier.name} onChange={(e) => setTier(ti, { ...tier, name: e.target.value })} />
                </div>
                <div className="w-20">
                  <label className="field-label" title="Items drawn per open">Rolls</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={tier.rolls}
                    onChange={(e) => setTier(ti, { ...tier, rolls: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div className="w-24">
                  <label className="field-label" title="Weight of getting nothing — makes the tier a chance">
                    Empty wt
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={tier.emptyWeight}
                    onChange={(e) => setTier(ti, { ...tier, emptyWeight: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <button
                  className="btn-ghost px-2 py-2 text-xs"
                  onClick={() => patch({ tiers: config.tiers.filter((_, j) => j !== ti) })}
                  title="Remove tier"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {tier.entries.map((entry, ei) => (
                  <div key={ei} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                    <select
                      className="input"
                      value={entry.itemId}
                      onChange={(e) => {
                        const entries = [...tier.entries];
                        entries[ei] = { ...entry, itemId: e.target.value };
                        setTier(ti, { ...tier, entries });
                      }}
                    >
                      {CRATE_ITEMS.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input w-16"
                      title="Count (e.g. 10 or 1-3)"
                      value={entry.count}
                      onChange={(e) => {
                        const entries = [...tier.entries];
                        entries[ei] = { ...entry, count: e.target.value };
                        setTier(ti, { ...tier, entries });
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      className="input w-16"
                      title="Weight"
                      value={entry.weight}
                      onChange={(e) => {
                        const entries = [...tier.entries];
                        entries[ei] = { ...entry, weight: Math.max(1, Number(e.target.value) || 1) };
                        setTier(ti, { ...tier, entries });
                      }}
                    />
                    <button
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => setTier(ti, { ...tier, entries: tier.entries.filter((_, j) => j !== ei) })}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">item · count · weight</span>
                  <button
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() =>
                      setTier(ti, { ...tier, entries: [...tier.entries, { itemId: "cobblemon:rare_candy", count: "1", weight: 50 }] })
                    }
                  >
                    + Add item
                  </button>
                </div>
              </div>
            </section>
          ))}

          <button className="btn-ghost w-full" onClick={addTier}>
            + Add tier
          </button>

          {/* usable crate key */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🔑 Usable crate key</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-400"
                  checked={config.key.enabled}
                  onChange={(e) => patchKey({ enabled: e.target.checked })}
                />
                Enable
              </label>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Generates a hold-to-use key item. Right-click &amp; hold consumes one key and opens the crate — via a
              <code className="px-1 text-slate-400">consume_item</code> advancement. No tick function.
            </p>

            {config.key.enabled && (
              <div className="space-y-4">
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="field-label">Icon item</label>
                    <input
                      list="key-icons"
                      className="input"
                      value={config.key.baseItem}
                      onChange={(e) => patchKey({ baseItem: e.target.value })}
                    />
                    <datalist id="key-icons">
                      {KEY_ICONS.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="field-label" title="Right-click hold time before it opens">Hold (s)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      className="input w-24"
                      value={config.key.consumeSeconds}
                      onChange={(e) => patchKey({ consumeSeconds: Math.max(0.1, Number(e.target.value) || 0.6) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Lore line</label>
                  <input className="input" value={config.key.lore} onChange={(e) => patchKey({ lore: e.target.value })} />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-400"
                    checked={config.key.glint}
                    onChange={(e) => patchKey({ glint: e.target.checked })}
                  />
                  Enchantment glint (sparkle)
                </label>
                <p className="text-[11px] text-slate-500">
                  Components target {versionForFormat(config.packFormat)?.mc ?? "your version"} —{" "}
                  {config.packFormat >= 57 ? "consumable component" : "food/eat_seconds"}. Pick an inert icon (no
                  built-in right-click action).
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ---------- RIGHT: odds + status + preview ---------- */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* odds */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Drop odds</h2>
              <span className="chip">EV ~{ev.toLocaleString()} 🪙 / open</span>
            </div>
            <div className="space-y-4">
              {odds.map((tier) => (
                <div key={tier.id}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-200">{tier.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {tier.rolls} roll{tier.rolls === 1 ? "" : "s"} · pays out {pct(tier.hitChance)}
                    </span>
                  </div>
                  {tier.entries.length === 0 ? (
                    <p className="text-xs text-slate-500">No items.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="py-1 text-left font-normal">Item</th>
                          <th className="text-right font-normal">×</th>
                          <th className="text-right font-normal">/roll</th>
                          <th className="text-right font-normal">≥1</th>
                          <th className="text-right font-normal">avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tier.entries.map((e, i) => (
                          <tr key={i} className="text-slate-300">
                            <td className="py-0.5">{e.itemId.split(":").pop()}</td>
                            <td className="text-right">{e.count}</td>
                            <td className="text-right">{pct(e.perRoll)}</td>
                            <td className="text-right">{pct(e.atLeastOnce)}</td>
                            <td className="text-right">{e.expectedCount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* status */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
              {result.validation.ok ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  ✓ Valid datapack
                </span>
              ) : (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                  ✕ {errorCount} error{errorCount === 1 ? "" : "s"}
                </span>
              )}
              {warnCount > 0 && (
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {warnCount} path warning{warnCount === 1 ? "" : "s"}
                </span>
              )}
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

            {warnings.length > 0 && (
              <ul className="space-y-1 border-t border-[var(--border)] pt-3 text-xs">
                {warnings.map((w, idx) => (
                  <li key={idx} className={w.level === "warn" ? "text-amber-300" : "text-slate-400"}>
                    {w.level === "warn" ? "⚖️" : "ℹ️"} {w.message}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>
                ⬇ Everything
              </button>
            </div>
            {!config.title && <p className="mt-2 text-xs text-slate-500">Name the crate to enable download.</p>}
          </section>

          {/* preview */}
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
              {result.bundle.files.map((f) => {
                const isDp = DATAPACK_KINDS.has(f.kind);
                const active = (selected?.path ?? "") === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`rounded px-2 py-1 text-[11px] transition ${
                      active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"
                    }`}
                    title={f.path}
                  >
                    {isDp ? "📦" : "📄"} {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500">
              <code className="truncate">{selected?.path}</code>
              <button
                className="shrink-0 text-slate-400 hover:text-slate-200"
                onClick={() => selected && downloadText(selected.contents, selected.path.split("/").pop()!)}
              >
                download file
              </button>
            </div>
            <pre className="scroll-thin max-h-[420px] overflow-auto bg-[#0a0e18] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {selected?.contents}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
