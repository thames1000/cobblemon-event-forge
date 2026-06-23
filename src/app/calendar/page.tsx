"use client";

import { useMemo, useRef, useState } from "react";
import { generateCalendar, shiftISO } from "@/lib/calendar/generate";
import { newCalendar, newEntry, ENTRY_STATUSES } from "@/lib/calendar/types";
import type { CalendarConfig, CalendarEntry, EntryStatus } from "@/lib/calendar/types";
import { downloadText, downloadZip } from "@/lib/download";
import { zipAll } from "@/lib/datapack/zip";

/** Largest existing eN id + 1, so ids stay unique even after importing a calendar.json. */
function freshId(entries: CalendarEntry[]): string {
  let max = 0;
  for (const e of entries) {
    const m = /^e(\d+)$/.exec(e.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `e${max + 1}`;
}

export default function CalendarPage() {
  const [config, setConfig] = useState<CalendarConfig>(() => newCalendar());
  // Resolve "today" once on the client so the schedule is stable for the session.
  const [today] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [activeFile, setActiveFile] = useState<string>("schedule.txt");
  const [importError, setImportError] = useState<string>("");
  const fileInput = useRef<HTMLInputElement>(null);

  const result = useMemo(() => generateCalendar(config, today), [config, today]);
  const selected = result.files.find((f) => f.path === activeFile) ?? result.files[0];

  const patch = (p: Partial<CalendarConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchEntry = (id: string, p: Partial<CalendarEntry>) =>
    setConfig((c) => ({ ...c, entries: c.entries.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  const removeEntry = (id: string) => setConfig((c) => ({ ...c, entries: c.entries.filter((e) => e.id !== id) }));

  const addEntry = () =>
    setConfig((c) => ({
      ...c,
      entries: [...c.entries, newEntry(freshId(c.entries), { start: today, end: shiftISO(today, 2) })],
    }));

  const addExample = () =>
    setConfig((c) => {
      let n = c.entries;
      const mk = (over: Partial<CalendarEntry>) => {
        const e = newEntry(freshId(n), over);
        n = [...n, e];
        return e;
      };
      mk({ name: "Haunted Safari", emoji: "🎃", start: shiftISO(today, -1), end: shiftISO(today, 1), status: "active", blurb: "Ghost-types are swarming the haunted woods." });
      mk({ name: "Fossil Frenzy", emoji: "🦴", start: shiftISO(today, 5), end: shiftISO(today, 7), blurb: "Rock-type rush — revive a fossil for a prize." });
      mk({ name: "Battle Tower Night", emoji: "⚔️", start: shiftISO(today, 12), end: shiftISO(today, 14), blurb: "Climb the tower, win the streak." });
      return { ...c, entries: n };
    });

  const exportJson = () => downloadText(JSON.stringify(config, null, 2), "calendar.json");
  const importJson = (file: File) => {
    file
      .text()
      .then((txt) => {
        const data = JSON.parse(txt) as Partial<CalendarConfig>;
        if (!data || !Array.isArray(data.entries)) throw new Error("not a calendar.json (missing entries[])");
        setConfig(newCalendar({ serverName: data.serverName, discordChannel: data.discordChannel, entries: data.entries as CalendarEntry[] }));
        setImportError("");
      })
      .catch((err: unknown) => setImportError(err instanceof Error ? err.message : "could not read that file"));
  };

  const downloadAll = () => downloadZip(zipAll("calendar", result.files), "event_calendar.zip");

  const { summary, warnings } = result;
  const errorCount = warnings.filter((w) => w.level === "error").length;

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <div className="chip mb-3">📅 Event Calendar</div>
        <h1 className="text-2xl font-bold text-slate-100">Plan the rotation</h1>
        <p className="mt-1 text-sm text-slate-400">
          Lay out the next few weeks of events. The planner builds an at-a-glance schedule, a paste-ready Discord post with
          an announcement plan, and a teardown checklist. Nothing is saved automatically — use <strong>Export</strong> to
          keep a <code className="text-amber-300">calendar.json</code> you can re-import later.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT: settings + entries */}
        <div className="space-y-6">
          <section className="panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Server name</label>
                <input className="input" value={config.serverName} onChange={(e) => patch({ serverName: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Discord channel</label>
                <input className="input" value={config.discordChannel} onChange={(e) => patch({ discordChannel: e.target.value })} placeholder="#events" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={addEntry}>
                + Add event
              </button>
              {config.entries.length === 0 && (
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={addExample}>
                  ✨ Add example rotation
                </button>
              )}
              <span className="ml-auto text-[11px] text-slate-500">today: {today}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={exportJson}>
                ⬇ Export calendar.json
              </button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => fileInput.current?.click()}>
                ⬆ Import calendar.json
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = "";
                }}
              />
              {importError && <span className="text-[11px] text-red-300">⚠ {importError}</span>}
            </div>
          </section>

          {config.entries.length === 0 ? (
            <section className="panel p-8 text-center text-sm text-slate-500">
              No events yet. Click <strong className="text-slate-300">+ Add event</strong> to start planning the rotation.
            </section>
          ) : (
            <div className="space-y-3">
              {config.entries.map((e) => (
                <section key={e.id} className="panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className="input w-16 text-center"
                      value={e.emoji}
                      onChange={(ev) => patchEntry(e.id, { emoji: ev.target.value })}
                      aria-label="emoji"
                    />
                    <input
                      className="input flex-1"
                      value={e.name}
                      onChange={(ev) => patchEntry(e.id, { name: ev.target.value })}
                      placeholder="Event name"
                    />
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removeEntry(e.id)} aria-label="remove">
                      ✕
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Starts</label>
                      <input type="date" className="input" value={e.start} onChange={(ev) => patchEntry(e.id, { start: ev.target.value })} />
                    </div>
                    <div>
                      <label className="field-label">Ends</label>
                      <input type="date" className="input" value={e.end} onChange={(ev) => patchEntry(e.id, { end: ev.target.value })} />
                    </div>
                    <div>
                      <label className="field-label">Status</label>
                      <select className="input" value={e.status} onChange={(ev) => patchEntry(e.id, { status: ev.target.value as EntryStatus })}>
                        {ENTRY_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.emoji} {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Announce (days before)</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        className="input"
                        value={e.announceLead}
                        onChange={(ev) => patchEntry(e.id, { announceLead: Math.max(0, Math.min(30, Number(ev.target.value) || 0)) })}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="field-label">Blurb (used in the Discord post)</label>
                    <input className="input" value={e.blurb} onChange={(ev) => patchEntry(e.id, { blurb: ev.target.value })} placeholder="One-line hook…" />
                  </div>
                  <div className="mt-3">
                    <label className="field-label">Private notes (never announced)</label>
                    <textarea
                      className="input min-h-[44px]"
                      value={e.notes}
                      onChange={(ev) => patchEntry(e.id, { notes: ev.target.value })}
                      placeholder="Banned items, prizes, reminders…"
                    />
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: summary + warnings + preview */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="panel p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rotation</h2>
              {summary.live.length > 0 ? (
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                  🔴 {summary.live.map((e) => e.name).join(", ")}
                </span>
              ) : (
                <span className="rounded bg-slate-700/50 px-2 py-0.5 text-xs font-semibold text-slate-400">nothing live</span>
              )}
              {summary.next && (
                <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
                  ⏭ next: {summary.next.name}
                </span>
              )}
              <span className="ml-auto text-[11px] text-slate-500">
                {summary.counts.upcoming} upcoming · {summary.counts.past} past
              </span>
            </div>

            {warnings.length > 0 && (
              <ul className="mb-3 space-y-1 text-xs">
                {warnings.map((w, i) => (
                  <li key={i} className={w.level === "error" ? "text-red-300" : w.level === "warn" ? "text-amber-300" : "text-slate-400"}>
                    {w.level === "error" ? "✕" : w.level === "warn" ? "!" : "•"} {w.message}
                  </li>
                ))}
              </ul>
            )}
            {warnings.length === 0 && config.entries.length > 0 && (
              <p className="mb-3 text-xs text-emerald-300">✓ Schedule looks clean.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={downloadAll} disabled={config.entries.length === 0}>
                ⬇ All exports (.zip)
              </button>
              <button className="btn-ghost" onClick={() => downloadText(result.files[0].contents, "schedule.txt")} disabled={config.entries.length === 0}>
                ⬇ schedule.txt
              </button>
              <button className="btn-ghost" onClick={() => downloadText(result.files[1].contents, "discord_schedule.md")} disabled={config.entries.length === 0}>
                ⬇ discord
              </button>
            </div>
            {errorCount > 0 && <p className="mt-2 text-[11px] text-red-300">{errorCount} date error(s) — fix before relying on the schedule.</p>}
          </section>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
              {result.files.map((f) => {
                const active = (selected?.path ?? "") === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`rounded px-2 py-1 text-[11px] transition ${active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:bg-[var(--panel-2)]"}`}
                    title={f.path}
                  >
                    📄 {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500">
              <code className="truncate">{selected?.path}</code>
              <button className="shrink-0 text-slate-400 hover:text-slate-200" onClick={() => selected && downloadText(selected.contents, selected.path)}>
                download file
              </button>
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
