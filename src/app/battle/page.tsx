"use client";

import { useMemo, useState } from "react";
import { generateBattleFactory } from "@/lib/battle/generate";
import { generateBattleTower } from "@/lib/battle/tower";
import type { TowerConfig, TowerMilestone } from "@/lib/battle/tower";
import { FORMATS, THEMES, DIFFICULTIES, STANDARD_CLAUSES, ALL_THEME_TYPES } from "@/lib/battle/catalog";
import type { BattleConfig } from "@/lib/battle/types";
import type { PokeType } from "@/lib/catalog/pokemon";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableBattle, fromPortableBattle } from "@/lib/battle/portable";
import { toPortableTower, fromPortableTower } from "@/lib/battle/towerPortable";

const DEFAULT_CONFIG: BattleConfig = {
  title: "Frontier Factory",
  format: "singles",
  level: 50,
  teamSize: 3,
  poolSize: 60,
  draftMode: "runtime",
  theme: "balanced",
  themeType: "fire",
  difficulty: "competitive",
  seed: 1,
  bannedSpecies: [],
  clauses: STANDARD_CLAUSES.slice(0, 3),
  draftItem: true,
  packFormat: 48,
};

const DRAFT_MODES = [
  { id: "runtime" as const, name: "Runtime random", blurb: "Fresh team each draft" },
  { id: "fixed" as const, name: "Fixed teams", blurb: "Pre-built pool" },
];

const PAGE_MODES = [
  { id: "rental" as const, name: "🎴 Rental Factory", blurb: "Draft kits & battle (PvP)" },
  { id: "tower" as const, name: "🗼 NPC Tower", blurb: "Climb RCT trainers for rewards" },
];

const DEFAULT_TOWER: TowerConfig = {
  title: "Sky Tower",
  floors: 10,
  scope: "type",
  trainerType: "NORMAL",
  trainerIds: [],
  perFloorReward: [{ kind: "item", itemId: "cobblemon:rare_candy", count: 1 }],
  milestones: [
    { floor: 5, rewards: [{ kind: "item", itemId: "cobblemon:exp_candy_xl", count: 5 }] },
    { floor: 10, rewards: [{ kind: "item", itemId: "obc:bottle_cap", count: 1 }] },
  ],
  packFormat: 48,
};

