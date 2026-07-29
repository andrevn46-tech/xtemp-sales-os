import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { INDUSTRY_META, SALE_TYPE_META } from "@/lib/constants";
import { getAllDeals, getPipelineStages, getWorkspace } from "@/lib/data";
import { getStageMeta, sortStages } from "@/lib/stages";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, relativeDayLabel, isOverdue, isDueToday, cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Industry } from "@/lib/types";

const badgeColorClasses: Record<string, string> = {
  wire: "bg-wire-dim text-wire",
  amber: "bg-amber-dim text-amber",
  signal: "bg-signal-dim text-signal",
  alert: "bg-alert-dim text-alert",
};

export default async function DealsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ stage?: string; industry?: string; q?: string }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const [deals, stages] = await Promise.all([
    getAllDeals(supabase, workspace.id, { stage: sp.stage, industry: sp.industry, search: sp.q }),
    getPipelineStages(supabase, workspace.id),
  ]);
  const orderedStages = sortStages(stages);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Deals</h1>
          <p className="text-sm text-ink-dim mt-0.5">{deals.length} total</p>
        </div>
        <ButtonLink href={`/${slug}/deals/new`}>New deal</ButtonLink>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="Search by deal title…"
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised flex-1 min-w-[200px]"
        />
        <select
          name="stage"
          defaultValue={sp.stage ?? ""}
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
        >
          <option value="">All stages</option>
          {orderedStages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        {workspace.requires_organization && (
          <select
            name="industry"
            defaultValue={sp.industry ?? ""}
            className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
          >
            <option value="">All industries</option>
            {(Object.keys(INDUSTRY_META) as Industry[]).map((i) => (
              <option key={i} value={i}>
                {INDUSTRY_META[i]}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="text-sm px-4 py-2 rounded-md border border-line hover:border-ink">
          Filter
        </button>
        {(sp.stage || sp.industry || sp.q) && (
          <Link href={`/${slug}/deals`} className="text-sm px-4 py-2 text-ink-dim hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-lg border border-line bg-paper-raised overflow-hidden">
        {deals.length === 0 ? (
          <EmptyState
            title="No deals match"
            body="Try clearing your filters, or add the first deal for this search."
            action={<ButtonLink href={`/${slug}/deals/new`}>New deal</ButtonLink>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line">
                <th className="px-5 py-3 font-medium">Deal</th>
                {workspace.requires_organization && <th className="px-5 py-3 font-medium">Industry</th>}
                {workspace.tracks_sale_type && <th className="px-5 py-3 font-medium">Type</th>}
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Value</th>
                <th className="px-5 py-3 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const overdue = isOverdue(deal.next_action_date);
                const dueToday = isDueToday(deal.next_action_date);
                const meta = getStageMeta(deal.stage, stages);
                return (
                  <tr key={deal.id} className="border-b border-line last:border-b-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link href={`/${slug}/deals/${deal.id}`} className="font-medium text-ink hover:underline">
                        {deal.organization?.name ?? deal.primary_contact?.name ?? "Untitled"}
                      </Link>
                      <div className="text-xs text-ink-dim">{deal.title}</div>
                    </td>
                    {workspace.requires_organization && (
                      <td className="px-5 py-3 text-ink-dim text-xs">
                        {deal.organization?.industry ? INDUSTRY_META[deal.organization.industry] : "—"}
                      </td>
                    )}
                    {workspace.tracks_sale_type && (
                      <td className="px-5 py-3 text-ink-dim text-xs">
                        {deal.sale_type ? SALE_TYPE_META[deal.sale_type] : "—"}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-medium uppercase tracking-wide",
                          badgeColorClasses[meta.color]
                        )}
                      >
                        {meta.label}
                      </span>
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
