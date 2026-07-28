import { ReminderRow } from "@/components/dashboard/reminder-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ButtonLink } from "@/components/ui/button";
import { getOpenDeals, getOpenContacts, getWonDealsForMonth } from "@/lib/data";
import { mergeReminders } from "@/lib/reminders";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, isDueToday, isOverdue, daysFromToday } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const [deals, contacts, wonThisMonth] = await Promise.all([
    getOpenDeals(supabase),
    getOpenContacts(supabase),
    getWonDealsForMonth(supabase, now.getFullYear(), now.getMonth() + 1),
  ]);
  const reminders = mergeReminders(deals, contacts);
  const commissionThisMonth = wonThisMonth.reduce((s, d) => s + (d.commission_amount_zar ?? 0), 0);

  const dueTodayOrOverdue = reminders.filter(
    (r) => r.next_action_date && (isDueToday(r.next_action_date) || isOverdue(r.next_action_date))
  );

  const callsToday = reminders.filter((r) => r.next_action_type === "call" && isDueToday(r.next_action_date));
  const overdueCount = reminders.filter((r) => isOverdue(r.next_action_date)).length;

  const meetingsThisWeek = reminders.filter(
    (r) =>
      r.next_action_type === "meeting" &&
      r.next_action_date &&
      daysFromToday(r.next_action_date) >= 0 &&
      daysFromToday(r.next_action_date) <= 7
  );

  const pipelineValue = deals.reduce((sum, d) => sum + (d.estimated_value_zar ?? 0), 0);

  const noNextAction = reminders.filter((r) => !r.next_action_date);

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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Calls due today"
          value={String(callsToday.length)}
          tone={callsToday.length > 0 ? "amber" : "neutral"}
        />
        <MetricCard
          label="Follow-ups due"
          value={String(dueTodayOrOverdue.length)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : "deals + contacts"}
          tone={overdueCount > 0 ? "alert" : dueTodayOrOverdue.length > 0 ? "amber" : "neutral"}
        />
        <MetricCard
          label="Meetings, 7 days"
          value={String(meetingsThisWeek.length)}
          tone={meetingsThisWeek.length > 0 ? "signal" : "neutral"}
        />
        <MetricCard label="Open pipeline value" value={formatZAR(pipelineValue)} sub={`${deals.length} open deals`} />
        <MetricCard
          label="Commission this month"
          value={formatZAR(commissionThisMonth)}
          sub={`${wonThisMonth.length} deal${wonThisMonth.length === 1 ? "" : "s"} won`}
          tone={commissionThisMonth > 0 ? "signal" : "neutral"}
          href="/commission"
        />
      </div>

      {noNextAction.length > 0 && (
        <div className="rounded-lg border border-amber bg-amber-dim px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber shrink-0 mt-0.5" />
          <div className="text-sm text-ink">
            <span className="font-medium">
              {noNextAction.length} deal{noNextAction.length > 1 ? "s or contacts have" : " or contact has"} no next
              action set.
            </span>{" "}
            These are the ones that quietly go cold. Open each and set what happens next.
            <div className="mt-2 flex flex-col gap-1">
              {noNextAction.slice(0, 4).map((r) => (
                <a key={r.id} href={r.href} className="underline text-ink hover:text-ink/70 block">
                  {r.title}
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
            <div className="flex gap-3">
              <ButtonLink href="/contacts" variant="ghost" size="sm">
                Contacts
              </ButtonLink>
              <ButtonLink href="/leads" variant="ghost" size="sm">
                Leads
              </ButtonLink>
            </div>
          </CardHeader>
          <CardContent>
            {dueTodayOrOverdue.length === 0 ? (
              <EmptyState
                title="Nothing due today"
                body="You're caught up. New calls and follow-ups will surface here as they come due."
              />
            ) : (
              dueTodayOrOverdue.map((item) => <ReminderRow key={`${item.kind}-${item.id}`} item={item} />)
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
              meetingsThisWeek.map((item) => (
                <ReminderRow key={`${item.kind}-${item.id}`} item={item} showReschedule={false} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
