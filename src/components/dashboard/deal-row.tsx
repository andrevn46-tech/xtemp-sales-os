import { StageBadge } from "@/components/ui/stage-badge";
import { NEXT_ACTION_META } from "@/lib/constants";
import { updateNextActionAction } from "@/lib/actions";
import type { DealWithRelations } from "@/lib/types";
import { cn, formatZAR, isOverdue, isDueToday, relativeDayLabel } from "@/lib/utils";
import Link from "next/link";
import { Phone, Mail, Users2, MonitorPlay, FileText, HelpCircle } from "lucide-react";

const TYPE_ICON = {
  call: Phone,
  email: Mail,
  meeting: Users2,
  demo: MonitorPlay,
  quote_followup: FileText,
  other: HelpCircle,
};

export function DealRow({ deal, showReschedule = true }: { deal: DealWithRelations; showReschedule?: boolean }) {
  const overdue = isOverdue(deal.next_action_date);
  const dueToday = isDueToday(deal.next_action_date);
  const Icon = deal.next_action_type ? TYPE_ICON[deal.next_action_type] : HelpCircle;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-line last:border-b-0">
      <div
        className={cn(
          "shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
          overdue ? "bg-alert-dim text-alert" : dueToday ? "bg-amber-dim text-amber" : "bg-wire-dim text-wire"
        )}
      >
        <Icon size={14} />
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/leads/${deal.id}`} className="font-medium text-sm text-ink hover:underline truncate block">
          {deal.organization?.name} — {deal.title}
        </Link>
        <div className="text-xs text-ink-dim truncate">
          {deal.next_action_type ? NEXT_ACTION_META[deal.next_action_type] : "Task"}
          {deal.next_action_note ? ` · ${deal.next_action_note}` : ""}
          {deal.primary_contact ? ` · ${deal.primary_contact.name}` : ""}
        </div>
      </div>

      <StageBadge stage={deal.stage} className="hidden sm:inline-flex" />

      <span className="text-xs text-ink-dim font-mono hidden md:inline">
        {formatZAR(deal.estimated_value_zar)}
      </span>

      <span
        className={cn(
          "text-xs font-mono font-medium whitespace-nowrap",
          overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
        )}
      >
        {relativeDayLabel(deal.next_action_date)}
      </span>

      {showReschedule && (
        <form action={updateNextActionAction} className="hidden lg:flex items-center gap-1.5">
          <input type="hidden" name="deal_id" value={deal.id} />
          <input type="hidden" name="next_action_type" value={deal.next_action_type ?? "other"} />
          <input type="hidden" name="next_action_note" value={deal.next_action_note ?? ""} />
          <input
            type="date"
            name="next_action_date"
            defaultValue={deal.next_action_date ?? ""}
            className="text-xs border border-line rounded px-1.5 py-1 bg-paper-raised text-ink-dim w-[126px]"
          />
          <button
            type="submit"
            className="text-xs px-2 py-1 rounded border border-line hover:border-ink text-ink-dim hover:text-ink"
          >
            Snooze
          </button>
        </form>
      )}
    </div>
  );
}
