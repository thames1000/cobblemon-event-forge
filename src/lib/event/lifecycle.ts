import type { GeneratedFile } from "../datapack/types";
import type { PackOptions } from "./types";

/**
 * Centralized pack lifecycle files (load / uninstall / tick) + the minecraft
 * function tags. Keeping this in one place means a single `load.json` no matter
 * how many features (enable flag, server-wide legendary guard, timed logic) want
 * to run on load — and crucially, we only ever emit a `tick.json` when the owner
 * explicitly opts into timed logic.
 *
 * All event packs share one scoreboard objective so multiple events can coexist;
 * per-pack state lives in fake-player scores keyed by the event slug. Uninstall
 * resets only this pack's scores (it never drops the shared objective, which
 * would clobber other active events).
 */
export const EVENT_OBJECTIVE = "cobble_events";
export const enabledFlag = (slug: string) => `#${slug}_on`;
export const legendFlag = (slug: string) => `#${slug}_leg`;

export interface LifecycleContext {
  namespace: string;
  slug: string;
  title: string;
  options: PackOptions;
  /** True when a server-wide legendary guard needs its flag reset on load. */
  serverWideLegendary: boolean;
}

/** Does anything actually need the shared scoreboard objective? */
export function needsObjective(ctx: LifecycleContext): boolean {
  return ctx.options.enableFlag || ctx.serverWideLegendary || ctx.options.advancedTimedLogic;
}

/** Is a load function required (either requested, or pulled in by a dependency)? */
export function loadRequired(ctx: LifecycleContext): boolean {
  return ctx.options.includeLoad || needsObjective(ctx);
}

export function buildLifecycleFiles(ctx: LifecycleContext): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const { namespace: ns, slug, title, options } = ctx;
  const obj = needsObjective(ctx);

  // ---- load ----
  if (loadRequired(ctx)) {
    const L: string[] = [`# Load setup for: ${title}`];
    if (obj) L.push(`scoreboard objectives add ${EVENT_OBJECTIVE} dummy`);
    if (options.enableFlag) L.push(`scoreboard players set ${enabledFlag(slug)} ${EVENT_OBJECTIVE} 1`);
    if (ctx.serverWideLegendary) {
      L.push(`# re-arm the server-wide legendary so it can spawn once per (re)load`);
      L.push(`scoreboard players set ${legendFlag(slug)} ${EVENT_OBJECTIVE} 0`);
    }
    if (options.testBroadcast) L.push(`tellraw @a {"text":"[${title}] datapack loaded ✓","color":"green"}`);
    if (L.length === 1) L.push(`# (nothing to set up — this event is fully passive)`);

    files.push({
      path: `data/${ns}/function/load.mcfunction`,
      contents: L.join("\n") + "\n",
      kind: "function",
      label: "load.mcfunction",
    });
    files.push({
      path: `data/minecraft/tags/function/load.json`,
      contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2),
      kind: "tag",
      label: "load tag",
    });
  }

  // ---- tick (only when explicitly enabled) ----
  if (options.advancedTimedLogic) {
    const T: string[] = [
      `# Per-tick logic for: ${title}`,
      `# Guarded by the enable flag so it does nothing while disabled.`,
      `execute unless score ${enabledFlag(slug)} ${EVENT_OBJECTIVE} matches 1 run return 0`,
      `# TODO: add your timed logic below (runs 20x/second — keep it cheap).`,
    ];
    files.push({
      path: `data/${ns}/function/tick.mcfunction`,
      contents: T.join("\n") + "\n",
      kind: "function",
      label: "tick.mcfunction",
    });
    files.push({
      path: `data/minecraft/tags/function/tick.json`,
      contents: JSON.stringify({ values: [`${ns}:tick`] }, null, 2),
      kind: "tag",
      label: "tick tag",
    });
  }

  // ---- uninstall ----
  if (options.includeUninstall) {
    const U: string[] = [`# Uninstall: ${title}`, `# Run /function ${ns}:uninstall, then delete the datapack .zip.`];
    if (obj) {
      U.push(`scoreboard players reset ${enabledFlag(slug)} ${EVENT_OBJECTIVE}`);
      if (ctx.serverWideLegendary) U.push(`scoreboard players reset ${legendFlag(slug)} ${EVENT_OBJECTIVE}`);
    }
    U.push(`tellraw @a {"text":"${title} uninstalled — safe to remove the datapack.","color":"gray"}`);
    files.push({
      path: `data/${ns}/function/uninstall.mcfunction`,
      contents: U.join("\n") + "\n",
      kind: "function",
      label: "uninstall.mcfunction",
    });
  }

  return files;
}
