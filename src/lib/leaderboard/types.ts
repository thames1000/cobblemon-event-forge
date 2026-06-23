import type { PokeType } from "../catalog/pokemon";

/**
 * Leaderboard / scoreboard helper — a reusable points board you can drop into
 * any event. Admins bump scores with /function …:score/add_<n>; an auto-sorting
 * sidebar shows the live ranking. Optionally it scores itself off Cobblemon
 * catches/battles/shinies so it runs hands-free. Tick-free.
 */

/** Optional auto-scoring hook off a Cobblemon action. */
export interface AutoRule {
  enabled: boolean;
  amount: number;
}

export interface LeaderboardConfig {
  title: string;
  /** Scoreboard objective name; blank → derived from the title. Sanitized on build. */
  objective: string;
  /** What a point is called, e.g. "points", "catches". */
  unit: string;
  /** Quick admin add buttons → one score/add_<n> function each. */
  amounts: number[];
  /** Show the live auto-sorted sidebar. */
  sidebar: boolean;
  /** Sidebar display title; blank → the title. */
  sidebarTitle: string;
  /** Auto-score on every catch (optionally restricted to a type). */
  autoCatch: AutoRule & { type: PokeType | "any" };
  /** Auto-score on every battle won. */
  autoBattle: AutoRule;
  /** Bonus auto-score on every shiny caught. */
  autoShiny: AutoRule;
  /** How many ranks to lay out in the results template. */
  top: number;
  packFormat: number;
}

export function newLeaderboardConfig(packFormat: number): LeaderboardConfig {
  return {
    title: "Event Leaderboard",
    objective: "",
    unit: "points",
    amounts: [1, 5, 10],
    sidebar: true,
    sidebarTitle: "",
    autoCatch: { enabled: false, amount: 1, type: "any" },
    autoBattle: { enabled: false, amount: 2 },
    autoShiny: { enabled: false, amount: 25 },
    top: 5,
    packFormat,
  };
}
