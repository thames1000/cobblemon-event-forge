"use client";

import { useRef } from "react";
import { ALL_TYPES, POKEMON } from "@/lib/catalog/pokemon";
import { REWARD_ITEMS } from "@/lib/catalog/items";
import { KEY_ICONS } from "@/lib/catalog/crateTypes";
import { TRIGGERS, findTrigger, describeObjective } from "@/lib/objective/triggers";
import { newObjective } from "@/lib/objective/types";
import { REWARD_KINDS, newRewardAction } from "@/lib/reward/actions";
import type { Objective } from "@/lib/objective/types";
import type { RewardAction } from "@/lib/reward/actions";

const ITEM_REWARDS = REWARD_ITEMS.filter((i) => i.category !== "currency");

export default function ObjectiveEditor({
  objectives,
  onChange,
}: {
  objectives: Objective[];
  onChange: (next: Objective[]) => void;
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Bounties / objectives</h2>
        <div className="flex gap-2">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => add("auto")}>
            + Auto
          </button>
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => add("manual")}>
            + Manual
          </button>
        </div>
      </div>

      <datalist id="obj-species">
        {POKEMON.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </datalist>
      <datalist id="obj-key-icons">
        {KEY_ICONS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </datalist>

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
                          list="obj-species"
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

function RewardList({ rewards, onChange }: { rewards: RewardAction[]; onChange: (r: RewardAction[]) => void }) {
  const update = (i: number, action: RewardAction) => onChange(rewards.map((a, j) => (j === i ? action : a)));
  const remove = (i: number) => onChange(rewards.filter((_, j) => j !== i));
  const add = () => onChange([...rewards, newRewardAction("item")]);

  return (
    <div className="rounded-md border border-dashed border-[var(--border)] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rewards</span>
        <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={add}>
          + Reward
        </button>
      </div>
      {rewards.length === 0 && <p className="text-[11px] text-slate-600">No rewards.</p>}
      <div className="space-y-2">
        {rewards.map((a, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              className="input w-32 shrink-0"
              value={a.kind}
              onChange={(e) => update(i, newRewardAction(e.target.value as RewardAction["kind"]))}
            >
              {REWARD_KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>

            {a.kind === "item" && (
              <>
                <select
                  className="input min-w-0 flex-1"
                  value={a.itemId}
                  onChange={(e) => update(i, { ...a, itemId: e.target.value })}
                >
                  {ITEM_REWARDS.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="input w-16"
                  value={a.count}
                  onChange={(e) => update(i, { ...a, count: Math.max(1, Number(e.target.value) || 1) })}
                />
              </>
            )}

            {a.kind === "spawn" && (
              <>
                <input
                  list="obj-species"
                  className="input min-w-0 flex-1"
                  placeholder="species (e.g. mew)"
                  value={a.species}
                  onChange={(e) => update(i, { ...a, species: e.target.value })}
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input w-16"
                  title="level"
                  value={a.level}
                  onChange={(e) => update(i, { ...a, level: Math.max(1, Number(e.target.value) || 1) })}
                />
              </>
            )}

            {a.kind === "crate-key" && (
              <>
                <input
                  className="input min-w-0 flex-1"
                  placeholder="crate name (must match a crate)"
                  value={a.crateName}
                  onChange={(e) => update(i, { ...a, crateName: e.target.value })}
                />
                <input
                  list="obj-key-icons"
                  className="input w-36"
                  title="icon item"
                  value={a.baseItem}
                  onChange={(e) => update(i, { ...a, baseItem: e.target.value })}
                />
              </>
            )}

            {a.kind === "command" && (
              <input
                className="input min-w-0 flex-1 font-mono text-xs"
                placeholder="/give @s minecraft:diamond 5"
                value={a.command}
                onChange={(e) => update(i, { ...a, command: e.target.value })}
              />
            )}

            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => remove(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
