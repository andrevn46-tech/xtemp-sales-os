"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { ContactStatus, DealStage, NextActionType } from "@/lib/types";
import { addDaysISO } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Creates the organization, primary contact, and the deal in one step. */
export async function createLeadAction(formData: FormData) {
  const supabase = await createClient();

  const existingOrgId = str(formData, "existing_organization_id");
  let organizationId = existingOrgId;

  if (!organizationId) {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: str(formData, "organization_name")!,
        industry: str(formData, "industry")!,
        website: str(formData, "website"),
        city: str(formData, "city"),
      })
      .select("id")
      .single();
    if (orgError) throw orgError;
    organizationId = org.id;
  }

  const contactName = str(formData, "contact_name");
  let contactId: string | null = null;
  if (contactName) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        organization_id: organizationId,
        name: contactName,
        title: str(formData, "contact_title"),
        email: str(formData, "contact_email"),
        phone: str(formData, "contact_phone"),
        linkedin_url: str(formData, "contact_linkedin"),
        is_primary: true,
      })
      .select("id")
      .single();
    if (contactError) throw contactError;
    contactId = contact.id;
  }

  const productLines = formData.getAll("product_lines").filter(Boolean) as string[];
  const nextActionType = (str(formData, "next_action_type") as NextActionType) ?? "call";
  const nextActionDate = str(formData, "next_action_date") ?? addDaysISO(2);

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
      organization_id: organizationId,
      primary_contact_id: contactId,
      title: str(formData, "title")!,
      stage: "new",
      source: str(formData, "source"),
      product_lines: productLines,
      estimated_value_zar: num(formData, "estimated_value_zar"),
      probability: num(formData, "probability") ?? 20,
      next_action_type: nextActionType,
      next_action_date: nextActionDate,
      next_action_note: str(formData, "next_action_note"),
      stage_entered_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (dealError) throw dealError;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads/${deal.id}`);
}

/** Moves a deal to a new stage (kanban drag, or the stage selector on the detail page). */
export async function updateDealStageAction(dealId: string, stage: DealStage) {
  const supabase = await createClient();

  const patch: DealUpdate = {
    stage,
    stage_entered_at: new Date().toISOString(),
  };

  if (stage === "won" || stage === "lost") {
    patch.next_action_type = null;
    patch.next_action_date = null;
    patch.next_action_note = null;
  }

  const { error } = await supabase.from("deals").update(patch).eq("id", dealId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${dealId}`);
}

