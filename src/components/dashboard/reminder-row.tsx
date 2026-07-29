import { updateContactNextActionAction, updateNextActionAction } from "@/lib/actions";
import { NEXT_ACTION_META } from "@/lib/constants";
import type { ReminderItem } from "@/lib/types";
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

export function ReminderRow({
  item,
  workspaceSlug,
  showReschedule = true,
}: {
  item: ReminderItem;
  workspaceSlug: string;
  showReschedule?: boolean;
}) {
  const overdue = isOverdue(item.next_action_date);
  const dueToday = isDueToday(item.next_action_date);
  const Icon = item.next_action_type ? TYPE_ICON[item.next_action_type] : HelpCircle;
  const rescheduleAction = item.kind === "deal" ? updateNextActionAction : updateContactNextActionAction;
  const idFieldName = item.kind === "deal" ? "deal_id" : "contact_id";

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
        <Link href={`/${workspaceSlug}${item.href}`} className="font-medium text-sm text-ink hover:underline truncate block">
          {item.title}
        </Link>
        <div className="text-xs text-ink-dim truncate">
          {item.next_action_type ? NEXT_ACTION_META[item.next_action_type] : "Task"}
          {item.next_action_note ? ` · ${item.next_action_note}` : ""}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </div>
      </div>

      <span
        className={cn(
          "hidden sm:inline-flex text-[10px] font-mono uppercase tracking-wide rounded-full px-2 py-1",
          item.kind === "contact" ? "bg-line/60 text-ink-dim" : "bg-wire-dim text-wire"
        )}
      >
        {item.kind === "contact" ? "Contact" : item.badgeLabel}
      </span>

      {item.kind === "deal" && (
        <span className="text-xs text-ink-dim font-mono hidden md:inline">{formatZAR(item.value)}</span>
      )}

      <span
        className={cn(
          "text-xs font-mono font-medium whitespace-nowrap",
          overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
        )}
      >
        {relativeDayLabel(item.next_action_date)}
      </span>

      {showReschedule && (
        <form action={rescheduleAction} className="hidden lg:flex items-center gap-1.5">
          <input type="hidden" name={idFieldName} value={item.id} />
          <input type="hidden" name="workspace_slug" value={workspaceSlug} />
          <input type="hidden" name="next_action_type" value={item.next_action_type ?? "other"} />
          <input type="hidden" name="next_action_note" value={item.next_action_note ?? ""} />
          <input
            type="date"
            name="next_action_date"
            defaultValue={item.next_action_date ?? ""}
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
