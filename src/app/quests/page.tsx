"use client";

import { useMemo, useRef, useState } from "react";
import { generateQuestline } from "@/lib/quest/generate";
import { newQuest, newTask } from "@/lib/quest/types";
import type { QuestConfig, Quest, QuestTask } from "@/lib/quest/types";
import { TRIGGERS } from "@/lib/objective/triggers";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import type { PokeType } from "@/lib/catalog/pokemon";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableQuest, fromPortableQuest } from "@/lib/quest/portable";

const TASK_KINDS: { id: QuestTask["kind"]; label: string }[] = [
  { id: "objective", label: "Cobblemon objective" },
  { id: "item", label: "Submit item" },
  { id: "location", label: "Reach dimension" },
  { id: "manual", label: "Manual (admin grants)" },
];

const DEFAULT_CONFIG: QuestConfig = {
  title: "Professor's Research",
  icon: "cobblemon:poke_ball",
  packFormat: 48,
  exportAdvancements: true,
  exportFtb: true,
  quests: [
    newQuest("q1", { title: "First Catch", description: ["Catch your very first Pokémon."], task: newTask({ kind: "objective", triggerId: "cobblemon:catch_pokemon", count: 1 }), rewards: [{ kind: "item", itemId: "cobblemon:poke_ball", count: 5 }], x: 0, y: 0 }),
    newQuest("q2", { title: "Type Specialist", task: newTask({ kind: "objective", count: 10, pokemonType: "electric" }), dependencies: ["q1"], rewards: [{ kind: "item", itemId: "obc:bottle_cap", count: 1 }], x: 3, y: 0 }),
  ],
};

