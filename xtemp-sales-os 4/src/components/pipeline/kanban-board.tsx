"use client";

import { updateDealStageAction } from "@/lib/actions";
import { KANBAN_STAGES, STAGE_META } from "@/lib/constants";
import type { DealStage, DealWithRelations } from "@/lib/types";
import { cn, formatZAR, isOverdue, isDueToday, relativeDayLabel } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

export function KanbanBoard({ deals }: { deals: DealWithRelations[] }) {
  const [localDeals, setLocalDeals] = useState(deals);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [, startTransition] = useTransition();

  const columns = useMemo(() => {
    const grouped: Record<DealStage, DealWithRelations[]> = {
      new: [],
      contacted: [],
      meeting: [],
      demo: [],
      quotation: [],
      won: [],
      lost: [],
    };
    for (const d of localDeals) grouped[d.stage]?.push(d);
    return grouped;
  }, [localDeals]);

  function handleDrop(stage: DealStage) {
    if (!dragId) return;
    const deal = localDeals.find((d) => d.id === dragId);
    if (!deal || deal.stage === stage) {
      setDragId(null);
      setOverStage(null);
      return;
    }
    setLocalDeals((prev) => prev.map((d) => (d.id === dragId ? { ...d, stage } : d)));
    startTransition(() => {
      updateDealStageAction(dragId, stage);
    });
    setDragId(null);
    setOverStage(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-8 px-8">
      {KANBAN_STAGES.map((stage) => {
        const stageDeals = columns[stage];
        const value = stageDeals.reduce((s, d) => s + (d.estimated_value_zar ?? 0), 0);
        const meta = STAGE_META[stage];

        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={() => handleDrop(stage)}
            className={cn(
              "w-72 shrink-0 rounded-lg border bg-paper/60 flex flex-col",
              overStage === stage ? "border-wire bg-wire-dim/40" : "border-line"
            )}
          >
            <div className="px-3 py-3 border-b border-line">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold uppercase tracking-wide text-ink">
                  {meta.label}
                </span>
                <span className="text-[11px] font-mono text-ink-dim">{stageDeals.length}</span>
              </div>
              <span className="text-[11px] font-mono text-ink-dim">{formatZAR(value)}</span>
            </div>

            <div className="flex-1 p-2 flex flex-col gap-2 min-h-[120px]">
              {stageDeals.map((deal) => {
                const overdue = isOverdue(deal.next_action_date);
                const dueToday = isDueToday(deal.next_action_date);
                return (
                  <Link
                    key={deal.id}
                    href={`/leads/${deal.id}`}
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
                    <p className="text-xs font-medium text-ink truncate">{deal.organization?.name}</p>
                    <p className="text-[11px] text-ink-dim truncate mt-0.5">{deal.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-mono text-ink-dim">
                        {formatZAR(deal.estimated_value_zar)}
                      </span>
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
