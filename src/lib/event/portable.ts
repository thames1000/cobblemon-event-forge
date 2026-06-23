import type { EventConfig, RewardTier, WeatherTheme } from "./types";
import type { Objective } from "../objective/types";
import { newObjective } from "../objective/types";
import { configFromPreset, findPreset } from "../catalog/eventTypes";

/**
 * Portable event config — so an event can be saved, shared, re-imported, and
 * re-run later. We export the whole EventConfig (it's plain serializable data)
 * wrapped with a type marker + version, and embed the same payload as an
 * `event_config.json` side-car in every generated bundle so a previously
 * downloaded pack is itself re-editable.
 *
 * Import is defensive: it normalizes whatever it's given against the preset
 * defaults, so a config exported by an OLDER version (missing fields added
 * since) still loads cleanly instead of crashing the Forge.
 */
export const EVENT_PORTABLE_TYPE = "cobbleverse-event-forge/event";
export const EVENT_PORTABLE_VERSION = 1;

interface PortableEvent {
  _type: string;
  version: number;
  config: EventConfig;
}

const WEATHERS: WeatherTheme[] = ["any", "clear", "rain", "thunder"];

export function toPortableEvent(config: EventConfig): string {
  const payload: PortableEvent = { _type: EVENT_PORTABLE_TYPE, version: EVENT_PORTABLE_VERSION, config };
  return JSON.stringify(payload, null, 2) + "\n";
}

/** Parse exported text (wrapped OR a bare EventConfig) into a normalized config. Throws on bad JSON. */
export function fromPortableEvent(text: string): EventConfig {
  const data = JSON.parse(text) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") throw new Error("not a JSON object");
  const wrapped = data._type === EVENT_PORTABLE_TYPE && "config" in data;
  return normalizeEventConfig(wrapped ? (data.config as unknown) : data);
}

function normObjective(raw: unknown, i: number): Objective {
  const o = (raw ?? {}) as Partial<Objective>;
  const base = newObjective(typeof o.id === "string" ? o.id : `o${i + 1}`);
  return { ...base, ...o, rewards: Array.isArray(o.rewards) ? o.rewards : base.rewards };
}

function normTier(raw: unknown, i: number): RewardTier {
  const t = (raw ?? {}) as Partial<RewardTier>;
  return {
    id: typeof t.id === "string" ? t.id : `tier${i + 1}`,
    name: typeof t.name === "string" ? t.name : "Tier",
    actions: Array.isArray(t.actions) ? t.actions : [],
    ...(typeof t.award === "string" ? { award: t.award } : {}),
  };
}

/** Merge an arbitrary (possibly partial / older-schema) value into a complete, valid EventConfig. */
export function normalizeEventConfig(input: unknown): EventConfig {
  const p = (input ?? {}) as Partial<EventConfig> & Record<string, unknown>;
  const presetId = typeof p.presetId === "string" && findPreset(p.presetId) ? p.presetId : "blank";
  const base = configFromPreset(presetId);

  return {
    presetId,
    title: typeof p.title === "string" ? p.title : base.title,
    duration: typeof p.duration === "string" ? p.duration : base.duration,
    blurb: typeof p.blurb === "string" ? p.blurb : base.blurb,
    weather: WEATHERS.includes(p.weather as WeatherTheme) ? (p.weather as WeatherTheme) : base.weather,
    featured: Array.isArray(p.featured) ? (p.featured as EventConfig["featured"]) : base.featured,
    objectives: Array.isArray(p.objectives) ? p.objectives.map(normObjective) : base.objectives,
    rewardTiers: Array.isArray(p.rewardTiers) ? p.rewardTiers.map(normTier) : base.rewardTiers,
    legendaryTrigger: { ...base.legendaryTrigger, ...(p.legendaryTrigger && typeof p.legendaryTrigger === "object" ? p.legendaryTrigger : {}) },
    pack: { ...base.pack, ...(p.pack && typeof p.pack === "object" ? p.pack : {}) },
    packFormat: typeof p.packFormat === "number" ? p.packFormat : base.packFormat,
  };
}
