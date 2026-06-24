import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import { newEscalationConfig } from "./types";
import type { EscalationConfig } from "./types";

/** Round-trippable Escalation Stages config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<EscalationConfig>({
  kind: "escalation",
  version: 1,
  defaults: () => newEscalationConfig(DEFAULT_VERSION.packFormat),
});

export const ESCALATION_PORTABLE_TYPE = portable.type;
export const toPortableEscalation = portable.toPortable;
export const fromPortableEscalation = portable.fromPortable;
export const normalizeEscalationConfig = portable.normalize;
