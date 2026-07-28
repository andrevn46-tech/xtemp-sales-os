import { StageBadge } from "@/components/ui/stage-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { INDUSTRY_META, STAGE_META } from "@/lib/constants";
import { getAllDeals } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, relativeDayLabel, isOverdue, isDueToday, cn } from "@/lib/utils";
import Link from "next/link";
import type { DealStage, Industry } from "@/lib/types";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; industry?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const deals = await getAllDeals(supabase, {
    stage: params.stage,
    industry: params.industry,
    search: params.q,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>
          <p className="text-sm text-ink-dim mt-0.5">{deals.length} total</p>
        </div>
        <ButtonLink href="/leads/new">New lead</ButtonLink>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search by deal title…"
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised flex-1 min-w-[200px]"
        />
        <select
          name="stage"
          defaultValue={params.stage ?? ""}
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
        >
          <option value="">All stages</option>
          {(Object.keys(STAGE_META) as DealStage[]).map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
        <select
          name="industry"
          defaultValue={params.industry ?? ""}
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
        >
          <option value="">All industries</option>
          {(Object.keys(INDUSTRY_META) as Industry[]).map((i) => (
            <option key={i} value={i}>
              {INDUSTRY_META[i]}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm px-4 py-2 rounded-md border border-line hover:border-ink">
          Filter
        </button>
        {(params.stage || params.industry || params.q) && (
          <Link href="/leads" className="text-sm px-4 py-2 text-ink-dim hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-lg border border-line bg-paper-raised overflow-hidden">
        {deals.length === 0 ? (
          <EmptyState
            title="No leads match"
            body="Try clearing your filters, or add the first lead for this search."
            action={<ButtonLink href="/leads/new">New lead</ButtonLink>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line">
                <th className="px-5 py-3 font-medium">Deal</th>
                <th className="px-5 py-3 font-medium">Industry</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Value</th>
                <th className="px-5 py-3 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const overdue = isOverdue(deal.next_action_date);
                const dueToday = isDueToday(deal.next_action_date);
                return (
                  <tr key={deal.id} className="border-b border-line last:border-b-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link href={`/leads/${deal.id}`} className="font-medium text-ink hover:underline">
                        {deal.organization?.name}
                      </Link>
                      <div className="text-xs text-ink-dim">{deal.title}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-dim text-xs">
                      {deal.organization ? INDUSTRY_META[deal.organization.industry] : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={deal.stage} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-dim">
                      {formatZAR(deal.estimated_value_zar)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 font-mono text-xs font-medium",
                        overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
                      )}
                    >
                      {relativeDayLabel(deal.next_action_date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
