import type { GeneratedFile } from "../datapack/types";
import type { EventConfig } from "./types";
import { toId } from "../datapack/sanitize";

/**
 * event_bounties.json — an owner-side, structured description of the event's
 * objectives. This is intentionally NOT a datapack file: it's a portable record
 * the dashboard (and, later, a Bounty Board / FTB Quests exporter) can read back
 * in. Keeping it structured now means questline export is a transform later, not
 * a rewrite.
 */
export function buildBountiesFile(opts: {
  eventSlug: string;
  config: EventConfig;
}): GeneratedFile {
  const doc = {
    event: opts.config.title,
    slug: opts.eventSlug,
    duration: opts.config.duration,
    weather: opts.config.weather,
    featured: opts.config.featured.map((f) => f.species),
    bounties: opts.config.objectives.map((o, i) => ({
      id: `${toId(opts.eventSlug)}_b${i + 1}`,
      text: o.text,
      kind: o.kind ?? "custom",
      ...(o.count != null ? { count: o.count } : {}),
      ...(o.type ? { type: o.type } : {}),
    })),
    rewards: opts.config.rewards.map((r) => ({
      item: r.itemId,
      count: r.count,
      ...(r.rawCommand ? { command: r.rawCommand } : {}),
    })),
  };
  return {
    path: "event_bounties.json",
    contents: JSON.stringify(doc, null, 2),
    kind: "bounties",
    label: "event_bounties.json",
  };
}
