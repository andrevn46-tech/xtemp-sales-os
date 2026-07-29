import type { ContactStatus, Industry, NextActionType, SaleType } from "./types";

export const SALE_TYPE_META: Record<SaleType, string> = {
  set: "Set",
  loose_clubs: "Loose club(s)",
};

export const INDUSTRY_META: Record<Industry, string> = {
  defence: "Defence",
  automotive: "Automotive",
  mining_heavy_industry: "Mining & Heavy Industry",
  academia: "Academia & Research",
  energy: "Energy",
  aerospace: "Aerospace",
  general_industrial: "General Industrial",
};

// Product / item categories shown as checkboxes on the deal form. Different
// per workspace since XTEMP sells instrumentation and We Buy Clubz sells
// golf equipment. Keyed by workspace slug.
export const PRODUCT_LINES_BY_WORKSPACE: Record<string, string[]> = {
  xtemp: [
    "SIRIUS",
    "SIRIUS XHS",
    "KRYPTON",
    "IOLITE",
    "DewesoftX Software",
    "Structural Health Monitoring",
    "Condition Monitoring",
    "Other",
  ],
  "we-buy-clubz": [
    "Driver",
    "Fairway Wood",
    "Hybrid",
    "Irons Set",
    "Wedge",
    "Putter",
    "Full Set",
    "Bag",
    "Other",
  ],
};

export function productLinesFor(workspaceSlug: string): string[] {
  return PRODUCT_LINES_BY_WORKSPACE[workspaceSlug] ?? [];
}

// "Technical tags" logged against an activity — same idea, different
// vocabulary per workspace.
export const TAG_SUGGESTIONS_BY_WORKSPACE: Record<string, string[]> = {
  xtemp: [
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
  ],
  "we-buy-clubz": [
    "Left-handed",
    "Right-handed",
    "Graphite Shaft",
    "Steel Shaft",
    "Regular Flex",
    "Stiff Flex",
    "Junior Set",
    "Ladies Set",
    "Needs Regripping",
    "Head Cover Included",
  ],
};

export function tagSuggestionsFor(workspaceSlug: string): string[] {
  return TAG_SUGGESTIONS_BY_WORKSPACE[workspaceSlug] ?? [];
}

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

export const NEXT_ACTION_META: Record<NextActionType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  quote_followup: "Quote follow-up",
  other: "Task",
};

// Every new contact defaults to a follow-up call in 3 days, regardless of
// workspace — deliberately a little looser than a qualified deal's cadence.
export const CONTACT_FOLLOWUP_DEFAULT: { days: number; type: NextActionType } = {
  days: 3,
  type: "call",
};

export function suggestedContactFollowUp(): { type: NextActionType; date: string } {
  const d = new Date();
  d.setDate(d.getDate() + CONTACT_FOLLOWUP_DEFAULT.days);
  return { type: CONTACT_FOLLOWUP_DEFAULT.type, date: d.toISOString().slice(0, 10) };
}

export const STALE_DAYS_THRESHOLD = 10; // no activity + no next action inside this window -> flagged on dashboard
