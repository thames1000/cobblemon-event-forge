import ComingSoon from "../components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      href="/quests"
      points={[
        "Mini-RPG questlines (Professor's Research, Legendary Researcher, Gym Challenger…) with ordered steps",
        "Task types: catch count, catch type, catch in biome, win battle, submit item, reach location",
        "Start with generated quest text, rewards & manual commands",
        "Then export FTB Quests chapter/quest files — the event_bounties.json format is already the seed for this",
      ]}
    />
  );
}
