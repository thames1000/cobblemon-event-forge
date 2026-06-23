import type { GeneratedFile } from "../datapack/types";
import { toId } from "../datapack/sanitize";
import type { CalendarConfig, CalendarEntry } from "./types";

/**
 * Turn a rotation plan into the human-facing text the owner actually needs:
 *   - schedule.txt           — the at-a-glance "what's live / what's next" board
 *   - discord_schedule.md    — a paste-ready Discord post + an announcement plan
 *   - teardown_checklist.txt — cleanup steps for events that have ended
 *
 * Pure and deterministic: `today` is injected (ISO "YYYY-MM-DD") so the same
 * plan always renders the same files and the smoke test can pin a date.
 */

const MS_DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** ISO "YYYY-MM-DD" → epoch ms at UTC midnight, or null if blank/invalid. */
function parseISO(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** Whole days from `fromISO` to `toISO` (positive = toISO is later). */
function dayDiff(fromISO: string, toISO: string): number | null {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  if (a == null || b == null) return null;
  return Math.round((b - a) / MS_DAY);
}

/** Shift an ISO date by whole days, returning a new ISO date ("" if input invalid). */
export function shiftISO(iso: string, deltaDays: number): string {
  const t = parseISO(iso);
  if (t == null) return "";
  return new Date(t + deltaDays * MS_DAY).toISOString().slice(0, 10);
}

/** "Sat Jun 27" — adds ", 2027" when the year differs from today's. */
function fmtDate(iso: string, todayISO: string): string {
  const t = parseISO(iso);
  if (t == null) return "(no date)";
  const d = new Date(t);
  let s = `${DOW[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
  const todayT = parseISO(todayISO);
  if (todayT != null && new Date(todayT).getUTCFullYear() !== d.getUTCFullYear()) s += `, ${d.getUTCFullYear()}`;
  return s;
}

/** "Jun 27" — compact form for the "Jun 27 → Jun 29" range. */
function fmtShort(iso: string): string {
  const t = parseISO(iso);
  if (t == null) return "(no date)";
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** "today" / "tomorrow" / "in 4 days" for a future date. */
function untilPhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** "today" / "yesterday" / "8 days ago" for a past date. */
function agoPhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export type Bucket = "live" | "upcoming" | "past" | "undated" | "cancelled";

/** Classify an entry against `today` using its dates (status only forces "cancelled"). */
export function bucketOf(e: CalendarEntry, today: string): Bucket {
  if (e.status === "cancelled") return "cancelled";
  const s = parseISO(e.start);
  const en = parseISO(e.end);
  const t = parseISO(today);
  if (s == null || en == null || t == null) return "undated";
  if (t < s) return "upcoming";
  if (t > en) return "past";
  return "live";
}

/** Entries sorted by start date ascending; undated ones sink to the bottom. */
function byStart(entries: CalendarEntry[]): CalendarEntry[] {
  return [...entries].sort((a, b) => {
    const ai = parseISO(a.start);
    const bi = parseISO(b.start);
    if (ai == null && bi == null) return 0;
    if (ai == null) return 1;
    if (bi == null) return -1;
    return ai - bi;
  });
}

export interface CalendarWarning {
  level: "error" | "warn" | "info";
  message: string;
}

/** A live label for the page header. */
export interface CalendarSummary {
  live: CalendarEntry[];
  next: CalendarEntry | null;
  counts: Record<Bucket, number>;
}

export interface CalendarResult {
  files: GeneratedFile[];
  warnings: CalendarWarning[];
  summary: CalendarSummary;
}

function ranges(entries: CalendarEntry[]): { e: CalendarEntry; s: number; en: number }[] {
  const out: { e: CalendarEntry; s: number; en: number }[] = [];
  for (const e of entries) {
    if (e.status === "cancelled") continue;
    const s = parseISO(e.start);
    const en = parseISO(e.end);
    if (s != null && en != null && s <= en) out.push({ e, s, en });
  }
  return out;
}

export function calendarWarnings(config: CalendarConfig, today: string): CalendarWarning[] {
  const out: CalendarWarning[] = [];

  for (const e of config.entries) {
    const name = e.name.trim() || "(unnamed event)";
    const s = parseISO(e.start);
    const en = parseISO(e.end);
    if (e.status !== "cancelled") {
      if (e.start && e.end && s != null && en != null && en < s) {
        out.push({ level: "error", message: `${name}: end date (${e.end}) is before the start date (${e.start}).` });
      }
      if (!e.start || !e.end) {
        out.push({ level: "info", message: `${name} has no start/end date — it won't show on the schedule.` });
      }
    }
    const bucket = bucketOf(e, today);
    if (e.status === "active" && bucket === "past") {
      out.push({ level: "info", message: `${name} is marked Active but its dates have passed — mark it Done or update the dates.` });
    }
    if (e.status === "active" && bucket === "upcoming") {
      out.push({ level: "info", message: `${name} is marked Active but starts in the future — it isn't live yet.` });
    }
  }

  // overlapping windows — two events sharing days can clutter spawns/economy
  const rs = ranges(config.entries);
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      if (rs[i].s <= rs[j].en && rs[j].s <= rs[i].en) {
        out.push({
          level: "warn",
          message: `"${rs[i].e.name || "?"}" and "${rs[j].e.name || "?"}" overlap — running two events at once can clutter spawns. Stagger them if that's not intentional.`,
        });
      }
    }
  }

  const live = config.entries.filter((e) => bucketOf(e, today) === "live");
  if (live.length > 1) {
    out.push({ level: "warn", message: `${live.length} events are live right now — usually you want exactly one event live at a time.` });
  }
  const upcoming = config.entries.filter((e) => bucketOf(e, today) === "upcoming");
  if (upcoming.length === 0 && config.entries.length > 0) {
    out.push({ level: "info", message: "No upcoming events scheduled — add your next rotation so there's no dead weekend." });
  }

  return out;
}

