import type { GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { BattleConfig, RentalMon, RentalTeam } from "./types";
import { NATURES, THEMES, FORMATS } from "./catalog";

const EV_LABEL: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defence: "Def",
  special_attack: "SpA",
  special_defence: "SpD",
  speed: "Spe",
};

function evString(m: RentalMon): string {
  const parts = Object.entries(m.evs).map(([k, v]) => `${v} ${EV_LABEL[k] ?? k}`);
  return parts.length ? parts.join(" / ") : "—";
}

function natureName(id: string): string {
  return NATURES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

function themeLabel(config: BattleConfig): string {
  const base = THEMES.find((t) => t.id === config.theme)?.name ?? config.theme;
  return config.theme === "monotype" ? `${base} (${config.themeType})` : base;
}

const formatName = (config: BattleConfig) => FORMATS.find((f) => f.id === config.format)?.name ?? config.format;

/** One human-readable line per rental Pokémon. */
function monLine(m: RentalMon, indent = "    "): string {
  const ivs = m.minPerfectIvs > 0 ? `${m.minPerfectIvs}× perfect IVs` : "random IVs";
  return `${indent}${m.name}  Lv${m.level}  ${natureName(m.nature)}  ·  ${m.ability}  @ ${m.heldItemName}  ·  ${ivs}  ·  EVs: ${evString(m)}`;
}

/** team_sheets.txt — the fixed teams, or the draftable set pool. */
export function buildTeamSheet(opts: { config: BattleConfig; teams: RentalTeam[]; pool: RentalMon[]; namespace: string; slug: string }): GeneratedFile {
  const { config, teams, pool, namespace } = opts;
  const L: string[] = [];
  const runtime = config.draftMode === "runtime";
  L.push(`${config.title} — ${runtime ? `RENTAL SET POOL (${pool.length})` : `RENTAL TEAMS (${teams.length})`}`);
  L.push(`${themeLabel(config)} · ${formatName(config)} · Lv${config.level} · ${config.difficulty}`);
  L.push("");
  if (runtime) {
    L.push(`Teams of ${config.teamSize} are DRAFTED AT RANDOM in-game from this pool (no two drafts alike).`);
    L.push("");
    pool.forEach((m, i) => L.push(monLine(m, `  ${String(i + 1).padStart(2, " ")}. `)));
  } else {
    for (const team of teams) {
      L.push(`Rental Team ${team.index}  (give: /execute as <player> run function ${namespace}:give_team_${team.index})`);
      for (const m of team.mons) L.push(monLine(m));
      L.push("");
    }
  }
  L.push("");
  L.push("Moves: rentals come with each Pokémon's natural level-up moveset for its level.");
  return { path: "team_sheets.txt", contents: L.join("\n") + "\n", kind: "readme", label: "team sheets" };
}

/** ruleset.txt — the stated rules players battle under. */
export function buildRuleset(opts: { config: BattleConfig }): GeneratedFile {
  const { config } = opts;
  const L: string[] = [];
  L.push(`${config.title} — RULESET`);
  L.push("");
  L.push(`Format:     ${formatName(config)}`);
  L.push(`Level:      flat Lv${config.level} (all rentals)`);
  L.push(`Team size:  ${config.teamSize}`);
  L.push(`Theme:      ${themeLabel(config)}`);
  L.push(`Draft:      ${config.draftMode === "runtime" ? "random team assembled in-game per draft" : "pick from pre-built teams"}`);
  L.push("");
  if (config.clauses.length) {
    L.push("CLAUSES (host-enforced — Cobblemon doesn't check these automatically):");
    for (const c of config.clauses) L.push(`  - ${c}`);
    L.push("");
  }
  if (config.bannedSpecies.length) {
    L.push(`BANNED SPECIES: ${config.bannedSpecies.join(", ")}`);
    L.push("");
  }
  L.push("HOW IT RUNS:");
  L.push("  - Players draft a rental team (ticket or admin function), then battle each other");
  L.push("    with /battlechallenge. Track win streaks for the leaderboard.");
  return { path: "ruleset.txt", contents: L.join("\n") + "\n", kind: "readme", label: "ruleset" };
}

/** admin_checklist.txt — install + run steps. */
export function buildBattleChecklist(opts: {
  config: BattleConfig;
  namespace: string;
  slug: string;
  teams: RentalTeam[];
  pool: RentalMon[];
  datapackFileName: string;
  validation: ValidationResult;
}): GeneratedFile {
  const { config, namespace, teams, pool, datapackFileName, validation } = opts;
  const runtime = config.draftMode === "runtime";
  const L: string[] = [];
  L.push(`${config.title} — ADMIN CHECKLIST`);
  L.push("");
  L.push(`Validator: ${validation.ok ? "OK ✓" : `${validation.issues.length} issue(s) — review before shipping`}`);
  L.push("");
  let n = 1;
  L.push(`  ${n++}. Drop ${datapackFileName} into <world>/datapacks/ and run /reload.`);
  L.push(`        load.mcfunction creates the draft scoreboard${runtime ? " and seeds the set pool into storage" : ""} — no restart needed.`);
  if (config.draftItem) {
    L.push(`  ${n++}. Hand out draft tickets: /execute as <player> run function ${namespace}:give_draft_ticket`);
    L.push(`        Players right-click & hold the ticket to draft a team.`);
  }
  if (runtime) {
    L.push(`  ${n++}. Or draft directly: /execute as <player> run function ${namespace}:draft_random`);
    L.push(`        Each call assembles a fresh random team of ${config.teamSize} from the ${pool.length}-set pool.`);
  } else {
    L.push(`  ${n++}. Or draft directly: /execute as <player> run function ${namespace}:draft_random`);
    L.push(`        (or a specific team: ${namespace}:give_team_1 … give_team_${teams.length}).`);
  }
  L.push(`  ${n++}. Players battle with /battlechallenge <player>. Track streaks for the leaderboard.`);
  L.push(`  ${n++}. Teardown: /function ${namespace}:uninstall, then remove the datapack.`);
  L.push("");
  if (runtime) {
    L.push("NOTE: the draft uses vanilla /random + storage macros (1.20.2+); verify one draft");
    L.push("      in-game the first time. Rentals are given to the party — returning them is manual.");
  } else {
    L.push("NOTE: rentals are given to the party — returning them is manual for now.");
  }
  L.push(`Commands require cheats/op level 2; ticket reward functions run at level 2 automatically.`);
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin checklist" };
}

/** discord_announcement.md — a hype post for the event. */
export function buildBattleDiscord(opts: { config: BattleConfig; count: number }): GeneratedFile {
  const { config, count } = opts;
  const runtime = config.draftMode === "runtime";
  const L: string[] = [];
  L.push(`# ⚔️ ${config.title} — Battle Factory`);
  L.push("");
  L.push(`**${themeLabel(config)} · ${formatName(config)} · Lv${config.level}**`);
  L.push("");
  L.push(
    runtime
      ? `Draft a **random rental team** of ${config.teamSize} — assembled live from a pool of **${count}** sets, so no two drafts are alike — and battle for the longest win streak!`
      : `Draft a random rental team from **${count}** pre-built squads and battle for the longest win streak!`,
  );
  L.push("");
  L.push("- 🎟 Use your **Draft Ticket** to roll a rental team");
  L.push("- ⚔️ Challenge other trainers with `/battlechallenge`");
  L.push("- 🏆 Longest streak takes the prize");
  L.push("");
  L.push("_Rentals come fully kitted — natures, abilities, held items & natural movesets._");
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord post" };
}
