import ComingSoon from "../components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      href="/battle"
      points={[
        "Weekly rulesets & theme nights (Little Cup, Monotype Doubles, Weather Wars, No-Legendary Week…)",
        "Rental Team Generator: input format/difficulty/theme → a full team with moves, items, abilities & natures",
        "Reward tables and rotating banned Pokémon/items lists",
        "Generate Discord leaderboard posts for streak records",
      ]}
    />
  );
}
