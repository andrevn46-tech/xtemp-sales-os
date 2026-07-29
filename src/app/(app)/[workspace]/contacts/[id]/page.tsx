import { ContactActivityForm } from "@/components/contacts/contact-activity-form";
import { ContactStatusBadge } from "@/components/contacts/contact-status-badge";
import { NotAFitButton } from "@/components/contacts/not-a-fit-button";
import { PromoteForm } from "@/components/contacts/promote-form";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { SALE_TYPE_META, suggestedContactFollowUp } from "@/lib/constants";
import { deleteContactAction } from "@/lib/actions";
import { getContact, getOrganizations, getPipelineStages, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate, isOverdue, isDueToday, relativeDayLabel, cn } from "@/lib/utils";
import { Mail, Phone, Link2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  let contact, activities;
  try {
    ({ contact, activities } = await getContact(supabase, workspace.id, id));
  } catch {
    notFound();
  }
  if (!contact) notFound();

  const [organizations, stages] = await Promise.all([
    workspace.requires_organization ? getOrganizations(supabase, workspace.id) : Promise.resolve([]),
    getPipelineStages(supabase, workspace.id),
  ]);
  const suggestion = suggestedContactFollowUp();
  const overdue = isOverdue(contact.next_action_date);
  const dueToday = isDueToday(contact.next_action_date);
  const isClosed = contact.status === "promoted" || contact.status === "not_a_fit";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/${slug}/contacts`} className="text-xs text-ink-dim hover:text-ink">
          ← All contacts
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{contact.name}</h1>
            {contact.title && <p className="text-sm text-ink-dim">{contact.title}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isClosed && (
              <div className="flex items-center gap-2">
                <PromoteForm
                  contactId={contact.id}
                  contactName={contact.name}
                  workspaceSlug={slug}
                  requiresOrganization={workspace.requires_organization}
                  tracksSaleType={workspace.tracks_sale_type}
                  knownSaleType={contact.sale_type}
                  organizations={organizations}
                  knownIndustry={contact.industry}
                  stages={stages}
                />
                <NotAFitButton contactId={contact.id} workspaceSlug={slug} />
              </div>
            )}
            <DeleteButton
              action={deleteContactAction}
              idFieldName="contact_id"
              idValue={contact.id}
              extraFields={{ workspace_slug: slug }}
              label="Delete contact"
              confirmLabel="Delete this contact and its history?"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ContactStatusBadge status={contact.status} />
        {contact.sale_type && (
          <span className="text-[11px] font-mono uppercase tracking-wide bg-signal-dim text-signal rounded-full px-2.5 py-1">
            {SALE_TYPE_META[contact.sale_type]}
          </span>
        )}
        {contact.organization && (
          <span className="text-sm text-ink-dim">→ now tied to {contact.organization.name}</span>
        )}
        {contact.source && (
          <span className="text-xs text-ink-dim capitalize">via {contact.source.replace("_", " ")}</span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!isClosed && (
            <Card className={cn(overdue && "border-alert", !overdue && dueToday && "border-amber")}>
              <CardHeader>
                <CardTitle>Next follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.next_action_date ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink font-medium capitalize">
                        {contact.next_action_type?.replace("_", " ")}
                        {contact.next_action_note ? ` — ${contact.next_action_note}` : ""}
                      </p>
                      <p className="text-xs text-ink-dim mt-0.5">{formatDate(contact.next_action_date)}</p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono font-medium",
                        overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
                      )}
                    >
                      {relativeDayLabel(contact.next_action_date)}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-amber">No follow-up set — log an activity below to set one.</p>
                )}
              </CardContent>
            </Card>
          )}

          {!isClosed && (
            <Card>
              <CardHeader>
                <CardTitle>Log activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactActivityForm
                  contactId={contact.id}
                  workspaceSlug={slug}
                  suggestedType={suggestion.type}
                  suggestedDate={suggestion.date}
                />
              </CardContent>
            </Card>
          )}

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
              <CardTitle>Contact info</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink">
                  <Mail size={12} /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink">
                  <Phone size={12} /> {contact.phone}
                </a>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
                >
                  <Link2 size={12} /> LinkedIn <ExternalLink size={10} />
                </a>
              )}
              {!contact.email && !contact.phone && !contact.linkedin_url && (
                <p className="text-xs text-ink-dim">No contact details saved.</p>
              )}
              {contact.notes && (
                <p className="text-xs text-ink-dim mt-2 pt-2 border-t border-line whitespace-pre-wrap">
                  {contact.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs text-ink-dim">
              <div className="flex justify-between">
                <span>Logged</span>
                <span className="text-ink font-mono">{formatDate(contact.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
