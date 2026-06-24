"use client";

import { useMemo, useState } from "react";
import { newBingoConfig, randomBoard, randomCell, centerIndex } from "@/lib/bingo/board";
import { generateBingo } from "@/lib/bingo/generate";
import { describeObjective } from "@/lib/objective/triggers";
import { MC_VERSIONS, DEFAULT_VERSION } from "@/lib/datapack/packMeta";
import { zipDatapack, zipAll } from "@/lib/datapack/zip";
import { DATAPACK_KINDS } from "@/lib/datapack/types";
import { downloadZip, downloadText } from "@/lib/download";
import RewardList, { SharedDatalists } from "@/app/components/RewardList";
import ConfigPortIO from "@/app/components/ConfigPortIO";
import { toPortableBingo, fromPortableBingo } from "@/lib/bingo/portable";
import type { BingoConfig } from "@/lib/bingo/board";

const SIZES = [3, 4, 5];

export default function BingoPage() {
  const [config, setConfig] = useState<BingoConfig>(() => newBingoConfig(DEFAULT_VERSION.packFormat));
  const [activeFile, setActiveFile] = useState<string>("");

  const result = useMemo(() => generateBingo(config), [config]);
  const selected = result.bundle.files.find((f) => f.path === activeFile) ?? result.bundle.files[0];
  const center = centerIndex(config.size, config.freeCenter);

  const patch = (p: Partial<BingoConfig>) => setConfig((c) => ({ ...c, ...p }));
  const reroll = () => patch({ cells: randomBoard(config.size, config.freeCenter) });
  const setSize = (size: number) => setConfig((c) => ({ ...c, size, cells: randomBoard(size, c.freeCenter) }));
  const setFreeCenter = (freeCenter: boolean) => setConfig((c) => ({ ...c, freeCenter, cells: randomBoard(c.size, freeCenter) }));
  const rerollCell = (i: number) => {
    if (i === center) return;
    setConfig((c) => {
      const cells = [...c.cells];
      cells[i] = randomCell(`cell_${i}`);
      return { ...c, cells };
    });
  };

  const downloadDatapack = () => downloadZip(zipDatapack(result.bundle.files), result.datapackFileName);
  const downloadBundle = () => downloadZip(zipAll(result.bundle.slug, result.bundle.files), `${result.bundle.slug}_bundle.zip`);

  return (
    <div className="px-6 py-8">
      <SharedDatalists />
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="chip mb-3">🎲 Bingo Boards</div>
            <h1 className="text-2xl font-bold text-slate-100">Build a bingo board</h1>
          </div>
          <ConfigPortIO
            config={config}
            filename={`${result.bundle.slug}.bingo.json`}
            toPortable={toPortableBingo}
            fromPortable={fromPortableBingo}
            onImport={(c) => { setConfig(c); setActiveFile(""); }}
            exportDisabled={!config.title}
            hint="Export this board as JSON, or import a saved one (or the bingo_config.json from a downloaded bundle) to edit & re-run."
          />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          A grid of auto-tracked objectives. Complete a row, column, or diagonal for a reward — detected in-game with no
          tick. Click a square to reroll it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT: board + settings */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Title</label>
                <input className="input" value={config.title} onChange={(e) => patch({ title: e.target.value })} />
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-lg px-3 py-1 text-xs transition ${
                      config.size === s ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-amber-400"
                  checked={config.freeCenter}
                  disabled={config.size % 2 === 0}
                  onChange={(e) => setFreeCenter(e.target.checked)}
                />
                Free centre
              </label>
              <button className="btn-ghost ml-auto px-2.5 py-1 text-xs" onClick={reroll}>
                🎲 Reroll board
              </button>
            </div>
          </section>

          {/* the board */}
          <section className="panel p-3">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))` }}>
              {config.cells.map((cell, i) => {
                const free = i === center;
                return (
                  <button
                    key={i}
                    onClick={() => rerollCell(i)}
                    title={free ? "Free space" : "Click to reroll this square"}
                    className={`flex aspect-square items-center justify-center rounded-md border p-1 text-center text-[10px] leading-tight transition ${
                      free
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                        : "border-[var(--border)] bg-[var(--panel-2)] text-slate-300 hover:border-amber-400/50 hover:text-amber-100"
                    }`}
                  >
                    {free ? "⭐ FREE" : describeObjective(cell)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">Click any square to reroll just that objective.</p>
          </section>

          {/* rewards */}
          <section className="panel p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">🎉 Bingo reward (any line)</h2>
            <RewardList rewards={config.bingoReward} onChange={(bingoReward) => patch({ bingoReward })} />
          </section>
          <section className="panel p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">🏆 Blackout reward (whole board)</h2>
            <p className="mb-2 text-xs text-slate-500">Leave empty to skip the blackout bonus.</p>
            <RewardList rewards={config.blackoutReward} onChange={(blackoutReward) => patch({ blackoutReward })} />
          </section>
        </div>

        {/* RIGHT: status + preview */}
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
              Each square is a Cobblemon advancement; completing a line runs the reward automatically. Players track
              progress in their own advancements screen.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadDatapack} disabled={!config.title}>
                ⬇ Datapack .zip
              </button>
              <button className="btn-ghost" onClick={downloadBundle} disabled={!config.title}>
                ⬇ Everything
              </button>
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
                    className={`rounded px-2 py-1 text-[11px] transition ${
                      active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"
                    }`}
                    title={f.path}
                  >
                    {DATAPACK_KINDS.has(f.kind) ? "📦" : "📄"} {f.label}
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
            <pre className="scroll-thin max-h-[460px] overflow-auto bg-[#0a0e18] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {selected?.contents}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
