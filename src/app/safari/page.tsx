"use client";

import { useMemo, useState } from "react";
import { SAFARI_THEMES, configFromSafariTheme } from "@/lib/catalog/safariThemes";
import { ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { generateSafari } from "@/lib/safari/generate";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import type { SafariConfig } from "@/lib/safari/types";
import type { WeatherTheme } from "@/lib/event/types";

const WEATHERS: { value: WeatherTheme; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "clear", label: "☀️ Clear" },
  { value: "rain", label: "🌧️ Rain" },
  { value: "thunder", label: "⛈️ Storm" },
];

function TierEditor({ label, ids, onChange }: { label: string; ids: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => onChange([...ids, ""])}>
          + Add
        </button>
      </div>
      {ids.length === 0 && <p className="text-[11px] text-slate-600">none</p>}
      <div className="space-y-1">
        {ids.map((id, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              list="dl-species"
              className="input"
              placeholder="species id"
              value={id}
              onChange={(e) => {
                const n = [...ids];
                n[i] = e.target.value;
                onChange(n);
              }}
            />
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange(ids.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="input"
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
      <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => onChange([...items, ""])}>
        + Add
      </button>
    </div>
  );
}

export default function SafariPage() {
  const [config, setConfig] = useState<SafariConfig>(() => configFromSafariTheme("haunted-woods"));
  const [activeFile, setActiveFile] = useState<string>("");

  const result = useMemo(() => generateSafari(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  const patch = (p: Partial<SafariConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchArena = (p: Partial<SafariConfig["arena"]>) => setConfig((c) => ({ ...c, arena: { ...c.arena, ...p } }));
  const patchTimer = (p: Partial<SafariConfig["timer"]>) => setConfig((c) => ({ ...c, timer: { ...c.timer, ...p } }));
  const patchTicket = (p: Partial<SafariConfig["ticket"]>) => setConfig((c) => ({ ...c, ticket: { ...c.ticket, ...p } }));
  const patchReward = (p: Partial<SafariConfig["reward"]>) => setConfig((c) => ({ ...c, reward: { ...c.reward, ...p } }));

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <datalist id="dl-biomes">
        {["#minecraft:is_forest", "#minecraft:is_mountain", "#minecraft:is_river", "minecraft:badlands", "minecraft:desert", "minecraft:jungle", "minecraft:frozen_river"].map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <header className="mb-6">
        <div className="chip mb-3">🏕️ Safari Zones</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a Safari Zone</h1>
        <p className="mt-1 text-sm text-slate-400">
          A themed temporary zone: tiered spawns (optionally biome-locked), an entry ticket, a catch reward, plus rules,
          NPC dialogue, sign &amp; announcement text. Swap it in for the weekend, then remove it.
        </p>
      </header>

      {/* theme picker */}
      <section className="mb-8">
        <div className="field-label">Theme</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {SAFARI_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setConfig(configFromSafariTheme(t.id));
                setActiveFile("");
              }}
              className={`panel flex flex-col items-center gap-1 p-3 text-center transition ${
                config.themeId === t.id ? "border-amber-400/70 bg-amber-400/10" : "hover:border-slate-500"
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-[11px] leading-tight text-slate-300">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="space-y-4">
              <div>
                <label className="field-label">Zone name</label>
                <input className="input" value={config.title} placeholder="Haunted Woods Safari" onChange={(e) => patch({ title: e.target.value })} />
                <p className="mt-1.5 text-xs text-slate-500">
                  namespace <code className="text-amber-300">{result.bundle.namespace}</code>
                </p>
              </div>
              <div>
                <label className="field-label">Blurb</label>
                <input className="input" value={config.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Weather</label>
                  <select className="input" value={config.weather} onChange={(e) => patch({ weather: e.target.value as WeatherTheme })}>
                    {WEATHERS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
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
            </div>
          </section>

          {/* spawns */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Encounters</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <TierEditor label="Common" ids={config.common} onChange={(common) => patch({ common })} />
              <TierEditor label="Rare" ids={config.rare} onChange={(rare) => patch({ rare })} />
              <TierEditor label="Ultra-Rare" ids={config.ultraRare} onChange={(ultraRare) => patch({ ultraRare })} />
            </div>
          </section>

          {/* biomes */}
          <section className="panel p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Biomes</h2>
            <p className="mb-3 text-xs text-slate-500">
              Restrict spawns to these biomes/tags. Leave empty to spawn anywhere (good for a built arena).
            </p>
            <div className="space-y-1">
              {config.biomes.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    list="dl-biomes"
                    className="input font-mono text-xs"
                    placeholder="#minecraft:is_forest"
                    value={b}
                    onChange={(e) => {
                      const n = [...config.biomes];
                      n[i] = e.target.value;
                      patch({ biomes: n });
                    }}
                  />
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => patch({ biomes: config.biomes.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => patch({ biomes: [...config.biomes, ""] })}>
                + Biome
              </button>
            </div>
          </section>

          {/* arena world */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🌍 Arena world</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.arena.enabled} onChange={(e) => patchArena({ enabled: e.target.checked })} />
                Enable
              </label>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              A <b>resettable arena</b> for the zone. The pack defines a <code>:zone</code> template (with the
              exclusive biome); the Resource World mod mirrors it into a world that <b>auto-resets when empty</b>.
              Tickets warp players in/out with <b>vanilla teleports</b> (no op level). One-time restart + <code>create_arena</code> to set up.
            </p>
            {config.arena.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(["single-biome", "mirror"] as const).map((m) => {
                    const active = config.arena.mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => patchArena({ mode: m })}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                          active ? "border-amber-400/70 bg-amber-400/10 text-amber-200" : "border-[var(--border)] bg-[var(--panel-2)] text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <div className="font-semibold">{m === "single-biome" ? "Single biome" : "Mirror dimension"}</div>
                        <div className="text-[11px] text-slate-500">
                          {m === "single-biome" ? "Whole world is one themed biome" : "A separate normal overworld"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {config.arena.mode === "single-biome" ? (
                  <div>
                    <label className="field-label">Arena biome</label>
                    <input
                      list="dl-biomes"
                      className="input font-mono text-xs"
                      placeholder="minecraft:dark_forest"
                      value={config.arena.biome}
                      onChange={(e) => patchArena({ biome: e.target.value })}
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Generates a one-biome overworld dimension for the arena. Keep this biome inside your spawn{" "}
                      <b>Biomes</b> above so the encounters appear in the arena.{" "}
                      <span className="text-amber-400/90">Needs a full server restart (not /reload) before tickets can warp players in.</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="field-label">Mirror dimension</label>
                    <input
                      className="input font-mono text-xs"
                      placeholder="minecraft:overworld"
                      value={config.arena.mirror}
                      onChange={(e) => patchArena({ mirror: e.target.value })}
                    />
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  Players enter via vanilla <code>spreadplayers</code> and are returned to where they came from on exit.
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-400"
                    checked={config.arena.exclusive !== false}
                    onChange={(e) => patchArena({ exclusive: e.target.checked })}
                  />
                  Exclusive spawns — only your selected Pokémon spawn here (custom biome, no vanilla mobs)
                </label>
                {config.arena.exclusive !== false && (
                  <p className="text-[11px] text-amber-400/90">
                    A custom arena biome is generated that <b>copies the look</b> of the “Arena biome” above (trees, fog, grass colour)
                    but spawns <b>only your selected Pokémon</b> — no vanilla mobs, no default Cobblemon spawns. The spawn “Biomes”
                    list is ignored inside the zone. (Special-floor biomes like badlands/peaks keep a grass floor.)
                  </p>
                )}
              </div>
            )}
          </section>

          {/* entry ticket */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🎟️ Entry ticket</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.ticket.enabled} onChange={(e) => patchTicket({ enabled: e.target.checked })} />
                Enable
              </label>
            </div>
            <p className="mb-3 text-xs text-slate-500">A usable item players hold-to-use to enter (greets them &amp; states the rules).</p>
            {config.ticket.enabled && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <label className="field-label">Icon item</label>
                    <input list="dl-key-icons" className="input" value={config.ticket.baseItem} onChange={(e) => patchTicket({ baseItem: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">Time limit (min)</label>
                    <input
                      type="number"
                      min={1}
                      className="input w-24"
                      value={config.timeLimitMinutes}
                      onChange={(e) => patch({ timeLimitMinutes: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-xs text-slate-300">
                    <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.ticket.glint} onChange={(e) => patchTicket({ glint: e.target.checked })} />
                    Glint
                  </label>
                </div>
                <div>
                  <label className="field-label">Safari Balls given on entry</label>
                  <input
                    type="number"
                    min={0}
                    className="input w-28"
                    value={config.safariBalls}
                    onChange={(e) => patch({ safariBalls: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Safari Balls have a <b>1.5× catch rate</b> — handing out a stack is the in-zone catch boost. (0 = none.)
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-400"
                    checked={config.leaveEarly !== false}
                    onChange={(e) => patch({ leaveEarly: e.target.checked })}
                  />
                  Give a “leave early” item (a clock — lets players exit before the timer ends, no op needed)
                </label>
              </div>
            )}
          </section>

          {/* timer */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">⏱️ Timer (enforced)</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.timer.enabled} onChange={(e) => patchTimer({ enabled: e.target.checked })} />
                Enable
              </label>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Starts a {config.timeLimitMinutes}-min countdown on entry and returns the player to
              where they entered from when it ends. A 1-second loop that only runs while someone&apos;s inside.
            </p>
            {config.timer.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="field-label">Warn at (minutes remaining)</label>
                  <input
                    className="input w-40"
                    value={config.timer.warnings.join(", ")}
                    onChange={(e) =>
                      patchTimer({
                        warnings: e.target.value
                          .split(",")
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => Number.isFinite(n) && n > 0),
                      })
                    }
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">Comma-separated, e.g. 15, 5, 1. Each fires a chat warning + sound.</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-400"
                    checked={config.timer.bossbar !== false}
                    onChange={(e) => patchTimer({ bossbar: e.target.checked })}
                  />
                  On-screen boss bar (top of screen, counts down M:SS — no client mod)
                </label>
              </div>
            )}
          </section>

          {/* rules */}
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Rules</h2>
            <ListEditor items={config.rules} onChange={(rules) => patch({ rules })} placeholder="No Master Balls" />
          </section>

          {/* reward objective */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🏆 Catch reward</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={config.reward.enabled} onChange={(e) => patchReward({ enabled: e.target.checked })} />
                Enable
              </label>
            </div>
            {config.reward.enabled && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="field-label">Catch</label>
                    <input
                      type="number"
                      min={1}
                      className="input w-20"
                      value={config.reward.count}
                      onChange={(e) => patchReward({ count: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                  <div>
                    <label className="field-label">of type</label>
                    <select className="input w-32" value={config.reward.type} onChange={(e) => patchReward({ type: e.target.value as SafariConfig["reward"]["type"] })}>
                      <option value="any">any type</option>
                      {ALL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <RewardList rewards={config.reward.rewards} onChange={(rewards) => patchReward({ rewards })} />
              </div>
            )}
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
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>
                ⬇ Everything
              </button>
            </div>
            {!config.title && <p className="mt-2 text-xs text-slate-500">Name the zone to enable download.</p>}
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
