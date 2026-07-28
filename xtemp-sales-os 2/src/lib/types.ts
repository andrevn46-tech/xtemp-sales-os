export type Industry =
  | "defence"
  | "automotive"
  | "mining_heavy_industry"
  | "academia"
  | "energy"
  | "aerospace"
  | "general_industrial";

export type ContactStatus = "new" | "contacted" | "qualifying" | "promoted" | "not_a_fit";

export const OPEN_CONTACT_STATUSES: ContactStatus[] = ["new", "contacted", "qualifying"];

export type DealStage =
  | "new"
  | "contacted"
  | "meeting"
  | "demo"
  | "quotation"
  | "won"
  | "lost";

export const OPEN_STAGES: DealStage[] = [
  "new",
  "contacted",
  "meeting",
  "demo",
  "quotation",
];

export type NextActionType = "call" | "email" | "meeting" | "demo" | "quote_followup" | "other";

export type ActivityType = "call" | "email" | "meeting" | "demo" | "note" | "stage_change";

export type ProductLine =
  | "SIRIUS"
  | "SIRIUS XHS"
  | "KRYPTON"
  | "IOLITE"
  | "DewesoftX Software"
  | "Structural Health Monitoring"
  | "Condition Monitoring"
  | "Other";

export interface Organization {
  id: string;
  name: string;
  industry: Industry;
  website: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  organization_id: string | null;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  notes: string | null;
  status: ContactStatus;
  industry: Industry | null;
  source: string | null;
  next_action_type: NextActionType | null;
  next_action_date: string | null;
  next_action_note: string | null;
  created_at: string;
}

export interface ContactWithOrganization extends Contact {
  organization: Organization | null;
}

/** A normalized shape used to render deal and contact reminders side by side. */
export interface ReminderItem {
  id: string;
  kind: "deal" | "contact";
  href: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  next_action_type: NextActionType | null;
  next_action_date: string | null;
  next_action_note: string | null;
  value?: number | null;
}

export interface Deal {
  id: string;
  organization_id: string;
  primary_contact_id: string | null;
  title: string;
  stage: DealStage;
  source: string | null;
  product_lines: ProductLine[];
  estimated_value_zar: number | null;
  probability: number;
  next_action_type: NextActionType | null;
  next_action_date: string | null; // ISO date
  next_action_note: string | null;
  stage_entered_at: string;
  lost_reason: string | null;
  actual_value_zar: number | null;
  commission_rate_percent: number | null;
  commission_amount_zar: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionTier {
  id: string;
  min_value: number;
  max_value: number | null;
  rate_percent: number;
  sort_order: number;
}

export interface Activity {
  id: string;
  deal_id: string | null;
  contact_id: string | null;
  type: ActivityType;
  notes: string;
  technical_tags: string[];
  occurred_at: string;
  created_at: string;
}

// Composite shapes returned by joined queries
export interface DealWithRelations extends Deal {
  organization: Organization;
  primary_contact: Contact | null;
}

export interface OrganizationWithContacts extends Organization {
  contacts: Contact[];
}
