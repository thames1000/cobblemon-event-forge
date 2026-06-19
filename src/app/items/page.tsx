import ComingSoon from "../components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      href="/items"
      points={[
        "Design named/lore items on top of existing items (Safari Ticket, Battle Factory Pass, Legendary Lure…)",
        "Set base item, display name, lore lines, rarity colour and enchant glint",
        "Generate /give commands with item components, or a datapack reward function",
        "Later: promote these into real custom items if you build a Fabric mod",
      ]}
    />
  );
}
