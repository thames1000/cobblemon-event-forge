import Link from "next/link";
import { NAV } from "@/lib/nav";

export default function Home() {
  const sections = NAV.filter((n) => n.href !== "/");
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10">
        <div className="chip mb-4">🎮 Cobbleverse Game Master Console</div>
        <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">
          Make your server feel <span className="text-amber-400">alive</span> — without editing files every week.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Build weekly events, bounties, rewards, and Safari zones in minutes. The Forge turns a few fields into a
          validated datapack, reward commands, a Discord post, and an upload checklist.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/forge" className="btn-primary">
            🔥 Open the Event Forge
          </Link>
          <a href="https://misode.github.io/" target="_blank" rel="noreferrer" className="btn-ghost">
            Datapack reference ↗
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="panel group relative block p-5 transition hover:border-amber-400/40 hover:bg-[var(--panel-2)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl">{s.emoji}</span>
              {s.ready ? (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                  Ready
                </span>
              ) : (
                <span className="rounded bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                  Planned
                </span>
              )}
            </div>
            <h2 className="font-semibold text-slate-100">{s.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{s.blurb}</p>
          </Link>
        ))}
      </section>

      <section className="panel mt-10 p-6">
        <h3 className="mb-2 font-semibold text-slate-100">The weekly loop</h3>
        <p className="text-sm text-slate-400">
          New event starts → players get themed bounties → they hunt, battle &amp; explore → earn rewards →
          leaderboard posts → next week rotates. Start with the Forge; the rest of the console plugs into the same
          generated bundle.
        </p>
      </section>
    </div>
  );
}
