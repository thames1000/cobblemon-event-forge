import type { Bundle, GeneratedFile } from "../datapack/types";
import { toPortableTeams } from "./portable";
import type { ValidationResult } from "../datapack/validate";
import type { Team, TeamsConfig } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { compileRewardLines } from "../reward/actions";
import { findTrigger, describeObjective } from "../objective/triggers";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";

export interface TeamsResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

const SCORE_OBJ = "team_score"; // fake-player score per team
const PTS_OBJ = "team_pts"; // per-player points (MVP / leaderboard)
const RNG_OBJ = "teams_rng"; // scratch for random assignment

/** Per-team derived ids: the vanilla team name and the unique sidebar score holder. */
interface TeamMeta extends Team {
  vt: string; // vanilla team id, e.g. "team_clash_red"
  holder: string; // unique, space-free score holder for the sidebar
}

function buildMeta(slug: string, teams: Team[]): TeamMeta[] {
  const seen = new Set<string>();
  return teams.map((t) => {
    let holder = (t.name.replace(/\s+/g, "").replace(/[^\w-]/g, "") || t.id).slice(0, 32);
    while (seen.has(holder)) holder += `_${t.id}`;
    seen.add(holder);
    return { ...t, vt: `${slug}_${t.id}`, holder };
  });
}

function fn(ns: string, name: string, lines: string[]): GeneratedFile {
  return { path: `data/${ns}/function/${name}.mcfunction`, contents: lines.join("\n") + "\n", kind: "function", label: `${name}.mcfunction` };
}

function adv(ns: string, name: string, doc: object): GeneratedFile {
  return { path: `data/${ns}/advancement/${name}.json`, contents: JSON.stringify(doc, null, 2), kind: "advancement", label: `${name} advancement` };
}

/** Lines that credit `points` to the acting player's team + personal score (event players only). */
function awardLines(meta: TeamMeta[], slug: string, points: number): string[] {
  const L: string[] = [`execute unless entity @s[tag=${slug}_player] run return 0`];
  for (const t of meta) L.push(`execute if entity @s[team=${t.vt}] run scoreboard players add ${t.holder} ${SCORE_OBJ} ${points}`);
  L.push(`scoreboard players add @s ${PTS_OBJ} ${points}`);
  return L;
}

