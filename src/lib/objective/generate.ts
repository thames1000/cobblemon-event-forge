import type { GeneratedFile } from "../datapack/types";
import type { Objective } from "./types";
import { findTrigger, describeObjective } from "./triggers";
import { compileRewardLines } from "../reward/actions";
import { progObjective } from "../event/lifecycle";

/**
 * Compile objectives into datapack files.
 *
 *  - Every objective with rewards (or an announce) gets a reward function
 *    data/<ns>/function/bounty_<n>.mcfunction.
 *  - `auto` objectives additionally get an invisible advancement
 *    data/<ns>/advancement/bounty_<n>.json whose trigger detects completion and
 *    rewards that function (runs as the completing player).
 *  - `manual` objectives only get the function — the owner runs it by hand.
 *
 * Objectives are one-shot per player (Cobblemon catch/etc. counts are
 * cumulative, so revoke-to-repeat would immediately re-fire). Good for events.
 */
export function buildObjectiveFiles(opts: {
  namespace: string;
  objectives: Objective[];
  packFormat: number;
  /** When set, auto objectives count toward event completion (reward tiers). */
  completion?: { slug: string };
}): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  opts.objectives.forEach((o, i) => {
    const n = i + 1;
    const fnId = `bounty_${n}`;
    const label = describeObjective(o);
    const rewardLines = compileRewardLines(o.rewards, { packFormat: opts.packFormat });
    // auto objectives need a function even with no reward, so completion can count them.
    const tracksCompletion = !!opts.completion && o.mode === "auto";
    const hasFunction = rewardLines.length > 0 || o.announce || tracksCompletion;

    if (hasFunction) {
      const L: string[] = [`# Bounty ${n}: ${label}`];
      if (o.mode === "manual") L.push(`# Manual objective — run against the winner: /execute as <player> run function ${opts.namespace}:${fnId}`);
      if (o.announce) {
        L.push(`# announce the completion server-wide`);
        L.push(`tellraw @a ${JSON.stringify([{ selector: "@s" }, { text: ` completed: ${label}!`, color: "green" }])}`);
      }
      L.push(...rewardLines);
      L.push(`tellraw @s ${JSON.stringify({ text: `Bounty complete — ${label}`, color: "gold" })}`);
      if (tracksCompletion) {
        L.push(`# count toward event completion → reward tiers`);
        L.push(`scoreboard players add @s ${progObjective(opts.completion!.slug)} 1`);
        L.push(`function ${opts.namespace}:check_complete`);
      }
      files.push({
        path: `data/${opts.namespace}/function/${fnId}.mcfunction`,
        contents: L.join("\n") + "\n",
        kind: "function",
        label: `${fnId}.mcfunction`,
      });
    }

    if (o.mode === "auto") {
      const t = findTrigger(o.triggerId);
      if (t) {
        const advancement = {
          criteria: { done: { trigger: t.id, conditions: t.conditions(o) } },
          requirements: [["done"]],
          ...(hasFunction ? { rewards: { function: `${opts.namespace}:${fnId}` } } : {}),
        };
        files.push({
          path: `data/${opts.namespace}/advancement/${fnId}.json`,
          contents: JSON.stringify(advancement, null, 2),
          kind: "advancement",
          label: `${fnId} advancement`,
        });
      }
    }
  });

  return files;
}
