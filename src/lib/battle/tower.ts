import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { RewardAction } from "../reward/actions";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { compileRewardLines, describeReward } from "../reward/actions";

/**
 * NPC Battle Tower (Radical Cobblemon Trainers).
 *
 * RCT's `rctmod:defeat_count` advancement trigger fires when a player has defeated at
 * least `count` DISTINCT trainers (of a type, or from a given id list). That distinct
 * count maps to "tower floors cleared", so a ladder of advancements (count = 1..floors),
 * each with a reward function, gives a reward per floor plus bigger milestone bonuses.
 *
 * Why not a resettable streak: both `rctmod:defeat_count` and `cobblemon:battles_won`
 * are CUMULATIVE thresholds on a persistent stat (verified in source), and there is no
 * loss/flee trigger — so progress can't be reset and can't be made per-event. The tower
 * is therefore cumulative progression (which also means no frustration on a loss).
 */

export interface TowerMilestone {
  floor: number;
  rewards: RewardAction[];
}

export interface TowerConfig {
  title: string;
  /** Floors to generate (one rctmod:defeat_count advancement per floor, count = floor). */
  floors: number;
  /** Match the tower's trainers by RCT type, or by an explicit id list. */
  scope: "type" | "ids";
  trainerType: string; // e.g. "NORMAL"
  trainerIds: string[]; // e.g. ["leader_brock_019e", ...]
  /** Reward handed out on every floor cleared. */
  perFloorReward: RewardAction[];
  /** Bigger bonus rewards at specific floors. */
  milestones: TowerMilestone[];
  packFormat: number;
}

export interface TowerGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  floors: number;
}

const RANK_OBJ = "tower_rank";

/** The RCT defeat_count conditions for a given floor (distinct-trainer threshold). */
function defeatConditions(config: TowerConfig, floor: number): Record<string, unknown> {
  const scope = config.scope === "ids" && config.trainerIds.length ? { trainer_ids: config.trainerIds } : { trainer_type: config.trainerType || "NORMAL" };
  return { ...scope, count: floor };
}

export function generateBattleTower(config: TowerConfig): TowerGenerateResult {
  const slug = toId(config.title || "battle_tower");
  const ns = toNamespace(config.title || "owner_tower");
  const floors = Math.max(1, Math.round(config.floors));
  const milestoneByFloor = new Map(config.milestones.map((m) => [Math.round(m.floor), m.rewards]));

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — NPC Battle Tower (RCT), by Cobbleverse Event Forge`, packFormat: config.packFormat }),
  ];

  for (let f = 1; f <= floors; f++) {
    // Advancement: granted once the player has beaten `f` distinct tower trainers.
    datapackFiles.push({
      path: `data/${ns}/advancement/floor_${f}.json`,
      contents: JSON.stringify(
        {
          criteria: { cleared: { trigger: "rctmod:defeat_count", conditions: defeatConditions(config, f) } },
          requirements: [["cleared"]],
          rewards: { function: `${ns}:floor_${f}` },
        },
        null,
        2,
      ),
      kind: "advancement",
      label: `floor ${f} advancement`,
    });
    // Reward function for clearing floor f (runs as the player; level 2; spawn rewards
    // are already positioned at @s by compileRewardLines).
    const bonus = milestoneByFloor.get(f);
    const lines = [
      `# Floor ${f} cleared — ${f} distinct tower trainers defeated.`,
      `scoreboard players set @s ${RANK_OBJ} ${f}`,
      `tellraw @s ${JSON.stringify([{ text: "🗼 ", color: "gold" }, { text: `${config.title} — Floor ${f} cleared!`, color: "yellow" }])}`,
      ...compileRewardLines(config.perFloorReward, { packFormat: config.packFormat }),
    ];
    if (bonus && bonus.length) {
      lines.push(`tellraw @s ${JSON.stringify({ text: `★ Milestone bonus for reaching floor ${f}!`, color: "gold" })}`);
      lines.push(...compileRewardLines(bonus, { packFormat: config.packFormat }));
    }
    lines.push("");
    datapackFiles.push({ path: `data/${ns}/function/floor_${f}.mcfunction`, contents: lines.join("\n"), kind: "function", label: `floor_${f}.mcfunction` });
  }

  // load / uninstall: the rank objective (also handy for a leaderboard).
  datapackFiles.push({
    path: `data/${ns}/function/load.mcfunction`,
    contents: [`# Setup for ${config.title}.`, `scoreboard objectives add ${RANK_OBJ} dummy`, ""].join("\n"),
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
      `scoreboard players reset * ${RANK_OBJ}`,
      `scoreboard objectives remove ${RANK_OBJ}`,
      `tellraw @a ${JSON.stringify({ text: `${config.title} Battle Tower torn down.`, color: "gray" })}`,
      "",
    ].join("\n"),
    kind: "function",
    label: "uninstall.mcfunction",
  });

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;
  const sideCars: GeneratedFile[] = [buildTowerRewardTable(config, floors), buildTowerChecklist(config, ns, floors, validation), buildTowerDiscord(config, floors)];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    floors,
  };
}

