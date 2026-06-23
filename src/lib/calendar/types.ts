/**
 * Event Calendar / Rotation Planner — a lightweight scheduling board.
 *
 * This is deliberately NOT a datapack generator: a calendar entry is just the
 * *plan* for an event (name, dates, status, notes), not the event's files. The
 * owner builds the actual pack in the Event Forge; the calendar lays out when
 * each one runs and produces the human-facing schedule / announcement /
 * teardown text. Everything here is plain serializable data so a whole calendar
 * round-trips through a single calendar.json file.
 */

/** Where an entry sits in its lifecycle. "active" = currently live on the server. */
export type EntryStatus = "planned" | "active" | "done" | "cancelled";

export const ENTRY_STATUSES: { id: EntryStatus; label: string; emoji: string }[] = [
  { id: "planned", label: "Planned", emoji: "🗓️" },
  { id: "active", label: "Active", emoji: "🔴" },
  { id: "done", label: "Done", emoji: "✅" },
  { id: "cancelled", label: "Cancelled", emoji: "🚫" },
];

/** One scheduled event on the calendar. Dates are ISO "YYYY-MM-DD" (date inputs). */
export interface CalendarEntry {
  /** Stable id (used as a React key and to suggest a teardown function name). */
  id: string;
  name: string;
  emoji: string;
  /** ISO date the event goes live, e.g. "2026-06-27". */
  start: string;
  /** ISO date the event ends. */
  end: string;
  status: EntryStatus;
  /** One-line hook, reused in the Discord announcement text. */
  blurb: string;
  /** Private owner notes (banned items, prizes, reminders…). Never announced. */
  notes: string;
  /** Days before `start` to post the Discord announcement. */
  announceLead: number;
}

/** A full rotation plan. */
export interface CalendarConfig {
  /** Server name, used in the export headers. */
  serverName: string;
  /** Discord channel the announcement text suggests posting in, e.g. "#events". */
  discordChannel: string;
  entries: CalendarEntry[];
}

/** A fresh entry with sensible defaults. `start`/`end` should be supplied by the caller. */
export function newEntry(id: string, partial?: Partial<CalendarEntry>): CalendarEntry {
  return {
    id,
    name: "New event",
    emoji: "🎉",
    start: "",
    end: "",
    status: "planned",
    blurb: "",
    notes: "",
    announceLead: 3,
    ...partial,
  };
}

export function newCalendar(partial?: Partial<CalendarConfig>): CalendarConfig {
  return { serverName: "My Server", discordChannel: "#events", entries: [], ...partial };
}
