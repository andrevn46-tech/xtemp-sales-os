import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, Contact, DealWithRelations, Organization } from "./types";

const DEAL_SELECT = `
  *,
  organization:organizations(*),
  primary_contact:contacts!deals_primary_contact_id_fkey(*)
`;

export async function getOpenDeals(supabase: SupabaseClient): Promise<DealWithRelations[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .not("stage", "in", "(won,lost)")
    .order("next_action_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}

export async function getAllDeals(
  supabase: SupabaseClient,
  opts: { stage?: string; industry?: string; search?: string } = {}
): Promise<DealWithRelations[]> {
  let query = supabase.from("deals").select(DEAL_SELECT).order("updated_at", { ascending: false });

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

export async function getDeal(supabase: SupabaseClient, id: string) {
  const { data: deal, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", (deal as unknown as DealWithRelations).organization_id)
    .order("is_primary", { ascending: false });

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("deal_id", id)
    .order("occurred_at", { ascending: false });

  return {
    deal: deal as unknown as DealWithRelations,
    contacts: (contacts ?? []) as Contact[],
    activities: (activities ?? []) as Activity[],
  };
}

export async function getOrganizations(supabase: SupabaseClient): Promise<Organization[]> {
  const { data, error } = await supabase.from("organizations").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function searchOrganizations(
  supabase: SupabaseClient,
  q: string
): Promise<Organization[]> {
  if (!q) return [];
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .ilike("name", `%${q}%`)
    .limit(6);
  if (error) throw error;
  return (data ?? []) as Organization[];
}
