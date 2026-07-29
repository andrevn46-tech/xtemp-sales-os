import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button, ButtonLink } from "@/components/ui/button";
import { INDUSTRY_META, SALE_TYPE_META, contactSourcesFor } from "@/lib/constants";
import { updateContactAction } from "@/lib/actions";
import { getContact, getOrganizations, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Industry, SaleType } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  let contact;
  try {
    ({ contact } = await getContact(supabase, workspace.id, id));
  } catch {
    notFound();
  }
  if (!contact) notFound();

  const sources = contactSourcesFor(slug);
  const organizations = workspace.requires_organization ? await getOrganizations(supabase, workspace.id) : [];

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Edit {contact.name}</h1>
      <p className="text-sm text-ink-dim mb-6">
        Update their details. Next actions and activity history are edited from their own page,
        not here.
      </p>

      <form action={updateContactAction} className="flex flex-col gap-6">
        <input type="hidden" name="contact_id" value={contact.id} />
        <input type="hidden" name="workspace_slug" value={slug} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={contact.name} required />
          </Field>
          {workspace.requires_organization && (
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" defaultValue={contact.title ?? ""} placeholder="Optional" />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="text" defaultValue={contact.email ?? ""} placeholder="name@example.com" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ""} />
          </Field>
          {workspace.requires_organization && (
            <Field label="LinkedIn" htmlFor="linkedin_url" hint="Full profile URL">
              <Input id="linkedin_url" name="linkedin_url" defaultValue={contact.linkedin_url ?? ""} placeholder="https://linkedin.com/in/…" />
            </Field>
          )}
        </div>

        {workspace.requires_organization && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-semibold text-sm text-ink border-b border-line pb-2">
              Company
            </h2>
            <Field
              label="Company"
              htmlFor="existing_organization_id"
              hint="Change the selection, pick 'Remove company link', or leave as-is"
            >
              <Select id="existing_organization_id" name="existing_organization_id" defaultValue={contact.organization_id ?? ""}>
                <option value="">— Create new company below, or none —</option>
                {contact.organization_id && <option value="__remove__">✕ Remove company link</option>}
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.id === contact.organization_id ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="New company name" htmlFor="organization_name" hint="Only used if you didn't pick one above">
                <Input id="organization_name" name="organization_name" placeholder="e.g. Vibramech" />
              </Field>
              <Field label="Industry" htmlFor="industry" hint="For the new company, or as a fallback with no company">
                <Select id="industry" name="industry" defaultValue={contact.industry ?? ""}>
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
          <Select id="source" name="source" defaultValue={contact.source ?? ""}>
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
            <Select id="sale_type" name="sale_type" defaultValue={contact.sale_type ?? ""}>
              <option value="">Not sure yet</option>
              {(Object.keys(SALE_TYPE_META) as SaleType[]).map((st) => (
                <option key={st} value={st}>
                  {SALE_TYPE_META[st]}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Note" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={contact.notes ?? ""} />
        </Field>

        <div className="flex gap-3">
          <Button type="submit">Save changes</Button>
          <ButtonLink href={`/${slug}/contacts/${contact.id}`} variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
