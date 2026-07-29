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

/**
 * Open stages are defined per-workspace (see PipelineStage / the
 * pipeline_stages table) since XTEMP and We Buy Clubz have different sales
 * processes. "won" and "lost" are the two universal terminal stages, shared
 * by every workspace, and are handled as plain string literals rather than
 * rows in that table.
 */
export type DealStage = string;
export const WON = "won";
export const LOST = "lost";

export type NextActionType = "call" | "email" | "meeting" | "demo" | "quote_followup" | "other";

export type ActivityType = "call" | "email" | "meeting" | "demo" | "note" | "message" | "stage_change";

export type ProductLine = string;

export type SaleType = "set" | "loose_clubs";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  requires_organization: boolean;
  tracks_sale_type: boolean;
  tracks_forecast: boolean;
  sort_order: number;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  workspace_id: string;
  key: string;
  label: string;
  color: "wire" | "amber" | "signal";
  sort_order: number;
  default_followup_days: number;
  default_followup_type: NextActionType;
}

export interface Organization {
  id: string;
  workspace_id: string;
  name: string;
  industry: Industry | null;
  website: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
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
  sale_type: SaleType | null;
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
  workspace_id: string;
  organization_id: string | null;
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
  sale_type: SaleType | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionTier {
  id: string;
  workspace_id: string;
  sale_type: SaleType | null;
  min_value: number;
  max_value: number | null;
  rate_percent: number | null;
  flat_amount: number | null;
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
  organization: Organization | null;
  primary_contact: Contact | null;
}

export interface OrganizationWithContacts extends Organization {
  contacts: Contact[];
}
