import { CONTACT_STATUS_META } from "./constants";
import { getStageMeta } from "./stages";
import type { ContactWithOrganization, DealWithRelations, PipelineStage, ReminderItem } from "./types";

export function dealToReminder(deal: DealWithRelations, stages: PipelineStage[]): ReminderItem {
  return {
    id: deal.id,
    kind: "deal",
    href: `/deals/${deal.id}`, // workspace prefix added by the caller/component
    title: `${deal.organization?.name ?? deal.primary_contact?.name ?? "Unknown"} — ${deal.title}`,
    subtitle: deal.primary_contact?.name ?? "",
    badgeLabel: getStageMeta(deal.stage, stages).label,
    next_action_type: deal.next_action_type,
    next_action_date: deal.next_action_date,
    next_action_note: deal.next_action_note,
    value: deal.estimated_value_zar,
  };
}

export function contactToReminder(contact: ContactWithOrganization): ReminderItem {
  return {
    id: contact.id,
    kind: "contact",
    href: `/contacts/${contact.id}`, // workspace prefix added by the caller/component
    title: contact.organization?.name ? `${contact.name} — ${contact.organization.name}` : contact.name,
    subtitle: contact.title ?? "",
    badgeLabel: CONTACT_STATUS_META[contact.status].label,
    next_action_type: contact.next_action_type,
    next_action_date: contact.next_action_date,
    next_action_note: contact.next_action_note,
    value: null,
  };
}

export function mergeReminders(
  deals: DealWithRelations[],
  contacts: ContactWithOrganization[],
  stages: PipelineStage[]
): ReminderItem[] {
  return [...deals.map((d) => dealToReminder(d, stages)), ...contacts.map(contactToReminder)].sort((a, b) => {
    if (!a.next_action_date) return 1;
    if (!b.next_action_date) return -1;
    return a.next_action_date < b.next_action_date ? -1 : 1;
  });
}
