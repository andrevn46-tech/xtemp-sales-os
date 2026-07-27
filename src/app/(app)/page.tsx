import { DealRow } from "@/components/dashboard/deal-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ButtonLink } from "@/components/ui/button";
import { getOpenDeals } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, isDueToday, isOverdue, daysFromToday } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const deals = await getOpenDeals(supabase);

  const dueTodayOrOverdue = deals
    .filter((d) => d.next_action_date && (isDueToday(d.next_action_date) || isOverdue(d.next_action_date)))
    .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1));

  const callsToday = deals.filter((d) => d.next_action_type === "call" && isDueToday(d.next_action_date));
  const overdueCount = deals.filter((d) => isOverdue(d.next_action_date)).length;

  const meetingsThisWeek = deals
    .filter(
      (d) =>
        d.next_action_type === "meeting" &&
        d.next_action_date &&
        daysFromToday(d.next_action_date) >= 0 &&
        daysFromToday(d.next_action_date) <= 7
    )
    .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1));

  const pipelineValue = deals.reduce((sum, d) => sum + (d.estimated_value_zar ?? 0), 0);

  const noNextAction = deals.filter((d) => !d.next_action_date);

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-dim mt-0.5">{today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Calls due today"
          value={String(callsToday.length)}
          tone={callsToday.length > 0 ? "amber" : "neutral"}
        />
        <MetricCard
          label="Follow-ups due"
          value={String(dueTodayOrOverdue.length)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
          tone={overdueCount > 0 ? "alert" : dueTodayOrOverdue.length > 0 ? "amber" : "neutral"}
        />
        <MetricCard
          label="Meetings, 7 days"
          value={String(meetingsThisWeek.length)}
          tone={meetingsThisWeek.length > 0 ? "signal" : "neutral"}
        />
        <MetricCard label="Open pipeline value" value={formatZAR(pipelineValue)} sub={`${deals.length} open deals`} />
      </div>

      {noNextAction.length > 0 && (
        <div className="rounded-lg border border-amber bg-amber-dim px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber shrink-0 mt-0.5" />
          <div className="text-sm text-ink">
            <span className="font-medium">{noNextAction.length} deal{noNextAction.length > 1 ? "s have" : " has"} no next action set.</span>{" "}
            These are the ones that quietly go cold. Open each and set what happens next.
            <div className="mt-2 flex flex-col gap-1">
              {noNextAction.slice(0, 4).map((d) => (
                <a key={d.id} href={`/leads/${d.id}`} className="underline text-ink hover:text-ink/70 block">
                  {d.organization?.name} — {d.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today &amp; overdue</CardTitle>
            <ButtonLink href="/leads" variant="ghost" size="sm">
              View all leads
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {dueTodayOrOverdue.length === 0 ? (
              <EmptyState
                title="Nothing due today"
                body="You're caught up. New calls and follow-ups will surface here as they come due."
              />
            ) : (
              dueTodayOrOverdue.map((deal) => <DealRow key={deal.id} deal={deal} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meetings, next 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            {meetingsThisWeek.length === 0 ? (
              <EmptyState title="No meetings booked" body="Meetings you schedule will show up here." />
            ) : (
              meetingsThisWeek.map((deal) => <DealRow key={deal.id} deal={deal} showReschedule={false} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