/** Closes a deal as won (capturing actual value + commission) or lost (with a reason). */
export async function setDealOutcomeAction(formData: FormData) {
  const dealId = str(formData, "deal_id")!;
  const outcome = str(formData, "outcome") as "won" | "lost";
  const supabase = await createClient();

  const patch: DealUpdate = {
    stage: outcome,
    stage_entered_at: new Date().toISOString(),
    next_action_type: null,
    next_action_date: null,
    next_action_note: null,
  };

  if (outcome === "lost") {
    patch.lost_reason = str(formData, "lost_reason");
  } else {
    patch.actual_value_zar = num(formData, "actual_value_zar");
    patch.commission_rate_percent = num(formData, "commission_rate_percent");
    patch.commission_amount_zar = num(formData, "commission_amount_zar");
  }

  const { error } = await supabase.from("deals").update(patch).eq("id", dealId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/commission");
  revalidatePath(`/leads/${dealId}`);
}

/**
 * Logs an activity (call/email/meeting/demo/note) against a deal and, in the
 * same step, sets the next action. This is the single mechanism that keeps a
 * deal from ever going stale without you noticing — you can't log an update
 * without also saying what happens next.
 */
export async function addActivityAction(formData: FormData) {
  const dealId = str(formData, "deal_id")!;
  const supabase = await createClient();

  const type = str(formData, "type")!;
  const tagsRaw = str(formData, "technical_tags") ?? "";
  const technicalTags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error: activityError } = await supabase.from("activities").insert({
    deal_id: dealId,
    type,
    notes: str(formData, "notes") ?? "",
    technical_tags: technicalTags,
    occurred_at: new Date().toISOString(),
  });
  if (activityError) throw activityError;

  const nextActionType = str(formData, "next_action_type") as NextActionType | null;
  const nextActionDate = str(formData, "next_action_date");
  const newStage = str(formData, "new_stage") as DealStage | null;

  const dealPatch: DealUpdate = { updated_at: new Date().toISOString() };
  if (nextActionType && nextActionDate) {
    dealPatch.next_action_type = nextActionType;
    dealPatch.next_action_date = nextActionDate;
    dealPatch.next_action_note = str(formData, "next_action_note");
  }
  if (newStage) {
    dealPatch.stage = newStage;
    dealPatch.stage_entered_at = new Date().toISOString();
  }

  const { error: dealError } = await supabase.from("deals").update(dealPatch).eq("id", dealId);
  if (dealError) throw dealError;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${dealId}`);
}

/** Quick-edit the next action straight from the dashboard or leads list. */
export async function updateNextActionAction(formData: FormData) {
  const dealId = str(formData, "deal_id")!;
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({
      next_action_type: str(formData, "next_action_type"),
      next_action_date: str(formData, "next_action_date"),
      next_action_note: str(formData, "next_action_note"),
    })
    .eq("id", dealId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${dealId}`);
}

type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

