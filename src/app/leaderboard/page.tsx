"use client";

import { useMemo, useState } from "react";
import { generateLeaderboard } from "@/lib/leaderboard/generate";
import { newLeaderboardConfig } from "@/lib/leaderboard/types";
import type { LeaderboardConfig } from "@/lib/leaderboard/types";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableLeaderboard, fromPortableLeaderboard } from "@/lib/leaderboard/portable";

export default function LeaderboardPage() {
  const [config, setConfig] = useState<LeaderboardConfig>(() => newLeaderboardConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");

  const result = useMemo(() => generateLeaderboard(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<LeaderboardConfig>) => setConfig((c) => ({ ...c, ...p }));

  const setAmount = (i: number, v: number) => patch({ amounts: config.amounts.map((a, j) => (j === i ? v : a)) });
  const addAmount = () => patch({ amounts: [...config.amounts, (Math.max(0, ...config.amounts) || 0) + 5] });
  const removeAmount = (i: number) => patch({ amounts: config.amounts.filter((_, j) => j !== i) });

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="chip mb-3">🏆 Leaderboard</div>
            <h1 className="text-2xl font-bold text-slate-100">Build a points leaderboard</h1>
          </div>
          <ConfigPortIO
            config={config}
            filename={`${result.bundle.slug}.leaderboard.json`}
            toPortable={toPortableLeaderboard}
            fromPortable={fromPortableLeaderboard}
            onImport={(c) => { setConfig(c); setActiveFile(""); }}
            exportDisabled={!config.title}
            hint="Export this leaderboard as JSON, or import a saved one (or the leaderboard_config.json from a downloaded bundle) to edit & re-run."
          />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          A reusable scoreboard you can drop into any event. Admins bump scores with a function; a live, auto-sorted
          sidebar shows the ranking. Optionally it scores itself off catches, battles, and shinies. Tick-free.
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
              <div>
                <label className="field-label">Objective name (optional)</label>
                <input className="input" value={config.objective} onChange={(e) => patch({ objective: e.target.value })} placeholder="auto from title" />
              </div>
              <div>
                <label className="field-label">Unit label</label>
                <input className="input" value={config.unit} onChange={(e) => patch({ unit: e.target.value })} placeholder="points" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.sidebar} onChange={(e) => patch({ sidebar: e.target.checked })} />
                Live sidebar
              </label>
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-slate-500">sidebar title</span>
                <input className="input" value={config.sidebarTitle} onChange={(e) => patch({ sidebarTitle: e.target.value })} placeholder="(uses title)" disabled={!config.sidebar} />
              </div>
            </div>
          </section>

          {/* quick amounts */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Quick add/remove buttons</h2>
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={addAmount} disabled={config.amounts.length >= 8}>+ Amount</button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Each amount makes a <code className="text-slate-400">score/add_&lt;n&gt;</code> and{" "}
              <code className="text-slate-400">score/take_&lt;n&gt;</code> function the owner runs against a player.
            </p>
            <div className="flex flex-wrap gap-2">
              {config.amounts.map((a, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-slate-500">+</span>
                  <input type="number" min={1} className="input w-20" value={a} onChange={(e) => setAmount(i, Math.max(1, Number(e.target.value) || 1))} />
                  <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => removeAmount(i)} disabled={config.amounts.length <= 1} aria-label="remove">✕</button>
                </div>
              ))}
            </div>
          </section>

          {/* auto-scoring */}
          <section className="panel p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Auto-scoring (optional)</h2>
            <p className="mb-3 text-xs text-slate-500">Leave all off for a purely admin-driven board, or have it score itself in-game.</p>
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.autoCatch.enabled} onChange={(e) => patch({ autoCatch: { ...config.autoCatch, enabled: e.target.checked } })} />
                  Per catch
                </label>
                <select className="input w-32" value={config.autoCatch.type} disabled={!config.autoCatch.enabled} onChange={(e) => patch({ autoCatch: { ...config.autoCatch, type: e.target.value as LeaderboardConfig["autoCatch"]["type"] } })}>
                  <option value="any">any type</option>
                  {ALL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input type="number" min={1} className="input w-20" value={config.autoCatch.amount} disabled={!config.autoCatch.enabled} onChange={(e) => patch({ autoCatch: { ...config.autoCatch, amount: Math.max(1, Number(e.target.value) || 1) } })} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.autoBattle.enabled} onChange={(e) => patch({ autoBattle: { ...config.autoBattle, enabled: e.target.checked } })} />
                  Per battle won
                </label>
                <input type="number" min={1} className="input w-20" value={config.autoBattle.amount} disabled={!config.autoBattle.enabled} onChange={(e) => patch({ autoBattle: { ...config.autoBattle, amount: Math.max(1, Number(e.target.value) || 1) } })} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.autoShiny.enabled} onChange={(e) => patch({ autoShiny: { ...config.autoShiny, enabled: e.target.checked } })} />
                  Per shiny caught (bonus)
                </label>
                <input type="number" min={1} className="input w-20" value={config.autoShiny.amount} disabled={!config.autoShiny.enabled} onChange={(e) => patch({ autoShiny: { ...config.autoShiny, amount: Math.max(1, Number(e.target.value) || 1) } })} />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Results template</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Top</span>
              <input type="number" min={1} max={25} className="input w-20" value={config.top} onChange={(e) => patch({ top: Math.max(1, Math.min(25, Number(e.target.value) || 1)) })} />
              <span className="text-sm text-slate-300">ranks in leaderboard_template.md / leaderboard.json</span>
            </div>
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
              On load this creates the objective{config.sidebar ? " and shows the sidebar" : ""}. Award points with{" "}
              <code className="text-amber-300">{result.bundle.namespace}:score/add_{config.amounts[0] ?? 1}</code>, show standings with{" "}
              <code className="text-amber-300">{result.bundle.namespace}:score/show</code>.
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
