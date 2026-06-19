import { keyGiveCommand } from "../crate/usableKey";
import { findReward } from "../catalog/items";
import { findSpecies } from "../catalog/pokemon";
import { toId } from "../datapack/sanitize";

/**
 * The customizable reward palette. A reward is a list of `RewardAction`s; the
 * compiler turns them into `.mcfunction` lines that run as the player (`@s`).
 * This is shared by event objectives (and can back any future reward surface).
 */
export type RewardAction =
  | { kind: "item"; itemId: string; count: number }
  | { kind: "spawn"; species: string; level: number }
  | { kind: "crate-key"; crateName: string; baseItem: string; glint: boolean }
  | { kind: "command"; command: string };

export const REWARD_KINDS: { kind: RewardAction["kind"]; label: string }[] = [
  { kind: "item", label: "Give item" },
  { kind: "crate-key", label: "Give crate key" },
  { kind: "spawn", label: "Spawn Pokémon" },
  { kind: "command", label: "Raw command" },
];

/** A fresh action of the given kind, with sensible defaults. */
export function newRewardAction(kind: RewardAction["kind"]): RewardAction {
  switch (kind) {
    case "item":
      return { kind, itemId: "cobblemon:rare_candy", count: 1 };
    case "spawn":
      return { kind, species: "", level: 50 };
    case "crate-key":
      return { kind, crateName: "", baseItem: "minecraft:nether_star", glint: true };
    case "command":
      return { kind, command: "" };
  }
}

/** Compile reward actions into mcfunction command lines (no leading slash). */
export function compileRewardLines(actions: RewardAction[], opts: { packFormat: number }): string[] {
  const lines: string[] = [];
  for (const a of actions) {
    switch (a.kind) {
      case "item": {
        if (!a.itemId.trim()) break;
        const id = a.itemId.includes(":") ? a.itemId : `minecraft:${a.itemId}`;
        lines.push(`give @s ${id} ${Math.max(1, Math.round(a.count))}`);
        break;
      }
      case "spawn": {
        if (!a.species.trim()) break;
        lines.push(`spawnpokemon ${toId(a.species)} level=${Math.max(1, Math.round(a.level))}`);
        break;
      }
      case "crate-key": {
        if (!a.crateName.trim()) break;
        lines.push(
          keyGiveCommand({
            namespace: "",
            slug: toId(a.crateName),
            title: a.crateName,
            key: { enabled: true, baseItem: a.baseItem, glint: a.glint, lore: "Right-click & hold to open", consumeSeconds: 0.6 },
            packFormat: opts.packFormat,
          }),
        );
        break;
      }
      case "command": {
        if (a.command.trim()) lines.push(a.command.trim().replace(/^\//, ""));
        break;
      }
    }
  }
  return lines;
}

/** Short human label for a reward action (Discord / previews). */
export function describeReward(a: RewardAction): string {
  switch (a.kind) {
    case "item": {
      const name = findReward(a.itemId)?.name ?? a.itemId.split(":").pop() ?? a.itemId;
      return a.count > 1 ? `${name} ×${a.count}` : name;
    }
    case "spawn":
      return `Spawn ${findSpecies(toId(a.species))?.name ?? (a.species || "Pokémon")} (Lv.${a.level})`;
    case "crate-key":
      return `${a.crateName || "Crate"} key`;
    case "command":
      return "Custom command";
  }
}
