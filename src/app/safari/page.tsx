import ComingSoon from "../components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      href="/safari"
      points={[
        "Themed temporary zones (Haunted Woods, Volcanic, Fossil Canyon, Dragon Highlands…)",
        "Per-zone spawn pools with common / rare / ultra-rare encounters and biome conditions",
        "Generate an entry ticket item, time-limit rules, reward crate, NPC dialogue & sign text",
        "Outputs a self-contained datapack you swap in for the weekend, then remove",
      ]}
    />
  );
}
