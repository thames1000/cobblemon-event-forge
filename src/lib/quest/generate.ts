import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { Quest, QuestConfig, QuestTask } from "./types";
import { toId, toNamespace } from "../datapack/sanitize";
import { buildPackMeta } from "../datapack/packMeta";
import { validateDatapack } from "../datapack/validate";
import { compileRewardLines, describeReward } from "../reward/actions";
import { findTrigger, describeObjective } from "../objective/triggers";
import { newObjective } from "../objective/types";
import type { RewardAction } from "../reward/actions";

export interface QuestGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
  questCount: number;
}

const withNs = (item: string) => (item.includes(":") ? item : `minecraft:${item}`);

/** The advancement criterion that detects a task's completion (vanilla + FTB bridge share this). */
function criteriaFor(task: QuestTask): { trigger: string; conditions: Record<string, unknown> } {
  switch (task.kind) {
    case "objective": {
      const o = newObjective("q", { triggerId: task.triggerId, count: task.count, pokemonType: task.pokemonType, species: task.species, level: task.level });
      return { trigger: task.triggerId, conditions: findTrigger(task.triggerId)?.conditions(o) ?? { count: task.count } };
    }
    case "item":
      return { trigger: "minecraft:inventory_changed", conditions: { items: [{ items: withNs(task.itemId), count: { min: Math.max(1, Math.round(task.itemCount)) } }] } };
    case "location":
      return { trigger: "minecraft:changed_dimension", conditions: { to: task.dimension } };
    case "manual":
      return { trigger: "minecraft:impossible", conditions: {} };
  }
}

/** Human-readable one-liner for a task (sheets + FTB checkmark titles). */
function describeTask(task: QuestTask): string {
  switch (task.kind) {
    case "objective":
      return describeObjective(newObjective("q", { mode: "auto", triggerId: task.triggerId, count: task.count, pokemonType: task.pokemonType, species: task.species, level: task.level }));
    case "item":
      return `Obtain ${task.itemCount}× ${withNs(task.itemId)}`;
    case "location":
      return `Reach ${task.dimension}`;
    case "manual":
      return "Complete this step";
  }
}

// ---------- vanilla advancement tree ----------

function buildAdvancementTree(config: QuestConfig, ns: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  // Root: an auto-granted advancement that anchors the tab (gives the tree a background).
  files.push({
    path: `data/${ns}/advancement/root.json`,
    contents: JSON.stringify(
      {
        display: {
          icon: { id: withNs(config.icon || "minecraft:book") },
          title: config.title,
          description: "Questline",
          frame: "task",
          background: "minecraft:textures/gui/advancements/backgrounds/adventure.png",
          show_toast: false,
          announce_to_chat: false,
        },
        criteria: { auto: { trigger: "minecraft:tick" } },
        requirements: [["auto"]],
      },
      null,
      2,
    ),
    kind: "advancement",
    label: "questline root",
  });

  for (const q of config.quests) {
    const { trigger, conditions } = criteriaFor(q.task);
    const parent = q.dependencies.length ? `${ns}:q_${toId(q.dependencies[0])}` : `${ns}:root`;
    files.push({
      path: `data/${ns}/advancement/q_${toId(q.id)}.json`,
      contents: JSON.stringify(
        {
          display: {
            icon: { id: withNs(q.icon || "cobblemon:poke_ball") },
            title: q.title,
            description: q.description.join(" ") || describeTask(q.task),
            frame: "task",
            show_toast: true,
            announce_to_chat: false,
          },
          parent,
          criteria: { done: { trigger, conditions } },
          requirements: [["done"]],
          rewards: { function: `${ns}:q_${toId(q.id)}_reward` },
        },
        null,
        2,
      ),
      kind: "advancement",
      label: `${q.title} advancement`,
    });
    files.push({
      path: `data/${ns}/function/q_${toId(q.id)}_reward.mcfunction`,
      contents: [
        `# Quest complete: ${q.title}`,
        `tellraw @s ${JSON.stringify([{ text: "✔ Quest complete: ", color: "green" }, { text: q.title, color: "gold" }])}`,
        ...compileRewardLines(q.rewards, { packFormat: config.packFormat }),
        "",
      ].join("\n"),
      kind: "function",
      label: `q_${toId(q.id)}_reward.mcfunction`,
    });
  }
  return files;
}