/** Small list editor for free-text lines (clauses) / species ids (banlist). */
function ListEditor({ label, items, onChange, datalist, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; datalist?: string; placeholder?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="field-label">{label}</span>
        <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => onChange([...items, ""])}>
          + Add
        </button>
      </div>
      {items.length === 0 && <p className="text-[11px] text-slate-600">none</p>}
      <div className="space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              list={datalist}
              className="input text-xs"
              placeholder={placeholder}
              value={it}
              onChange={(e) => {
                const n = [...items];
                n[i] = e.target.value;
                onChange(n);
              }}
            />
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle<T extends string>({ options, value, onChange }: { options: { id: T; name: string; blurb?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`panel p-2.5 text-center transition ${value === o.id ? "border-amber-400/70 bg-amber-400/10" : "hover:border-slate-500"}`}
          title={o.blurb}
        >
          <div className="text-xs font-semibold text-slate-200">{o.name}</div>
          {o.blurb && <div className="mt-0.5 text-[10px] leading-tight text-slate-500">{o.blurb}</div>}
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [pageMode, setPageMode] = useState<"rental" | "tower">("rental");
  const [config, setConfig] = useState<BattleConfig>(DEFAULT_CONFIG);
  const [tower, setTower] = useState<TowerConfig>(DEFAULT_TOWER);
  const [activeFile, setActiveFile] = useState("");

  const rentalResult = useMemo(() => generateBattleFactory(config), [config]);
  const towerResult = useMemo(() => generateBattleTower(tower), [tower]);
  const result = pageMode === "rental" ? rentalResult : towerResult;
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];
  const patch = (p: Partial<BattleConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchTower = (p: Partial<TowerConfig>) => setTower((t) => ({ ...t, ...p }));

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  const headChip =
    pageMode === "rental"
      ? config.draftMode === "runtime"
        ? `${rentalResult.pool.length} sets · teams of ${config.teamSize}`
        : `${rentalResult.teams.length} teams · ${rentalResult.teams.reduce((s, t) => s + t.mons.length, 0)} mons`
      : `${towerResult.floors} floors`;
  const titleOk = pageMode === "rental" ? !!config.title : !!tower.title;

  return (
    <div className="px-6 py-8">
      <SharedDatalists />

      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="chip mb-3">⚔️ Battle Factory</div>
          <h1 className="text-2xl font-bold text-slate-100">Build a Battle Factory</h1>
          <p className="mt-1 text-sm text-slate-400">
            {pageMode === "rental"
              ? "Pre-built rental teams + a ruleset; players draft and battle (PvP)."
              : "An RCT NPC battle tower: a reward each floor, bigger rewards the higher you climb."}
          </p>
        </div>
        {pageMode === "rental" ? (
          <ConfigPortIO
            config={config}
            filename={`${result.bundle.slug}.battle.json`}
            toPortable={toPortableBattle}
            fromPortable={fromPortableBattle}
            onImport={(c) => { setConfig(c); setActiveFile(""); }}
            exportDisabled={!titleOk}
            hint="Export this factory as JSON, or import a saved one (or the battle_config.json from a downloaded bundle)."
          />
        ) : (
          <ConfigPortIO
            config={tower}
            filename={`${result.bundle.slug}.tower.json`}
            toPortable={toPortableTower}
            fromPortable={fromPortableTower}
            onImport={(c) => { setTower(c); setActiveFile(""); }}
            exportDisabled={!titleOk}
            hint="Export this tower as JSON, or import a saved one (or the tower_config.json from a downloaded bundle)."
          />
        )}
      </header>

      <div className="mb-6 max-w-md">
        <Toggle options={PAGE_MODES} value={pageMode} onChange={setPageMode} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT — config */}
        <div className="space-y-6">
          {pageMode === "rental" && (
            <>
          <section className="panel p-5">
            <div className="space-y-4">
              <div>
                <label className="field-label">Event name</label>
                <input className="input" value={config.title} placeholder="Frontier Factory" onChange={(e) => patch({ title: e.target.value })} />
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

          <section className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Format &amp; ruleset</h2>
            <div>
              <div className="field-label">Draft mode</div>
              <Toggle options={DRAFT_MODES} value={config.draftMode} onChange={(draftMode) => patch({ draftMode })} />
              <p className="mt-1 text-[11px] text-slate-500">
                {config.draftMode === "runtime"
                  ? "The pack bakes a set pool and assembles a random team in-game on each draft."
                  : "Teams are pre-built now and baked into the pack; a draft picks one."}
              </p>
            </div>
            <div>
              <div className="field-label">Battle format</div>
              <Toggle options={FORMATS} value={config.format} onChange={(format) => patch({ format })} />
            </div>
            <div>
              <div className="field-label">Difficulty (rental quality)</div>
              <Toggle options={DIFFICULTIES} value={config.difficulty} onChange={(difficulty) => patch({ difficulty })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">Level</label>
                <input type="number" min={1} max={100} className="input" value={config.level} onChange={(e) => patch({ level: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
              </div>
              <div>
                <label className="field-label">Team size</label>
                <input type="number" min={1} max={6} className="input" value={config.teamSize} onChange={(e) => patch({ teamSize: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })} />
              </div>
              <div>
                <label className="field-label">{config.draftMode === "runtime" ? "Pool size" : "# Teams"}</label>
                <input
                  type="number"
                  min={1}
                  max={config.draftMode === "runtime" ? 128 : 32}
                  className="input"
                  value={config.poolSize}
                  onChange={(e) => patch({ poolSize: Math.min(config.draftMode === "runtime" ? 128 : 32, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </div>
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Theme</h2>
            <Toggle options={THEMES} value={config.theme} onChange={(theme) => patch({ theme })} />
            {config.theme === "monotype" && (
              <div>
                <label className="field-label">Type</label>
                <select className="input" value={config.themeType} onChange={(e) => patch({ themeType: e.target.value as PokeType })}>
                  {ALL_THEME_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.draftItem} onChange={(e) => patch({ draftItem: e.target.checked })} />
                Draft ticket item
              </label>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">Seed</span>
                <input type="number" className="input w-24 text-xs" value={config.seed} onChange={(e) => patch({ seed: Number(e.target.value) || 0 })} />
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => patch({ seed: Math.floor(Math.random() * 1_000_000) })} title="Reroll the pool">
                  🎲
                </button>
              </div>
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Clauses &amp; banlist</h2>
            <ListEditor label="Clauses (stated)" items={config.clauses} onChange={(clauses) => patch({ clauses })} placeholder="Species Clause — …" />
            <ListEditor label="Banned species" items={config.bannedSpecies} onChange={(bannedSpecies) => patch({ bannedSpecies })} datalist="dl-species" placeholder="species id (e.g. dragapult)" />
          </section>
            </>
          )}

          {pageMode === "tower" && (
            <>
              <section className="panel p-5">
                <div className="space-y-4">
                  <div>
                    <label className="field-label">Tower name</label>
                    <input className="input" value={tower.title} placeholder="Sky Tower" onChange={(e) => patchTower({ title: e.target.value })} />
                    <p className="mt-1.5 text-xs text-slate-500">
                      namespace <code className="text-amber-300">{towerResult.bundle.namespace}</code>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Floors</label>
                      <input type="number" min={1} max={100} className="input" value={tower.floors} onChange={(e) => patchTower({ floors: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
                    </div>
                    <div>
                      <label className="field-label">Target Minecraft</label>
                      <select className="input" value={tower.packFormat} onChange={(e) => patchTower({ packFormat: Number(e.target.value) })}>
                        {MC_VERSIONS.map((v) => (
                          <option key={v.packFormat} value={v.packFormat}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel space-y-4 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">RCT trainers</h2>
                <p className="text-[11px] text-amber-400/90">Requires Radical Cobblemon Trainers. A floor clears per DISTINCT tower trainer defeated.</p>
                <div>
                  <div className="field-label">Match trainers by</div>
                  <Toggle
                    options={[
                      { id: "type" as const, name: "Trainer type" },
                      { id: "ids" as const, name: "Trainer ids" },
                    ]}
                    value={tower.scope}
                    onChange={(scope) => patchTower({ scope })}
                  />
                </div>
                {tower.scope === "type" ? (
                  <div>
                    <label className="field-label">Trainer type</label>
                    <input className="input font-mono text-xs" value={tower.trainerType} placeholder="NORMAL" onChange={(e) => patchTower({ trainerType: e.target.value })} />
                  </div>
                ) : (
                  <ListEditor label="Trainer ids" items={tower.trainerIds} onChange={(trainerIds) => patchTower({ trainerIds })} placeholder="leader_brock_019e" />
                )}
              </section>

              <section className="panel space-y-3 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Per-floor reward</h2>
                <p className="text-[11px] text-slate-500">Handed out every floor a player clears.</p>
                <RewardList rewards={tower.perFloorReward} onChange={(perFloorReward) => patchTower({ perFloorReward })} />
              </section>

              <section className="panel space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Milestone bonuses</h2>
                  <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => patchTower({ milestones: [...tower.milestones, { floor: tower.floors, rewards: [] } as TowerMilestone] })}>
                    + Add
                  </button>
                </div>
                {tower.milestones.length === 0 && <p className="text-[11px] text-slate-600">none</p>}
                {tower.milestones.map((m, i) => (
                  <div key={i} className="space-y-2 rounded border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Floor</span>
                      <input
                        type="number"
                        min={1}
                        max={tower.floors}
                        className="input w-20 text-xs"
                        value={m.floor}
                        onChange={(e) => {
                          const ms = [...tower.milestones];
                          ms[i] = { ...ms[i], floor: Math.max(1, Number(e.target.value) || 1) };
                          patchTower({ milestones: ms });
                        }}
                      />
                      <button className="btn-ghost ml-auto px-2 py-1 text-xs" onClick={() => patchTower({ milestones: tower.milestones.filter((_, j) => j !== i) })}>
                        ✕
                      </button>
                    </div>
                    <RewardList
                      rewards={m.rewards}
                      onChange={(rewards) => {
                        const ms = [...tower.milestones];
                        ms[i] = { ...ms[i], rewards };
                        patchTower({ milestones: ms });
                      }}
                    />
                  </div>
                ))}
              </section>
            </>
          )}
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
              <span className="chip ml-auto">{headChip}</span>
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
              <button className="btn-primary" onClick={downloadDatapack} disabled={!titleOk}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!titleOk}>
                ⬇ Everything
              </button>
            </div>
            {!titleOk && <p className="mt-2 text-xs text-slate-500">Name the {pageMode === "tower" ? "tower" : "event"} to enable download.</p>}
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
