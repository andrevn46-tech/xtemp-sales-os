"use client";

import type { Workspace } from "@/lib/types";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceSwitcher({
  workspaces,
  currentSlug,
}: {
  workspaces: Workspace[];
  currentSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const current = workspaces.find((w) => w.slug === currentSlug);

  if (workspaces.length <= 1) {
    return (
      <div className="font-display font-bold text-lg tracking-tight">{current?.name ?? "AVN"}</div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full gap-2 font-display font-bold text-lg tracking-tight hover:text-signal transition-colors"
      >
        {current?.name ?? "Select workspace"}
        <ChevronsUpDown size={15} className="text-panel-ink-dim shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-full min-w-[180px] bg-panel-raised border border-panel-line rounded-md shadow-lg z-20 overflow-hidden">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setOpen(false);
                  router.push(`/${w.slug}`);
                }}
                className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                  w.slug === currentSlug
                    ? "bg-panel text-panel-ink font-medium"
                    : "text-panel-ink-dim hover:bg-panel hover:text-panel-ink"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
