"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { promoteContactAction } from "@/lib/actions";
import { INDUSTRY_META, NEXT_ACTION_META, SALE_TYPE_META, productLinesFor } from "@/lib/constants";
import { suggestedFollowUpForStage } from "@/lib/stages";
import type { Industry, NextActionType, Organization, PipelineStage, SaleType } from "@/lib/types";
import { useState } from "react";

export function PromoteForm({
  contactId,
  contactName,
  workspaceSlug,
  requiresOrganization,
  tracksSaleType,
  knownSaleType,
  organizations,
  knownIndustry,
  stages,
}: {
  contactId: string;
  contactName: string;
  workspaceSlug: string;
  requiresOrganization: boolean;
  tracksSaleType: boolean;
  knownSaleType: SaleType | null;
  organizations: Organization[];
  knownIndustry: Industry | null;
  stages: PipelineStage[];
}) {
  const [open, setOpen] = useState(false);
  const suggestion = suggestedFollowUpForStage("new", stages);
  const productLines = productLinesFor(workspaceSlug);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded bg-signal text-panel font-medium hover:opacity-90"
      >
        Promote to deal
      </button>
    );
  }

  return (
    <form
      action={promoteContactAction}
      className="flex flex-col gap-4 rounded-lg border border-signal bg-signal-dim/30 p-4 mt-3"
    >
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="workspace_slug" value={workspaceSlug} />
      <p className="text-sm font-medium text-ink">Promote {contactName} to a real deal</p>

      {requiresOrganization && (
        <>
          {organizations.length > 0 && (
            <Field label="Company" htmlFor="existing_organization_id" hint="Pick an existing one, or fill in a new company below">
              <Select id="existing_organization_id" name="existing_organization_id" defaultValue="">
                <option value="">— New company —</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Company name" htmlFor="organization_name">
              <Input id="organization_name" name="organization_name" placeholder="Only if new" />
            </Field>
            <Field label="Industry" htmlFor="industry">
              <Select id="industry" name="industry" defaultValue={knownIndustry ?? ""}>
                <option value="" disabled>
                  Select an industry
                </option>
                {(Object.keys(INDUSTRY_META) as Industry[]).map((i) => (
                  <option key={i} value={i}>
                    {INDUSTRY_META[i]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </>
      )}

      <Field label="Deal title" htmlFor="title" required hint="What are they buying — keep it short.">
        <Input id="title" name="title" placeholder="e.g. SIRIUS XHS for NVH test rig" required />
      </Field>

      {tracksSaleType && (
        <Field label="Sale type" htmlFor="sale_type" required hint="Drives which commission rate applies">
          <Select id="sale_type" name="sale_type" defaultValue={knownSaleType ?? ""} required>
            <option value="" disabled>
              Select…
            </option>
            {(Object.keys(SALE_TYPE_META) as SaleType[]).map((st) => (
              <option key={st} value={st}>
                {SALE_TYPE_META[st]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {productLines.length > 0 && (
        <Field label="Product lines" htmlFor="product_lines">
          <div className="flex flex-wrap gap-2">
            {productLines.map((p) => (
              <label
                key={p}
                className="flex items-center gap-1.5 text-xs border border-line rounded-full px-3 py-1.5 cursor-pointer hover:border-ink bg-paper-raised"
              >
                <input type="checkbox" name="product_lines" value={p} className="accent-signal" />
                {p}
              </label>
            ))}
          </div>
        </Field>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Estimated value" htmlFor="estimated_value_zar" hint="ZAR">
          <Input id="estimated_value_zar" name="estimated_value_zar" type="number" min="0" step="1000" />
        </Field>
        <Field label="Win probability" htmlFor="probability" hint="%">
          <Input id="probability" name="probability" type="number" min="0" max="100" defaultValue={20} />
        </Field>
        <Field label="Source" htmlFor="source">
          <Select id="source" name="source" defaultValue="">
            <option value="">Select…</option>
            <option value="cold_outreach">Cold outreach</option>
            <option value="referral">Referral</option>
            <option value="trade_event">Trade event</option>
            <option value="inbound">Inbound</option>
            <option value="existing_client">Existing client</option>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Next action" htmlFor="next_action_type" required>
          <Select id="next_action_type" name="next_action_type" defaultValue={suggestion.type}>
            {(Object.keys(NEXT_ACTION_META) as NextActionType[]).map((t) => (
              <option key={t} value={t}>
                {NEXT_ACTION_META[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="next_action_date" required>
          <Input id="next_action_date" name="next_action_date" type="date" defaultValue={suggestion.date} required />
        </Field>
      </div>
      <Field label="Note" htmlFor="next_action_note">
        <Textarea id="next_action_note" name="next_action_note" placeholder="What exactly needs to happen?" />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className="text-sm px-4 py-2 rounded-md bg-signal text-panel font-medium hover:opacity-90">
          Create deal
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm px-4 py-2 rounded-md border border-line text-ink-dim hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
