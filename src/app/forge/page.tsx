"use client";

import { useMemo, useState } from "react";
import { EVENT_PRESETS, configFromPreset, BUCKET_DEFAULTS } from "@/lib/catalog/eventTypes";
import { POKEMON, ALL_TYPES } from "@/lib/catalog/pokemon";
import { MC_VERSIONS } from "@/lib/datapack/packMeta";
import { generateEvent } from "@/lib/event/generate";
import { balanceWarnings } from "@/lib/event/balance";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import ObjectiveEditor from "@/app/components/ObjectiveEditor";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import { randomEvent, DIFFICULTIES } from "@/lib/event/randomize";
import type { Difficulty } from "@/lib/event/randomize";
import type { EventConfig, Bucket, WeatherTheme, LegendaryTrigger } from "@/lib/event/types";

function PackToggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  danger,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${disabled ? "opacity-70" : ""}`}>
      <input
        type="checkbox"
        className={`mt-0.5 h-4 w-4 ${danger ? "accent-amber-500" : "accent-amber-400"}`}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="leading-tight">
        <span className="text-sm text-slate-200">{label}</span>
        <span className="block text-[11px] text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

const WEATHERS: { value: WeatherTheme; label: string }[] = [
  { value: "any", label: "Any weather" },
  { value: "clear", label: "☀️ Clear" },
  { value: "rain", label: "🌧️ Rain" },
  { value: "thunder", label: "⛈️ Thunderstorm" },
];
const BUCKETS: Bucket[] = ["common", "uncommon", "rare", "ultra-rare"];

export default function ForgePage() {
  const [config, setConfig] = useState<EventConfig>(() => configFromPreset("legendary-hunt"));
  const [activeFile, setActiveFile] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  const generateFull = () => {
    setConfig(randomEvent(difficulty));
    setActiveFile("");
  };

  const result = useMemo(() => generateEvent(config), [config]);
  const warnings = useMemo(() => balanceWarnings(config), [config]);

  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];

  // ----- mutation helpers -----
  const patch = (p: Partial<EventConfig>) => setConfig((c) => ({ ...c, ...p }));
  const applyPreset = (id: string) => {
    setConfig(configFromPreset(id));
    setActiveFile("");
  };
  const patchTrigger = (p: Partial<LegendaryTrigger>) =>
    setConfig((c) => ({ ...c, legendaryTrigger: { ...c.legendaryTrigger, ...p } }));
  const patchPack = (p: Partial<EventConfig["pack"]>) =>
    setConfig((c) => ({ ...c, pack: { ...c.pack, ...p } }));

  // load.mcfunction is force-included when another option depends on it.
  const serverWideLegendary =
    config.legendaryTrigger.enabled &&
    config.legendaryTrigger.legendary.trim() !== "" &&
    config.legendaryTrigger.scope === "server-wide";
  const loadForcedBy =
    (config.pack.enableFlag && "the enable/disable flag") ||
    (serverWideLegendary && "the server-wide legendary") ||
    (config.pack.advancedTimedLogic && "timed logic") ||
    null;

  // ----- downloads -----
  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  const errorCount = result.validation.issues.filter((i) => i.severity === "error").length;
  const warnCount = result.validation.issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="chip mb-3">🔥 Event Forge</div>
        <h1 className="text-2xl font-bold text-slate-100">Build a weekend event</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pick a template, tweak the fields, and download a validated datapack plus the reward function, bounties,
          Discord post and upload checklist.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)]/60 p-2">
          <button className="btn-primary" onClick={generateFull} title="Roll a complete event">
            🎲 Generate full event
          </button>
          <span className="text-xs text-slate-500">at difficulty</span>
          <div className="flex flex-wrap gap-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`rounded-lg px-2.5 py-1 text-xs transition ${
                  difficulty === d.id
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-slate-400 hover:bg-[var(--panel-2)]"
                }`}
              >
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[11px] text-slate-500">fills everything below — then tweak &amp; download</span>
        </div>
      </header>

      {/* preset picker */}
      <section className="mb-8">
        <div className="field-label">Event template</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {EVENT_PRESETS.map((p) => {
            const active = config.presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`panel flex flex-col items-center gap-1 p-3 text-center transition ${
                  active ? "border-amber-400/70 bg-amber-400/10" : "hover:border-slate-500"
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[11px] leading-tight text-slate-300">{p.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------- LEFT: form ---------- */}
        <div className="space-y-6">
          {/* basics */}
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Event details</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Title</label>
                <input
                  className="input"
                  value={config.title}
                  placeholder="Electric Storm Weekend"
                  onChange={(e) => patch({ title: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Generated namespace:{" "}
                  <code className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-amber-300">
                    {result.bundle.namespace}
                  </code>{" "}
                  → everything lands under <code className="text-slate-400">data/{result.bundle.namespace}/</code>
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Duration</label>
                  <input className="input" value={config.duration} onChange={(e) => patch({ duration: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Weather theme</label>
                  <select
                    className="input"
                    value={config.weather}
                    onChange={(e) => patch({ weather: e.target.value as WeatherTheme })}
                  >
                    {WEATHERS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Blurb (shown in Discord + sign text)</label>
                <textarea
                  className="input min-h-[60px] resize-y"
                  value={config.blurb}
                  onChange={(e) => patch({ blurb: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Target Minecraft version</label>
                <select
                  className="input"
                  value={config.packFormat}
                  onChange={(e) => patch({ packFormat: Number(e.target.value) })}
                >
                  {MC_VERSIONS.map((v) => (
                    <option key={v.packFormat} value={v.packFormat}>
                      {v.label} (pack_format {v.packFormat})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* featured pokemon */}
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Featured Pokémon</h2>
              <button
                className="btn-ghost px-2.5 py-1 text-xs"
                onClick={() =>
                  patch({
                    featured: [
                      ...config.featured,
                      { species: "", bucket: "rare", weight: BUCKET_DEFAULTS.rare.weight, level: BUCKET_DEFAULTS.rare.level },
                    ],
                  })
                }
              >
                + Add
              </button>
            </div>
            <datalist id="species-list">
              {POKEMON.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </datalist>
            <div className="space-y-2">
              {config.featured.length === 0 && (
                <p className="text-xs text-slate-500">No featured Pokémon — spawns won&apos;t change.</p>
              )}
              {config.featured.map((mon, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                  <input
                    list="species-list"
                    className="input"
                    placeholder="pikachu"
                    value={mon.species}
                    onChange={(e) => {
                      const featured = [...config.featured];
                      featured[i] = { ...mon, species: e.target.value };
                      patch({ featured });
                    }}
                  />
                  <select
                    className="input w-28"
                    value={mon.bucket}
                    onChange={(e) => {
                      const featured = [...config.featured];
                      const bucket = e.target.value as Bucket;
                      const d = BUCKET_DEFAULTS[bucket];
                      featured[i] = { ...mon, bucket, weight: d.weight, level: d.level };
                      patch({ featured });
                    }}
                  >
                    {BUCKETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input w-20"
                    title="Level range"
                    value={mon.level}
                    onChange={(e) => {
                      const featured = [...config.featured];
                      featured[i] = { ...mon, level: e.target.value };
                      patch({ featured });
                    }}
                  />
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => patch({ featured: config.featured.filter((_, j) => j !== i) })}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* objectives */}
          <ObjectiveEditor objectives={config.objectives} onChange={(objectives) => patch({ objectives })} />

          {/* reward tiers */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Reward tiers</h2>
              <button
                className="btn-ghost px-2.5 py-1 text-xs"
                onClick={() =>
                  patch({ rewardTiers: [...config.rewardTiers, { id: `tier${config.rewardTiers.length + 1}`, name: "New tier", actions: [] }] })
                }
              >
                + Tier
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Event-wide reward bundles you grant by hand (e.g. Participation / Winner). Each becomes a{" "}
              <code className="text-slate-400">reward_&lt;tier&gt;</code> function.
            </p>
            <div className="space-y-3">
              {config.rewardTiers.map((tier, ti) => (
                <div key={ti} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)]/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className="input flex-1"
                      value={tier.name}
                      onChange={(e) => {
                        const rewardTiers = [...config.rewardTiers];
                        rewardTiers[ti] = { ...tier, name: e.target.value };
                        patch({ rewardTiers });
                      }}
                    />
                    <button
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => patch({ rewardTiers: config.rewardTiers.filter((_, j) => j !== ti) })}
                    >
                      ✕
                    </button>
                  </div>
                  <RewardList
                    rewards={tier.actions}
                    onChange={(actions) => {
                      const rewardTiers = [...config.rewardTiers];
                      rewardTiers[ti] = { ...tier, actions };
                      patch({ rewardTiers });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
          {/* legendary auto-spawn */}
          <section className="panel p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🏆 Legendary auto-spawn</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-400"
                  checked={config.legendaryTrigger.enabled}
                  onChange={(e) => patchTrigger({ enabled: e.target.checked })}
                />
                Enable
              </label>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Catch enough of a type to summon a legendary — generates a Cobblemon catch advancement + summon
              function. No commands or KubeJS needed.
            </p>

            {config.legendaryTrigger.enabled && (
              <div className="space-y-4">
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <label className="field-label">Catch this many…</label>
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={config.legendaryTrigger.count}
                      onChange={(e) => patchTrigger({ count: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                  <div>
                    <label className="field-label">…of type</label>
                    <select
                      className="input w-32"
                      value={config.legendaryTrigger.type}
                      onChange={(e) => patchTrigger({ type: e.target.value as LegendaryTrigger["type"] })}
                    >
                      <option value="any">any type</option>
                      {ALL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="field-label">…to summon</label>
                    <input
                      list="species-list"
                      className="input"
                      placeholder="zapdos"
                      value={config.legendaryTrigger.legendary}
                      onChange={(e) => patchTrigger({ legendary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">at level</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="input w-24"
                      value={config.legendaryTrigger.level}
                      onChange={(e) => patchTrigger({ level: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Who gets it</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["per-player", "server-wide"] as const).map((scope) => {
                      const active = config.legendaryTrigger.scope === scope;
                      return (
                        <button
                          key={scope}
                          onClick={() => patchTrigger({ scope })}
                          className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                            active
                              ? "border-amber-400/70 bg-amber-400/10 text-amber-200"
                              : "border-[var(--border)] bg-[var(--panel-2)] text-slate-300 hover:border-slate-500"
                          }`}
                        >
                          <div className="font-semibold">{scope === "per-player" ? "Per-player" : "Server-wide"}</div>
                          <div className="text-[11px] text-slate-500">
                            {scope === "per-player" ? "Everyone earns their own" : "First to finish spawns one"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {config.legendaryTrigger.legendary.trim() === "" && (
                  <p className="text-xs text-amber-300">Pick a legendary to summon to generate the trigger.</p>
                )}
              </div>
            )}
          </section>

          {/* pack safety / cleanup */}
          <section className="panel p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">🧹 Pack safety / cleanup</h2>
            <p className="mb-4 text-xs text-slate-500">
              Control which lifecycle files get generated. Safe defaults: no per-tick logic, plus an uninstall function
              and an enable/disable flag.
            </p>
            <div className="space-y-3">
              <PackToggle
                label="Enable / disable flag"
                hint="Pause the event's summons without removing the pack."
                checked={config.pack.enableFlag}
                onChange={(v) => patchPack({ enableFlag: v })}
              />
              <PackToggle
                label="Uninstall function"
                hint="A /function …:uninstall that clears this event's scores."
                checked={config.pack.includeUninstall}
                onChange={(v) => patchPack({ includeUninstall: v })}
              />
              <PackToggle
                label="Load function"
                hint={loadForcedBy ? `Required by ${loadForcedBy}.` : "Runs once on world load / reload."}
                checked={config.pack.includeLoad || !!loadForcedBy}
                disabled={!!loadForcedBy}
                onChange={(v) => patchPack({ includeLoad: v })}
              />
              <PackToggle
                label="Load broadcast message"
                hint="Print “datapack loaded ✓” in chat on load (off keeps things quiet)."
                checked={config.pack.testBroadcast}
                onChange={(v) => patchPack({ testBroadcast: v })}
              />
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <PackToggle
                  label="Advanced timed logic (tick)"
                  hint="Generates a per-tick function + tick.json. Only enable if you truly need something running 20×/sec."
                  checked={config.pack.advancedTimedLogic}
                  onChange={(v) => patchPack({ advancedTimedLogic: v })}
                  danger
                />
              </div>
            </div>
          </section>
        </div>

        {/* ---------- RIGHT: status + preview ---------- */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* validation + balance */}
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
              {result.validation.ok ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  ✓ Valid datapack
                </span>
              ) : (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                  ✕ {errorCount} error{errorCount === 1 ? "" : "s"}
                </span>
              )}
              {warnCount > 0 && (
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {warnCount} warning{warnCount === 1 ? "" : "s"}
                </span>
              )}
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

            {warnings.length > 0 && (
              <ul className="space-y-1 border-t border-[var(--border)] pt-3 text-xs">
                {warnings.map((w, idx) => (
                  <li key={idx} className={w.level === "warn" ? "text-amber-300" : "text-slate-400"}>
                    {w.level === "warn" ? "⚖️" : "ℹ️"} {w.message}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>
                ⬇ Everything
              </button>
            </div>
            {!config.title && <p className="mt-2 text-xs text-slate-500">Give the event a title to enable download.</p>}
          </section>

          {/* file preview */}
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
              {result.bundle.files.map((f) => {
                const isDp = DATAPACK_KINDS.has(f.kind);
                const active = (selected?.path ?? "") === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`rounded px-2 py-1 text-[11px] transition ${
                      active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"
                    }`}
                    title={f.path}
                  >
                    {isDp ? "📦" : "📄"} {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500">
              <code className="truncate">{selected?.path}</code>
              <button
                className="shrink-0 text-slate-400 hover:text-slate-200"
                onClick={() => selected && downloadText(selected.contents, selected.path.split("/").pop()!)}
              >
                download file
              </button>
            </div>
            <pre className="scroll-thin max-h-[480px] overflow-auto bg-[#0a0e18] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {selected?.contents}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
