"use client";

import { useMemo, useRef, useState } from "react";
import { generateMystery, describeTask } from "@/lib/mystery/generate";
import { newMysteryConfig, newMysteryStep } from "@/lib/mystery/types";
import type { MysteryConfig, MysteryStep } from "@/lib/mystery/types";
import { TRIGGERS, findTrigger } from "@/lib/objective/triggers";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";

const COUNT_TRIGGERS = TRIGGERS.filter((t) => t.usesCount);

export default function MysteryPage() {
  const [config, setConfig] = useState<MysteryConfig>(() => newMysteryConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");
  const stepId = useRef(100);

  const result = useMemo(() => generateMystery(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<MysteryConfig>) => setConfig((c) => ({ ...c, ...p }));
  const updateStep = (i: number, p: Partial<MysteryStep>) => patch({ steps: config.steps.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const addStep = () => patch({ steps: [...config.steps, newMysteryStep(`m${stepId.current++}`)] });
  const removeStep = (i: number) => patch({ steps: config.steps.filter((_, j) => j !== i) });
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= config.steps.length) return;
    const next = [...config.steps];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ steps: next });
  };

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="chip mb-3">🔮 Mystery Hunt</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a clue chain</h1>
        <p className="mt-1 text-sm text-slate-400">
          A per-player chain of cryptic steps. Players only see the clue for the step they&apos;re on — the real task is
          hidden until they solve it, which reveals it, drops a reward, and unlocks the next clue. Great for legendary hunts.
          Tick-free.
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
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.revealTasks} onChange={(e) => patch({ revealTasks: e.target.checked })} />
                Show the explicit objective with each clue (guided mode)
              </label>
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-slate-500">clue item</span>
                <input className="input" value={config.clueItemBase} onChange={(e) => patch({ clueItemBase: e.target.value })} placeholder="minecraft:paper" />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Steps</h2>
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={addStep} disabled={config.steps.length >= 12}>+ Step</button>
            </div>
            <div className="space-y-3">
              {config.steps.map((s, i) => {
                const trig = findTrigger(s.triggerId);
                return (
                  <div key={s.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-300">{i + 1}</span>
                      <span className="flex-1 text-xs text-slate-500">{describeTask(s)} — hidden from players</span>
                      <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label="up">↑</button>
                      <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => moveStep(i, 1)} disabled={i === config.steps.length - 1} aria-label="down">↓</button>
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removeStep(i)} disabled={config.steps.length <= 1} aria-label="remove">✕</button>
                    </div>

                    <label className="field-label">Clue (cryptic — shown to players)</label>
                    <textarea className="input min-h-[44px]" value={s.clue} onChange={(e) => updateStep(i, { clue: e.target.value })} placeholder="Something watches from the forest after dusk…" />

                    <label className="field-label mt-3">Hidden task</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <select className="input" value={s.triggerId} onChange={(e) => updateStep(i, { triggerId: e.target.value })}>
                        {COUNT_TRIGGERS.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">×</span>
                        <input type="number" min={1} className="input w-20" value={s.count} onChange={(e) => updateStep(i, { count: Math.max(1, Number(e.target.value) || 1) })} />
                      </div>
                    </div>
                    {trig?.usesType && (
                      <select className="input mt-2" value={s.pokemonType} onChange={(e) => updateStep(i, { pokemonType: e.target.value as MysteryStep["pokemonType"] })}>
                        <option value="any">any type</option>
                        {ALL_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}

                    <label className="field-label mt-3">Reveal line on solve (optional)</label>
                    <input className="input" value={s.solved} onChange={(e) => updateStep(i, { solved: e.target.value })} placeholder={`"Solved!" → defaults to the task (${describeTask(s)})`} />

                    <div className="mt-3">
                      <label className="field-label">Reward on solve</label>
                      <RewardList rewards={s.reward} onChange={(reward) => updateStep(i, { reward })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">🏆 Finale reward (whole chain)</h2>
            <p className="mb-2 text-xs text-slate-500">Bonus granted when the last step is solved.</p>
            <RewardList rewards={config.finaleReward} onChange={(finaleReward) => patch({ finaleReward })} />
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
              <span className="chip ml-auto">{config.steps.length} steps</span>
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
              Hand out the clue item with <code className="text-amber-300">{result.bundle.namespace}:give_clue_item</code>. Players
              right-click-hold it to start and to re-read their current clue. Your full answer key is in{" "}
              <code className="text-amber-300">mystery_outline.txt</code>.
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