export function generateTeams(config: TeamsConfig): TeamsResult {
  const slug = toId(config.title || "team_event");
  const ns = toNamespace(config.title || "team_event");
  const meta = buildMeta(slug, config.teams);
  const files: GeneratedFile[] = [];

  files.push(buildPackMeta({ description: `${config.title} — Team vs Team, by Cobbleverse Event Forge`, packFormat: config.packFormat }));

  // ---- join items + per-team join handling ----
  // One "menu" function hands a player one join item per team; using a team's item
  // joins that vanilla team (and tags them as an event player).
  const joinMenu: string[] = [`# Give a player the full set of team join items (they pick by using one).`];
  for (const t of meta) {
    joinMenu.push(
      usableGiveCommand({
        baseItem: config.joinBaseItem,
        name: `Join ${t.name}`,
        nameColor: t.color,
        lore: `Right-click & hold to join ${t.name}`,
        glint: true,
        consumeSeconds: 1,
        dataKey: "teams_join",
        dataValue: t.id,
        packFormat: config.packFormat,
      }),
    );
  }
  files.push(fn(ns, "join_items", joinMenu));

  for (const t of meta) {
    files.push(
      adv(ns, `use_join_${t.id}`, consumeAdvancement({ baseItem: config.joinBaseItem, dataKey: "teams_join", dataValue: t.id, rewardFunctionId: `${ns}:join_${t.id}` })),
    );
    files.push(
      fn(ns, `join_${t.id}`, [
        `# Join ${t.name}.`,
        `advancement revoke @s only ${ns}:use_join_${t.id}`,
        `team join ${t.vt} @s`,
        `tag @s add ${slug}_player`,
        `tellraw @s [{"text":"${t.emoji} You joined ","color":"gray"},{"text":"${t.name}","color":"${t.color}"},{"text":"!","color":"gray"}]`,
      ]),
    );
  }

  // ---- random shuffle of everyone online ----
  const shuffle: string[] = [
    `# Randomly assign every ONLINE player to a team (roughly even by luck).`,
    `execute as @a store result score @s ${RNG_OBJ} run random value 1..${meta.length}`,
  ];
  meta.forEach((t, i) => {
    shuffle.push(`execute as @a[scores={${RNG_OBJ}=${i + 1}}] run team join ${t.vt} @s`);
  });
  shuffle.push(`tag @a add ${slug}_player`);
  shuffle.push(`tellraw @a {"text":"⚔ Teams have been shuffled — check your name colour!","color":"gold"}`);
  for (const t of meta) shuffle.push(`execute as @a[team=${t.vt}] run tellraw @s [{"text":"You are on ","color":"gray"},{"text":"${t.name}","color":"${t.color}"}]`);
  files.push(fn(ns, "shuffle", shuffle));

  // ---- per-action scoring (count-less, self-re-arming advancements) ----
  const { perCatch, perBattle, perShiny, catchType } = config.scoring;
  if (perCatch.enabled) {
    const cond: Record<string, unknown> = catchType !== "any" ? { type: catchType } : {};
    files.push(adv(ns, "score_catch", { criteria: { caught: { trigger: "cobblemon:catch_pokemon", conditions: cond } }, requirements: [["caught"]], rewards: { function: `${ns}:score_catch` } }));
    files.push(
      fn(ns, "score_catch", [
        `# +${perCatch.points} team points per ${catchType === "any" ? "" : catchType + "-type "}catch.`,
        `advancement revoke @s only ${ns}:score_catch`,
        ...awardLines(meta, slug, perCatch.points),
      ]),
    );
  }
  if (perBattle.enabled) {
    files.push(adv(ns, "score_battle", { criteria: { won: { trigger: "cobblemon:battles_won", conditions: {} } }, requirements: [["won"]], rewards: { function: `${ns}:score_battle` } }));
    files.push(fn(ns, "score_battle", [`# +${perBattle.points} team points per battle won.`, `advancement revoke @s only ${ns}:score_battle`, ...awardLines(meta, slug, perBattle.points)]));
  }
  if (perShiny.enabled) {
    files.push(adv(ns, "score_shiny", { criteria: { shiny: { trigger: "cobblemon:catch_shiny_pokemon", conditions: {} } }, requirements: [["shiny"]], rewards: { function: `${ns}:score_shiny` } }));
    files.push(fn(ns, "score_shiny", [`# +${perShiny.points} bonus team points per shiny caught.`, `advancement revoke @s only ${ns}:score_shiny`, ...awardLines(meta, slug, perShiny.points)]));
  }

  // ---- milestone goals (one-shot per player, award team points + optional reward) ----
  config.goals.forEach((g, i) => {
    const n = i + 1;
    const t = findTrigger(g.triggerId);
    if (!t) return;
    const label = describeObjective(g);
    files.push(adv(ns, `goal_${n}`, { criteria: { done: { trigger: t.id, conditions: t.conditions(g) } }, requirements: [["done"]], rewards: { function: `${ns}:goal_${n}` } }));
    const body: string[] = [`# Goal ${n}: ${label} (+${g.points} team points)`, `execute unless entity @s[tag=${slug}_player] run return 0`];
    body.push(...compileRewardLines(g.rewards, { packFormat: config.packFormat }));
    body.push(...awardLines(meta, slug, g.points).slice(1)); // drop the duplicate tag-guard (already guarded above)
    if (g.announce) body.push(`tellraw @a [{"selector":"@s"},{"text":" cleared a goal for their team: ${label}!","color":"green"}]`);
    body.push(`tellraw @s {"text":"Goal complete — ${label} (+${g.points} team pts)","color":"gold"}`);
    files.push(fn(ns, `goal_${n}`, body));
  });

  // ---- standings + winner ----
  const standings: string[] = [`tellraw @a {"text":"━━ ${config.title} — standings ━━","color":"gold"}`];
  for (const t of meta) {
    standings.push(
      `tellraw @a [{"text":"${t.emoji} ${t.name}: ","color":"${t.color}"},{"score":{"name":"${t.holder}","objective":"${SCORE_OBJ}"},"color":"white"}]`,
    );
  }
  files.push(fn(ns, "scores", standings));

  const winner: string[] = [`# Declare the leader (ties announce more than one).`];
  for (const t of meta) {
    const guards = meta.filter((o) => o.holder !== t.holder).map((o) => `if score ${t.holder} ${SCORE_OBJ} >= ${o.holder} ${SCORE_OBJ}`).join(" ");
    const prefix = guards ? `execute ${guards} run ` : "";
    winner.push(`${prefix}tellraw @a [{"text":"🏆 ","color":"gold"},{"text":"${t.name} wins the event! ","color":"${t.color}"},{"score":{"name":"${t.holder}","objective":"${SCORE_OBJ}"},"color":"white"}]`);
  }
  files.push(fn(ns, "winner", winner));

  // ---- lifecycle: load / uninstall ----
  const load: string[] = [`# Load setup for: ${config.title}`, `scoreboard objectives add ${SCORE_OBJ} dummy`, `scoreboard objectives add ${PTS_OBJ} dummy`, `scoreboard objectives add ${RNG_OBJ} dummy`];
  load.push(`scoreboard objectives modify ${SCORE_OBJ} displayname ${JSON.stringify([{ text: config.title, color: "gold" }])}`);
  for (const t of meta) {
    load.push(`# ${t.name}`);
    load.push(`team add ${t.vt}`);
    load.push(`team modify ${t.vt} color ${t.color}`);
    load.push(`team modify ${t.vt} displayName ${JSON.stringify([{ text: t.name, color: t.color }])}`);
    load.push(`team modify ${t.vt} prefix ${JSON.stringify([{ text: `${t.emoji} ` }])}`);
    load.push(`scoreboard players add ${t.holder} ${SCORE_OBJ} 0`); // seed so it shows on the sidebar
  }
  if (config.sidebar) load.push(`scoreboard objectives setdisplay sidebar ${SCORE_OBJ}`);
  files.push(fn(ns, "load", load));
  files.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });

  const uninstall: string[] = [`# Uninstall: ${config.title}`, `# Run /function ${ns}:uninstall, then delete the datapack .zip.`];
  if (config.sidebar) uninstall.push(`scoreboard objectives setdisplay sidebar`);
  for (const t of meta) uninstall.push(`team remove ${t.vt}`);
  uninstall.push(`scoreboard objectives remove ${SCORE_OBJ}`, `scoreboard objectives remove ${PTS_OBJ}`, `scoreboard objectives remove ${RNG_OBJ}`);
  uninstall.push(`tag @a remove ${slug}_player`);
  // reclaim leftover join items (exact custom_data match, one per team)
  for (const t of meta) uninstall.push(`clear @a ${config.joinBaseItem}[minecraft:custom_data={teams_join:"${t.id}"}]`);
  uninstall.push(`tellraw @a {"text":"${config.title} uninstalled — safe to remove the datapack.","color":"gray"}`);
  files.push(fn(ns, "uninstall", uninstall));

  // ---- side-cars ----
  files.push(buildChecklist(config, ns, slug, meta));
  files.push(buildDiscord(config, meta));
  files.push(buildRules(config, meta));
  // re-importable snapshot of this event — drop it back into the page to edit/re-run later
  files.push({ path: "teams_config.json", contents: toPortableTeams(config), kind: "readme", label: "teams_config.json" });

  const validation = validateDatapack(files);
  const bundle: Bundle = { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files };
  return { bundle, validation, datapackFileName: `${slug}.zip` };
}

