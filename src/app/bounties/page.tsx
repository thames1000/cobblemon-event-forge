import ComingSoon from "../components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      href="/bounties"
      points={[
        "Daily & weekly contracts: catch X type, defeat wild Pokémon, shiny hunts, themed catches",
        "Server-wide community goals with a shared reward (e.g. catch 500 Water-types → Fishing Crate Key for all)",
        "Reward types: CobbleDollars, Bottle Caps, Rare Candies, Safari Tickets, cosmetic titles, access passes",
        "Export a bounties datapack/function alongside the event_bounties.json the Forge already produces",
      ]}
    />
  );
}