function rewardSummary(rewards: RewardAction[]): string {
  return rewards.length ? rewards.map(describeReward).join(", ") : "—";
}

/** reward_table.txt — what each floor pays out. */
function buildTowerRewardTable(config: TowerConfig, floors: number): GeneratedFile {
  const milestoneByFloor = new Map(config.milestones.map((m) => [Math.round(m.floor), m.rewards]));
  const L: string[] = [];
  L.push(`${config.title} — BATTLE TOWER REWARDS (${floors} floors)`);
  L.push(`Trigger: rctmod:defeat_count (${config.scope === "ids" ? `${config.trainerIds.length} trainer ids` : `trainer_type ${config.trainerType || "NORMAL"}`})`);
  L.push("");
  L.push(`Per floor: ${rewardSummary(config.perFloorReward)}`);
  L.push("");
  const ms = config.milestones.filter((m) => m.floor >= 1 && m.floor <= floors).sort((a, b) => a.floor - b.floor);
  if (ms.length) {
    L.push("Milestone bonuses (on top of the per-floor reward):");
    for (const m of ms) L.push(`  - Floor ${m.floor}: ${rewardSummary(m.rewards)}`);
  }
  void milestoneByFloor;
  return { path: "reward_table.txt", contents: L.join("\n") + "\n", kind: "readme", label: "reward table" };
}

/** admin_checklist.txt — install + RCT setup. */
function buildTowerChecklist(config: TowerConfig, namespace: string, floors: number, validation: ValidationResult): GeneratedFile {
  const L: string[] = [];
  L.push(`${config.title} — ADMIN CHECKLIST`);
  L.push("");
  L.push(`Validator: ${validation.ok ? "OK ✓" : `${validation.issues.length} issue(s)`}`);
  L.push("");
  L.push("REQUIRES Radical Cobblemon Trainers (RCT) — the advancements use rctmod:defeat_count.");
  L.push("");
  let n = 1;
  L.push(`  ${n++}. Drop the .zip into <world>/datapacks/ and /reload (load creates the ${RANK_OBJ} objective).`);
  if (config.scope === "ids") {
    L.push(`  ${n++}. The tower counts these RCT trainers (set them up in RCT): ${config.trainerIds.join(", ") || "(none set!)"}`);
  } else {
    L.push(`  ${n++}. The tower counts every RCT trainer of type "${config.trainerType || "NORMAL"}". Tag your tower trainers with that type.`);
  }
  L.push(`  ${n++}. Players climb by defeating distinct trainers: floor F pays out once they've beaten F of them.`);
  L.push(`  ${n++}. Highest floor reached is tracked in ${RANK_OBJ} (use it for a leaderboard, e.g. /scoreboard objectives setdisplay sidebar ${RANK_OBJ}).`);
  L.push(`  ${n++}. Teardown: /function ${namespace}:uninstall, then remove the datapack.`);
  L.push("");
  L.push("NOTE: progression is CUMULATIVE distinct-trainer defeats — there's no loss/streak");
  L.push("      reset (no datapack trigger exists for losing). Beating the SAME trainer twice");
  L.push("      doesn't advance a floor. Verify one floor clear in-game the first time.");
  L.push(`Total floors: ${floors}. Reward functions run at op/level 2 automatically (advancement reward).`);
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin checklist" };
}

/** discord_announcement.md */
function buildTowerDiscord(config: TowerConfig, floors: number): GeneratedFile {
  const L: string[] = [];
  L.push(`# 🗼 ${config.title} — Battle Tower`);
  L.push("");
  L.push(`Climb **${floors} floors** of NPC trainers. Every floor pays out, and milestone floors drop **bigger rewards** the higher you go!`);
  L.push("");
  L.push("- ⚔️ Beat tower trainers to climb");
  L.push("- 🎁 A reward every floor, bonus rewards at milestones");
  L.push("- 🏆 Highest floor reached tops the leaderboard");
  return { path: "discord_announcement.md", contents: L.join("\n") + "\n", kind: "discord", label: "discord post" };
}
