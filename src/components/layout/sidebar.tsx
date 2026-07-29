"use client";

import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, KanbanSquare, Users, Plus, PhoneCall, Wallet, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function Sidebar({
  userEmail,
  workspaces,
  currentSlug,
}: {
  userEmail: string | null;
  workspaces: Workspace[];
  currentSlug: string;
}) {
  const pathname = usePathname();
  const base = `/${currentSlug}`;

  const sections: { label: string | null; items: { href: string; label: string; icon: typeof LayoutGrid }[] }[] = [
    {
      label: null,
      items: [{ href: base, label: "Dashboard", icon: LayoutGrid }],
    },
    {
      label: "Pipeline",
      items: [
        { href: `${base}/pipeline`, label: "Pipeline board", icon: KanbanSquare },
        { href: `${base}/deals`, label: "Deals", icon: Users },
        { href: `${base}/commission`, label: "Commission", icon: Wallet },
      ],
    },
    {
      label: "Contacts",
      items: [{ href: `${base}/contacts`, label: "All contacts", icon: PhoneCall }],
    },
  ];

  return (
    <aside className="w-60 shrink-0 bg-panel text-panel-ink flex flex-col h-screen sticky top-0 no-print">
      <div className="px-5 pt-6 pb-5 border-b border-panel-line">
        <WorkspaceSwitcher workspaces={workspaces} currentSlug={currentSlug} />
        <div className="text-[11px] font-mono uppercase tracking-widest text-signal mt-0.5">
          AVN Sales OS
        </div>
      </div>

      <div className="px-3 pt-4 flex flex-col gap-2">
        <Link
          href={`${base}/deals/new`}
          className="flex items-center justify-center gap-1.5 rounded-md bg-signal text-panel font-medium text-sm px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New deal
        </Link>
        <Link
          href={`${base}/contacts/new`}
          className="flex items-center justify-center gap-1.5 rounded-md border border-panel-line text-panel-ink font-medium text-sm px-3 py-2 hover:bg-panel-raised transition-colors"
        >
          <UserPlus size={16} />
          New contact
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-5 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-1">
            {section.label && (
              <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-widest text-panel-ink-dim">
                {section.label}
              </div>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = href === base ? pathname === base : pathname.startsWith(href);
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
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-panel-line flex items-center justify-between">
        <span className="text-[11px] text-panel-ink-dim truncate max-w-[110px]">{userEmail}</span>
        <SignOutButton />
      </div>
    </aside>
  );
}
