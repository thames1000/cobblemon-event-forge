import type { GeneratedFile } from "../datapack/types";
import type { EventConfig } from "./types";
import { findPreset } from "../catalog/eventTypes";
import { findReward } from "../catalog/items";
import { findSpecies } from "../catalog/pokemon";
import { legendarySummary } from "./legendary";
import { describeObjective } from "../objective/triggers";
import { describeReward } from "../reward/actions";

const WEATHER_LABEL: Record<string, string> = {
  any: "Any weather",
  clear: "☀️ Clear skies",
  rain: "🌧️ Rain",
  thunder: "⛈️ Thunderstorm",
};

function titleCase(id: string): string {
  return id
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function rewardLabel(itemId: string, count: number): string {
  if (itemId === "command") return "Special reward";
  const meta = findReward(itemId);
  const name = meta?.name ?? titleCase(itemId.split(":").pop() ?? itemId);
  if (meta?.category === "currency") return `${count.toLocaleString()} ${name}`;
  return count > 1 ? `${name} ×${count}` : name;
}

function monLabel(species: string): string {
  return findSpecies(species)?.name ?? titleCase(species);
}

/**
 * Discord announcement (Markdown). Ready to paste into a Discord channel — uses
 * headers, bold, and emoji that render cleanly in Discord. Also serves as a
 * server MOTD source (the first line) and an in-game sign blurb.
 */
export function buildDiscordAnnouncement(opts: {
  config: EventConfig;
}): GeneratedFile {
  const c = opts.config;
  const preset = findPreset(c.presetId);
  const emoji = preset?.emoji ?? "📣";

  const lines: string[] = [];
  lines.push(`# ${emoji} ${c.title}`);
  lines.push("");
  if (c.blurb) lines.push(`> ${c.blurb}`);
  lines.push("");
  lines.push(`**🗓️ When:** ${c.duration}`);
  lines.push(`**${WEATHER_LABEL[c.weather] ?? c.weather}**`);
  lines.push("");

  if (c.featured.length) {
    lines.push("## Featured Pokémon");
    for (const f of c.featured) {
      const rarity = f.bucket.replace("-", " ");
      lines.push(`- **${monLabel(f.species)}** — *${rarity}* (Lv. ${f.level})`);
    }
    lines.push("");
  }

  if (c.objectives.length) {
    lines.push("## Bounties");
    for (const o of c.objectives) {
      const reward = o.rewards.length ? ` — *${o.rewards.map(describeReward).join(", ")}*` : "";
      lines.push(`- ${describeObjective(o)}${reward}`);
    }
    lines.push("");
  }

  const legend = legendarySummary(c.legendaryTrigger);
  if (legend) {
    lines.push(`## 🏆 Legendary Hunt`);
    lines.push(`**${legend}**`);
    lines.push("");
  }

  if (c.rewards.length) {
    lines.push("## Rewards");
    for (const r of c.rewards) lines.push(`- ${rewardLabel(r.itemId, r.count)}`);
    lines.push("");
  }

  lines.push("———");
  lines.push("*Hop on and get hunting. Good luck, trainers!* 🎮");

  return {
    path: "discord_announcement.md",
    contents: lines.join("\n") + "\n",
    kind: "discord",
    label: "discord_announcement.md",
  };
}

/** A one-line server MOTD derived from the event. */
export function buildMotd(config: EventConfig): string {
  const preset = findPreset(config.presetId);
  return `${preset?.emoji ?? ""} ${config.title} — ${config.duration}`.trim();
}
