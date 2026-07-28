"use client";

import { addContactActivityAction } from "@/lib/actions";
import { NEXT_ACTION_META, TECHNICAL_TAG_SUGGESTIONS } from "@/lib/constants";
import type { ActivityType, ContactStatus, NextActionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "demo", label: "Demo" },
  { value: "note", label: "Note" },
];

export function ContactActivityForm({
  contactId,
  suggestedType,
  suggestedDate,
}: {
  contactId: string;
  suggestedType: NextActionType;
  suggestedDate: string;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [setsNextAction, setSetsNextAction] = useState(true);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag("");
  }

  return (
    <form
      action={addContactActivityAction}
      className="flex flex-col gap-4 rounded-lg border border-line bg-paper-raised p-4"
    >
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="technical_tags" value={tags.join(",")} />

      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map((t) => (
          <label
            key={t.value}
            className="flex items-center gap-1.5 text-xs border border-line rounded-full px-3 py-1.5 cursor-pointer has-checked:border-ink has-checked:bg-line/40"
          >
            <input type="radio" name="type" value={t.value} defaultChecked={t.value === "call"} className="accent-signal" />
            {t.label}
          </label>
        ))}
      </div>

      <textarea
        name="notes"
        placeholder="What happened? Are they actually interested in anything?"
        required
        className="min-h-[80px] resize-y w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
      />

      <div>
        <span className="text-xs font-medium text-ink-dim block mb-1.5">Technical tags</span>
        <div className="flex flex-wrap gap-1.5">
          {TECHNICAL_TAG_SUGGESTIONS.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "text-[11px] rounded-full px-2.5 py-1 border transition-colors",
                tags.includes(tag)
                  ? "bg-wire text-white border-wire"
                  : "border-line text-ink-dim hover:border-ink"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="Add custom tag"
            className="text-xs border border-line rounded px-2 py-1 bg-paper flex-1"
          />
          <button type="button" onClick={addCustomTag} className="text-xs px-2 py-1 border border-line rounded text-ink-dim">
            Add
          </button>
        </div>
      </div>

      <div className="border-t border-line pt-3 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-ink-dim">
          <input
            type="checkbox"
            checked={setsNextAction}
            onChange={(e) => setSetsNextAction(e.target.checked)}
            className="accent-signal"
          />
          Set the next follow-up
        </label>

        {setsNextAction && (
          <div className="grid sm:grid-cols-2 gap-3 pl-6">
            <select
              name="next_action_type"
              defaultValue={suggestedType}
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper"
            >
              {(Object.keys(NEXT_ACTION_META) as NextActionType[]).map((t) => (
                <option key={t} value={t}>
                  {NEXT_ACTION_META[t]}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="next_action_date"
              defaultValue={suggestedDate}
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper"
            />
            <input
              type="text"
              name="next_action_note"
              placeholder="Note for next follow-up"
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper sm:col-span-2"
            />
          </div>
        )}

        <div className="pl-6">
          <span className="text-xs font-medium text-ink-dim block mb-1.5">Update status (optional)</span>
          <select name="new_status" defaultValue="" className="text-sm border border-line rounded-md px-3 py-2 bg-paper">
            <option value="">Keep current status</option>
            {(["new", "contacted", "qualifying"] as ContactStatus[]).map((s) => (
              <option key={s} value={s}>
                {s === "new" ? "New" : s === "contacted" ? "Contacted" : "Qualifying"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="self-start bg-ink text-paper text-sm font-medium px-4 py-2 rounded-md hover:bg-panel-raised transition-colors"
      >
        Log activity
      </button>
    </form>
  );
}
