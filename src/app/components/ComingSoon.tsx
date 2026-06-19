import Link from "next/link";
import { navItem } from "@/lib/nav";

/** Shared placeholder for sections that are planned but not yet built. */
export default function ComingSoon({ href, points }: { href: string; points: string[] }) {
  const item = navItem(href);
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="chip mb-4">Planned section</div>
      <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-100">
        <span>{item?.emoji}</span>
        {item?.label}
      </h1>
      <p className="mt-2 text-slate-400">{item?.blurb}</p>

      <div className="panel mt-8 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">What this will do</h2>
        <ul className="space-y-2">
          {points.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-slate-300">
              <span className="text-amber-400">›</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        The{" "}
        <Link href="/forge" className="text-amber-400 hover:underline">
          Event Forge
        </Link>{" "}
        is live now and already generates the datapack, rewards, bounties JSON, Discord post, and upload checklist —
        this section will build on that same bundle format.
      </p>
    </div>
  );
}
