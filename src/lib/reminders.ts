import { CONTACT_STATUS_META } from "./constants";
import type { ContactWithOrganization, DealWithRelations, ReminderItem } from "./types";
import { STAGE_META } from "./constants";

export function dealToReminder(deal: DealWithRelations): ReminderItem {
  return {
    id: deal.id,
    kind: "deal",
    href: `/leads/${deal.id}`,
    title: `${deal.organization?.name ?? "Unknown company"} — ${deal.title}`,
    subtitle: deal.primary_contact?.name ?? "",
    badgeLabel: STAGE_META[deal.stage].label,
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
    href: `/contacts/${contact.id}`,
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
  contacts: ContactWithOrganization[]
): ReminderItem[] {
  return [...deals.map(dealToReminder), ...contacts.map(contactToReminder)].sort((a, b) => {
    if (!a.next_action_date) return 1;
    if (!b.next_action_date) return -1;
    return a.next_action_date < b.next_action_date ? -1 : 1;
  });
}