function buildSchedule(config: CalendarConfig, today: string): string {
  const L: string[] = [];
  const server = config.serverName.trim() || "Server";
  L.push(`EVENT SCHEDULE — ${server}`);
  L.push(`Generated ${fmtDate(today, today)}`);
  L.push("=".repeat(48));
  L.push("");

  const sorted = byStart(config.entries);
  const section = (title: string, bucket: Bucket, render: (e: CalendarEntry) => string[]) => {
    const items = sorted.filter((e) => bucketOf(e, today) === bucket);
    if (!items.length) return;
    L.push(title);
    items.forEach((e) => {
      for (const line of render(e)) L.push(line);
    });
    L.push("");
  };

  const range = (e: CalendarEntry, tail: string) => [
    `  ${e.emoji} ${e.name.trim() || "(unnamed)"}`,
    `     ${fmtShort(e.start)} → ${fmtShort(e.end)} · ${tail}`,
  ];

  section("🔴 LIVE NOW", "live", (e) => {
    const d = dayDiff(today, e.end);
    return range(e, d == null ? "live" : d <= 0 ? "ends today" : `ends ${untilPhrase(d)}`);
  });
  section("⏭  UPCOMING", "upcoming", (e) => {
    const d = dayDiff(today, e.start);
    const ann = e.announceLead > 0 ? ` · announce ${fmtShort(shiftISO(e.start, -e.announceLead))}` : "";
    return range(e, `starts ${d == null ? "?" : untilPhrase(d)}${ann}`);
  });
  section("✅ PAST", "past", (e) => {
    const d = dayDiff(e.end, today);
    return range(e, d == null ? "ended" : `ended ${agoPhrase(d)}`);
  });
  section("🚫 CANCELLED", "cancelled", (e) => [`  ${e.emoji} ${e.name.trim() || "(unnamed)"} (cancelled)`]);

  const undated = sorted.filter((e) => bucketOf(e, today) === "undated");
  if (undated.length) {
    L.push("📝 UNSCHEDULED (no dates yet)");
    undated.forEach((e) => L.push(`  ${e.emoji} ${e.name.trim() || "(unnamed)"}`));
    L.push("");
  }

  if (config.entries.length === 0) L.push("(no events yet — add one to build a schedule)");
  L.push("Tip: keep one event live at a time; tear down the previous before the next begins.");
  return L.join("\n") + "\n";
}

