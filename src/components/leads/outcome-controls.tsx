"use client";

import { setDealOutcomeAction } from "@/lib/actions";
import { useState } from "react";

export function OutcomeControls({ dealId }: { dealId: string }) {
  const [showLostForm, setShowLostForm] = useState(false);

  if (showLostForm) {
    return (
      <form action={setDealOutcomeAction} className="flex items-center gap-2">
        <input type="hidden" name="deal_id" value={dealId} />
        <input type="hidden" name="outcome" value="lost" />
        <input
          type="text"
          name="lost_reason"
          placeholder="Why was it lost?"
          autoFocus
          required
          className="text-xs border border-line rounded px-2 py-1.5 bg-paper-raised w-48"
        />
        <button type="submit" className="text-xs px-3 py-1.5 rounded bg-alert text-white">
          Confirm lost
        </button>
        <button
          type="button"
          onClick={() => setShowLostForm(false)}
          className="text-xs text-ink-dim hover:text-ink"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <form action={setDealOutcomeAction}>
        <input type="hidden" name="deal_id" value={dealId} />
        <input type="hidden" name="outcome" value="won" />
        <button
          type="submit"
          className="text-xs px-3 py-1.5 rounded bg-signal text-panel font-medium hover:opacity-90"
        >
          Mark won
        </button>
      </form>
      <button
        onClick={() => setShowLostForm(true)}
        className="text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-alert hover:text-alert"
      >
        Mark lost
      </button>
    </div>
  );
}