function QuestCard({ quest, all, onChange, onRemove }: { quest: Quest; all: Quest[]; onChange: (p: Partial<Quest>) => void; onRemove: () => void }) {
  const t = quest.task;
  const setTask = (p: Partial<QuestTask>) => onChange({ task: { ...t, ...p } });
  const others = all.filter((q) => q.id !== quest.id);
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input min-w-[8rem] flex-1" placeholder="Quest title" value={quest.title} onChange={(e) => onChange({ title: e.target.value })} />
        <input className="input w-40 font-mono text-xs" placeholder="icon item" value={quest.icon} onChange={(e) => onChange({ icon: e.target.value })} title="icon item id" />
        <button className="btn-ghost px-2 py-1 text-xs" onClick={onRemove} title="Remove quest">
          ✕
        </button>
      </div>

      {/* task */}
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-44 text-xs" value={t.kind} onChange={(e) => setTask({ kind: e.target.value as QuestTask["kind"] })}>
          {TASK_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        {t.kind === "objective" && (
          <>
            <select className="input flex-1 text-xs" value={t.triggerId} onChange={(e) => setTask({ triggerId: e.target.value })}>
              {TRIGGERS.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.label}
                </option>
              ))}
            </select>
            <input type="number" min={1} className="input w-16 text-xs" value={t.count} onChange={(e) => setTask({ count: Math.max(1, Number(e.target.value) || 1) })} title="count" />
            <select className="input w-24 text-xs" value={t.pokemonType} onChange={(e) => setTask({ pokemonType: e.target.value as PokeType | "any" })} title="type">
              <option value="any">any</option>
              {ALL_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </select>
          </>
        )}
        {t.kind === "item" && (
          <>
            <input className="input flex-1 font-mono text-xs" placeholder="minecraft:diamond" value={t.itemId} onChange={(e) => setTask({ itemId: e.target.value })} />
            <input type="number" min={1} className="input w-16 text-xs" value={t.itemCount} onChange={(e) => setTask({ itemCount: Math.max(1, Number(e.target.value) || 1) })} title="amount" />
          </>
        )}
        {t.kind === "location" && <input className="input flex-1 font-mono text-xs" placeholder="minecraft:the_nether" value={t.dimension} onChange={(e) => setTask({ dimension: e.target.value })} />}
        {t.kind === "manual" && <span className="text-[11px] text-slate-500">Granted by /advancement grant (vanilla) or a checkmark click (FTB).</span>}
      </div>

      {/* dependencies */}
      {others.length > 0 && (
        <div>
          <span className="field-label">Requires (branching)</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {others.map((o) => (
              <label key={o.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-amber-400"
                  checked={quest.dependencies.includes(o.id)}
                  onChange={(e) => onChange({ dependencies: e.target.checked ? [...quest.dependencies, o.id] : quest.dependencies.filter((d) => d !== o.id) })}
                />
                {o.title || o.id}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* x/y + description */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">FTB pos</span>
        <input type="number" step="0.5" className="input w-16 text-xs" value={quest.x} onChange={(e) => onChange({ x: Number(e.target.value) || 0 })} title="x" />
        <input type="number" step="0.5" className="input w-16 text-xs" value={quest.y} onChange={(e) => onChange({ y: Number(e.target.value) || 0 })} title="y" />
        <input className="input min-w-[8rem] flex-1 text-xs" placeholder="description (one line)" value={quest.description.join(" ")} onChange={(e) => onChange({ description: e.target.value ? [e.target.value] : [] })} />
      </div>

      <RewardList rewards={quest.rewards} onChange={(rewards) => onChange({ rewards })} />
    </div>
  );
}

export default function Page() {
  const [config, setConfig] = useState<QuestConfig>(DEFAULT_CONFIG);
  const [activeFile, setActiveFile] = useState("");
  const counter = useRef(100);

  const result = useMemo(() => generateQuestline(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];
  const patch = (p: Partial<QuestConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchQuest = (i: number, p: Partial<Quest>) => patch({ quests: config.quests.map((q, j) => (j === i ? { ...q, ...p } : q)) });

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="chip mb-3">🗺️ Questlines</div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-100">Build a Questline</h1>
          <ConfigPortIO
            config={config}
            filename={`${result.bundle.slug}.questline.json`}
            toPortable={toPortableQuest}
            fromPortable={fromPortableQuest}
            onImport={(c) => {
              setConfig(c);
              setActiveFile("");
            }}
            exportDisabled={!config.title}
            hint="Export this questline as JSON, or import a saved one (or the questline_config.json from a downloaded bundle) to edit & re-run."
          />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          A branching mini-RPG arc. Exports a <b>vanilla advancement tree</b> (no mod) and/or an <b>FTB Quests chapter</b>. Tasks
          reuse the Cobblemon triggers; rewards run as functions/commands. Install one system to avoid double rewards.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT — config */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Questline name</label>
                <input className="input" value={config.title} placeholder="Professor's Research" onChange={(e) => patch({ title: e.target.value })} />
                <p className="mt-1.5 text-xs text-slate-500">
                  namespace <code className="text-amber-300">{result.bundle.namespace}</code>
                </p>
              </div>
              <div>
                <label className="field-label">Chapter icon</label>
                <input className="input font-mono text-xs" value={config.icon} onChange={(e) => patch({ icon: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
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
              <label className="flex items-end gap-2 pb-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.exportAdvancements} onChange={(e) => patch({ exportAdvancements: e.target.checked })} /> Vanilla advancement tree
              </label>
              <label className="flex items-end gap-2 pb-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.exportFtb} onChange={(e) => patch({ exportFtb: e.target.checked })} /> FTB Quests chapter
              </label>
            </div>
          </section>

          <div className="space-y-4">
            {config.quests.map((q, i) => (
              <QuestCard key={q.id} quest={q} all={config.quests} onChange={(p) => patchQuest(i, p)} onRemove={() => patch({ quests: config.quests.filter((_, j) => j !== i) })} />
            ))}
            <button className="btn-ghost w-full py-2 text-sm" onClick={() => patch({ quests: [...config.quests, newQuest(`q${counter.current++}`, { x: 0, y: 0 })] })}>
              + Add quest
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
              <span className="chip ml-auto">{result.questCount} quests</span>
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
                ⬇ Everything (incl. FTB .snbt)
              </button>
            </div>
            {!config.title && <p className="mt-2 text-xs text-slate-500">Name the questline to enable download.</p>}
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
