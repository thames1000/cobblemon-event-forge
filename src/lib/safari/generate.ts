import type { Bundle, GeneratedFile } from "../datapack/types";
import type { ValidationResult } from "../datapack/validate";
import type { FeaturedMon } from "../event/types";
import type { SafariConfig } from "./types";
import { buildPackMeta } from "../datapack/packMeta";
import { buildSpawnFiles } from "../datapack/spawns";
import { validateDatapack } from "../datapack/validate";
import { usableGiveCommand, consumeAdvancement } from "../datapack/usableItem";
import { compileRewardLines } from "../reward/actions";
import { buildRulesBoard, buildNpcDialogue, buildSignText, buildSafariDiscord, buildSafariChecklist } from "./text";
import { BIOME_LOOKS } from "./vanillaBiomeLooks";

export interface SafariGenerateResult {
  bundle: Bundle;
  validation: ValidationResult;
  datapackFileName: string;
}

const SAFARI_DATA_KEY = "safari";
const TIMER_OBJ = "safari_time";
// Scratch objective for the minutes/seconds math that builds the "M:SS" timer text.
const CALC_OBJ = "safari_calc";
// Per-player capture of where a player entered from, so they return there on exit.
const RET_X = "safari_ret_x";
const RET_Y = "safari_ret_y";
const RET_Z = "safari_ret_z";
// Blocks safari mons may spawn ON (neededBaseBlocks). Covers every arena surface —
// crucially ICE & SNOW — so water mons spawn on a frozen lake instead of needing open
// water, and land mons spawn on dirt/stone/sand/terracotta across the other themes.
const SAFARI_GROUND_BLOCKS = [
  "#minecraft:dirt",
  "#minecraft:base_stone_overworld",
  "#minecraft:sand",
  "#minecraft:ice",
  "#minecraft:snow",
  "minecraft:gravel",
  "minecraft:terracotta",
  "minecraft:orange_terracotta",
  "minecraft:red_terracotta",
];
// Per-VISIT catch counter for the reward bounty (reset on entry, so the bounty is
// earnable again each visit instead of being a one-shot lifetime milestone).
const CAUGHT_OBJ = "safari_caught";
// Fixed datapack identity shared by every theme (see generateSafari for why).
const SAFARI_ID = "safari_zone";

/** Build the tiered featured-mon list (common / rare / ultra-rare). */
function tieredFeatured(config: SafariConfig): FeaturedMon[] {
  const tiers: [string[], FeaturedMon["bucket"], number, string][] = [
    [config.common, "common", 50, "10-30"],
    [config.rare, "rare", 8, "20-40"],
    [config.ultraRare, "ultra-rare", 1, "30-55"],
  ];
  return tiers.flatMap(([list, bucket, weight, level]) =>
    list.filter((s) => s.trim()).map((species) => ({ species, bucket, weight, level })),
  );
}

