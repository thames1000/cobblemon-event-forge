"use client";

import { useMemo, useRef, useState } from "react";
import { generateTeams } from "@/lib/teams/generate";
import { newTeamsConfig, defaultTeam, newTeamGoal, TEAM_COLORS } from "@/lib/teams/types";
import type { TeamsConfig, TeamGoal, ScoreRule } from "@/lib/teams/types";
import { TRIGGERS, findTrigger, describeObjective } from "@/lib/objective/triggers";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import type { Objective } from "@/lib/objective/types";

export default function TeamsPage() {
  const [config, setConfig] = useState<TeamsConfig>(() => newTeamsConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");
  const teamId = useRef(1);
  const goalId = useRef(1);

  const result = useMemo(() => generateTeams(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<TeamsConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchScoring = (p: Partial<TeamsConfig["scoring"]>) => setConfig((c) => ({ ...c, scoring: { ...c.scoring, ...p } }));

  const addTeam = () => {
    const palette = TEAM_COLORS[config.teams.length % TEAM_COLORS.length];
    patch({ teams: [...config.teams, defaultTeam(`t${teamId.current++}`, `Team ${palette.label}`, palette.id, "⭐")] });
  };
  const updateTeam = (i: number, p: Partial<TeamsConfig["teams"][number]>) =>
    patch({ teams: config.teams.map((t, j) => (j === i ? { ...t, ...p } : t)) });
  const removeTeam = (i: number) => patch({ teams: config.teams.filter((_, j) => j !== i) });

  const addGoal = () => patch({ goals: [...config.goals, newTeamGoal(`g${goalId.current++}`)] });
  const updateGoal = (i: number, p: Partial<TeamGoal>) => patch({ goals: config.goals.map((g, j) => (j === i ? { ...g, ...p } : g)) });
  const removeGoal = (i: number) => patch({ goals: config.goals.filter((_, j) => j !== i) });

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  const scoreRow = (key: "perCatch" | "perBattle" | "perShiny", label: string, rule: ScoreRule, extra?: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={rule.enabled} onChange={(e) => patchScoring({ [key]: { ...rule, enabled: e.target.checked } } as Partial<TeamsConfig["scoring"]>)} />
        {label}
      </label>
      {extra}
      <span className="text-xs text-slate-500">pts</span>
      <input
        type="number"
        min={0}
        className="input w-20"
        value={rule.points}
        disabled={!rule.enabled}
        onChange={(e) => patchScoring({ [key]: { ...rule, points: Math.max(0, Number(e.target.value) || 0) } } as Partial<TeamsConfig["scoring"]>)}
      />
    </div>
  );

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="chip mb-3">🚩 Team vs Team</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a team competition</h1>
        <p className="mt-1 text-sm text-slate-400">
          Players self-pick a side with a join item (or get randomly shuffled). Catches, battles, and milestone goals
          all score points; the leader shows live on a sidebar. Tick-free — runs on Cobblemon advancements + vanilla teams.
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
              <label className="field-label">Blurb (Discord announcement)</label>
              <input className="input" value={config.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
            </div>
          </section>

          {/* teams */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Teams</h2>
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={addTeam} disabled={config.teams.length >= 6}>+ Team</button>
            </div>
            <div className="space-y-2">
              {config.teams.map((t, i) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2">
                  <input className="input w-14 text-center" value={t.emoji} onChange={(e) => updateTeam(i, { emoji: e.target.value })} aria-label="emoji" />
                  <input className="input min-w-[8rem] flex-1" value={t.name} onChange={(e) => updateTeam(i, { name: e.target.value })} />
                  <select className="input w-32" value={t.color} onChange={(e) => updateTeam(i, { color: e.target.value })}>
                    {TEAM_COLORS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removeTeam(i)} disabled={config.teams.length <= 1} aria-label="remove">✕</button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Each team becomes a coloured vanilla team + a join item. 2–4 is the sweet spot.</p>
          </section>

          {/* scoring */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Per-action scoring</h2>
            <div className="space-y-2.5">
              {scoreRow(
                "perCatch",
                "Catch",
                config.scoring.perCatch,
                <select className="input w-32" value={config.scoring.catchType} onChange={(e) => patchScoring({ catchType: e.target.value as TeamsConfig["scoring"]["catchType"] })} disabled={!config.scoring.perCatch.enabled}>
                  <option value="any">any type</option>
                  {ALL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>,
              )}
              {scoreRow("perBattle", "Win a battle", config.scoring.perBattle)}
              {scoreRow("perShiny", "Catch a shiny (bonus)", config.scoring.perShiny)}
            </div>
          </section>

          {/* goals */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Milestone goals</h2>
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={addGoal}>+ Goal</button>
            </div>
            {config.goals.length === 0 && <p className="text-xs text-slate-500">Optional one-shot milestones that award bonus team points (and an optional personal reward) when a player clears them.</p>}
            <div className="space-y-3">
              {config.goals.map((g, i) => {
                const trig = findTrigger(g.triggerId);
                return (
                  <div key={g.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input className="input flex-1" placeholder={describeObjective({ ...g, label: "" } as Objective)} value={g.label} onChange={(e) => updateGoal(i, { label: e.target.value })} />
                      <span className="text-xs text-slate-500">+</span>
                      <input type="number" min={0} className="input w-20" value={g.points} onChange={(e) => updateGoal(i, { points: Math.max(0, Number(e.target.value) || 0) })} title="team points" />
                      <span className="text-xs text-slate-500">pts</span>
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removeGoal(i)} aria-label="remove">✕</button>
                    </div>
                    <div className="mb-2 grid gap-2 sm:grid-cols-2">
                      <select className="input" value={g.triggerId} onChange={(e) => updateGoal(i, { triggerId: e.target.value })}>
                        {TRIGGERS.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        {trig?.usesLevel ? (
                          <>
                            <span className="text-xs text-slate-500">to Lv.</span>
                            <input type="number" min={1} max={100} className="input" value={g.level} onChange={(e) => updateGoal(i, { level: Math.max(1, Number(e.target.value) || 1) })} />
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-slate-500">count</span>
                            <input type="number" min={1} className="input" value={g.count} onChange={(e) => updateGoal(i, { count: Math.max(1, Number(e.target.value) || 1) })} />
                          </>
                        )}
                      </div>
                    </div>
                    {trig?.usesType && (
                      <select className="input mb-2" value={g.pokemonType} onChange={(e) => updateGoal(i, { pokemonType: e.target.value as Objective["pokemonType"] })}>
                        <option value="any">any type</option>
                        {ALL_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                    <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-amber-400" checked={g.announce} onChange={(e) => updateGoal(i, { announce: e.target.checked })} />
                      📣 Announce when a player clears it
                    </label>
                    <RewardList rewards={g.rewards} onChange={(rewards) => updateGoal(i, { rewards })} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* options */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Options</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.sidebar} onChange={(e) => patch({ sidebar: e.target.checked })} />
              Show the live score sidebar
            </label>
            <div className="mt-3">
              <label className="field-label">Join item base</label>
              <input className="input" value={config.joinBaseItem} onChange={(e) => patch({ joinBaseItem: e.target.value })} placeholder="minecraft:paper" />
              <p className="mt-1 text-xs text-slate-500">Any item works — it&apos;s made right-click &ldquo;usable&rdquo;. Players get one per team and use the one they want.</p>
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
                    {iss.severity === "error" ? "✕" : "!"} {iss.message}
                    {iss.path ? ` (${iss.path})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <p className="mb-4 text-xs text-slate-500">
              On load this creates the coloured teams + scoreboards. Hand out join items with{" "}
              <code className="text-amber-300">{result.bundle.namespace}:join_items</code> or shuffle everyone with{" "}
              <code className="text-amber-300">{result.bundle.namespace}:shuffle</code>. Declare the winner with{" "}
              <code className="text-amber-300">{result.bundle.namespace}:winner</code>.
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
