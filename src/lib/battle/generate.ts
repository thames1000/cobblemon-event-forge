import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { Species } from "../catalog/pokemon";
import type { BattleConfig, RentalMon, RentalTeam } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";
import { POKEMON } from "../catalog/pokemon";
import { BATTLE_DATA } from "./battleData";
import { HELD_ITEMS } from "./catalog";
import { buildTeamSheet, buildRuleset, buildBattleChecklist, buildBattleDiscord } from "./text";

export interface BattleGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  /** Fixed-mode pre-built teams (empty in runtime mode). */
  teams: RentalTeam[];
  /** Runtime-mode baked set pool (empty in fixed mode). */
  pool: RentalMon[];
}

const RNG_OBJ = "battle_rng";
const DRAFT_KEY = "battle";
const TOKEN_ITEM = "minecraft:paper";

/** Deterministic PRNG (mulberry32) so a given seed always yields the same pool. */
function mulberry32(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

/** Eligible species for the pool given theme + banlist (must have battle data). */
function eligibleSpecies(config: BattleConfig): Species[] {
  return POKEMON.filter((p) => {
    if (!BATTLE_DATA[p.id]) return false;
    if (config.bannedSpecies.includes(p.id)) return false;
    if (config.theme === "legendary") return !!p.legendary;
    if (p.legendary) return false; // balanced/monotype exclude legendaries
    if (config.theme === "monotype") return p.types.includes(config.themeType);
    return true;
  });
}

/** Build one rental Pokémon's set from its base stats (natural moves left to Cobblemon). */
function buildMon(sp: Species, config: BattleConfig, rng: () => number): RentalMon {
  const bd = BATTLE_DATA[sp.id];
  const [, atk, , spa, , spe] = bd.s;
  const physical = atk >= spa;
  const fast = spe >= 80;
  const competitive = config.difficulty === "competitive";

  const nature = physical ? (fast ? "jolly" : "adamant") : fast ? "timid" : "modest";
  const ability = pick(bd.a, rng);

  // Offensive EV spread for competitive; none for casual.
  const evs: Record<string, number> = competitive
    ? physical
      ? { attack: 252, speed: 252, hp: 4 }
      : { special_attack: 252, speed: 252, hp: 4 }
    : {};

  // Pick a role-appropriate held item.
  const role = physical ? "physical" : "special";
  const itemPool = HELD_ITEMS.filter(
    (i) => i.role === role || i.role === "any" || (!competitive && i.role === "defensive"),
  );
  const item = pick(itemPool, rng);

  return {
    species: sp.id,
    name: sp.name,
    types: sp.types,
    level: config.level,
    nature,
    ability,
    heldItem: item.id,
    heldItemName: item.name,
    minPerfectIvs: competitive ? 6 : 0,
    evs,
  };
}

/** Draw `count` distinct-species sets from the eligible list (without replacement). */
function drawSets(config: BattleConfig, eligible: Species[], count: number, rng: () => number): RentalMon[] {
  const n = Math.min(count, eligible.length);
  const remaining = [...eligible];
  const out: RentalMon[] = [];
  for (let i = 0; i < n; i++) {
    const [sp] = remaining.splice(Math.floor(rng() * remaining.length), 1);
    out.push(buildMon(sp, config, rng));
  }
  return out;
}

/** The Cobblemon Pokémon Properties string for one rental (species token + properties). */
export function rentalProperties(m: RentalMon): string {
  const parts = [
    m.species,
    `level=${m.level}`,
    `nature=${m.nature}`,
    `ability=${m.ability}`,
    `held_item=${m.heldItem}`,
  ];
  if (m.minPerfectIvs > 0) parts.push(`min_perfect_ivs=${m.minPerfectIvs}`);
  for (const [stat, val] of Object.entries(m.evs)) parts.push(`${stat}_ev=${val}`);
  return parts.join(" ");
}

export function generateBattleFactory(config: BattleConfig): BattleGenerateResult {
  const slug = toId(config.title || "battle_factory");
  const ns = toNamespace(config.title || "owner_battle");
  const rng = mulberry32(config.seed);
  const eligible = eligibleSpecies(config);

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — Battle Factory rentals, by Cobbleverse Event Forge`, packFormat: config.packFormat }),
  ];
  const loadLines = [`scoreboard objectives add ${RNG_OBJ} dummy`];
  const uninstallLines = [`scoreboard objectives remove ${RNG_OBJ}`];

  let teams: RentalTeam[] = [];
  let pool: RentalMon[] = [];

  if (config.draftMode === "fixed") {
    // --- FIXED: pre-build poolSize teams; draft picks one. ---
    const size = Math.min(config.teamSize, eligible.length);
    teams = Array.from({ length: config.poolSize }, (_, i) => ({ index: i + 1, mons: drawSets(config, eligible, size, rng) }));

    for (const team of teams) {
      datapackFiles.push({
        path: `data/${ns}/function/give_team_${team.index}.mcfunction`,
        contents: [
          `# Rental Team ${team.index} — give the whole team to the player running this (@s).`,
          `#   /execute as <player> run function ${ns}:give_team_${team.index}`,
          ...team.mons.map((m) => `givepokemonother @s ${rentalProperties(m)}`),
          `tellraw @s ${JSON.stringify({ text: `🎟 You drew Rental Team ${team.index}: ${team.mons.map((m) => m.name).join(", ")}`, color: "aqua" })}`,
          "",
        ].join("\n"),
        kind: "function",
        label: `give_team_${team.index}.mcfunction`,
      });
    }
    const draft = [`# Draft a random rental team (1..${teams.length}).`, `execute store result score #pick ${RNG_OBJ} run random value 1..${teams.length}`];
    for (const team of teams) draft.push(`execute if score #pick ${RNG_OBJ} matches ${team.index} run function ${ns}:give_team_${team.index}`);
    draft.push("");
    datapackFiles.push({ path: `data/${ns}/function/draft_random.mcfunction`, contents: draft.join("\n"), kind: "function", label: "draft_random.mcfunction" });
  } else {
    // --- RUNTIME: bake a pool of sets; assemble a random team in-game per draft. ---
    pool = drawSets(config, eligible, config.poolSize, rng);
    const teamSize = Math.min(config.teamSize, pool.length);
    // The pool lives in storage <ns>:draft, seeded by load.
    loadLines.push(`data modify storage ${ns}:draft pool set value ${JSON.stringify(pool.map(rentalProperties))}`);
    uninstallLines.push(`data remove storage ${ns}:draft pool`, `data remove storage ${ns}:draft work`);

    // draft_random = copy the pool to a working list, then draw teamSize sets without replacement.
    datapackFiles.push({
      path: `data/${ns}/function/draft_random.mcfunction`,
      contents: [
        `# Assemble a fresh random rental team from the pool (no-replacement → Species Clause).`,
        `data modify storage ${ns}:draft work set from storage ${ns}:draft pool`,
        ...Array.from({ length: teamSize }, () => `function ${ns}:draft_pick`),
        `tellraw @s ${JSON.stringify({ text: `🎲 Drafted a random rental team — check your party!`, color: "aqua" })}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "draft_random.mcfunction",
    });
    // draft_pick: roll a random index into `work`, give that set, remove it.
    datapackFiles.push({
      path: `data/${ns}/function/draft_pick.mcfunction`,
      contents: [
        `# Draw one random set from the working pool (without replacement) and give it to @s.`,
        `execute store result score #len ${RNG_OBJ} run data get storage ${ns}:draft work`,
        `execute if score #len ${RNG_OBJ} matches ..0 run return 0`,
        `scoreboard players operation #max ${RNG_OBJ} = #len ${RNG_OBJ}`,
        `scoreboard players remove #max ${RNG_OBJ} 1`,
        `execute store result storage ${ns}:draft m int 1 run scoreboard players get #max ${RNG_OBJ}`,
        `function ${ns}:draft_roll with storage ${ns}:draft`,
        `function ${ns}:draft_extract with storage ${ns}:draft`,
        `function ${ns}:draft_give with storage ${ns}:draft`,
        "",
      ].join("\n"),
      kind: "function",
      label: "draft_pick.mcfunction",
    });
    // Macros: roll the index (range is dynamic → must be a macro), extract+remove, then give.
    datapackFiles.push({
      path: `data/${ns}/function/draft_roll.mcfunction`,
      contents: [`# Macro: roll a random index 0..$(m) into storage r.`, `$execute store result storage ${ns}:draft r int 1 run random value 0..$(m)`, ""].join("\n"),
      kind: "function",
      label: "draft_roll.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/draft_extract.mcfunction`,
      contents: [
        `# Macro: copy work[$(r)] to set, then remove it from work.`,
        `$data modify storage ${ns}:draft set set from storage ${ns}:draft work[$(r)]`,
        `$data remove storage ${ns}:draft work[$(r)]`,
        "",
      ].join("\n"),
      kind: "function",
      label: "draft_extract.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/draft_give.mcfunction`,
      contents: [`# Macro: give @s the chosen rental set.`, `$givepokemonother @s $(set)`, ""].join("\n"),
      kind: "function",
      label: "draft_give.mcfunction",
    });
  }

  // --- shared: optional draft ticket, load/uninstall, load tag ---
  if (config.draftItem) {
    const draftValue = `${slug}_draft`;
    datapackFiles.push({
      path: `data/${ns}/advancement/use_${slug}_draft.json`,
      contents: JSON.stringify(consumeAdvancement({ baseItem: TOKEN_ITEM, dataKey: DRAFT_KEY, dataValue: draftValue, rewardFunctionId: `${ns}:draft_token` }), null, 2),
      kind: "advancement",
      label: "draft-ticket advancement",
    });
    datapackFiles.push({
      path: `data/${ns}/function/draft_token.mcfunction`,
      contents: [
        `# A player used a Rental Draft Ticket → draft a team, then re-arm.`,
        `function ${ns}:draft_random`,
        `advancement revoke @s only ${ns}:use_${slug}_draft`,
        "",
      ].join("\n"),
      kind: "function",
      label: "draft_token.mcfunction",
    });
    const give = usableGiveCommand({
      baseItem: TOKEN_ITEM,
      name: `${config.title} Draft Ticket`,
      nameColor: "aqua",
      lore: "Right-click & hold to draft a rental team",
      glint: true,
      consumeSeconds: 0.6,
      dataKey: DRAFT_KEY,
      dataValue: draftValue,
      packFormat: config.packFormat,
    });
    datapackFiles.push({
      path: `data/${ns}/function/give_draft_ticket.mcfunction`,
      contents: [
        `# Give one ${config.title} draft ticket:`,
        `#   /execute as <player> run function ${ns}:give_draft_ticket`,
        give,
        `tellraw @s ${JSON.stringify({ text: `You received a ${config.title} draft ticket!`, color: "gold" })}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "give_draft_ticket.mcfunction",
    });
  }

  datapackFiles.push({
    path: `data/${ns}/function/load.mcfunction`,
    contents: [`# Setup for ${config.title}.`, ...loadLines, ""].join("\n"),
    kind: "function",
    label: "load.mcfunction",
  });
  datapackFiles.push({
    path: `data/minecraft/tags/function/load.json`,
    contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2),
    kind: "tag",
    label: "load tag",
  });
  datapackFiles.push({
    path: `data/${ns}/function/uninstall.mcfunction`,
    contents: [
      `# Tear down "${config.title}", then delete the datapack.`,
      ...uninstallLines,
      `tellraw @a ${JSON.stringify({ text: `${config.title} Battle Factory torn down.`, color: "gray" })}`,
      "",
    ].join("\n"),
    kind: "function",
    label: "uninstall.mcfunction",
  });

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;

  const sideCars: GeneratedFile[] = [
    buildTeamSheet({ config, teams, pool, namespace: ns, slug }),
    buildRuleset({ config }),
    buildBattleChecklist({ config, namespace: ns, slug, teams, pool, datapackFileName, validation }),
    buildBattleDiscord({ config, count: config.draftMode === "fixed" ? teams.length : pool.length }),
  ];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    teams,
    pool,
  };
}
