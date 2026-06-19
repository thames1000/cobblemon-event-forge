"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]/60 p-4 md:block">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="text-2xl">🎮</span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-100">Cobbleverse</div>
          <div className="text-[11px] uppercase tracking-widest text-amber-400">Event Forge</div>
        </div>
      </Link>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-amber-400/15 text-amber-200"
                  : "text-slate-300 hover:bg-[var(--panel-2)] hover:text-slate-100"
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              {!item.ready && <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-400">soon</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 px-3 text-[11px] leading-relaxed text-slate-500">
        Generates datapacks, spawns, rewards & announcements for your Cobbleverse server.
      </div>
    </aside>
  );
}
