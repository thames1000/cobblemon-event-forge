/**
 * Generic round-trippable config.
 *
 * Every generator's config is plain serializable data, so we can wrap it with a
 * type marker + version, export it to JSON, share it, and re-import it later to
 * edit/re-run — and embed the same payload as a `*_config.json` side-car in the
 * generated bundle so a previously downloaded pack is itself re-editable.
 *
 * Import is defensive: it deep-merges whatever it's given over a complete default
 * config, so a config exported by an OLDER version (missing fields added since)
 * still loads cleanly instead of crashing the page. The Event Forge predates this
 * helper and keeps its own bespoke `event/portable.ts`; everything else is built
 * on `makePortable` below.
 */
export const PORTABLE_PREFIX = "cobbleverse-event-forge/";

interface Wrapped {
  _type: string;
  version: number;
  config: unknown;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Recursively fill missing / wrong-typed fields from `defaults`:
 *  - object: union of keys — defaults guarantees the required shape, while any
 *    extra keys the input carries pass through untouched (lossless round-trip);
 *    keys in both recurse so nested defaults still backfill.
 *  - array: taken wholesale when the input supplies an array, else the default.
 *  - primitive: the input is used only when it's the same JS type, else default.
 */
export function mergeDefaults<T>(defaults: T, input: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(input) ? input : clone(defaults)) as unknown as T;
  }
  if (defaults !== null && typeof defaults === "object") {
    if (input === null || typeof input !== "object" || Array.isArray(input)) return clone(defaults);
    const di = input as Record<string, unknown>;
    const dd = defaults as Record<string, unknown>;
    const out: Record<string, unknown> = { ...di };
    for (const k of Object.keys(dd)) {
      out[k] = k in di ? mergeDefaults(dd[k], di[k]) : clone(dd[k]);
    }
    return out as T;
  }
  // primitive (string / number / boolean): only accept a same-typed input
  return (input !== null && typeof input === typeof defaults ? input : defaults) as T;
}

export interface Portable<T> {
  /** Full type marker, e.g. "cobbleverse-event-forge/safari". */
  readonly type: string;
  /** Serialize a config to wrapped JSON (with a trailing newline). */
  toPortable(config: T): string;
  /** Parse exported text (wrapped OR a bare config) into a normalized config. Throws on bad JSON or a wrong-type wrapper. */
  fromPortable(text: string): T;
  /** Merge an arbitrary (possibly partial / older-schema) value into a complete, valid config. */
  normalize(input: unknown): T;
}

export function makePortable<T>(opts: {
  /** Short kind id, e.g. "safari". The full marker is `cobbleverse-event-forge/<kind>`. */
  kind: string;
  version: number;
  /** A complete, valid default config used to backfill missing fields on import. */
  defaults: () => T;
  /** Optional extra normalization run after the defaults merge (e.g. per-element fix-ups). */
  refine?: (merged: T, raw: Record<string, unknown>) => T;
}): Portable<T> {
  const type = PORTABLE_PREFIX + opts.kind;

  function normalize(input: unknown): T {
    const merged = mergeDefaults(opts.defaults(), input);
    return opts.refine ? opts.refine(merged, (input ?? {}) as Record<string, unknown>) : merged;
  }

  function toPortable(config: T): string {
    const payload: Wrapped = { _type: type, version: opts.version, config };
    return JSON.stringify(payload, null, 2) + "\n";
  }

  function fromPortable(text: string): T {
    const data = JSON.parse(text) as Record<string, unknown> | null;
    if (!data || typeof data !== "object") throw new Error("not a JSON object");
    const marker = typeof data._type === "string" ? data._type : "";
    // A wrapped config from a DIFFERENT generator → fail loudly instead of silently
    // normalizing someone's safari into an empty bingo board.
    if (marker.startsWith(PORTABLE_PREFIX) && marker !== type) {
      throw new Error(`this is a "${marker.slice(PORTABLE_PREFIX.length)}" config, not ${opts.kind}`);
    }
    const wrapped = marker === type && "config" in data;
    return normalize(wrapped ? data.config : data);
  }

  return { type, toPortable, fromPortable, normalize };
}
