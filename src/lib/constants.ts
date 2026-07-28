import type { ContactStatus, DealStage, Industry, NextActionType, ProductLine } from "./types";

export const STAGE_META: Record<
  DealStage,
  { label: string; short: string; color: "wire" | "amber" | "signal" | "alert" | "ink" }
> = {
  new: { label: "New", short: "NEW", color: "wire" },
  contacted: { label: "Contacted", short: "CONTACTED", color: "wire" },
  meeting: { label: "Meeting", short: "MEETING", color: "amber" },
  demo: { label: "Demo", short: "DEMO", color: "amber" },
  quotation: { label: "Quotation", short: "QUOTE", color: "signal" },
  won: { label: "Won", short: "WON", color: "signal" },
  lost: { label: "Lost", short: "LOST", color: "alert" },
};

// Kanban only shows the open, working stages. Won/Lost are terminal
// outcomes triggered explicitly from a deal, not columns to sit idle in.
export const KANBAN_STAGES: DealStage[] = [
  "new",
  "contacted",
  "meeting",
  "demo",
  "quotation",
];

export const INDUSTRY_META: Record<Industry, string> = {
  defence: "Defence",
  automotive: "Automotive",
  mining_heavy_industry: "Mining & Heavy Industry",
  academia: "Academia & Research",
  energy: "Energy",
  aerospace: "Aerospace",
  general_industrial: "General Industrial",
};

export const PRODUCT_LINES: ProductLine[] = [
  "SIRIUS",
  "SIRIUS XHS",
  "KRYPTON",
  "IOLITE",
  "DewesoftX Software",
  "Structural Health Monitoring",
  "Condition Monitoring",
  "Other",
];

export const NEXT_ACTION_META: Record<NextActionType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  quote_followup: "Quote follow-up",
  other: "Task",
};

// Suggested cadence — offered as a default when a deal enters a stage or
// an activity is logged, never forced. This is the core anti-forgetting
// mechanism: a next action + date is required on every open deal.
export const STAGE_FOLLOWUP_DEFAULTS: Record<DealStage, { days: number; type: NextActionType }> = {
  new: { days: 2, type: "call" },
  contacted: { days: 3, type: "call" },
  meeting: { days: 5, type: "email" },
  demo: { days: 4, type: "quote_followup" },
  quotation: { days: 7, type: "quote_followup" },
  won: { days: 0, type: "other" },
  lost: { days: 0, type: "other" },
};

export const TECHNICAL_TAG_SUGGESTIONS = [
  "DAQ",
  "NVH",
  "Structural Health Monitoring",
  "Power Quality",
  "EV Powertrain",
  "M&V / Energy Metering",
  "Vibration Analysis",
  "Condition Monitoring",
  "CAN Bus / Vehicle Networks",
  "Strain Measurement",
  "Thermal / Temperature",
  "High-Speed Video Sync",
  "Rotating Machinery",
  "Battery Testing",
];

export const STALE_DAYS_THRESHOLD = 10; // no activity + no next action inside this window -> flagged on dashboard

export const CONTACT_STATUS_META: Record<
  ContactStatus,
  { label: string; color: "wire" | "amber" | "signal" | "alert" | "ink" }
> = {
  new: { label: "New contact", color: "wire" },
  contacted: { label: "Contacted", color: "wire" },
  qualifying: { label: "Qualifying", color: "amber" },
  promoted: { label: "Promoted", color: "signal" },
  not_a_fit: { label: "Not a fit", color: "alert" },
};

// Every new contact defaults to a follow-up call in 3 days — deliberately a
// little looser than a qualified deal's cadence, since these are cooler leads.
export const CONTACT_FOLLOWUP_DEFAULT: { days: number; type: NextActionType } = {
  days: 3,
  type: "call",
};

export function suggestedContactFollowUp(): { type: NextActionType; date: string } {
  const d = new Date();
  d.setDate(d.getDate() + CONTACT_FOLLOWUP_DEFAULT.days);
  return { type: CONTACT_FOLLOWUP_DEFAULT.type, date: d.toISOString().slice(0, 10) };
}

export function suggestedFollowUp(stage: DealStage): { type: NextActionType; date: string } {
  const rule = STAGE_FOLLOWUP_DEFAULTS[stage];
  const d = new Date();
  d.setDate(d.getDate() + rule.days);
  return { type: rule.type, date: d.toISOString().slice(0, 10) };
}
