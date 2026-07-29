import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { INDUSTRY_META, NEXT_ACTION_META, SALE_TYPE_META, productLinesFor } from "@/lib/constants";
import { createDealAction } from "@/lib/actions";
import { getOrganizations, getPipelineStages, getWorkspace } from "@/lib/data";
import { suggestedFollowUpForStage } from "@/lib/stages";
import { createClient } from "@/lib/supabase/server";
import type { Industry, NextActionType, SaleType } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function NewDealPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const [organizations, stages] = await Promise.all([
    workspace.requires_organization ? getOrganizations(supabase, workspace.id) : Promise.resolve([]),
    getPipelineStages(supabase, workspace.id),
  ]);
  const suggestion = suggestedFollowUpForStage("new", stages);
  const productLines = productLinesFor(slug);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">New deal</h1>
      <p className="text-sm text-ink-dim mb-6">
        Every deal needs a next action before it&rsquo;s saved — that&rsquo;s the whole point.
      </p>

      <form action={createDealAction} className="flex flex-col gap-8">
        <input type="hidden" name="workspace_slug" value={slug} />

        {workspace.requires_organization && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
              Organization
            </h2>
            {organizations.length > 0 && (
              <Field
                label="Link to an existing organization instead"
                htmlFor="existing_organization_id"
                hint="Pick this if you already have this company in the system — new-org fields below will be ignored."
              >
                <Select id="existing_organization_id" name="existing_organization_id" defaultValue="">
                  <option value="">— Create a new organization —</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company name" htmlFor="organization_name" required>
                <Input id="organization_name" name="organization_name" placeholder="e.g. Vibramech" />
              </Field>
              <Field label="Industry" htmlFor="industry" required>
                <Select id="industry" name="industry" defaultValue="">
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
              <Field label="Website" htmlFor="website">
                <Input id="website" name="website" placeholder="https://…" />
              </Field>
              <Field label="City" htmlFor="city">
                <Input id="city" name="city" placeholder="e.g. Johannesburg" />
              </Field>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
            {workspace.requires_organization ? "Primary contact" : "Who's the deal with"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" htmlFor="contact_name" required={!workspace.requires_organization}>
              <Input id="contact_name" name="contact_name" placeholder="e.g. Julien Botha" required={!workspace.requires_organization} />
            </Field>
            <Field label="Title" htmlFor="contact_title">
              <Input id="contact_title" name="contact_title" placeholder={workspace.requires_organization ? "e.g. Test Engineer" : "Optional"} />
            </Field>
            <Field label="Email" htmlFor="contact_email">
              <Input id="contact_email" name="contact_email" type="email" />
            </Field>
            <Field label="Phone" htmlFor="contact_phone">
              <Input id="contact_phone" name="contact_phone" type="tel" />
            </Field>
            <Field label="LinkedIn" htmlFor="contact_linkedin" hint="Full profile URL">
              <Input id="contact_linkedin" name="contact_linkedin" placeholder="https://linkedin.com/in/…" />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
            Deal
          </h2>
          <Field label="Deal title" htmlFor="title" required hint="What are they buying — keep it short.">
            <Input id="title" name="title" placeholder="e.g. SIRIUS XHS for NVH test rig" required />
          </Field>
          {workspace.tracks_sale_type && (
            <Field label="Sale type" htmlFor="sale_type" required hint="Drives which commission rate applies">
              <Select id="sale_type" name="sale_type" defaultValue="" required>
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
                    className="flex items-center gap-1.5 text-xs border border-line rounded-full px-3 py-1.5 cursor-pointer hover:border-ink"
                  >
                    <input type="checkbox" name="product_lines" value={p} className="accent-signal" />
                    {p}
                  </label>
                ))}
              </div>
            </Field>
          )}
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Estimated value" htmlFor="estimated_value_zar" hint="ZAR">
              <Input id="estimated_value_zar" name="estimated_value_zar" type="number" min="0" step="1000" />
            </Field>
            <Field label="Win probability" htmlFor="probability" hint="%">
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={20}
              />
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
            Next action
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Action type" htmlFor="next_action_type" required>
              <Select id="next_action_type" name="next_action_type" defaultValue={suggestion.type}>
                {(Object.keys(NEXT_ACTION_META) as NextActionType[]).map((t) => (
                  <option key={t} value={t}>
                    {NEXT_ACTION_META[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date" htmlFor="next_action_date" required>
              <Input
                id="next_action_date"
                name="next_action_date"
                type="date"
                defaultValue={suggestion.date}
                required
              />
            </Field>
          </div>
          <Field label="Note" htmlFor="next_action_note" hint="What exactly needs to happen?">
            <Textarea id="next_action_note" name="next_action_note" placeholder="e.g. Call to confirm budget owner" />
          </Field>
        </section>

        <div className="flex gap-3">
          <Button type="submit">Save deal</Button>
        </div>
      </form>
    </div>
  );
}