function scoringSummary(config: TeamsConfig): string[] {
  const s = config.scoring;
  const out: string[] = [];
  if (s.perCatch.enabled) out.push(`  - Catch a ${s.catchType === "any" ? "Pokémon" : s.catchType + "-type"}: +${s.perCatch.points}`);
  if (s.perBattle.enabled) out.push(`  - Win a battle: +${s.perBattle.points}`);
  if (s.perShiny.enabled) out.push(`  - Catch a shiny: +${s.perShiny.points} (bonus)`);
  config.goals.forEach((g, i) => out.push(`  - Goal ${i + 1} — ${describeObjective(g)}: +${g.points}`));
  if (!out.length) out.push("  - (no scoring rules set yet)");
  return out;
}

function buildChecklist(config: TeamsConfig, ns: string, slug: string, meta: TeamMeta[]): GeneratedFile {
  const L: string[] = [];
  L.push(`ADMIN CHECKLIST — ${config.title} (Team vs Team)`);
  L.push("=".repeat(44));
  L.push("SETUP");
  L.push(`  1. Upload ${slug}.zip to <server>/world/datapacks/`);
  L.push(`  2. /reload  (or restart the server)`);
  L.push(`  3. Teams + scoreboards are created automatically on load.`);
  L.push("");
  L.push("PICK TEAMS — choose one:");
  L.push(`  A) Let players self-pick. Hand out the join items:`);
  L.push(`        /execute as @a run function ${ns}:join_items`);
  L.push(`     Each player right-click-holds the item for the team they want.`);
  L.push(`  B) Randomly assign everyone online:`);
  L.push(`        /function ${ns}:shuffle`);
  L.push("");
  L.push("DURING THE EVENT");
  L.push(`  - Live scores show on the sidebar${config.sidebar ? "" : " (disabled — enable in the generator)"}.`);
  L.push(`  - Print standings to chat any time:  /function ${ns}:scores`);
  L.push("  Points:");
  for (const line of scoringSummary(config)) L.push(`  ${line}`);
  L.push("");
  L.push("END THE EVENT");
  L.push(`  1. Declare the winner:  /function ${ns}:winner`);
  L.push(`  2. Tear down:  /function ${ns}:uninstall   (removes teams + scoreboards)`);
  L.push(`  3. Remove ${slug}.zip and /reload.`);
  L.push("");
  L.push("TEAMS");
  for (const t of meta) L.push(`  ${t.emoji} ${t.name}  (vanilla team: ${t.vt})`);
  if (config.sidebar) {
    L.push("");
    L.push("NOTE: only one datapack can own the sidebar at a time. If another pack");
    L.push("(e.g. a Leaderboard or Escalation event) also uses the sidebar, expect");
    L.push("them to clash — run only one sidebar pack at once.");
  }
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin_checklist.txt" };
}

