import type { GeneratedFile } from "../datapack/types";
import type { CompletionWiring } from "./lifecycle";
import { EVENT_OBJECTIVE, progObjective, wonObjective, champFlag } from "./lifecycle";

/**
 * The completion check (`check_complete.mcfunction`) that turns finished
 * objectives into auto-granted reward tiers.
 *
 * Each auto objective's reward function (see objective/generate.ts) bumps the
 * per-player progress score and then calls this function — AS the completing
 * player. When the player has finished every auto objective we grant the
 * completion tiers exactly once:
 *
 *   - Winner tiers ("completion-each") fire for every player who completes.
 *   - Champion tiers ("completion-first") fire only for the FIRST player
 *     server-wide, guarded by a shared fake-player flag.
 *
 * A `won` marker stops a player being awarded twice and lets teardown tell
 * completers apart from mere participants. Reward functions run at world spawn,
 * not the player's position — but the tier functions they call already wrap
 * their spawns in `execute at @s`, so legendary/Pokémon spawn rewards land on
 * the player just like the per-objective ones do.
 */
export function buildCompletionFiles(opts: {
  namespace: string;
  slug: string;
  title: string;
  completion: CompletionWiring;
}): GeneratedFile[] {
  const { namespace: ns, slug, title, completion: c } = opts;
  const prog = progObjective(slug);
  const won = wonObjective(slug);

  const L: string[] = [
    `# Completion check — runs (as the player) after each auto objective is done.`,
    `# Grants the completion reward tiers once all ${c.total} objective(s) are finished.`,
    `execute unless score @s ${prog} matches ${c.total}.. run return 0`,
    `execute if score @s ${won} matches 1 run return 0`,
    `scoreboard players set @s ${won} 1`,
  ];

  if (c.winnerFns.length) {
    L.push(`# Winner: every player who completes the challenge.`);
    for (const fn of c.winnerFns) L.push(`function ${ns}:${fn}`);
  }

  if (c.championFns.length) {
    const champ = champFlag(slug);
    L.push(`# Champion: only the FIRST player server-wide to complete.`);
    L.push(`execute if score ${champ} ${EVENT_OBJECTIVE} matches 1 run return 0`);
    L.push(`scoreboard players set ${champ} ${EVENT_OBJECTIVE} 1`);
    // @s is the finisher; the selector resolves to their name for everyone.
    const announce = JSON.stringify([
      { text: "🏆 ", color: "gold" },
      { selector: "@s", color: "yellow" },
      { text: ` is the Champion of ${title}!`, color: "gold" },
    ]);
    L.push(`tellraw @a ${announce}`);
    for (const fn of c.championFns) L.push(`function ${ns}:${fn}`);
  }

  return [
    {
      path: `data/${ns}/function/check_complete.mcfunction`,
      contents: L.join("\n") + "\n",
      kind: "function",
      label: "check_complete.mcfunction",
    },
  ];
}
