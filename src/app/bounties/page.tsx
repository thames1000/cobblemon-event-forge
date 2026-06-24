"use client";

import { useMemo, useRef, useState } from "react";
import { generateBountyBoard } from "@/lib/bounty/generate";
import { newCommunityGoal } from "@/lib/bounty/types";
import type { BountyConfig, CommunityGoal } from "@/lib/bounty/types";
import { newObjective } from "@/lib/objective/types";
import { TRIGGERS } from "@/lib/objective/triggers";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import type { PokeType } from "@/lib/catalog/pokemon";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import ObjectiveEditor from "@/app/components/ObjectiveEditor";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableBounty, fromPortableBounty } from "@/lib/bounty/portable";

const DEFAULT_CONFIG: BountyConfig = {
  title: "Weekly Bounties",
  daily: [newObjective("d1", { mode: "auto", triggerId: "cobblemon:catch_pokemon", count: 10, pokemonType: "any", announce: true, rewards: [{ kind: "item", itemId: "cobblemon:rare_candy", count: 2 }] })],
  weekly: [newObjective("w1", { mode: "auto", triggerId: "cobblemon:battles_won", count: 20, announce: true, rewards: [{ kind: "item", itemId: "obc:bottle_cap", count: 1 }] })],
  special: [],
  community: [{ ...newCommunityGoal("c1"), label: "Catch a Water-type", count: 1, pokemonType: "water", targetPlayers: 25, rewards: [{ kind: "crate-key", crateName: "Fishing Crate", baseItem: "minecraft:nether_star", glint: true }] }],
  boardItem: true,
  packFormat: 48,
};

function CommunityGoals({ goals, onChange }: { goals: CommunityGoal[]; onChange: (g: CommunityGoal[]) => void }) {
  const counter = useRef(2000);
  const update = (i: number, patch: Partial<CommunityGoal>) => onChange(goals.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Community goals</h2>
        <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => onChange([...goals, newCommunityGoal(`c${counter.current++}`)])}>
          + Add
        </button>
      </div>
      {goals.length === 0 && <p className="text-xs text-slate-500">Participation goals: N trainers each complete the task → a reward for everyone online.</p>}
      <div className="space-y-3">
        {goals.map((g, i) => (
          <div key={g.id} className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
            <div className="flex items-center gap-2">
              <input className="input" placeholder="Goal label (e.g. Catch a Water-type)" value={g.label} onChange={(e) => update(i, { label: e.target.value })} />
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange(goals.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select className="input text-xs" value={g.triggerId} onChange={(e) => update(i, { triggerId: e.target.value })} title="task">
                {TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input type="number" min={1} className="input text-xs" value={g.count} onChange={(e) => update(i, { count: Math.max(1, Number(e.target.value) || 1) })} title="count per trainer" />
              <select className="input text-xs" value={g.pokemonType} onChange={(e) => update(i, { pokemonType: e.target.value as PokeType | "any" })} title="type">
                <option value="any">any type</option>
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input type="number" min={1} className="input text-xs" value={g.targetPlayers} onChange={(e) => update(i, { targetPlayers: Math.max(1, Number(e.target.value) || 1) })} title="# trainers needed" />
            </div>
            <RewardList rewards={g.rewards} onChange={(rewards) => update(i, { rewards })} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const [config, setConfig] = useState<BountyConfig>(DEFAULT_CONFIG);
  const [activeFile, setActiveFile] = useState("");

  const result = useMemo(() => generateBountyBoard(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];
  const patch = (p: Partial<BountyConfig>) => setConfig((c) => ({ ...c, ...p }));

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="chip mb-3">📋 Bounty Board</div>
          <h1 className="text-2xl font-bold text-slate-100">Build a Bounty Board</h1>
          <p className="mt-1 text-sm text-slate-400">
            Daily / weekly / special <b>contracts</b> that auto-complete in-game, plus <b>community goals</b> (everyone pitches in → everyone
            wins). Players check progress with a reusable Bounty Board item.
          </p>
        </div>
        <ConfigPortIO
          config={config}
          filename={`${result.bundle.slug}.bounty.json`}
          toPortable={toPortableBounty}
          fromPortable={fromPortableBounty}
          onImport={(c) => {
            setConfig(c);
            setActiveFile("");
          }}
          exportDisabled={!config.title}
          hint="Export this board as JSON, or import a saved one (or the bounty_config.json from a downloaded bundle) to edit & re-run."
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT — config */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="space-y-4">
              <div>
                <label className="field-label">Board name</label>
                <input className="input" value={config.title} placeholder="Weekly Bounties" onChange={(e) => patch({ title: e.target.value })} />
                <p className="mt-1.5 text-xs text-slate-500">
                  namespace <code className="text-amber-300">{result.bundle.namespace}</code>
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.boardItem} onChange={(e) => patch({ boardItem: e.target.checked })} />
                  Bounty Board item
                </label>
              </div>
            </div>
          </section>

          <ObjectiveEditor title="Daily bounties" objectives={config.daily} onChange={(daily) => patch({ daily })} />
          <ObjectiveEditor title="Weekly bounties" objectives={config.weekly} onChange={(weekly) => patch({ weekly })} />
          <ObjectiveEditor title="Special bounties" objectives={config.special} onChange={(special) => patch({ special })} />
          <CommunityGoals goals={config.community} onChange={(community) => patch({ community })} />
        </div>

        {/* RIGHT — preview */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
              {result.validation.ok ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">✓ Valid datapack</span>
              ) : (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">✕ errors</span>
              )}
              <span className="chip ml-auto">
                {result.bountyCount} bounties · {config.community.length} community
              </span>
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
            {!config.title && <p className="mt-2 text-xs text-slate-500">Name the board to enable download.</p>}
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