// ---------- FTB Quests chapter (.snbt) + bridge advancements ----------

function hashHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
const snbtStr = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function buildFtb(config: QuestConfig, ns: string, slug: string): GeneratedFile[] {
  const base = hashHex(slug);
  let seq = 1;
  const hex = () => (base + (seq++).toString(16).padStart(8, "0")).toUpperCase();
  const questHex = new Map<string, string>();
  config.quests.forEach((q) => questHex.set(q.id, hex()));

  const files: GeneratedFile[] = [];
  const T = "\t";

  const ftbTask = (q: Quest): string => {
    const id = snbtStr(hex());
    switch (q.task.kind) {
      case "objective":
        // Bridge through a generated advancement (only needs FTB Quests, not the Cobblemon-Quests addon).
        return `{ advancement: ${snbtStr(`${ns}:fq_${toId(q.id)}`)} criterion: "" id: ${id} type: "advancement" }`;
      case "item":
        return `{ count: ${Math.max(1, Math.round(q.task.itemCount))} id: ${id} item: ${snbtStr(withNs(q.task.itemId))} type: "item" }`;
      case "location":
        return `{ dimension: ${snbtStr(q.task.dimension)} id: ${id} type: "dimension" }`;
      case "manual":
        return `{ id: ${id} title: ${snbtStr(describeTask(q.task))} type: "checkmark" }`;
    }
  };
  const ftbRewards = (q: Quest): string[] =>
    q.rewards.flatMap((r: RewardAction) => {
      const id = snbtStr(hex());
      if (r.kind === "item") return [`{ count: ${Math.max(1, Math.round(r.count))} id: ${id} item: ${snbtStr(withNs(r.itemId))} type: "item" }`];
      // spawn / crate-key / raw command → FTB command rewards (one per emitted line).
      return compileRewardLines([r], { packFormat: config.packFormat }).map((cmd) => `{ command: ${snbtStr("/" + cmd)} id: ${snbtStr(hex())} player_command: false title: ${snbtStr(describeReward(r))} type: "command" }`);
    });

  const questBlocks = config.quests.map((q) => {
    const deps = q.dependencies.map((d) => questHex.get(d)).filter(Boolean) as string[];
    const rewards = ftbRewards(q);
    const lines = [
      `${T}${T}{`,
      ...(deps.length ? [`${T}${T}${T}dependencies: [${deps.map((d) => snbtStr(d)).join(", ")}]`] : []),
      ...(q.description.length ? [`${T}${T}${T}description: [${q.description.map(snbtStr).join(", ")}]`] : []),
      `${T}${T}${T}icon: ${snbtStr(withNs(q.icon || "cobblemon:poke_ball"))}`,
      `${T}${T}${T}id: ${snbtStr(questHex.get(q.id)!)}`,
      ...(rewards.length ? [`${T}${T}${T}rewards: [${rewards.join(", ")}]`] : []),
      `${T}${T}${T}tasks: [${ftbTask(q)}]`,
      `${T}${T}${T}title: ${snbtStr(q.title)}`,
      `${T}${T}${T}x: ${q.x.toFixed(1)}d`,
      `${T}${T}${T}y: ${q.y.toFixed(1)}d`,
      `${T}${T}}`,
    ];
    return lines.join("\n");
  });

  const chapter = [
    `{`,
    `${T}default_hide_dependency_lines: false`,
    `${T}default_quest_shape: ""`,
    `${T}filename: ${snbtStr(slug)}`,
    `${T}group: ""`,
    `${T}icon: ${snbtStr(withNs(config.icon || "minecraft:book"))}`,
    `${T}id: ${snbtStr((base + "00000000").toUpperCase())}`,
    `${T}order_index: 0`,
    `${T}quest_links: [ ]`,
    `${T}quests: [`,
    questBlocks.join("\n"),
    `${T}]`,
    `${T}title: ${snbtStr(config.title)}`,
    `}`,
    "",
  ].join("\n");
  files.push({ path: `config/ftbquests/quests/chapters/${slug}.snbt`, contents: chapter, kind: "readme", label: "FTB chapter (.snbt)" });

  // Silent bridge advancements (criteria only) for objective tasks, so the FTB advancement
  // tasks have something to detect. FTB hands out the rewards itself.
  for (const q of config.quests) {
    if (q.task.kind !== "objective") continue;
    const { trigger, conditions } = criteriaFor(q.task);
    files.push({
      path: `data/${ns}/advancement/fq_${toId(q.id)}.json`,
      contents: JSON.stringify({ criteria: { done: { trigger, conditions } }, requirements: [["done"]] }, null, 2),
      kind: "advancement",
      label: `${q.title} FTB bridge advancement`,
    });
  }
  return files;
}

