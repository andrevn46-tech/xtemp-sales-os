import type { SupabaseClient } from "@supabase/supabase-js";
import { OPEN_CONTACT_STATUSES } from "./types";
import type {
  Activity,
  CommissionTier,
  Contact,
  ContactStatus,
  ContactWithOrganization,
  DealWithRelations,
  Organization,
  PipelineStage,
  Workspace,
} from "./types";

export async function getWorkspaces(supabase: SupabaseClient): Promise<Workspace[]> {
  const { data, error } = await supabase.from("workspaces").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Workspace[];
}

export async function getWorkspace(supabase: SupabaseClient, slug: string): Promise<Workspace | null> {
  const { data, error } = await supabase.from("workspaces").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Workspace | null;
}

export async function getPipelineStages(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as PipelineStage[];
}

const CONTACT_SELECT = `*, organization:organizations(*)`;

export async function getOpenContacts(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ContactWithOrganization[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .eq("workspace_id", workspaceId)
    .in("status", OPEN_CONTACT_STATUSES)
    .order("next_action_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as ContactWithOrganization[];
}

export async function getAllContacts(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { status?: string; search?: string } = {}
): Promise<ContactWithOrganization[]> {
  let query = supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (opts.status) query = query.eq("status", opts.status as ContactStatus);
  if (opts.search) query = query.ilike("name", `%${opts.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ContactWithOrganization[];
}

export async function getContact(supabase: SupabaseClient, workspaceId: string, id: string) {
  const { data: contact, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  if (error) throw error;

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", id)
    .order("occurred_at", { ascending: false });

  return {
    contact: contact as unknown as ContactWithOrganization,
    activities: (activities ?? []) as Activity[],
  };
}

const DEAL_SELECT = `
  *,
  organization:organizations(*),
  primary_contact:contacts!deals_primary_contact_id_fkey(*)
`;

export async function getOpenDeals(supabase: SupabaseClient, workspaceId: string): Promise<DealWithRelations[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("workspace_id", workspaceId)
    .not("stage", "in", "(won,lost)")
    .order("next_action_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}

export async function getAllDeals(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { stage?: string; industry?: string; search?: string } = {}
): Promise<DealWithRelations[]> {
  let query = supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (opts.stage) query = query.eq("stage", opts.stage);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as unknown as DealWithRelations[];
  if (opts.industry) {
    rows = rows.filter((d) => d.organization?.industry === opts.industry);
  }
  return rows;
}

export async function getDeal(supabase: SupabaseClient, workspaceId: string, id: string) {
  const { data: deal, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  if (error) throw error;

  const dealRow = deal as unknown as DealWithRelations;

  const { data: contacts } = dealRow.organization_id
    ? await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", dealRow.organization_id)
        .order("is_primary", { ascending: false })
    : { data: dealRow.primary_contact ? [dealRow.primary_contact] : [] };

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("deal_id", id)
    .order("occurred_at", { ascending: false });

  return {
    deal: dealRow,
    contacts: (contacts ?? []) as Contact[],
    activities: (activities ?? []) as Activity[],
  };
}

export async function getOrganizations(supabase: SupabaseClient, workspaceId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function searchOrganizations(
  supabase: SupabaseClient,
  workspaceId: string,
  q: string
): Promise<Organization[]> {
  if (!q) return [];
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .ilike("name", `%${q}%`)
    .limit(6);
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function getCommissionTiers(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CommissionTier[]> {
  const { data, error } = await supabase
    .from("commission_tiers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CommissionTier[];
}

/** Deals won within a calendar month, using stage_entered_at as the close date. */
export async function getWonDealsForMonth(
  supabase: SupabaseClient,
  workspaceId: string,
  year: number,
  month: number // 1-12
): Promise<DealWithRelations[]> {
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 1)).toISOString();

  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("stage", "won")
    .gte("stage_entered_at", start)
    .lt("stage_entered_at", end)
    .order("stage_entered_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}

/** Every deal won in a calendar year, for the yearly overview. */
export async function getWonDealsForYear(
  supabase: SupabaseClient,
  workspaceId: string,
  year: number
): Promise<DealWithRelations[]> {
  const start = new Date(Date.UTC(year, 0, 1)).toISOString();
  const end = new Date(Date.UTC(year + 1, 0, 1)).toISOString();

  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("stage", "won")
    .gte("stage_entered_at", start)
    .lt("stage_entered_at", end)
    .order("stage_entered_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}
