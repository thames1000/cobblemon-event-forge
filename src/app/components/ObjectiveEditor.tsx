"use client";

import { useRef } from "react";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { TRIGGERS, findTrigger, describeObjective } from "@/lib/objective/triggers";
import { newObjective } from "@/lib/objective/types";
import RewardList from "./RewardList";
import type { Objective } from "@/lib/objective/types";
import type { RewardAction } from "@/lib/reward/actions";

export default function ObjectiveEditor({
  objectives,
  onChange,
  title = "Bounties / objectives",
}: {
  objectives: Objective[];
  onChange: (next: Objective[]) => void;
  title?: string;
}) {
  const counter = useRef(1000);
  const nextId = () => `o${counter.current++}`;

  const add = (mode: Objective["mode"]) =>
    onChange([...objectives, newObjective(nextId(), { mode, announce: mode === "auto" })]);
  const update = (i: number, patch: Partial<Objective>) =>
    onChange(objectives.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const remove = (i: number) => onChange(objectives.filter((_, j) => j !== i));

  const setRewards = (i: number, rewards: RewardAction[]) => update(i, { rewards });

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
        <div className="flex gap-2">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => add("auto")}>
            + Auto
          </button>
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => add("manual")}>
            + Manual
          </button>
        </div>
      </div>

      {objectives.length === 0 && (
        <p className="text-xs text-slate-500">
          No bounties yet. <span className="text-slate-400">Auto</span> = tracked in-game &amp; rewards automatically.{" "}
          <span className="text-slate-400">Manual</span> = free text you reward by hand.
        </p>
      )}

      <div className="space-y-3">
        {objectives.map((o, i) => {
          const trigger = findTrigger(o.triggerId);
          return (
            <div key={o.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    o.mode === "auto" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/40 text-slate-300"
                  }`}
                >
                  {o.mode}
                </span>
                <input
                  className="input flex-1"
                  placeholder={describeObjective({ ...o, label: "" })}
                  value={o.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => remove(i)} aria-label="Remove">
                  ✕
                </button>
              </div>

              {o.mode === "auto" && (
                <div className="mb-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      className="input"
                      value={o.triggerId}
                      onChange={(e) => update(i, { triggerId: e.target.value })}
                    >
                      {TRIGGERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                      {trigger?.usesLevel ? (
                        <>
                          <span className="text-xs text-slate-500">to Lv.</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            className="input"
                            value={o.level}
                            onChange={(e) => update(i, { level: Math.max(1, Number(e.target.value) || 1) })}
                          />
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500">count</span>
                          <input
                            type="number"
                            min={1}
                            className="input"
                            value={o.count}
                            onChange={(e) => update(i, { count: Math.max(1, Number(e.target.value) || 1) })}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {(trigger?.usesType || trigger?.usesSpecies) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {trigger?.usesType && (
                        <select
                          className="input"
                          value={o.pokemonType}
                          onChange={(e) => update(i, { pokemonType: e.target.value as Objective["pokemonType"] })}
                        >
                          <option value="any">any type</option>
                          {ALL_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      )}
                      {trigger?.usesSpecies && (
                        <input
                          list="dl-species"
                          className="input"
                          placeholder="any species"
                          value={o.species}
                          onChange={(e) => update(i, { species: e.target.value })}
                        />
                      )}
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-amber-400"
                      checked={o.announce}
                      onChange={(e) => update(i, { announce: e.target.checked })}
                    />
                    📣 Announce completion to the whole server
                  </label>
                </div>
              )}

              {/* rewards */}
              <RewardList
                rewards={o.rewards}
                onChange={(r) => setRewards(i, r)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
