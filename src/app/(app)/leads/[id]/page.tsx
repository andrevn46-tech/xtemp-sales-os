import { ActivityForm } from "@/components/leads/activity-form";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { OutcomeControls } from "@/components/leads/outcome-controls";
import { StageSelect } from "@/components/leads/stage-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INDUSTRY_META, suggestedFollowUp } from "@/lib/constants";
import { getDeal, getCommissionTiers } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatZAR, isOverdue, isDueToday, relativeDayLabel, cn } from "@/lib/utils";
import { Building2, Mail, Phone, Link2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  let deal, contacts, activities;
  try {
    ({ deal, contacts, activities } = await getDeal(supabase, id));
  } catch {
    notFound();
  }
  if (!deal) notFound();

  const suggestion = suggestedFollowUp(deal.stage);
  const overdue = isOverdue(deal.next_action_date);
  const dueToday = isDueToday(deal.next_action_date);
  const isTerminal = deal.stage === "won" || deal.stage === "lost";
  const tiers = isTerminal ? [] : await getCommissionTiers(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leads" className="text-xs text-ink-dim hover:text-ink">
          ← All leads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-dim mb-1">
              <Building2 size={13} />
              {deal.organization?.name}
              {deal.organization && (
                <span className="text-ink-dim/70">· {INDUSTRY_META[deal.organization.industry]}</span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">{deal.title}</h1>
          </div>
          {!isTerminal && (
            <OutcomeControls dealId={deal.id} estimatedValue={deal.estimated_value_zar} tiers={tiers} />
          )}
        </div>
        {deal.stage === "lost" && deal.lost_reason && (
          <p className="text-xs text-alert mt-2">Lost: {deal.lost_reason}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <StageSelect dealId={deal.id} stage={deal.stage} />
        <span className="text-sm font-mono text-ink-dim">
          {formatZAR(deal.estimated_value_zar)} · {deal.probability}% probability
        </span>
        {deal.product_lines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {deal.product_lines.map((p) => (
              <span key={p} className="text-[10px] font-mono uppercase bg-line/60 text-ink-dim rounded px-1.5 py-0.5">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!isTerminal && (
            <Card
              className={cn(
                overdue && "border-alert",
                !overdue && dueToday && "border-amber"
              )}
            >
              <CardHeader>
                <CardTitle>Next action</CardTitle>
              </CardHeader>
              <CardContent>
                {deal.next_action_date ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink font-medium capitalize">
                        {deal.next_action_type?.replace("_", " ")}
                        {deal.next_action_note ? ` — ${deal.next_action_note}` : ""}
                      </p>
                      <p className="text-xs text-ink-dim mt-0.5">{formatDate(deal.next_action_date)}</p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono font-medium",
                        overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
                      )}
                    >
                      {relativeDayLabel(deal.next_action_date)}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-amber">
                    No next action set — log an activity below to set one.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Log activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityForm
                dealId={deal.id}
                currentStage={deal.stage}
                suggestedType={suggestion.type}
                suggestedDate={suggestion.date}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {contacts.length === 0 && <p className="text-sm text-ink-dim">No contacts yet.</p>}
              {contacts.map((c) => (
                <div key={c.id} className="text-sm">
                  <p className="font-medium text-ink">
                    {c.name} {c.is_primary && <span className="text-[10px] text-signal align-middle ml-1">PRIMARY</span>}
                  </p>
                  {c.title && <p className="text-xs text-ink-dim">{c.title}</p>}
                  <div className="flex flex-col gap-1 mt-1.5">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink">
                        <Mail size={12} /> {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink">
                        <Phone size={12} /> {c.phone}
                      </a>
                    )}
                    {c.linkedin_url && (
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
                      >
                        <Link2 size={12} /> LinkedIn <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal info</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs text-ink-dim">
              {deal.stage === "won" && (
                <>
                  <div className="flex justify-between">
                    <span>Actual value</span>
                    <span className="text-ink font-mono">{formatZAR(deal.actual_value_zar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission rate</span>
                    <span className="text-ink font-mono">{deal.commission_rate_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission</span>
                    <span className="text-signal font-mono font-semibold">
                      {formatZAR(deal.commission_amount_zar)}
                    </span>
                  </div>
                  <div className="border-t border-line my-1" />
                </>
              )}
              <div className="flex justify-between">
                <span>Source</span>
                <span className="text-ink">{deal.source?.replace("_", " ") ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Stage since</span>
                <span className="text-ink font-mono">{formatDate(deal.stage_entered_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-ink font-mono">{formatDate(deal.created_at)}</span>
              </div>
              {deal.organization?.website && (
                <div className="flex justify-between">
                  <span>Website</span>
                  <a
                    href={deal.organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wire hover:underline"
                  >
                    Visit ↗
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
