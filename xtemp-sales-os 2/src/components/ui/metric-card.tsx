import { cn } from "@/lib/utils";
import Link from "next/link";

const toneClasses = {
  neutral: "text-ink",
  amber: "text-amber",
  alert: "text-alert",
  signal: "text-signal",
};

function valueSizeClass(value: string): string {
  if (value.length > 14) return "text-lg";
  if (value.length > 10) return "text-xl";
  if (value.length > 7) return "text-2xl";
  return "text-3xl";
}

export function MetricCard({
  label,
  value,
  sub,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: keyof typeof toneClasses;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-line bg-paper-raised px-5 py-4 h-full min-w-0 flex flex-col justify-between hover:border-ink/30 transition-colors overflow-hidden">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      <span
        className={cn(
          "font-mono font-semibold mt-2 break-words leading-tight",
          valueSizeClass(value),
          toneClasses[tone]
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-ink-dim mt-1 truncate">{sub}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full min-w-0">
        {content}
      </Link>
    );
  }
  return content;
}
