"use client";

import { useMemo, useRef, useState } from "react";
import { generateEscalation, describeGoal } from "@/lib/escalation/generate";
import { newEscalationConfig, newStage } from "@/lib/escalation/types";
import type { EscalationConfig, EscalationStage } from "@/lib/escalation/types";
import { TRIGGERS, findTrigger } from "@/lib/objective/triggers";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";

const COUNT_TRIGGERS = TRIGGERS.filter((t) => t.usesCount);

export default function EscalationPage() {
  const [config, setConfig] = useState<EscalationConfig>(() => newEscalationConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");
  const stageId = useRef(100);

  const result = useMemo(() => generateEscalation(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<EscalationConfig>) => setConfig((c) => ({ ...c, ...p }));
  const updateStage = (i: number, p: Partial<EscalationStage>) => patch({ stages: config.stages.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const addStage = () => patch({ stages: [...config.stages, newStage(`s${stageId.current++}`)] });
  const removeStage = (i: number) => patch({ stages: config.stages.filter((_, j) => j !== i) });
  const moveStage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= config.stages.length) return;
    const next = [...config.stages];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ stages: next });
  };

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="chip mb-3">✦ Escalation Stages</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a multi-phase event</h1>
        <p className="mt-1 text-sm text-slate-400">
          A server-wide story that escalates as everyone plays. The whole server contributes toward each stage&apos;s goal;
          reaching it announces the next stage and fires its effects (spawn bursts, rewards). The last stage is the finale.
          Tick-free — runs on a global counter + Cobblemon advancements.
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
            <div className="mt-3">
              <label className="field-label">Blurb (Discord teaser)</label>
              <input className="input" value={config.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.progressBar} onChange={(e) => patch({ progressBar: e.target.checked })} />
              Show a server-wide progress boss bar
            </label>
          </section>

          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Stages</h2>
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={addStage} disabled={config.stages.length >= 10}>+ Stage</button>
            </div>
            <div className="space-y-3">
              {config.stages.map((s, i) => {
                const terminal = i === config.stages.length - 1;
                const trig = findTrigger(s.goalTrigger);
                return (
                  <div key={s.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">{i + 1}</span>
                      <input className="input flex-1" value={s.label} onChange={(e) => updateStage(i, { label: e.target.value })} placeholder="Stage label" />
                      <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => moveStage(i, -1)} disabled={i === 0} aria-label="up">↑</button>
                      <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => moveStage(i, 1)} disabled={terminal} aria-label="down">↓</button>
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removeStage(i)} disabled={config.stages.length <= 1} aria-label="remove">✕</button>
                    </div>

                    <label className="field-label">Announcement when reached</label>
                    <input className="input" value={s.announce} onChange={(e) => updateStage(i, { announce: e.target.value })} placeholder="(no announcement)" />
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-amber-400" checked={s.bigTitle} onChange={(e) => updateStage(i, { bigTitle: e.target.checked })} />
                      Show as a big on-screen title (for the dramatic beats)
                    </label>

                    {terminal ? (
                      <p className="mt-3 rounded bg-amber-400/10 px-2 py-1 text-xs text-amber-200">🏁 Finale — reaching this stage ends the story (no goal needed).</p>
                    ) : (
                      <div className="mt-3">
                        <label className="field-label">Advance when the server (together)…</label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <select className="input" value={s.goalTrigger} onChange={(e) => updateStage(i, { goalTrigger: e.target.value })}>
                            {COUNT_TRIGGERS.map((t) => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">×</span>
                            <input type="number" min={1} className="input w-24" value={s.goalCount} onChange={(e) => updateStage(i, { goalCount: Math.max(1, Number(e.target.value) || 1) })} />
                          </div>
                        </div>
                        {trig?.usesType && (
                          <select className="input mt-2" value={s.goalType} onChange={(e) => updateStage(i, { goalType: e.target.value as EscalationStage["goalType"] })}>
                            <option value="any">any type</option>
                            {ALL_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        )}
                        <p className="mt-1 text-[11px] text-slate-500">{describeGoal(s)} — counted across all players.</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="field-label">Effects when reached (applied to everyone online)</label>
                      <RewardList rewards={s.effects} onChange={(effects) => updateStage(i, { effects })} />
                    </div>
                  </div>
                );
              })}
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
              <span className="chip ml-auto">{config.stages.length} stages</span>
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
              The story starts on <code className="text-amber-300">/reload</code> and auto-advances. Admins can{" "}
              <code className="text-amber-300">{result.bundle.namespace}:status</code>,{" "}
              <code className="text-amber-300">{result.bundle.namespace}:force_advance</code>, or{" "}
              <code className="text-amber-300">{result.bundle.namespace}:restart</code>.
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
