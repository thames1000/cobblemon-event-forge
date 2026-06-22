import { ALL_TYPES } from "../catalog/pokemon";
import { TRIGGERS } from "../objective/triggers";
import { newObjective } from "../objective/types";
import type { Objective } from "../objective/types";
import type { RewardAction } from "../reward/actions";

/**
 * A bingo board is a square grid of objectives (cells). Each non-free cell
 * compiles to a Cobblemon advancement; completing a full row / column /
 * diagonal triggers the bingo reward. See bingo/generate.ts.
 */
export interface BingoConfig {
  title: string;
  size: number; // 3, 4 or 5
  freeCenter: boolean;
  cells: Objective[]; // length size*size
  bingoReward: RewardAction[];
  blackoutReward: RewardAction[];
  packFormat: number;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Index of the free centre cell, or -1 if there isn't one. */
export function centerIndex(size: number, freeCenter: boolean): number {
  return freeCenter && size % 2 === 1 ? (size * size - 1) / 2 : -1;
}

/** A random auto objective for one cell (no per-cell reward — the line pays out). */
export function randomCell(id: string): Objective {
  const t = pick(TRIGGERS);
  const o = newObjective(id, { mode: "auto", triggerId: t.id });
  if (t.usesLevel) o.level = randInt(30, 70);
  else o.count = t.id === "cobblemon:catch_shiny_pokemon" ? randInt(1, 2) : randInt(5, 20);
  if (t.usesType && Math.random() < 0.7) o.pokemonType = pick(ALL_TYPES);
  return o;
}

/** Build a fresh randomized board. */
export function randomBoard(size: number, freeCenter: boolean): Objective[] {
  const center = centerIndex(size, freeCenter);
  return Array.from({ length: size * size }, (_, i) =>
    i === center ? newObjective(`cell_${i}`, { mode: "manual", label: "FREE" }) : randomCell(`cell_${i}`),
  );
}

export function newBingoConfig(packFormat: number): BingoConfig {
  return {
    title: "Weekend Bingo",
    size: 5,
    freeCenter: true,
    cells: randomBoard(5, true),
    bingoReward: [
      { kind: "item", itemId: "cobblemon:rare_candy", count: 5 },
      { kind: "crate-key", crateName: "Bingo Crate", baseItem: "minecraft:nether_star", glint: true },
    ],
    blackoutReward: [{ kind: "item", itemId: "obc:bottle_cap_gold", count: 1 }],
    packFormat,
  };
}

/**
 * All winning lines as arrays of cell indices (rows, columns, both diagonals),
 * with the free centre removed.
 */
export function bingoLines(size: number, center: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return lines.map((line) => line.filter((i) => i !== center)).filter((line) => line.length > 0);
}