function buildDiscord(config: TeamsConfig, meta: TeamMeta[]): GeneratedFile {
  const L: string[] = [];
  L.push(`# ⚔️ ${config.title}`);
  L.push("");
  if (config.blurb.trim()) L.push(`> ${config.blurb.trim()}`);
  L.push("");
  L.push(`**Teams:** ${meta.map((t) => `${t.emoji} ${t.name}`).join(" · ")}`);
  L.push("");
  L.push("**How to join:** grab a join item from an admin and right-click-hold it — or you'll be auto-assigned.");
  L.push("");
  L.push("**Scoring**");
  for (const line of scoringSummary(config)) L.push(`- ${line.trim().replace(/^- /, "")}`);
  L.push("");
  L.push("Pick a side and rack up points. May the best team win! 🏆");
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord_announcement.md" };
}

function buildRules(config: TeamsConfig, meta: TeamMeta[]): GeneratedFile {
  const L: string[] = [];
  L.push(`${config.title.toUpperCase()} — RULES`);
  L.push("=".repeat(40));
  L.push(`Teams: ${meta.map((t) => `${t.emoji} ${t.name}`).join(", ")}`);
  L.push("");
  L.push("HOW TO JOIN");
  L.push("  Use the join item for the team you want (right-click & hold), or get");
  L.push("  randomly assigned by an admin. You can switch by using another team's item.");
  L.push("");
  L.push("HOW TO EARN POINTS");
  for (const line of scoringSummary(config)) L.push(line);
  L.push("");
  L.push("HOW THE WINNER IS DECIDED");
  L.push("  The team with the most points when the event ends wins.");
  L.push("");
  L.push("IF SOMETHING BREAKS");
  L.push("  Tell an admin — they can re-show scores or re-assign teams.");
  return { path: "rules_board.txt", contents: L.join("\n") + "\n", kind: "readme", label: "rules_board.txt" };
}
