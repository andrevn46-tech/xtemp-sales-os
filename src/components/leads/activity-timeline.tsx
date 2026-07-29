import { EmptyState } from "@/components/ui/empty-state";
import type { Activity } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Phone, Mail, Users2, MonitorPlay, StickyNote, MessageCircle, ArrowRightLeft } from "lucide-react";

const TYPE_META: Record<Activity["type"], { label: string; icon: typeof Phone }> = {
  call: { label: "Call", icon: Phone },
  email: { label: "Email", icon: Mail },
  meeting: { label: "Meeting", icon: Users2 },
  demo: { label: "Demo", icon: MonitorPlay },
  note: { label: "Note", icon: StickyNote },
  message: { label: "Message", icon: MessageCircle },
  stage_change: { label: "Stage change", icon: ArrowRightLeft },
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <EmptyState title="No activity yet" body="Calls, meetings, and notes you log will build a timeline here." />;
  }

  return (
    <div className="flex flex-col">
      {activities.map((a) => {
        const meta = TYPE_META[a.type];
        const Icon = meta.icon;
        return (
          <div key={a.id} className="flex gap-3 py-3 border-b border-line last:border-b-0">
            <div className="shrink-0 h-7 w-7 rounded-full bg-wire-dim text-wire flex items-center justify-center mt-0.5">
              <Icon size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink">{meta.label}</span>
                <span className="text-[11px] font-mono text-ink-dim shrink-0">
                  {formatDateTime(a.occurred_at)}
                </span>
              </div>
              {a.notes && <p className="text-sm text-ink mt-1 whitespace-pre-wrap">{a.notes}</p>}
              {a.technical_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {a.technical_tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono uppercase tracking-wide bg-line/60 text-ink-dim rounded px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
