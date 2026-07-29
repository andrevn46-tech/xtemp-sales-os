import { ContactStatusBadge } from "@/components/contacts/contact-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT_STATUS_META, SALE_TYPE_META } from "@/lib/constants";
import { getAllContacts, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { relativeDayLabel, isOverdue, isDueToday, cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContactStatus } from "@/lib/types";

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const contacts = await getAllContacts(supabase, workspace.id, { status: sp.status, search: sp.q });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Contacts</h1>
          <p className="text-sm text-ink-dim mt-0.5">
            Everyone you&rsquo;ve spoken to — {contacts.length} total. Promote the ones that turn real into a deal.
          </p>
        </div>
        <ButtonLink href={`/${slug}/contacts/new`}>New contact</ButtonLink>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name…"
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised flex-1 min-w-[200px]"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
        >
          <option value="">All statuses</option>
          {(Object.keys(CONTACT_STATUS_META) as ContactStatus[]).map((s) => (
            <option key={s} value={s}>
              {CONTACT_STATUS_META[s].label}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm px-4 py-2 rounded-md border border-line hover:border-ink">
          Filter
        </button>
        {(sp.status || sp.q) && (
          <Link href={`/${slug}/contacts`} className="text-sm px-4 py-2 text-ink-dim hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-lg border border-line bg-paper-raised overflow-hidden">
        {contacts.length === 0 ? (
          <EmptyState
            title="No contacts match"
            body="Log the next person you speak to here — no company or deal required yet."
            action={<ButtonLink href={`/${slug}/contacts/new`}>New contact</ButtonLink>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line">
                <th className="px-5 py-3 font-medium">Name</th>
                {workspace.requires_organization && <th className="px-5 py-3 font-medium">Company</th>}
                {workspace.tracks_sale_type && <th className="px-5 py-3 font-medium">Looking for</th>}
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const overdue = isOverdue(contact.next_action_date);
                const dueToday = isDueToday(contact.next_action_date);
                return (
                  <tr key={contact.id} className="border-b border-line last:border-b-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link href={`/${slug}/contacts/${contact.id}`} className="font-medium text-ink hover:underline">
                        {contact.name}
                      </Link>
                      {contact.title && <div className="text-xs text-ink-dim">{contact.title}</div>}
                    </td>
                    {workspace.requires_organization && (
                      <td className="px-5 py-3 text-ink-dim text-xs">{contact.organization?.name ?? "—"}</td>
                    )}
                    {workspace.tracks_sale_type && (
                      <td className="px-5 py-3 text-ink-dim text-xs">
                        {contact.sale_type ? SALE_TYPE_META[contact.sale_type] : "—"}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <ContactStatusBadge status={contact.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-dim text-xs capitalize">
                      {contact.source?.replace("_", " ") ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 font-mono text-xs font-medium",
                        overdue ? "text-alert" : dueToday ? "text-amber" : "text-ink-dim"
                      )}
                    >
                      {relativeDayLabel(contact.next_action_date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
