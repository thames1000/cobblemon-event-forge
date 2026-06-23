import type { PokeType } from "../catalog/pokemon";
import type { Objective } from "../objective/types";
import { newObjective } from "../objective/types";
import type { RewardAction } from "../reward/actions";

/**
 * Team vs Team event. Players self-pick a side with a join item (or the owner
 * randomly shuffles everyone online), then earn points for their team by
 * catching, battling, and clearing milestone goals. Scores show live on a
 * sidebar; a winner function declares the leader.
 */

/** Vanilla scoreboard-team colors (the 16 formatting colors), curated + labelled. */
export const TEAM_COLORS: { id: string; label: string }[] = [
  { id: "red", label: "Red" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "yellow", label: "Yellow" },
  { id: "aqua", label: "Aqua" },
  { id: "gold", label: "Gold" },
  { id: "light_purple", label: "Pink" },
  { id: "dark_purple", label: "Purple" },
  { id: "dark_green", label: "Dark Green" },
  { id: "dark_aqua", label: "Teal" },
  { id: "dark_red", label: "Crimson" },
  { id: "white", label: "White" },
];

export interface Team {
  /** Stable slug, e.g. "red" — used for the vanilla team id and join-item data. */
  id: string;
  name: string;
  /** A vanilla color id from TEAM_COLORS. */
  color: string;
  emoji: string;
}

/** One scoring rule: how many points an action is worth (0 / disabled = ignored). */
export interface ScoreRule {
  enabled: boolean;
  points: number;
}

export interface ScoringRules {
  /** Points per Pokémon caught (optionally restricted to a type). */
  perCatch: ScoreRule;
  catchType: PokeType | "any";
  /** Points per battle won. */
  perBattle: ScoreRule;
  /** Bonus points per shiny caught (on top of the catch points). */
  perShiny: ScoreRule;
}

/** A milestone goal: a one-shot objective that awards team points on completion. */
export interface TeamGoal extends Objective {
  /** Team points awarded to the completer's team. */
  points: number;
}

export function newTeamGoal(id: string, partial?: Partial<TeamGoal>): TeamGoal {
  return { ...newObjective(id, { mode: "auto" }), points: 50, ...partial };
}

export interface TeamsConfig {
  title: string;
  blurb: string;
  teams: Team[];
  scoring: ScoringRules;
  /** Milestone goals worth bonus team points. */
  goals: TeamGoal[];
  /** Show a live sidebar scoreboard of team scores. */
  sidebar: boolean;
  /** Base item used for every team's join item (made right-click "usable"). */
  joinBaseItem: string;
  /** Target MC datapack pack_format. */
  packFormat: number;
}

export function defaultTeam(id: string, name: string, color: string, emoji: string): Team {
  return { id, name, color, emoji };
}

export function newTeamsConfig(packFormat: number): TeamsConfig {
  return {
    title: "Team Clash Weekend",
    blurb: "Pick a side and rack up points — catches, battles, and goals all count.",
    teams: [defaultTeam("red", "Team Red", "red", "🔴"), defaultTeam("blue", "Team Blue", "blue", "🔵")],
    scoring: {
      perCatch: { enabled: true, points: 3 },
      catchType: "any",
      perBattle: { enabled: true, points: 5 },
      perShiny: { enabled: true, points: 25 },
    },
    goals: [],
    sidebar: true,
    joinBaseItem: "minecraft:paper",
    packFormat,
  };
}

export type { RewardAction };
