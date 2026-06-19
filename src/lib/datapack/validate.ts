import type { GeneratedFile } from "./types";
import { DATAPACK_KINDS } from "./types";

/**
 * Pre-export validation. The point is to catch the dumb, world-breaking
 * mistakes *before* the owner uploads and restarts the server — most famously
 * the "LegendaryEncounters" folder issue, where an uppercase or mis-nested
 * folder makes Minecraft silently ignore the whole pack.
 */
export type Severity = "error" | "warning";

export interface ValidationIssue {
  severity: Severity;
  message: string;
  /** File the issue relates to, if any. */
  path?: string;
}

export interface ValidationResult {
  ok: boolean; // false if any error
  issues: ValidationIssue[];
}

export function validateDatapack(files: GeneratedFile[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const datapackFiles = files.filter((f) => DATAPACK_KINDS.has(f.kind));

  // 1. exactly one pack.mcmeta, at the root.
  const metas = datapackFiles.filter((f) => f.path === "pack.mcmeta");
  if (metas.length === 0) {
    issues.push({ severity: "error", message: "Missing pack.mcmeta at the datapack root — Minecraft will ignore the pack." });
  } else if (metas.length > 1) {
    issues.push({ severity: "error", message: "More than one pack.mcmeta." });
  }

  // 2. duplicate paths.
  const seen = new Set<string>();
  for (const f of datapackFiles) {
    if (seen.has(f.path)) {
      issues.push({ severity: "error", message: "Duplicate file path.", path: f.path });
    }
    seen.add(f.path);
  }

  for (const f of datapackFiles) {
    if (f.path === "pack.mcmeta") continue;

    // 3. everything else must live under data/.
    if (!f.path.startsWith("data/")) {
      issues.push({
        severity: "error",
        message: "Datapack files must live under data/ (or be pack.mcmeta).",
        path: f.path,
      });
      continue;
    }

    // 4. THE classic bug: uppercase anywhere in a resource path. Minecraft
    // resource locations are lowercase-only; an uppercase folder name is
    // silently dropped. This is the "LegendaryEncounters" trap.
    if (/[A-Z]/.test(f.path)) {
      issues.push({
        severity: "error",
        message: "Uppercase letters in path — resource locations must be lowercase (this silently breaks loading).",
        path: f.path,
      });
    }

    // 5. illegal characters.
    if (/[^a-z0-9_./-]/.test(f.path)) {
      issues.push({
        severity: "error",
        message: "Illegal character in path — only a-z 0-9 _ . / - are allowed.",
        path: f.path,
      });
    }

    // 6. spawn files must be in the right Cobblemon folder.
    if (f.kind === "spawn" && !/^data\/[a-z0-9_.-]+\/spawn_pool_world\//.test(f.path)) {
      issues.push({
        severity: "warning",
        message: "Cobblemon spawn files should live under data/<namespace>/spawn_pool_world/ or they won't be picked up.",
        path: f.path,
      });
    }

    // 7. JSON must actually parse.
    if (f.path.endsWith(".json")) {
      try {
        JSON.parse(f.contents);
      } catch (e) {
        issues.push({ severity: "error", message: `Invalid JSON: ${(e as Error).message}`, path: f.path });
      }
    }

    // 8a. loot tables: 1.21+ uses the singular "loot_table" folder.
    if (f.kind === "loot-table") {
      if (!/^data\/[a-z0-9_.-]+\/loot_table\//.test(f.path)) {
        issues.push({
          severity: "warning",
          message: "Loot tables should live under data/<namespace>/loot_table/ (1.21 renamed it from 'loot_tables').",
          path: f.path,
        });
      }
    }

    // 8b. advancements: 1.21+ uses the singular "advancement" folder.
    if (f.kind === "advancement") {
      if (!/^data\/[a-z0-9_.-]+\/advancement\//.test(f.path)) {
        issues.push({
          severity: "warning",
          message: "Advancements should live under data/<namespace>/advancement/ (1.21 renamed it from 'advancements').",
          path: f.path,
        });
      }
    }

    // 8. functions: 1.21+ uses the singular "function" folder.
    if (f.kind === "function") {
      if (!f.path.endsWith(".mcfunction")) {
        issues.push({ severity: "error", message: "Function files must end in .mcfunction.", path: f.path });
      }
      if (/\/functions\//.test(f.path)) {
        issues.push({
          severity: "warning",
          message: "1.21+ renamed the folder from 'functions' to 'function'. Double-check your target version.",
          path: f.path,
        });
      }
    }
  }

  return { ok: !issues.some((i) => i.severity === "error"), issues };
}
