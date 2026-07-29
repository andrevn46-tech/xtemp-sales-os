import { PrintButton } from "@/components/commission/print-button";
import { dealNounFor } from "@/lib/constants";
import { getWonDealsForMonth, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatZAR } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CommissionMonthPage({
  params,
}: {
  params: Promise<{ workspace: string; year: string; month: string }>;
}) {
  const { workspace: slug, year: yearStr, month: monthStr } = await params;
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) notFound();

  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();
  const noun = dealNounFor(workspace.tracks_forecast);

  const deals = await getWonDealsForMonth(supabase, workspace.id, year, month);

  const totalSales = deals.reduce((s, d) => s + (d.actual_value_zar ?? 0), 0);
  const totalCommission = deals.reduce((s, d) => s + (d.commission_amount_zar ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/${slug}/commission`} className="text-xs text-ink-dim hover:text-ink">
          ← Commission
        </Link>
        <PrintButton />
      </div>

      <div className="border border-line rounded-lg bg-paper-raised p-8 print:border-none print:shadow-none">
        <div className="flex items-start justify-between border-b border-line pb-4 mb-6">
          <div>
            <p className="font-display font-bold text-lg text-ink">{workspace.name}</p>
            <p className="text-xs text-ink-dim">Commission Report</p>
          </div>
          <div className="text-right">
            <p className="font-display font-semibold text-ink">
              {MONTH_NAMES[month - 1]} {year}
            </p>
            <p className="text-xs text-ink-dim">Generated {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {deals.length === 0 ? (
          <p className="text-sm text-ink-dim py-8 text-center">No deals were won in this month.</p>
        ) : (
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line">
                <th className="py-2 font-medium">Who</th>
                <th className="py-2 font-medium">{noun.capital}</th>
                <th className="py-2 font-medium text-right">Value</th>
                <th className="py-2 font-medium text-right">Rate</th>
                <th className="py-2 font-medium text-right">Commission</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-b-0">
                  <td className="py-2.5">{d.organization?.name ?? d.primary_contact?.name ?? "—"}</td>
                  <td className="py-2.5 text-ink-dim">{d.title}</td>
                  <td className="py-2.5 text-right font-mono">{formatZAR(d.actual_value_zar)}</td>
                  <td className="py-2.5 text-right font-mono">
                    {d.commission_rate_percent !== null ? `${d.commission_rate_percent}%` : "Flat"}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium">
                    {formatZAR(d.commission_amount_zar)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="border-t-2 border-ink pt-4 flex justify-end">
          <div className="w-64 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-dim">Total sales</span>
              <span className="font-mono text-ink">{formatZAR(totalSales)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-ink">Total commission</span>
              <span className="font-mono text-ink">{formatZAR(totalCommission)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
