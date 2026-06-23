/**
 * Safe Teleport / Rescue helper — a standalone "travel" datapack for moving
 * players between an overworld hub and an event destination (an arena, a build,
 * a Resource World dimension…) without the desync, fall damage, or
 * fell-through-unloaded-chunks problems you hit doing it by hand.
 *
 * It generates travel/enter, travel/exit and travel/rescue, gives arrival
 * protection effects, optionally force-loads the destination pad so it's always
 * generated before anyone lands on it, and can hand out a right-click travel item.
 * Tick-free.
 */

export interface ArrivalEffects {
  slowFalling: boolean;
  resistance: boolean;
  /** Effect duration in seconds. */
  seconds: number;
}

export interface TravelConfig {
  title: string;
  // --- destination ---
  destDimension: string;
  destX: number;
  destY: number;
  destZ: number;
  /** Scatter arrivals around the pad (spreadplayers) instead of stacking on the exact spot. */
  spread: boolean;
  spreadRadius: number;
  // --- return / rescue anchor ---
  /** "capture": remember where each player came from and send them back there.
   *  "fixed":   always return to the home coordinates below. */
  returnMode: "capture" | "fixed";
  /** Home/rescue dimension + pad — the guaranteed-safe spot rescue always uses, and
   *  the return point in "fixed" mode. */
  homeDimension: string;
  homeX: number;
  homeY: number;
  homeZ: number;
  // --- safety ---
  arrival: ArrivalEffects;
  /** Force-load the destination pad chunk so it's always generated/loaded. */
  forceload: boolean;
  // --- entry item ---
  giveTravelItem: boolean;
  travelItemBase: string;
  packFormat: number;
}

export function newTravelConfig(packFormat: number): TravelConfig {
  return {
    title: "Event Travel",
    destDimension: "minecraft:overworld",
    destX: 0,
    destY: 100,
    destZ: 0,
    spread: false,
    spreadRadius: 8,
    returnMode: "capture",
    homeDimension: "minecraft:overworld",
    homeX: 0,
    homeY: 100,
    homeZ: 0,
    arrival: { slowFalling: true, resistance: true, seconds: 10 },
    forceload: true,
    giveTravelItem: true,
    travelItemBase: "minecraft:compass",
    packFormat,
  };
}
