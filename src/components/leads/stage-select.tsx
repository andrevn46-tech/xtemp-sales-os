"use client";

import { updateDealStageAction } from "@/lib/actions";
import { isTerminalStage } from "@/lib/stages";
import type { PipelineStage } from "@/lib/types";
import { useTransition } from "react";

export function StageSelect({
  dealId,
  stage,
  stages,
  workspaceSlug,
}: {
  dealId: string;
  stage: string;
  stages: PipelineStage[];
  workspaceSlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (isTerminalStage(stage)) {
    return (
      <span className="text-xs font-mono uppercase tracking-wide text-ink-dim">
        {stage === "won" ? "Won" : "Lost"} — stage is closed
      </span>
    );
  }

  const ordered = [...stages].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <select
      value={stage}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          updateDealStageAction(dealId, next, workspaceSlug);
        });
      }}
      className="text-sm border border-line rounded-md px-3 py-1.5 bg-paper-raised text-ink disabled:opacity-50"
    >
      {ordered.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
