/** Console sections. `ready` ones are built; others render a planned-feature page. */
export interface NavItem {
  href: string;
  label: string;
  emoji: string;
  blurb: string;
  ready: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Home", emoji: "🏠", blurb: "Console overview", ready: true },
  { href: "/forge", label: "Event Forge", emoji: "🔥", blurb: "Build weekly events, spawns & rewards", ready: true },
  { href: "/calendar", label: "Event Calendar", emoji: "📅", blurb: "Plan the rotation, schedule & teardown", ready: true },
  { href: "/bounties", label: "Bounty Board", emoji: "📋", blurb: "Daily, weekly & community contracts", ready: true },
  { href: "/crates", label: "Reward Crates", emoji: "🎁", blurb: "Loot tables without hand-writing JSON", ready: true },
  { href: "/bingo", label: "Bingo Boards", emoji: "🎲", blurb: "Randomized objective bingo with line rewards", ready: true },
  { href: "/safari", label: "Safari Zones", emoji: "🏕️", blurb: "Themed temporary spawn areas", ready: true },
  { href: "/battle", label: "Battle Factory", emoji: "⚔️", blurb: "Rental drafts + NPC battle tower", ready: true },
  { href: "/teams", label: "Team vs Team", emoji: "🚩", blurb: "Pick sides, score points, crown a winner", ready: true },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆", blurb: "Reusable points scoreboard + live ranking", ready: true },
  { href: "/escalation", label: "Escalation Stages", emoji: "✦", blurb: "Multi-phase, server-wide story events", ready: true },
  { href: "/travel", label: "Safe Travel", emoji: "🧭", blurb: "Safe teleport, rescue & forceload helpers", ready: true },
  { href: "/mystery", label: "Mystery Hunt", emoji: "🔮", blurb: "Cryptic clue chains that reveal as you solve", ready: true },
  { href: "/items", label: "Item Designer", emoji: "🏷️", blurb: "Named/lore items & /give commands", ready: true },
  { href: "/quests", label: "Questlines", emoji: "🗺️", blurb: "Advancement tree + FTB Quests export", ready: true },
];

export function navItem(href: string): NavItem | undefined {
  return NAV.find((n) => n.href === href);
}
