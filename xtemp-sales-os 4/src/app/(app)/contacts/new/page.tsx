import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { INDUSTRY_META, NEXT_ACTION_META, suggestedContactFollowUp } from "@/lib/constants";
import { createContactAction } from "@/lib/actions";
import type { Industry, NextActionType } from "@/lib/types";

export default function NewContactPage() {
  const suggestion = suggestedContactFollowUp();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">New contact</h1>
      <p className="text-sm text-ink-dim mb-6">
        For anyone you&rsquo;ve spoken to — no company or specific deal needed yet. Promote them
        to a real deal later once there&rsquo;s an actual opportunity.
      </p>

      <form action={createContactAction} className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Thabo Nkosi" required />
          </Field>
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" placeholder="e.g. Maintenance Manager" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin_url" hint="Full profile URL">
            <Input id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label="Industry" htmlFor="industry" hint="If you know it — company isn't required">
            <Select id="industry" name="industry" defaultValue="">
              <option value="">Not sure yet</option>
              {(Object.keys(INDUSTRY_META) as Industry[]).map((i) => (
                <option key={i} value={i}>
                  {INDUSTRY_META[i]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="How did you meet them?" htmlFor="source">
          <Select id="source" name="source" defaultValue="">
            <option value="">Select…</option>
            <option value="cold_outreach">Cold outreach</option>
            <option value="referral">Referral</option>
            <option value="trade_event">Trade event</option>
            <option value="inbound">Inbound</option>
            <option value="walk_in">Walk-in / on-site visit</option>
          </Select>
        </Field>

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
