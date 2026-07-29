"use client";

import { updateDealStageAction } from "@/lib/actions";
import { sortStages } from "@/lib/stages";
import type { DealWithRelations, PipelineStage } from "@/lib/types";
import { cn, formatZAR, isOverdue, isDueToday, relativeDayLabel } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const dotClasses: Record<string, string> = {
  wire: "bg-wire",
  amber: "bg-amber",
  signal: "bg-signal",
};

export function KanbanBoard({
  deals,
  stages,
  workspaceSlug,
  tracksForecast,
}: {
  deals: DealWithRelations[];
  stages: PipelineStage[];
  workspaceSlug: string;
  tracksForecast: boolean;
}) {
  const [localDeals, setLocalDeals] = useState(deals);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const orderedStages = useMemo(() => sortStages(stages), [stages]);

  const columns = useMemo(() => {
    const grouped: Record<string, DealWithRelations[]> = {};
    for (const s of orderedStages) grouped[s.key] = [];
    for (const d of localDeals) {
      if (grouped[d.stage]) grouped[d.stage].push(d);
    }
    return grouped;
  }, [localDeals, orderedStages]);

  function handleDrop(stageKey: string) {
    if (!dragId) return;
    const deal = localDeals.find((d) => d.id === dragId);
    if (!deal || deal.stage === stageKey) {
      setDragId(null);
      setOverStage(null);
      return;
    }
    setLocalDeals((prev) => prev.map((d) => (d.id === dragId ? { ...d, stage: stageKey } : d)));
    startTransition(() => {
      updateDealStageAction(dragId, stageKey, workspaceSlug);
    });
    setDragId(null);
    setOverStage(null);
  }

  if (orderedStages.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-paper-raised px-6 py-10 text-center">
        <p className="text-sm text-ink-dim">
          No pipeline stages set up yet for this workspace.{" "}
          <Link href={`/${workspaceSlug}/pipeline/stages`} className="text-wire hover:underline">
            Add some
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-8 px-8">
      {orderedStages.map((stage) => {
        const stageDeals = columns[stage.key] ?? [];
        const value = stageDeals.reduce((s, d) => s + (d.estimated_value_zar ?? 0), 0);

        return (
          <div
            key={stage.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.key);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
            onDrop={() => handleDrop(stage.key)}
            className={cn(
              "w-72 shrink-0 rounded-lg border bg-paper/60 flex flex-col",
              overStage === stage.key ? "border-wire bg-wire-dim/40" : "border-line"
            )}
          >
            <div className="px-3 py-3 border-b border-line">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wide text-ink">
                  <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[stage.color] ?? "bg-wire")} />
                  {stage.label}
                </span>
                <span className="text-[11px] font-mono text-ink-dim">{stageDeals.length}</span>
              </div>
              {tracksForecast && <span className="text-[11px] font-mono text-ink-dim">{formatZAR(value)}</span>}
            </div>

            <div className="flex-1 p-2 flex flex-col gap-2 min-h-[120px]">
              {stageDeals.map((deal) => {
                const overdue = isOverdue(deal.next_action_date);
                const dueToday = isDueToday(deal.next_action_date);
                return (
                  <Link
                    key={deal.id}
                    href={`/${workspaceSlug}/deals/${deal.id}`}
                    draggable
                    onDragStart={() => setDragId(deal.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    className={cn(
                      "block rounded-md border bg-paper-raised px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-ink/40 transition-colors",
                      dragId === deal.id ? "opacity-40" : "opacity-100",
                      overdue ? "border-alert/50" : "border-line"
                    )}
                  >
                    <p className="text-xs font-medium text-ink truncate">
                      {deal.organization?.name ?? deal.primary_contact?.name ?? "Untitled"}
                    </p>
                    <p className="text-[11px] text-ink-dim truncate mt-0.5">{deal.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      {tracksForecast && (
                        <span className="text-[11px] font-mono text-ink-dim">
                          {formatZAR(deal.estimated_value_zar)}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-mono font-medium",
                          overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
                        )}
                      >
                        {relativeDayLabel(deal.next_action_date)}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {stageDeals.length === 0 && (
                <div className="text-[11px] text-ink-dim/60 text-center py-6">Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
