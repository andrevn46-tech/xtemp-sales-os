"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteButton({
  action,
  idFieldName,
  idValue,
  extraFields = {},
  label = "Delete",
  confirmLabel = "Permanently delete?",
}: {
  action: (formData: FormData) => void;
  idFieldName: string;
  idValue: string;
  extraFields?: Record<string, string>;
  label?: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name={idFieldName} value={idValue} />
        {Object.entries(extraFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <span className="text-xs text-alert">{confirmLabel}</span>
        <button type="submit" className="text-xs px-3 py-1.5 rounded bg-alert text-white font-medium">
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-ink-dim hover:text-ink"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-alert hover:text-alert"
    >
      <Trash2 size={13} />
      {label}
    </button>
  );
}