// ---------- side-cars ----------

function buildQuestText(config: QuestConfig): GeneratedFile {
  const L: string[] = [`${config.title} — QUESTLINE`, ""];
  const byId = new Map(config.quests.map((q) => [q.id, q]));
  for (const q of config.quests) {
    const deps = q.dependencies.map((d) => byId.get(d)?.title ?? d);
    L.push(`• ${q.title}${deps.length ? `   (after: ${deps.join(", ")})` : "   (start)"}`);
    if (q.description.length) for (const d of q.description) L.push(`    ${d}`);
    L.push(`    Task: ${describeTask(q.task)}`);
    L.push(`    Reward: ${q.rewards.length ? q.rewards.map(describeReward).join(", ") : "—"}`);
    L.push("");
  }
  return { path: "questline.txt", contents: L.join("\n") + "\n", kind: "readme", label: "questline text" };
}

function buildChecklist(config: QuestConfig, ns: string, slug: string, validation: ValidationResult): GeneratedFile {
  const L: string[] = [`${config.title} — ADMIN CHECKLIST`, ""];
  L.push(`Validator: ${validation.ok ? "OK ✓" : `${validation.issues.length} issue(s)`}`);
  L.push("");
  L.push("⚠ Install ONE quest system — not both — or rewards fire twice.");
  L.push("");
  if (config.exportAdvancements) {
    L.push("VANILLA ADVANCEMENT TREE (no mod):");
    L.push(`  - Drop the datapack into <world>/datapacks/ and /reload. The questline appears`);
    L.push(`    in the Advancements screen (${ns}:root tab). Each step rewards via a function.`);
    L.push(`  - Manual steps use an impossible criterion — grant them yourself:`);
    L.push(`    /advancement grant <player> only ${ns}:q_<id>`);
    L.push("");
  }
  if (config.exportFtb) {
    L.push("FTB QUESTS CHAPTER (needs the FTB Quests mod):");
    L.push(`  - Put config/ftbquests/quests/chapters/${slug}.snbt into the world/instance.`);
    L.push(`  - Also install the datapack: its fq_<id> advancements back the Cobblemon`);
    L.push(`    (catch/battle) tasks (FTB has no native Cobblemon task without an addon).`);
    L.push(`  - FTB hands out the quest rewards. Verify the import in-game — FTB Quests SNBT`);
    L.push(`    is version-sensitive (built against the 1.21 format).`);
    L.push("");
  }
  return { path: "admin_checklist.txt", contents: L.join("\n") + "\n", kind: "checklist", label: "admin checklist" };
}

export function generateQuestline(config: QuestConfig): QuestGenerateResult {
  const slug = toId(config.title || "questline");
  const ns = toNamespace(config.title || "owner_quests");

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — Questline, generated by Cobbleverse Event Forge`, packFormat: config.packFormat }),
  ];
  if (config.exportAdvancements) datapackFiles.push(...buildAdvancementTree(config, ns));

  const sideCars: GeneratedFile[] = [];
  if (config.exportFtb) {
    const ftb = buildFtb(config, ns, slug);
    for (const f of ftb) (f.kind === "advancement" ? datapackFiles : sideCars).push(f);
  }

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;
  sideCars.push(buildQuestText(config), buildChecklist(config, ns, slug, validation));

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
    questCount: config.quests.length,
  };
}
