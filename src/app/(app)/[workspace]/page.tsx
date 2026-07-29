import { ReminderRow } from "@/components/dashboard/reminder-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ButtonLink } from "@/components/ui/button";
import { dealNounFor } from "@/lib/constants";
import { getOpenDeals, getOpenContacts, getWonDealsForMonth, getWorkspace, getPipelineStages } from "@/lib/data";
import { contactToReminder, dealToReminder, mergeReminders } from "@/lib/reminders";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, isDueToday, isOverdue, daysFromToday } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

function sortByDate<T extends { next_action_date: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.next_action_date) return 1;
    if (!b.next_action_date) return -1;
    return a.next_action_date < b.next_action_date ? -1 : 1;
  });
}

export default async function DashboardPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();
  const noun = dealNounFor(workspace.tracks_forecast);

  const now = new Date();
  const [deals, contacts, wonThisMonth, stages] = await Promise.all([
    getOpenDeals(supabase, workspace.id),
    getOpenContacts(supabase, workspace.id),
    getWonDealsForMonth(supabase, workspace.id, now.getFullYear(), now.getMonth() + 1),
    getPipelineStages(supabase, workspace.id),
  ]);

  const reminders = mergeReminders(deals, contacts, stages);
  const commissionThisMonth = wonThisMonth.reduce((s, d) => s + (d.commission_amount_zar ?? 0), 0);

  const dealReminders = sortByDate(deals.map((d) => dealToReminder(d, stages)));
  const contactReminders = sortByDate(contacts.map(contactToReminder));

  const dealsDueTodayOrOverdue = dealReminders.filter(
    (r) => r.next_action_date && (isDueToday(r.next_action_date) || isOverdue(r.next_action_date))
  );
  const contactsDueTodayOrOverdue = contactReminders.filter(
    (r) => r.next_action_date && (isDueToday(r.next_action_date) || isOverdue(r.next_action_date))
  );

  const dealMeetingsThisWeek = dealReminders.filter(
    (r) =>
      r.next_action_type === "meeting" &&
      r.next_action_date &&
      daysFromToday(r.next_action_date) >= 0 &&
      daysFromToday(r.next_action_date) <= 7
  );
  const contactMeetingsThisWeek = contactReminders.filter(
    (r) =>
      r.next_action_type === "meeting" &&
      r.next_action_date &&
      daysFromToday(r.next_action_date) >= 0 &&
      daysFromToday(r.next_action_date) <= 7
  );

  const callsToday = reminders.filter((r) => r.next_action_type === "call" && isDueToday(r.next_action_date));
  const overdueCount = reminders.filter((r) => isOverdue(r.next_action_date)).length;
  const dueTodayOrOverdueCount = dealsDueTodayOrOverdue.length + contactsDueTodayOrOverdue.length;
  const meetingsThisWeekCount = dealMeetingsThisWeek.length + contactMeetingsThisWeek.length;

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
        <h1 className="font-display text-2xl font-semibold text-ink">{workspace.name} Dashboard</h1>
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
          value={String(dueTodayOrOverdueCount)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : "deals + contacts"}
          tone={overdueCount > 0 ? "alert" : dueTodayOrOverdueCount > 0 ? "amber" : "neutral"}
        />
        <MetricCard
          label="Meetings, 7 days"
          value={String(meetingsThisWeekCount)}
          tone={meetingsThisWeekCount > 0 ? "signal" : "neutral"}
        />
        <MetricCard label="Open pipeline value" value={formatZAR(pipelineValue)} sub={`${deals.length} open deals`} />
        <MetricCard
          label="Commission this month"
          value={formatZAR(commissionThisMonth)}
          sub={`${wonThisMonth.length} deal${wonThisMonth.length === 1 ? "" : "s"} won`}
          tone={commissionThisMonth > 0 ? "signal" : "neutral"}
          href={`/${slug}/commission`}
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{noun.capital}s — today &amp; overdue</CardTitle>
            <ButtonLink href={`/${slug}/deals`} variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {dealsDueTodayOrOverdue.length === 0 ? (
              <EmptyState title="Nothing due today" body={`${noun.capital} follow-ups will surface here as they come due.`} />
            ) : (
              dealsDueTodayOrOverdue.map((item) => <ReminderRow key={item.id} item={item} workspaceSlug={slug} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contacts — today &amp; overdue</CardTitle>
            <ButtonLink href={`/${slug}/contacts`} variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {contactsDueTodayOrOverdue.length === 0 ? (
              <EmptyState title="Nothing due today" body="Contact follow-ups will surface here as they come due." />
            ) : (
              contactsDueTodayOrOverdue.map((item) => <ReminderRow key={item.id} item={item} workspaceSlug={slug} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{noun.capital}s — meetings, next 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            {dealMeetingsThisWeek.length === 0 ? (
              <EmptyState title="No meetings booked" body={`${noun.capital} meetings you schedule will show up here.`} />
            ) : (
              dealMeetingsThisWeek.map((item) => (
                <ReminderRow key={item.id} item={item} workspaceSlug={slug} showReschedule={false} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts — meetings, next 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            {contactMeetingsThisWeek.length === 0 ? (
              <EmptyState title="No meetings booked" body="Contact meetings you schedule will show up here." />
            ) : (
              contactMeetingsThisWeek.map((item) => (
                <ReminderRow key={item.id} item={item} workspaceSlug={slug} showReschedule={false} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
