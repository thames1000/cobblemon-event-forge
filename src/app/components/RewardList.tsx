"use client";

import { POKEMON } from "@/lib/catalog/pokemon";
import { REWARD_ITEMS } from "@/lib/catalog/items";
import { KEY_ICONS } from "@/lib/catalog/crateTypes";
import { REWARD_KINDS, newRewardAction } from "@/lib/reward/actions";
import type { RewardAction } from "@/lib/reward/actions";

const ITEM_REWARDS = REWARD_ITEMS.filter((i) => i.category !== "currency");

/** Datalists referenced by the reward/objective inputs. Render once per page. */
export function SharedDatalists() {
  return (
    <>
      <datalist id="dl-species">
        {POKEMON.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </datalist>
      <datalist id="dl-key-icons">
        {KEY_ICONS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </datalist>
    </>
  );
}

/** Editor for a list of reward actions (give item / crate key / spawn / command). */
export default function RewardList({
  rewards,
  onChange,
}: {
  rewards: RewardAction[];
  onChange: (r: RewardAction[]) => void;
}) {
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
                  list="dl-species"
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
                  list="dl-key-icons"
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
