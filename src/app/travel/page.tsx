"use client";

import { useMemo, useState } from "react";
import { generateTravel } from "@/lib/travel/generate";
import { newTravelConfig } from "@/lib/travel/types";
import type { TravelConfig } from "@/lib/travel/types";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";

export default function TravelPage() {
  const [config, setConfig] = useState<TravelConfig>(() => newTravelConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");

  const result = useMemo(() => generateTravel(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<TravelConfig>) => setConfig((c) => ({ ...c, ...p }));
  const num = (v: string) => (v.trim() === "" || v.trim() === "-" ? 0 : Number(v) || 0);

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  const coords = (
    label: string,
    keys: ["destX", "destY", "destZ"] | ["homeX", "homeY", "homeZ"],
  ) => (
    <div>
      <label className="field-label">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {(["X", "Y", "Z"] as const).map((axis, i) => (
          <input key={axis} type="number" className="input" value={config[keys[i]]} onChange={(e) => patch({ [keys[i]]: num(e.target.value) } as Partial<TravelConfig>)} aria-label={`${label} ${axis}`} placeholder={axis} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <div className="chip mb-3">🧭 Safe Travel</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a safe-teleport helper</h1>
        <p className="mt-1 text-sm text-slate-400">
          Move players to an event area and back without desync, fall damage, or falling through unloaded chunks. Generates
          enter/exit/rescue functions, arrival protection, an optional travel item, and force-loads the destination pad. Tick-free.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Title</label>
                <input className="input" value={config.title} onChange={(e) => patch({ title: e.target.value })} />
                <p className="mt-1.5 text-xs text-slate-500">namespace <code className="text-amber-300">{result.bundle.namespace}</code></p>
              </div>
              <div>
                <label className="field-label">Target Minecraft</label>
                <select className="input" value={config.packFormat} onChange={(e) => patch({ packFormat: Number(e.target.value) })}>
                  {MC_VERSIONS.map((v) => (
                    <option key={v.packFormat} value={v.packFormat}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* destination */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Destination</h2>
            <div className="mb-3">
              <label className="field-label">Dimension</label>
              <input className="input" value={config.destDimension} onChange={(e) => patch({ destDimension: e.target.value })} placeholder="minecraft:overworld" />
            </div>
            {coords("Pad coordinates", ["destX", "destY", "destZ"])}
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.spread} onChange={(e) => patch({ spread: e.target.checked })} />
              Scatter arrivals around the pad (avoid stacking)
            </label>
            {config.spread && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">radius</span>
                <input type="number" min={1} className="input w-24" value={config.spreadRadius} onChange={(e) => patch({ spreadRadius: Math.max(1, num(e.target.value)) })} />
                <span className="text-xs text-slate-500">blocks (spreadplayers places on the surface — use for natural terrain, not a fixed pad)</span>
              </div>
            )}
          </section>

          {/* return / rescue */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Return & rescue</h2>
            <div className="mb-3">
              <label className="field-label">When a player exits…</label>
              <select className="input" value={config.returnMode} onChange={(e) => patch({ returnMode: e.target.value as TravelConfig["returnMode"] })}>
                <option value="capture">Send them back where they came from (captured on entry)</option>
                <option value="fixed">Always send them to the home coordinates below</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="field-label">Home / rescue dimension</label>
              <input className="input" value={config.homeDimension} onChange={(e) => patch({ homeDimension: e.target.value })} placeholder="minecraft:overworld" />
            </div>
            {coords("Home / rescue pad (always-safe spot)", ["homeX", "homeY", "homeZ"])}
            <p className="mt-2 text-xs text-slate-500">
              The rescue function always sends a stuck player here, regardless of return mode — keep it a known-safe, loaded spot.
            </p>
          </section>

          {/* safety */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Arrival safety</h2>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.arrival.slowFalling} onChange={(e) => patch({ arrival: { ...config.arrival, slowFalling: e.target.checked } })} />
                Slow Falling
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.arrival.resistance} onChange={(e) => patch({ arrival: { ...config.arrival, resistance: e.target.checked } })} />
                Resistance
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">for</span>
                <input type="number" min={1} className="input w-20" value={config.arrival.seconds} onChange={(e) => patch({ arrival: { ...config.arrival, seconds: Math.max(1, num(e.target.value)) } })} />
                <span className="text-xs text-slate-500">sec</span>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.forceload} onChange={(e) => patch({ forceload: e.target.checked })} />
              Force-load the destination pad (keeps it generated so nobody lands in unloaded terrain)
            </label>
          </section>

          {/* travel item */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Travel item</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.giveTravelItem} onChange={(e) => patch({ giveTravelItem: e.target.checked })} />
              Hand out a right-click travel item (reusable)
            </label>
            {config.giveTravelItem && (
              <div className="mt-3">
                <label className="field-label">Item base</label>
                <input className="input" value={config.travelItemBase} onChange={(e) => patch({ travelItemBase: e.target.value })} placeholder="minecraft:compass" />
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
              {result.validation.ok ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">✓ Valid datapack</span>
              ) : (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">✕ errors</span>
              )}
              <span className="chip ml-auto">tick-free</span>
            </div>
            {result.validation.issues.length > 0 && (
              <ul className="mb-3 space-y-1 text-xs">
                {result.validation.issues.map((iss, idx) => (
                  <li key={idx} className={iss.severity === "error" ? "text-red-300" : "text-amber-300"}>
                    {iss.severity === "error" ? "✕" : "!"} {iss.message}{iss.path ? ` (${iss.path})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <p className="mb-4 text-xs text-slate-500">
              Send a player with <code className="text-amber-300">{result.bundle.namespace}:travel/enter</code>, bring them back with{" "}
              <code className="text-amber-300">travel/exit</code>, and unstick anyone with{" "}
              <code className="text-amber-300">travel/rescue</code>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>⬇ Datapack .zip</button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>⬇ Everything</button>
            </div>
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
              <button className="shrink-0 text-slate-400 hover:text-slate-200" onClick={() => selected && downloadText(selected.contents, selected.path.split("/").pop()!)}>download file</button>
            </div>
            <pre className="scroll-thin max-h-[520px] overflow-auto bg-[#0a0e18] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {selected?.contents}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
