"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, KanbanSquare, Users, Plus, PhoneCall, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/contacts", label: "Contacts", icon: PhoneCall },
  { href: "/commission", label: "Commission", icon: Wallet },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-panel text-panel-ink flex flex-col h-screen sticky top-0 no-print">
      <div className="px-5 pt-6 pb-5 border-b border-panel-line">
        <div className="font-display font-bold text-lg tracking-tight">XTEMP</div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-signal">
          Sales OS
        </div>
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/leads/new"
          className="flex items-center justify-center gap-1.5 rounded-md bg-signal text-panel font-medium text-sm px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New lead
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-panel-raised text-panel-ink font-medium"
                  : "text-panel-ink-dim hover:bg-panel-raised/60 hover:text-panel-ink"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-panel-line flex items-center justify-between">
        <span className="text-[11px] text-panel-ink-dim truncate max-w-[110px]">{userEmail}</span>
        <SignOutButton />
      </div>
    </aside>
  );
}
