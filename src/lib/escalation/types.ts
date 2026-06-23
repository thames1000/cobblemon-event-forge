import type { PokeType } from "../catalog/pokemon";
import type { RewardAction } from "../reward/actions";

/**
 * Event Escalation Stages — a server-wide, multi-phase event that plays out like
 * a story instead of a checklist. The WHOLE server contributes toward the
 * current stage's goal; when the goal is met the event escalates: the next
 * stage's announcement fires, its effects (spawn bursts, rewards, commands)
 * apply to everyone online, and the bar resets for the next goal. The final
 * stage is terminal (its goal is ignored) — reaching it ends the story.
 *
 * Tick-free: a global stage counter + count-less, self-re-arming Cobblemon
 * advancements that only tally while their stage is the active one.
 */
export interface EscalationStage {
  id: string;
  /** Admin label, e.g. "Catch 25 Ghost-types". */
  label: string;
  /** Server message shown when this stage is ENTERED ("" = none). */
  announce: string;
  /** Show the announcement as a big on-screen title (for the dramatic beats). */
  bigTitle: boolean;
  /** Applied to every online player when this stage is entered (spawn burst, items, commands). */
  effects: RewardAction[];
  /** Cobblemon trigger that counts toward COMPLETING this stage (ignored on the final stage). */
  goalTrigger: string;
  /** Server-wide total needed to advance to the next stage. */
  goalCount: number;
  /** Type filter for catch goals. */
  goalType: PokeType | "any";
}

export interface EscalationConfig {
  title: string;
  blurb: string;
  stages: EscalationStage[];
  /** Show a server-wide boss bar tracking progress toward the current stage's goal. */
  progressBar: boolean;
  packFormat: number;
}

export function newStage(id: string, partial?: Partial<EscalationStage>): EscalationStage {
  return {
    id,
    label: "New stage",
    announce: "",
    bigTitle: false,
    effects: [],
    goalTrigger: "cobblemon:catch_pokemon",
    goalCount: 25,
    goalType: "any",
    ...partial,
  };
}

export function newEscalationConfig(packFormat: number): EscalationConfig {
  return {
    title: "The Haunting",
    blurb: "A Ghost-type surge builds toward something far worse…",
    progressBar: true,
    stages: [
      newStage("s1", { label: "The surge begins", announce: "👻 Ghost-types are stirring server-wide — catch 25 to draw them out!", goalTrigger: "cobblemon:catch_pokemon", goalCount: 25, goalType: "ghost" }),
      newStage("s2", {
        label: "Rarer spirits emerge",
        announce: "The veil thins — rarer Ghost-types now roam. Keep hunting!",
        effects: [{ kind: "spawn", species: "gastly", level: 30 }],
        goalTrigger: "cobblemon:catch_pokemon",
        goalCount: 20,
        goalType: "ghost",
      }),
      newStage("s3", { label: "The challenge", announce: "Prove yourselves — win 15 battles to break the seal.", goalTrigger: "cobblemon:battles_won", goalCount: 15, goalType: "any" }),
      newStage("s4", {
        label: "The Reaper awakens",
        announce: "💀 IT IS HERE.",
        bigTitle: true,
        effects: [
          { kind: "spawn", species: "gengar", level: 70 },
          { kind: "item", itemId: "cobblemon:rare_candy", count: 10 },
        ],
        goalTrigger: "cobblemon:catch_pokemon",
        goalCount: 1,
        goalType: "any",
      }),
    ],
    packFormat,
  };
}
