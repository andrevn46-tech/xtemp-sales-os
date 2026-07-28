"use client";

import { updateDealStageAction } from "@/lib/actions";
import { STAGE_META } from "@/lib/constants";
import type { DealStage } from "@/lib/types";
import { useTransition } from "react";

const EDITABLE_STAGES: DealStage[] = ["new", "contacted", "meeting", "demo", "quotation"];

export function StageSelect({ dealId, stage }: { dealId: string; stage: DealStage }) {
  const [isPending, startTransition] = useTransition();
  const isTerminal = stage === "won" || stage === "lost";

  if (isTerminal) {
    return (
      <span className="text-xs font-mono uppercase tracking-wide text-ink-dim">
        {STAGE_META[stage].label} — stage is closed
      </span>
    );
  }

  return (
    <select
      value={stage}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as DealStage;
        startTransition(() => {
          updateDealStageAction(dealId, next);
        });
      }}
      className="text-sm border border-line rounded-md px-3 py-1.5 bg-paper-raised text-ink disabled:opacity-50"
    >
      {EDITABLE_STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_META[s].label}
        </option>
      ))}
    </select>
  );
}