export function generateSafari(config: SafariConfig): SafariGenerateResult {
  // FIXED identity for every Safari pack. The theme only changes the look, spawns
  // and text — the namespace, arena dimension (safari_zone:zone), resource world,
  // functions, tags and the zip name are ALWAYS "safari_zone". That way the Safari
  // Catch Boost mod (which targets `safari_zone:zone`) never needs reconfiguring per
  // theme: run one Safari at a time, swapping out safari_zone.zip.
  const slug = SAFARI_ID;
  const ns = SAFARI_ID;

  // On-screen countdown via the vanilla action bar (no client mod). Defaults on.
  const showBar = config.timer.enabled && config.timer.hud !== false;
  // Optional "leave early" item: a one-use consumable that runs an exit function
  // via an advancement reward — so it works for a NON-OP player (reward functions
  // run at permission level 2). Only meaningful when there's something to leave
  // (a separate arena to return from, or a countdown to end).
  const leaveItem = "minecraft:clock";
  const leaveValue = `${slug}_leave`;
  const leaveOn = config.leaveEarly !== false && config.ticket.enabled && (config.arena.enabled || config.timer.enabled);
  const leaveSpec = {
    baseItem: leaveItem,
    name: `Leave ${config.title}`,
    nameColor: "red",
    lore: "Right-click & hold to leave early",
    glint: false,
    consumeSeconds: 0.6,
    dataKey: SAFARI_DATA_KEY,
    dataValue: leaveValue,
    packFormat: config.packFormat,
  };
  // Steps every exit runs (shared by the timer's auto-home and the leave item):
  // remove the inzone tag, return the player home, stop the countdown, and take back
  // the leave item so it can never be carried out of the zone and misused.
  const teardownLines = [
    `tag @s remove ${slug}_inzone`,
    ...(config.arena.enabled ? [`function ${ns}:return_${slug}`] : []),
    ...(config.timer.enabled ? [`scoreboard players reset @s ${TIMER_OBJ}`] : []),
    ...(leaveOn ? [`clear @s ${leaveItem}[minecraft:custom_data={${SAFARI_DATA_KEY}:"${leaveValue}"}]`] : []),
    // On exit, zero the per-visit catch counter so the next visit starts fresh.
    ...(config.reward.enabled ? [`scoreboard players reset @s ${CAUGHT_OBJ}`] : []),
  ];

  // Exclusive spawns: the arena gets its own custom biome that no default Cobblemon
  // spawn references, and the featured Pokémon are conditioned to THAT biome — so the
  // selected mons are the only things that spawn there (instead of a slight addition
  // to the vanilla biome's defaults). Only possible with a (single-biome) arena.
  const exclusive = config.arena.enabled && config.arena.exclusive !== false;
  const arenaBiomeId = `${ns}:zone_biome`;
  // The resource-world dimension players actually enter. For EXCLUSIVE arenas we gate
  // the featured spawns on this DIMENSION rather than the custom biome — the biome id
  // doesn't reliably survive the mod's mirror, but the dimension id always matches.
  const rwDim = `resource_world:${slug}`;

  const datapackFiles: GeneratedFile[] = [
    buildPackMeta({ description: `${config.title} — Safari Zone, generated by Cobbleverse Event Forge`, packFormat: config.packFormat }),
    ...buildSpawnFiles({
      namespace: ns,
      eventSlug: slug,
      // Featured spawns are intentionally UNGATED by biome or weather — they appear in
      // any biome and in any weather, always. When there's an arena they're confined to
      // it via the dimension; with no arena they can spawn anywhere.
      weather: "any",
      featured: tieredFeatured(config),
      // Water mons spawn on the walkable surface (not open water) so they're catchable
      // on foot even on a frozen lake...
      aquaticContext: "grounded",
      // ...and they're allowed to stand on the actual arena blocks (ice/snow/etc.),
      // which the default "natural" preset excludes.
      baseBlocks: SAFARI_GROUND_BLOCKS,
      ...(config.arena.enabled ? { dimensions: [rwDim] } : {}),
    }),
  ];

  // commands collected for the (optional) load + uninstall functions
  const loadLines: string[] = [];
  const uninstallLines: string[] = [];

  // --- arena dimension (datapack-defined; entered with vanilla teleports) ---
  // We deliberately do NOT use the Resource World mod: its tp/home commands only
  // work when typed live, not when a datapack function runs them, so a ticket could
  // never warp players in. Instead we define a standalone dimension here and move
  // players with vanilla `execute in <dim> run …`, which runs fine from a function
  // at permission level 2 and (because the dimension exists at login) avoids the
  // client desync. The dimension only registers after a FULL SERVER RESTART
  // (datapack dimensions do NOT load on /reload).
  if (config.arena.enabled) {
    const singleBiome = config.arena.mode === "single-biome";
    const biome = config.arena.biome.trim() || "minecraft:plains";
    // :zone (data/<ns>/dimension/zone.json) is the TEMPLATE that the Resource World
    // mod mirrors (so it carries the exclusive biome). Players actually enter the
    // resource-world dimension (rwDim, defined above), which the mod can REGENERATE
    // live — vanilla can't reset a dimension without a restart.
    // Exclusive mode fills the whole arena with our custom biome (so only the safari's
    // Pokémon spawn). Otherwise: single-biome → the chosen vanilla biome; mirror → a
    // normal multi-biome overworld.
    const biomeSource = exclusive
      ? { type: "minecraft:fixed", biome: arenaBiomeId }
      : singleBiome
        ? { type: "minecraft:fixed", biome }
        : { type: "minecraft:multi_noise", preset: "minecraft:overworld" };
    datapackFiles.push({
      path: `data/${ns}/dimension/zone.json`,
      contents: JSON.stringify(
        {
          type: "minecraft:overworld",
          generator: { type: "minecraft:noise", settings: "minecraft:overworld", biome_source: biomeSource },
        },
        null,
        2,
      ),
      kind: "dimension",
      label: "arena dimension",
    });
    // The custom arena biome COPIES the look (effects, trees/plants, climate) of the
    // chosen vanilla biome, but carries NO Cobblemon biome tags (so no default Cobblemon
    // spawns apply) and EMPTY vanilla spawners (no zombies/animals). Result: it looks
    // like the themed biome while only the selected Pokémon spawn there.
    // Caveat: ground/surface blocks come from the dimension's surface rules (keyed to
    // vanilla biome ids), so special-floor biomes (badlands/peaks) keep a grass floor.
    if (exclusive) {
      const look = BIOME_LOOKS[biome] ?? BIOME_LOOKS["minecraft:plains"];
      // Weather-themed safaris need precipitation enabled or their isRaining/isThundering
      // spawn conditions can never fire — force it on for those, else keep the copy's value.
      const needsPrecip = config.weather === "rain" || config.weather === "thunder";
      const arenaBiomeJson = {
        ...look,
        has_precipitation: needsPrecip ? true : (look.has_precipitation ?? false),
        // every vanilla spawn category empty → no hostile or passive mobs in the arena
        spawners: {
          monster: [],
          creature: [],
          ambient: [],
          axolotls: [],
          underground_water_creature: [],
          water_creature: [],
          water_ambient: [],
          misc: [],
        },
        spawn_costs: {},
      };
      datapackFiles.push({
        path: `data/${ns}/worldgen/biome/zone_biome.json`,
        contents: JSON.stringify(arenaBiomeJson, null, 2),
        kind: "worldgen",
        label: "arena biome (exclusive)",
      });
    }
    // Per-player return point — captured on entry so each player goes back to their
    // OWN spot, never a shared one.
    loadLines.push(
      `scoreboard objectives add ${RET_X} dummy`,
      `scoreboard objectives add ${RET_Y} dummy`,
      `scoreboard objectives add ${RET_Z} dummy`,
    );
    uninstallLines.push(
      `scoreboard players reset @a ${RET_X}`,
      `scoreboard players reset @a ${RET_Y}`,
      `scoreboard players reset @a ${RET_Z}`,
      `tag @a remove ${slug}_inzone`,
      `# delete the resource world (run twice — delete needs confirmation)`,
      `resourceworld delete ${slug}`,
      `resourceworld delete ${slug}`,
    );
    // Warp IN: drop ONLY this player (@s) on a safe surface within 200 blocks of
    // (0,0) in the arena dimension. Pure vanilla, so it runs from the ticket's
    // reward function with no mod command and no op level needed.
    datapackFiles.push({
      path: `data/${ns}/function/warp_${slug}.mcfunction`,
      contents: [
        `# Warp one player (@s) into the resource-world arena. Vanilla tp, so it runs from`,
        `# the ticket reward with no mod command / op level. (Tagged inzone in enter.)`,
        `execute in ${rwDim} run spreadplayers 0 0 1 200 false @s`,
        "",
      ].join("\n"),
      kind: "function",
      label: "warp.mcfunction",
    });
    // Warp BACK: return the player to exactly where they entered from (captured into
    // the scoreboard on entry). Copied per-player into storage, then a macro feeds
    // the coords to tp. Assumes players enter from the overworld (where tickets live).
    datapackFiles.push({
      path: `data/${ns}/function/return_${slug}.mcfunction`,
      contents: [
        `# Send @s back to their captured entry point in the overworld.`,
        `execute store result storage ${ns}:return x int 1 run scoreboard players get @s ${RET_X}`,
        `execute store result storage ${ns}:return y int 1 run scoreboard players get @s ${RET_Y}`,
        `execute store result storage ${ns}:return z int 1 run scoreboard players get @s ${RET_Z}`,
        `function ${ns}:do_return_${slug} with storage ${ns}:return`,
        "",
      ].join("\n"),
      kind: "function",
      label: "return.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/do_return_${slug}.mcfunction`,
      contents: [
        `# Macro tp to the captured return coords (filled in by return_${slug}).`,
        `$execute in minecraft:overworld run tp @s $(x) $(y) $(z)`,
        "",
      ].join("\n"),
      kind: "function",
      label: "do_return.mcfunction",
    });
    // One-time setup: create the RESETTABLE resource world, mirroring :zone so it
    // carries the exclusive biome. Run once, after a full restart (so :zone exists).
    datapackFiles.push({
      path: `data/${ns}/function/create_arena.mcfunction`,
      contents: [
        `# Run ONCE during setup (after a full server restart so ${ns}:zone is registered):`,
        `#   /function ${ns}:create_arena`,
        `resourceworld create ${slug} mirror ${ns}:zone`,
        `say 🌍 ${config.title} arena created (mirrors ${ns}:zone). Players enter with a ticket.`,
        "",
      ].join("\n"),
      kind: "function",
      label: "create_arena.mcfunction",
    });
    // Manual reset: regenerate the whole arena LIVE (no restart). Run it yourself when
    // the zone is EMPTY — e.g. between events. Same dimension id, so the vanilla warp
    // keeps working afterward. (Auto-reset-on-exit was removed: resetting the dimension
    // the instant the last player left could crash the server.)
    datapackFiles.push({
      path: `data/${ns}/function/reset_zone_${slug}.mcfunction`,
      contents: [
        `# Wipe & regenerate the arena. Run ONLY when no players are inside:`,
        `#   /function ${ns}:reset_zone_${slug}`,
        `execute if entity @a[tag=${slug}_inzone] run say ⚠ Players are still inside ${config.title} — reset aborted.`,
        `execute unless entity @a[tag=${slug}_inzone] run resourceworld reset ${slug}`,
        `execute unless entity @a[tag=${slug}_inzone] run say ♻ ${config.title} arena reset — fresh for the next visitor.`,
        "",
      ].join("\n"),
      kind: "function",
      label: "reset_zone.mcfunction",
    });
  }

  // --- per-player countdown timer (1s self-rescheduling loop) ---
  if (config.timer.enabled) {
    const total = Math.max(1, Math.round(config.timeLimitMinutes)) * 60; // seconds
    loadLines.push(`scoreboard objectives add ${TIMER_OBJ} dummy`);
    uninstallLines.push(`scoreboard players reset @a ${TIMER_OBJ}`);
    if (showBar) {
      loadLines.push(
        `scoreboard objectives add ${CALC_OBJ} dummy`,
        `scoreboard players set #sixty ${CALC_OBJ} 60`,
      );
    }

    // Scope every loop op to THIS zone's players via the inzone tag, so multiple
    // safaris (which share these objectives) never fight over each other's timers.
    const inzone = `tag=${slug}_inzone`;
    const tick: string[] = [
      `# Safari countdown — runs once per second, only for THIS zone's players.`,
      `scoreboard players remove @a[${inzone},scores={${TIMER_OBJ}=1..}] ${TIMER_OBJ} 1`,
    ];
    const warnSeconds = config.timer.warnings
      .filter((m, i, arr) => arr.indexOf(m) === i)
      .filter((m) => m > 0 && m * 60 < total)
      .sort((a, b) => b - a);
    for (const m of warnSeconds) {
      const s = m * 60;
      const msg = `⏳ ${m} minute${m === 1 ? "" : "s"} left in the ${config.title}!`;
      tick.push(`execute as @a[${inzone},scores={${TIMER_OBJ}=${s}}] at @s run tellraw @s ${JSON.stringify({ text: msg, color: "yellow" })}`);
      tick.push(`execute as @a[${inzone},scores={${TIMER_OBJ}=${s}}] at @s run playsound minecraft:block.note_block.bell player @s ~ ~ ~ 1 1`);
    }
    if (showBar) {
      tick.push(`# refresh each active player's on-screen action-bar timer`);
      tick.push(`execute as @a[${inzone},scores={${TIMER_OBJ}=1..}] run function ${ns}:hud_update_${slug}`);
    }
    tick.push(`# time's up — send each expired player home`);
    tick.push(`execute as @a[${inzone},scores={${TIMER_OBJ}=0}] at @s run function ${ns}:safari_home`);
    tick.push(`# keep the loop alive only while one of THIS zone's players still has time`);
    tick.push(`execute if entity @a[${inzone},scores={${TIMER_OBJ}=1..}] run schedule function ${ns}:safari_tick 1s replace`);
    tick.push("");
    datapackFiles.push({
      path: `data/${ns}/function/safari_tick.mcfunction`,
      contents: tick.join("\n"),
      kind: "function",
      label: "safari_tick.mcfunction",
    });

    datapackFiles.push({
      path: `data/${ns}/function/safari_home.mcfunction`,
      contents: [
        `# Return a player home when their safari time runs out.`,
        `tellraw @s ${JSON.stringify({ text: `⌛ Your time in the ${config.title} is up — heading home!`, color: "red" })}`,
        // teardown drops the bar BEFORE resetting scores (bar_remove reads the bar id).
        ...teardownLines,
        "",
      ].join("\n"),
      kind: "function",
      label: "safari_home.mcfunction",
    });

    if (showBar) {
      // Action-bar countdown: transient text above the hotbar, refreshed every second.
      // Unlike a bossbar it is NOT saved to the world, so it can never be orphaned — when
      // the timer stops or the player leaves, it just stops refreshing and fades on its own.
      datapackFiles.push({
        path: `data/${ns}/function/hud_update_${slug}.mcfunction`,
        contents: [
          `# Compute @s's remaining time as M:SS and show it on their action bar.`,
          `scoreboard players operation #min ${CALC_OBJ} = @s ${TIMER_OBJ}`,
          `scoreboard players operation #min ${CALC_OBJ} /= #sixty ${CALC_OBJ}`,
          `scoreboard players operation #sec ${CALC_OBJ} = @s ${TIMER_OBJ}`,
          `scoreboard players operation #sec ${CALC_OBJ} %= #sixty ${CALC_OBJ}`,
          `# zero-pad seconds (< 10) so we render e.g. 4:07, not 4:7`,
          `data modify storage ${ns}:hud pad set value ""`,
          `execute if score #sec ${CALC_OBJ} matches 0..9 run data modify storage ${ns}:hud pad set value "0"`,
          `# turn the text red in the final minute`,
          `data modify storage ${ns}:hud col set value "white"`,
          `execute if score @s ${TIMER_OBJ} matches ..60 run data modify storage ${ns}:hud col set value "red"`,
          `execute store result storage ${ns}:hud m int 1 run scoreboard players get #min ${CALC_OBJ}`,
          `execute store result storage ${ns}:hud s int 1 run scoreboard players get #sec ${CALC_OBJ}`,
          `function ${ns}:hud_apply_${slug} with storage ${ns}:hud`,
          "",
        ].join("\n"),
        kind: "function",
        label: "hud_update.mcfunction",
      });
      datapackFiles.push({
        path: `data/${ns}/function/hud_apply_${slug}.mcfunction`,
        contents: [
          `# Macro: write @s's action-bar timer text (values from storage ${ns}:hud).`,
          `$title @s actionbar {"text":"⏳ $(m):$(pad)$(s) left","color":"$(col)"}`,
          "",
        ].join("\n"),
        kind: "function",
        label: "hud_apply.mcfunction",
      });
    }
  }

  // --- "leave early" item (advancement reward -> exit function; non-op safe) ---
  // A consumable item whose `minecraft:consume_item` advancement reward runs an exit
  // function. Advancement reward functions execute at permission level 2, so an
  // ordinary (non-op) player can trigger the teleport-out just by using the item.
  if (leaveOn) {
    datapackFiles.push({
      path: `data/${ns}/advancement/use_${slug}_leave.json`,
      contents: JSON.stringify(
        consumeAdvancement({ baseItem: leaveItem, dataKey: SAFARI_DATA_KEY, dataValue: leaveValue, rewardFunctionId: `${ns}:leave_${slug}` }),
        null,
        2,
      ),
      kind: "advancement",
      label: "leave-early advancement",
    });
    datapackFiles.push({
      path: `data/${ns}/function/leave_${slug}.mcfunction`,
      contents: [
        `# Player used the "leave early" item. Only act if they're mid-session, then`,
        `# re-arm the advancement so the next leave item (next entry) works again.`,
        config.timer.enabled
          ? `execute if score @s ${TIMER_OBJ} matches 1.. run function ${ns}:do_leave_${slug}`
          : `function ${ns}:do_leave_${slug}`,
        `advancement revoke @s only ${ns}:use_${slug}_leave`,
        "",
      ].join("\n"),
      kind: "function",
      label: "leave.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/do_leave_${slug}.mcfunction`,
      contents: [
        `# Exit the ${config.title} early, at the player's own request.`,
        `tellraw @s ${JSON.stringify({ text: `You left the ${config.title} early.`, color: "yellow" })}`,
        ...teardownLines,
        "",
      ].join("\n"),
      kind: "function",
      label: "do_leave.mcfunction",
    });
  }

  // --- entry ticket (usable item -> enter function) ---
  if (config.ticket.enabled) {
    const enterId = `${ns}:enter_${slug}`;
    datapackFiles.push({
      path: `data/${ns}/advancement/use_${slug}.json`,
      contents: JSON.stringify(
        consumeAdvancement({ baseItem: config.ticket.baseItem, dataKey: SAFARI_DATA_KEY, dataValue: slug, rewardFunctionId: enterId }),
        null,
        2,
      ),
      kind: "advancement",
      label: "use-ticket advancement",
    });
    datapackFiles.push({
      path: `data/${ns}/function/enter_${slug}.mcfunction`,
      contents: [
        `# Runs when a player uses the ${config.title} ticket.`,
        `tellraw @s ${JSON.stringify([{ text: "Welcome to the ", color: "green" }, { text: config.title, color: "gold" }, { text: "!", color: "green" }])}`,
        ...(config.timer.enabled || config.arena.enabled
          ? [`# mark this player as inside (scopes the timer loop to this zone)`, `tag @s add ${slug}_inzone`]
          : []),
        ...(config.safariBalls > 0
          ? [
              `# Safari Balls (1.5x catch rate) — the in-zone catch boost`,
              `give @s cobblemon:safari_ball ${Math.round(config.safariBalls)}`,
              `tellraw @s ${JSON.stringify({ text: `Here are ${Math.round(config.safariBalls)} Safari Balls — they catch 1.5× better. Make them count!`, color: "aqua" })}`,
            ]
          : []),
        `tellraw @s ${JSON.stringify({ text: `You have ${config.timeLimitMinutes} minutes. Rules: ${config.rules.join("; ")}`, color: "gray" })}`,
        ...(config.reward.enabled
          ? [
              `# arm the catch bounty for this visit: zero the per-visit counter and re-arm`,
              `# the catch advancement so every in-zone catch counts toward it.`,
              `scoreboard players set @s ${CAUGHT_OBJ} 0`,
              `advancement revoke @s only ${ns}:catch_${slug}`,
            ]
          : []),
        ...(config.timer.enabled
          ? [
              `# start the countdown and kick off the 1s loop (the action-bar timer appears`,
              `# on the first tick — nothing to create or clean up)`,
              `scoreboard players set @s ${TIMER_OBJ} ${Math.max(1, Math.round(config.timeLimitMinutes)) * 60}`,
              `schedule function ${ns}:safari_tick 1s replace`,
            ]
          : []),
        ...(config.arena.enabled
          ? [
              `# capture where the player entered from (per-player) so they return to`,
              `# this exact spot on exit, THEN warp them into the arena dimension.`,
              `execute store result score @s ${RET_X} run data get entity @s Pos[0] 1`,
              `execute store result score @s ${RET_Y} run data get entity @s Pos[1] 1`,
              `execute store result score @s ${RET_Z} run data get entity @s Pos[2] 1`,
              `function ${ns}:warp_${slug}`,
            ]
          : []),
        ...(leaveOn
          ? [
              `# hand out a one-use "leave early" item (consumed when used — see leave_${slug})`,
              usableGiveCommand(leaveSpec),
              `tellraw @s ${JSON.stringify({ text: `Hold the Leave ${config.title} item to exit before your time is up.`, color: "gray" })}`,
            ]
          : []),
        `# re-arm the ticket so it can be used again next time`,
        `advancement revoke @s only ${ns}:use_${slug}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "enter.mcfunction",
    });
    const give = usableGiveCommand({
      baseItem: config.ticket.baseItem,
      name: `${config.title} Ticket`,
      nameColor: "green",
      lore: "Right-click & hold to enter the zone",
      glint: config.ticket.glint,
      consumeSeconds: 0.6,
      dataKey: SAFARI_DATA_KEY,
      dataValue: slug,
      packFormat: config.packFormat,
    });
    datapackFiles.push({
      path: `data/${ns}/function/give_${slug}_ticket.mcfunction`,
      contents: [
        `# Give one ${config.title} entry ticket:`,
        `#   /execute as <player> run function ${ns}:give_${slug}_ticket`,
        give,
        `tellraw @s ${JSON.stringify({ text: `You received a ${config.title} ticket!`, color: "gold" })}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "give_ticket.mcfunction",
    });
  }

  // --- per-visit catch bounty (catch N of a type IN the zone; re-earnable each visit) ---
  // Cobblemon's catch_pokemon COUNT is cumulative (lifetime), so a count advancement
  // can't be revoked to repeat — it re-fires instantly. Instead a COUNT-LESS catch
  // advancement fires on EACH qualifying catch (an event, not a milestone); its reward
  // re-arms it and bumps a per-player score, but only while the player is inside the
  // zone. At the target we grant the reward and reset — earnable again next visit, and
  // catches made outside the zone never count, so there's no leave/re-enter farm.
  if (config.reward.enabled) {
    const typeStr = config.reward.type === "any" ? "Pokémon" : `${config.reward.type}-type`;
    const target = Math.max(1, Math.round(config.reward.count));
    const label = `Catch ${target} ${typeStr} in the ${config.title}`;
    const catchAdv = `${ns}:catch_${slug}`;
    loadLines.push(`scoreboard objectives add ${CAUGHT_OBJ} dummy`);
    uninstallLines.push(`scoreboard players reset @a ${CAUGHT_OBJ}`);
    datapackFiles.push({
      path: `data/${ns}/advancement/catch_${slug}.json`,
      contents: JSON.stringify(
        {
          // no `count` → fires on every qualifying catch, not a cumulative milestone
          criteria: { caught: { trigger: "cobblemon:catch_pokemon", conditions: config.reward.type === "any" ? {} : { type: config.reward.type } } },
          requirements: [["caught"]],
          rewards: { function: `${ns}:catch_tick_${slug}` },
        },
        null,
        2,
      ),
      kind: "advancement",
      label: "catch-bounty advancement",
    });
    datapackFiles.push({
      path: `data/${ns}/function/catch_tick_${slug}.mcfunction`,
      contents: [
        `# Runs on each ${typeStr} catch. Only count it if the player is inside the zone;`,
        `# re-arm there so the next catch fires too. Outside the zone we DON'T re-arm, so`,
        `# the advancement goes dormant until the next entry re-arms it.`,
        `execute if entity @s[tag=${slug}_inzone] run advancement revoke @s only ${catchAdv}`,
        `execute if entity @s[tag=${slug}_inzone] run scoreboard players add @s ${CAUGHT_OBJ} 1`,
        `execute if entity @s[tag=${slug}_inzone] if score @s ${CAUGHT_OBJ} matches ${target}.. run function ${ns}:reward_${slug}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "catch_tick.mcfunction",
    });
    datapackFiles.push({
      path: `data/${ns}/function/reward_${slug}.mcfunction`,
      contents: [
        `# Bounty complete — ${label}. Grant the reward and reset so it's earnable again.`,
        `tellraw @s ${JSON.stringify({ text: `Bounty complete — ${label}!`, color: "gold" })}`,
        ...compileRewardLines(config.reward.rewards, { packFormat: config.packFormat }),
        `scoreboard players set @s ${CAUGHT_OBJ} 0`,
        "",
      ].join("\n"),
      kind: "function",
      label: "reward.mcfunction",
    });
  }

  // --- load (objective setup) + uninstall (teardown), if anything needs them ---
  if (loadLines.length) {
    datapackFiles.push({
      path: `data/${ns}/function/load.mcfunction`,
      contents: [`# Load setup for ${config.title}.`, ...loadLines, ""].join("\n"),
      kind: "function",
      label: "load.mcfunction",
    });
    datapackFiles.push({
      path: `data/minecraft/tags/function/load.json`,
      contents: JSON.stringify({ values: [`${ns}:load`] }, null, 2),
      kind: "tag",
      label: "load tag",
    });
  }
  if (uninstallLines.length) {
    datapackFiles.push({
      path: `data/${ns}/function/uninstall.mcfunction`,
      contents: [
        `# Tear down the "${config.title}" safari, then remove the datapack and /reload.`,
        ...uninstallLines,
        // the arena block already prints its own "deleted" message; only add a
        // generic confirmation when there's no arena (e.g. timer-only).
        `tellraw @a ${JSON.stringify({ text: `${config.title} torn down.`, color: "gray" })}`,
        "",
      ].join("\n"),
      kind: "function",
      label: "uninstall.mcfunction",
    });
  }

  const validation = validateDatapack(datapackFiles);
  const datapackFileName = `${slug}.zip`;

  const sideCars: GeneratedFile[] = [
    buildRulesBoard(config),
    buildNpcDialogue(config),
    buildSignText(config),
    buildSafariDiscord(config),
    buildSafariChecklist({ config, namespace: ns, slug, datapackFileName, validation }),
  ];

  return {
    bundle: { slug, title: config.title, namespace: ns, packFormat: config.packFormat, files: [...datapackFiles, ...sideCars] },
    validation,
    datapackFileName,
  };
}