function buildDiscordSchedule(config: CalendarConfig, today: string): string {
  const L: string[] = [];
  const server = config.serverName.trim() || "Server";
  const channel = config.discordChannel.trim() || "#events";
  L.push(`# 📅 ${server} — Event Schedule`);
  L.push("");

  const live = byStart(config.entries.filter((e) => bucketOf(e, today) === "live"));
  const upcoming = byStart(config.entries.filter((e) => bucketOf(e, today) === "upcoming"));

  if (live.length) {
    L.push(`**🔴 Live now:** ${live.map((e) => `${e.emoji} ${e.name} (ends ${fmtShort(e.end)})`).join(" · ")}`);
  }
  if (upcoming.length) {
    const n = upcoming[0];
    L.push(`**⏭ Next up:** ${n.emoji} ${n.name} — ${fmtShort(n.start)}–${fmtShort(n.end)}`);
  }
  L.push("");

  if (upcoming.length) {
    L.push("## Upcoming");
    for (const e of upcoming) {
      L.push(`- **${e.emoji} ${e.name}** · ${fmtShort(e.start)} → ${fmtShort(e.end)}`);
      if (e.blurb.trim()) L.push(`  > ${e.blurb.trim()}`);
    }
    L.push("");
  }

  // announcement plan — sorted by the date you'd actually post
  const plan = upcoming
    .map((e) => ({ e, when: shiftISO(e.start, -Math.max(0, e.announceLead)) }))
    .filter((p) => p.when)
    .sort((a, b) => (parseISO(a.when)! - parseISO(b.when)!));
  if (plan.length) {
    L.push(`## 📣 Announcement plan (post in ${channel})`);
    for (const { e, when } of plan) {
      const lead = dayDiff(when, e.start) ?? 0;
      const leadStr = lead <= 0 ? "day of" : lead === 1 ? "1 day out" : `${lead} days out`;
      L.push(`- **${fmtDate(when, today)}** — announce **${e.name}** (${leadStr}):`);
      L.push(`  > ${e.emoji} **${e.name}** runs ${fmtShort(e.start)}–${fmtShort(e.end)}!${e.blurb.trim() ? ` ${e.blurb.trim()}` : ""}`);
    }
    L.push("");
  }

  if (!live.length && !upcoming.length) L.push("_No live or upcoming events — schedule your next rotation._");
  return L.join("\n") + "\n";
}

function buildTeardown(config: CalendarConfig, today: string): string {
  const L: string[] = [];
  const server = config.serverName.trim() || "Server";
  L.push(`TEARDOWN CHECKLIST — ${server}`);
  L.push(`Generated ${fmtDate(today, today)}`);
  L.push("=".repeat(48));
  L.push("Clean up events that have ended (or are ending today). Do this BEFORE the");
  L.push("next event goes live so spawns and scoreboards don't pile up.");
  L.push("");

  // ended already, plus anything live that ends today
  const needs = byStart(
    config.entries.filter((e) => {
      const b = bucketOf(e, today);
      if (b === "past") return true;
      if (b === "live") return dayDiff(today, e.end) === 0; // ends today
      return false;
    }),
  );

  if (!needs.length) {
    L.push("(no events need teardown right now)");
    return L.join("\n") + "\n";
  }

  for (const e of needs) {
    const ns = toId(e.name) || "event";
    const d = dayDiff(e.end, today);
    const when = d == null ? "" : d === 0 ? " (ends today)" : ` (ended ${agoPhrase(d)})`;
    L.push(`[ ] ${e.emoji} ${e.name.trim() || "(unnamed)"}${when}`);
    L.push(`      1. Run the event's uninstall:  /function ${ns}:uninstall`);
    L.push(`      2. Remove its .zip from world/datapacks/`);
    L.push(`      3. /reload (or restart) so temporary spawns stop`);
    L.push(`      4. Post the results / leaderboard in Discord`);
    L.push("");
  }
  L.push("Note: the uninstall namespace is a guess from the event name — use the exact");
  L.push("name from that event's admin_checklist.txt if it differs.");
  return L.join("\n") + "\n";
}

export function generateCalendar(config: CalendarConfig, today: string): CalendarResult {
  const files: GeneratedFile[] = [
    { path: "schedule.txt", contents: buildSchedule(config, today), kind: "readme", label: "schedule.txt" },
    { path: "discord_schedule.md", contents: buildDiscordSchedule(config, today), kind: "discord", label: "discord_schedule.md" },
    { path: "teardown_checklist.txt", contents: buildTeardown(config, today), kind: "checklist", label: "teardown_checklist.txt" },
  ];

  const counts = { live: 0, upcoming: 0, past: 0, undated: 0, cancelled: 0 } as Record<Bucket, number>;
  for (const e of config.entries) counts[bucketOf(e, today)] += 1;
  const live = config.entries.filter((e) => bucketOf(e, today) === "live");
  const next = byStart(config.entries.filter((e) => bucketOf(e, today) === "upcoming"))[0] ?? null;

  return { files, warnings: calendarWarnings(config, today), summary: { live, next, counts } };
}
