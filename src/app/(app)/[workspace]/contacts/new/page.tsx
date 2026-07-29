import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { INDUSTRY_META, NEXT_ACTION_META, SALE_TYPE_META, contactSourcesFor, suggestedContactFollowUp } from "@/lib/constants";
import { createContactAction } from "@/lib/actions";
import { getOrganizations, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Industry, NextActionType, SaleType } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function NewContactPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const suggestion = suggestedContactFollowUp();
  const sources = contactSourcesFor(slug);
  const organizations = workspace.requires_organization ? await getOrganizations(supabase, workspace.id) : [];

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">New contact</h1>
      <p className="text-sm text-ink-dim mb-6">
        For anyone you&rsquo;ve spoken to — no company or specific deal needed yet. Promote them
        to a real deal later once there&rsquo;s an actual opportunity.
        {workspace.tracks_sale_type && (
          <span className="block mt-1 text-amber">
            Log them now — commission is only paid on leads recorded before the sale.
          </span>
        )}
      </p>

      <form action={createContactAction} className="flex flex-col gap-6">
        <input type="hidden" name="workspace_slug" value={slug} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Thabo Nkosi" required />
          </Field>
          {workspace.requires_organization && (
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" placeholder="Optional" />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="text" placeholder="name@example.com" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" />
          </Field>
          {workspace.requires_organization && (
            <Field label="LinkedIn" htmlFor="linkedin_url" hint="Full profile URL">
              <Input id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/…" />
            </Field>
          )}
        </div>

        {workspace.requires_organization && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
              Company <span className="font-normal text-ink-dim">(optional — can add later)</span>
            </h2>
            {organizations.length > 0 && (
              <Field
                label="Link to an existing company"
                htmlFor="existing_organization_id"
                hint="Pick this if you already have this company in the system — new-company fields below will be ignored."
              >
                <Select id="existing_organization_id" name="existing_organization_id" defaultValue="">
                  <option value="">— New company, or none yet —</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company name" htmlFor="organization_name" hint="Leave blank if you don't know it yet">
                <Input id="organization_name" name="organization_name" placeholder="e.g. Vibramech" />
              </Field>
              <Field label="Industry" htmlFor="industry">
                <Select id="industry" name="industry" defaultValue="">
                  <option value="">Not sure yet</option>
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

        <Field label="How did you meet them?" htmlFor="source">
          <Select id="source" name="source" defaultValue="">
            <option value="">Select…</option>
            {sources.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        {workspace.tracks_sale_type && (
          <Field label="What are they looking for?" htmlFor="sale_type">
            <Select id="sale_type" name="sale_type" defaultValue="">
              <option value="">Not sure yet</option>
              {(Object.keys(SALE_TYPE_META) as SaleType[]).map((st) => (
                <option key={st} value={st}>
                  {SALE_TYPE_META[st]}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Note" htmlFor="notes" hint="What did you talk about?">
          <Textarea id="notes" name="notes" placeholder="e.g. Interested in vibration monitoring, budget unclear" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-line pt-4">
          <Field label="Follow up with" htmlFor="next_action_type" required>
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
          <Field
            label="Follow-up note"
            htmlFor="next_action_note"
            hint="Optional"
          >
            <Input id="next_action_note" name="next_action_note" placeholder="e.g. Check if budget approved" />
          </Field>
        </div>

        <div>
          <Button type="submit">Save contact</Button>
        </div>
      </form>
    </div>
  );
}
