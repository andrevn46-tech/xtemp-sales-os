import { STAGE_META } from "@/lib/constants";
import type { DealStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  wire: "bg-wire-dim text-wire",
  amber: "bg-amber-dim text-amber",
  signal: "bg-signal-dim text-signal",
  alert: "bg-alert-dim text-alert",
  ink: "bg-line text-ink-dim",
};

const dotClasses: Record<string, string> = {
  wire: "bg-wire",
  amber: "bg-amber",
  signal: "bg-signal",
  alert: "bg-alert",
  ink: "bg-ink-dim",
};

export function StageBadge({ stage, className }: { stage: DealStage; className?: string }) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-medium uppercase tracking-wide",
        colorClasses[meta.color],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[meta.color])} />
      {meta.short}
    </span>
  );
}