/** Adds someone to the contacts pool — no company or deal required yet. */
export async function createContactAction(formData: FormData) {
  const supabase = await createClient();

  const nextActionType = (str(formData, "next_action_type") as NextActionType) ?? "call";
  const nextActionDate = str(formData, "next_action_date") ?? addDaysISO(3);

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      name: str(formData, "name")!,
      title: str(formData, "title"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      linkedin_url: str(formData, "linkedin_url"),
      industry: str(formData, "industry"),
      source: str(formData, "source"),
      notes: str(formData, "notes"),
      status: "new",
      next_action_type: nextActionType,
      next_action_date: nextActionDate,
      next_action_note: str(formData, "next_action_note"),
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

/** Logs a call/email/note against a standalone contact and sets what happens next. */
export async function addContactActivityAction(formData: FormData) {
  const contactId = str(formData, "contact_id")!;
  const supabase = await createClient();

  const tagsRaw = str(formData, "technical_tags") ?? "";
  const technicalTags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  const { error: activityError } = await supabase.from("activities").insert({
    contact_id: contactId,
    type: str(formData, "type")!,
    notes: str(formData, "notes") ?? "",
    technical_tags: technicalTags,
    occurred_at: new Date().toISOString(),
  });
  if (activityError) throw activityError;

  const nextActionType = str(formData, "next_action_type") as NextActionType | null;
  const nextActionDate = str(formData, "next_action_date");
  const newStatus = str(formData, "new_status") as ContactStatus | null;

  const contactPatch: ContactUpdate = {};
  if (nextActionType && nextActionDate) {
    contactPatch.next_action_type = nextActionType;
    contactPatch.next_action_date = nextActionDate;
    contactPatch.next_action_note = str(formData, "next_action_note");
  }
  if (newStatus) contactPatch.status = newStatus;

  if (Object.keys(contactPatch).length > 0) {
    const { error } = await supabase.from("contacts").update(contactPatch).eq("id", contactId);
    if (error) throw error;
  }

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

/** Quick-reschedule a contact's next action from the dashboard or contacts list. */
export async function updateContactNextActionAction(formData: FormData) {
  const contactId = str(formData, "contact_id")!;
  const supabase = await createClient();

  const { error } = await supabase
    .from("contacts")
    .update({
      next_action_type: str(formData, "next_action_type"),
      next_action_date: str(formData, "next_action_date"),
      next_action_note: str(formData, "next_action_note"),
    })
    .eq("id", contactId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

/** Archives a contact as a dead end — clears the next action so it stops showing as due. */
export async function markContactNotAFitAction(formData: FormData) {
  const contactId = str(formData, "contact_id")!;
  const supabase = await createClient();

  const { error } = await supabase
    .from("contacts")
    .update({
      status: "not_a_fit",
      next_action_type: null,
      next_action_date: null,
      next_action_note: null,
    })
    .eq("id", contactId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

/**
 * Promotes a contact into a real opportunity: creates (or links) an
 * organization and a deal, carries the contact over as the deal's primary
 * contact, and marks the contact as promoted so it drops out of the
 * everyone-I've-spoken-to list.
 */
export async function promoteContactAction(formData: FormData) {
  const contactId = str(formData, "contact_id")!;
  const supabase = await createClient();

  const existingOrgId = str(formData, "existing_organization_id");
  let organizationId = existingOrgId;

  if (!organizationId) {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: str(formData, "organization_name")!,
        industry: str(formData, "industry")!,
        website: str(formData, "website"),
        city: str(formData, "city"),
      })
      .select("id")
      .single();
    if (orgError) throw orgError;
    organizationId = org.id;
  }

  const productLines = formData.getAll("product_lines").filter(Boolean) as string[];
  const nextActionType = (str(formData, "next_action_type") as NextActionType) ?? "call";
  const nextActionDate = str(formData, "next_action_date") ?? addDaysISO(2);

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
      organization_id: organizationId,
      primary_contact_id: contactId,
      title: str(formData, "title")!,
      stage: "new",
      source: str(formData, "source"),
      product_lines: productLines,
      estimated_value_zar: num(formData, "estimated_value_zar"),
      probability: num(formData, "probability") ?? 20,
      next_action_type: nextActionType,
      next_action_date: nextActionDate,
      next_action_note: str(formData, "next_action_note"),
      stage_entered_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (dealError) throw dealError;

  const { error: contactError } = await supabase
    .from("contacts")
    .update({
      organization_id: organizationId,
      is_primary: true,
      status: "promoted",
      next_action_type: null,
      next_action_date: null,
      next_action_note: null,
    })
    .eq("id", contactId);
  if (contactError) throw contactError;

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads/${deal.id}`);
}


/** Replaces the whole commission tier table with the submitted rows. */
export async function saveCommissionTiersAction(formData: FormData) {
  const supabase = await createClient();

  const mins = formData.getAll("tier_min") as string[];
  const maxes = formData.getAll("tier_max") as string[];
  const rates = formData.getAll("tier_rate") as string[];

  const rows = mins
    .map((min, i) => ({
      min_value: Number(min),
      max_value: maxes[i] && maxes[i].trim() !== "" ? Number(maxes[i]) : null,
      rate_percent: Number(rates[i]),
      sort_order: i + 1,
    }))
    .filter((r) => Number.isFinite(r.min_value) && Number.isFinite(r.rate_percent));

  const { error: deleteError } = await supabase.from("commission_tiers").delete().gte("sort_order", 0);
  if (deleteError) throw deleteError;

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("commission_tiers").insert(rows);
    if (insertError) throw insertError;
  }

  revalidatePath("/commission");
  revalidatePath("/commission/tiers");
}

/** Permanently deletes a deal and its activity log. Used for cleaning up test data. */
export async function deleteDealAction(formData: FormData) {
  const dealId = str(formData, "deal_id")!;
  const supabase = await createClient();

  const { error } = await supabase.from("deals").delete().eq("id", dealId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/commission");
  redirect("/leads");
}

/** Permanently deletes a contact and its activity log. Used for cleaning up test data. */
export async function deleteContactAction(formData: FormData) {
  const contactId = str(formData, "contact_id")!;
  const supabase = await createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/contacts");
  redirect("/contacts");
}
