import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { Objective } from "../objective/types";
import type { BountyConfig, CommunityGoal } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";
import { buildObjectiveFiles } from "../objective/generate";
import { findTrigger, describeObjective } from "../objective/triggers";
import { newObjective } from "../objective/types";
import { compileRewardLines, describeReward } from "../reward/actions";
import { buildBoardText, buildBountyDiscord, buildBountyChecklist, buildBountiesJson } from "./text";

export interface BountyGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  /** Total individual bounties across all categories. */
  bountyCount: number;
}

const COMM_OBJ = "bounty_comm";
const BOARD_KEY = "bounty";
const BOARD_ITEM = "minecraft:paper";

export function rewardSummary(rewards: { kind: string }[]): string {
  return rewards.length ? (rewards as Parameters<typeof describeReward>[0][]).map(describeReward).join(", ") : "—";
}

/** The tellraw board players see (categories + live community progress). */
function buildBoardFunction(config: BountyConfig): string {
  const L: string[] = [`# Show the bounty board to the player running this (@s).`];
  L.push(`tellraw @s ${JSON.stringify(["", { text: "═══ ", color: "gold" }, { text: `${config.title}`, color: "gold", bold: true }, { text: " ═══", color: "gold" }])}`);

  const section = (heading: string, color: string, items: Objective[]) => {
    if (!items.length) return;
    L.push(`tellraw @s ${JSON.stringify({ text: `❑ ${heading}`, color, bold: true })}`);
    for (const o of items) {
      L.push(
        `tellraw @s ${JSON.stringify([
          { text: "  • ", color: "gray" },
          { text: describeObjective(o), color: "white" },
          ...(o.rewards.length ? [{ text: "  →  ", color: "gray" }, { text: rewardSummary(o.rewards), color: "aqua" }] : []),
        ])}`,
      );
    }
  };
  section("DAILY", "yellow", config.daily);
  section("WEEKLY", "gold", config.weekly);
  section("SPECIAL", "light_purple", config.special);

  if (config.community.length) {
    L.push(`tellraw @s ${JSON.stringify({ text: "❑ COMMUNITY", color: "aqua", bold: true })}`);
    config.community.forEach((g, i) => {
      const k = i + 1;
      L.push(
        `tellraw @s ${JSON.stringify([
          { text: "  • ", color: "gray" },
          { text: `${g.label || describeObjective(communityTaskObjective(g))}  `, color: "white" },
          { score: { name: `#c${k}`, objective: COMM_OBJ } },
          { text: `/${Math.max(1, Math.round(g.targetPlayers))}`, color: "yellow" },
          { text: " trainers", color: "gray" },
          ...(g.rewards.length ? [{ text: "  →  ", color: "gray" }, { text: rewardSummary(g.rewards), color: "aqua" }] : []),
        ])}`,
      );
    });
  }
  L.push("");
  return L.join("\n");
}

/** Build an Objective from a community goal so we can reuse the trigger machinery. */
function communityTaskObjective(g: CommunityGoal): Objective {
  return newObjective(g.id, { mode: "auto", triggerId: g.triggerId, count: g.count, pokemonType: g.pokemonType, species: g.species, level: g.level, label: g.label });
}

export function generateBountyBoard(config: BountyConfig): BountyGenerateResult {
  const slug = toId(config.title || "bounty_board");
  const ns = toNamespace(config.title || "owner_bounties");

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — Bounty Board, by Cobbleverse Event Forge`, packFormat: config.packFormat }),
  ];

  // --- individual bounties (one flat numbered set; categories are display-only) ---
  const allBounties = [...config.daily, ...config.weekly, ...config.special];
  datapackFiles.push(...buildObjectiveFiles({ namespace: ns, objectives: allBounties, packFormat: config.packFormat }));

  const loadLines: string[] = [];
  const uninstallLines: string[] = [];

  // --- community participation goals ---
  config.community.forEach((g, i) => {
    const k = i + 1;
    const task = communityTaskObjective(g);
    const trigger = findTrigger(g.triggerId);
    if (!trigger) return;
    const target = Math.max(1, Math.round(g.targetPlayers));

    // per-player contribution advancement → contribute fn (one-shot per player)
    datapackFiles.push({
      path: `data/${ns}/advancement/community_${k}.json`,
      contents: JSON.stringify(
        { criteria: { done: { trigger: trigger.id, conditions: trigger.conditions(task) } }, requirements: [["done"]], rewards: { function: `${ns}:community_${k}_contribute` } },
        null,
        2,
      ),
      kind: "advancement",
      label: `community ${k} advancement`,
    });
    const label = g.label || describeObjective(task);
    datapackFiles.push({
      path: `data/${ns}/function/community_${k}_contribute.mcfunction`,
      contents: [
        `# A player completed the contribution task for community goal ${k}: ${label}`,
        `scoreboard players add #c${k} ${COMM_OBJ} 1`,
        `tellraw @s ${JSON.stringify({ text: `✔ You contributed to the community goal: ${label}`, color: "green" })}`,
        `# fire the community reward once the target is reached (guarded so it runs only once)`,
        `execute if score #c${k} ${COMM_OBJ} matches ${target}.. unless score #d${k} ${COMM_OBJ} matches 1 run function ${ns}:community_${k}_complete`,
        "",
      ].join("\n"),
      kind: "function",
      label: `community_${k}_contribute.mcfunction`,
    });
    datapackFiles.push({
      path: `data/${ns}/function/community_${k}_complete.mcfunction`,
      contents: [
        `# Community goal ${k} reached: ${label}`,
        `scoreboard players set #d${k} ${COMM_OBJ} 1`,
        `tellraw @a ${JSON.stringify({ text: `🎉 Community goal reached — ${label}! Rewards for everyone online.`, color: "gold" })}`,
        `execute as @a run function ${ns}:community_${k}_grant`,
        "",
      ].join("\n"),
      kind: "function",
      label: `community_${k}_complete.mcfunction`,
    });
    datapackFiles.push({
      path: `data/${ns}/function/community_${k}_grant.mcfunction`,
      contents: [`# Grant the community reward to @s (run for each online player).`, ...compileRewardLines(g.rewards, { packFormat: config.packFormat }), `tellraw @s ${JSON.stringify({ text: `You received the community reward!`, color: "gold" })}`, ""].join("\n"),
      kind: "function",
      label: `community_${k}_grant.mcfunction`,
    });
    loadLines.push(`scoreboard players set #c${k} ${COMM_OBJ} 0`);
  });
  if (config.community.length) {
    loadLines.unshift(`scoreboard objectives add ${COMM_OBJ} dummy`);
    uninstallLines.push(`scoreboard objectives remove ${COMM_OBJ}`);
  }

  // --- the /board view ---
  datapackFiles.push({ path: `data/${ns}/function/board.mcfunction`, contents: buildBoardFunction(config), kind: "function", label: "board.mcfunction" });

  // --- optional reusable "Bounty Board" item (right-click → board, then re-given) ---
  if (config.boardItem) {
    const boardValue = `${slug}_board`;
    const spec = { baseItem: BOARD_ITEM, name: `${config.title} Board`, nameColor: "gold", lore: "Right-click & hold to view the bounty board", glint: true, consumeSeconds: 0.4, dataKey: BOARD_KEY, dataValue: boardValue, packFormat: config.packFormat };
    datapackFiles.push({
      path: `data/${ns}/advancement/use_${slug}_board.json`,
      contents: JSON.stringify(consumeAdvancement({ baseItem: BOARD_ITEM, dataKey: BOARD_KEY, dataValue: boardValue, rewardFunctionId: `${ns}:open_board` }), null, 2),
      kind: "advancement",
      label: "board-item advancement",
    });
    datapackFiles.push({
      path: `data/${ns}/function/open_board.mcfunction`,
      contents: [
        `# Player used the Bounty Board item → show the board, give the item back (so it's`,
        `# reusable), then re-arm the advancement.`,
        `function ${ns}:board`,
        usableGiveCommand(spec),
        `advancement revoke @s only ${ns}:use_${slug}_board`,
        "",
      ].join("\n"),
      kind: "function",
      label: "open_board.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/give_board.mcfunction`,
      contents: [`# Give one Bounty Board item: /execute as <player> run function ${ns}:give_board`, usableGiveCommand(spec), `tellraw @s ${JSON.stringify({ text: `You received the ${config.title} Board!`, color: "gold" })}`, ""].join("\n"),
      kind: "function",
      label: "give_board.mcfunction",
    });
  }

  // --- load / uninstall (only when there's state to set up) ---
  if (loadLines.length) {
    datapackFiles.push({ path: `data/${ns}/function/load.mcfunction`, contents: [`# Setup for ${config.title}.`, ...loadLines, ""].join("\n"), kind: "function", label: "load.mcfunction" });
    datapackFiles.push({ path: `data/minecraft/tags/function/load.json`, contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2), kind: "tag", label: "load tag" });
    datapackFiles.push({
      path: `data/${ns}/function/uninstall.mcfunction`,
      contents: [`# Tear down "${config.title}", then delete the datapack.`, ...uninstallLines, `tellraw @a ${JSON.stringify({ text: `${config.title} torn down.`, color: "gray" })}`, ""].join("\n"),
      kind: "function",
      label: "uninstall.mcfunction",
    });
  }

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;
  const sideCars: GeneratedFile[] = [buildBoardText(config), buildBountyDiscord(config), buildBountyChecklist(config, ns, validation), buildBountiesJson(config, slug)];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    bountyCount: allBounties.length,
  };
}
