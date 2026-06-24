import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { QuestConfig } from "./types";

/** Round-trippable Questline config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<QuestConfig>({
  kind: "questline",
  version: 1,
  defaults: (): QuestConfig => ({
    title: "Questline",
    icon: "cobblemon:poke_ball",
    quests: [],
    exportAdvancements: true,
    exportFtb: true,
    packFormat: DEFAULT_VERSION.packFormat,
  }),
});

export const QUEST_PORTABLE_TYPE = portable.type;
export const toPortableQuest = portable.toPortable;
export const fromPortableQuest = portable.fromPortable;
export const normalizeQuestConfig = portable.normalize;
