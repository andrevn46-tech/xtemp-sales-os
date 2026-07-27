import { cn } from "@/lib/utils";
import Link from "next/link";

const toneClasses = {
  neutral: "text-ink",
  amber: "text-amber",
  alert: "text-alert",
  signal: "text-signal",
};

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
    <div className="rounded-lg border border-line bg-paper-raised px-5 py-4 h-full flex flex-col justify-between hover:border-ink/30 transition-colors">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      <span className={cn("font-mono text-3xl font-semibold mt-2", toneClasses[tone])}>
        {value}
      </span>
      {sub && <span className="text-xs text-ink-dim mt-1">{sub}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
