"use client";

import { markContactNotAFitAction } from "@/lib/actions";

export function NotAFitButton({ contactId }: { contactId: string }) {
  return (
    <form action={markContactNotAFitAction}>
      <input type="hidden" name="contact_id" value={contactId} />
      <button
        type="submit"
        className="text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-alert hover:text-alert"
      >
        Not a fit
      </button>
    </form>
  );
}
