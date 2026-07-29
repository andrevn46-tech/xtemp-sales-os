import { MonthlyBarChart } from "@/components/commission/monthly-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getWonDealsForYear, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatZAR } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CommissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = sp.year ? Number(sp.year) : currentYear;

  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const wonDeals = await getWonDealsForYear(supabase, workspace.id, year);

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const deals = wonDeals.filter((d) => new Date(d.stage_entered_at).getUTCMonth() + 1 === month);
    const totalSales = deals.reduce((s, d) => s + (d.actual_value_zar ?? 0), 0);
    const totalCommission = deals.reduce((s, d) => s + (d.commission_amount_zar ?? 0), 0);
    return { month, count: deals.length, totalSales, totalCommission };
  });

  const yearSales = monthly.reduce((s, m) => s + m.totalSales, 0);
  const yearCommission = monthly.reduce((s, m) => s + m.totalCommission, 0);
  const yearDeals = monthly.reduce((s, m) => s + m.count, 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Commission</h1>
          <p className="text-sm text-ink-dim mt-0.5">Calculated from your rate table on each deal&rsquo;s actual value.</p>
        </div>
        <div className="flex items-center gap-3">
          <form method="get" className="flex items-center gap-2">
            <select
              name="year"
              defaultValue={year}
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button type="submit" className="text-xs px-3 py-2 rounded-md border border-line hover:border-ink text-ink-dim">
              Go
            </button>
          </form>
          <ButtonLink href={`/${slug}/commission/tiers`} variant="secondary" size="sm">
            Rate table
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-line bg-paper-raised px-5 py-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">Deals won</span>
          <p className="font-mono text-2xl font-semibold text-ink mt-1">{yearDeals}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised px-5 py-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">Total sales</span>
          <p className="font-mono text-2xl font-semibold text-ink mt-1">{formatZAR(yearSales)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised px-5 py-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">Commission earned</span>
          <p className="font-mono text-2xl font-semibold text-signal mt-1">{formatZAR(yearCommission)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission by month — {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart values={monthly.map((m) => m.totalCommission)} />
        </CardContent>
      </Card>

      <div className="rounded-lg border border-line bg-paper-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line">
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-5 py-3 font-medium">Deals won</th>
              <th className="px-5 py-3 font-medium">Total sales</th>
              <th className="px-5 py-3 font-medium">Commission</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m) => (
              <tr key={m.month} className="border-b border-line last:border-b-0 hover:bg-paper/60">
                <td className="px-5 py-3 font-medium text-ink">{MONTH_NAMES[m.month - 1]}</td>
                <td className="px-5 py-3 text-ink-dim font-mono text-xs">{m.count}</td>
                <td className="px-5 py-3 text-ink-dim font-mono text-xs">{formatZAR(m.totalSales)}</td>
                <td className="px-5 py-3 text-signal font-mono text-xs font-medium">
                  {formatZAR(m.totalCommission)}
                </td>
                <td className="px-5 py-3 text-right">
                  {m.count > 0 && (
                    <Link href={`/${slug}/commission/${year}/${m.month}`} className="text-xs text-wire hover:underline">
                      View report →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
