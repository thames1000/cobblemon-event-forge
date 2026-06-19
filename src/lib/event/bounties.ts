import type { GeneratedFile } from "../datapack/types";
import type { EventConfig } from "./types";
import { toId } from "../datapack/sanitize";
import { describeObjective } from "../objective/triggers";

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
      id: `${toId(opts.eventSlug)}_bounty_${i + 1}`,
      label: describeObjective(o),
      mode: o.mode,
      ...(o.mode === "auto"
        ? {
            trigger: o.triggerId,
            count: o.count,
            ...(o.pokemonType !== "any" ? { type: o.pokemonType } : {}),
            ...(o.species.trim() ? { species: o.species } : {}),
          }
        : {}),
      announce: o.announce,
      rewards: o.rewards,
    })),
    rewardTiers: opts.config.rewardTiers.map((t) => ({ id: t.id, name: t.name, rewards: t.actions })),
  };
  return {
    path: "event_bounties.json",
    contents: JSON.stringify(doc, null, 2),
    kind: "bounties",
    label: "event_bounties.json",
  };
}
