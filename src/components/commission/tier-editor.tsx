"use client";

import { saveCommissionTiersAction } from "@/lib/actions";
import type { CommissionTier } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Row = { min_value: string; max_value: string; rate_percent: string };

export function TierEditor({ tiers }: { tiers: CommissionTier[] }) {
  const [rows, setRows] = useState<Row[]>(
    tiers.length > 0
      ? tiers.map((t) => ({
          min_value: String(t.min_value),
          max_value: t.max_value === null ? "" : String(t.max_value),
          rate_percent: String(t.rate_percent),
        }))
      : [{ min_value: "0", max_value: "", rate_percent: "" }]
  );

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { min_value: "", max_value: "", rate_percent: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={saveCommissionTiersAction} className="flex flex-col gap-4">
      <div className="rounded-lg border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line bg-paper">
              <th className="px-4 py-2 font-medium">From (ZAR)</th>
              <th className="px-4 py-2 font-medium">To (ZAR) — blank means no limit</th>
              <th className="px-4 py-2 font-medium">Rate (%)</th>
              <th className="px-4 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2">
                  <input
                    type="number"
                    name="tier_min"
                    value={row.min_value}
                    onChange={(e) => updateRow(i, "min_value", e.target.value)}
                    className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                    required
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    name="tier_max"
                    value={row.max_value}
                    onChange={(e) => updateRow(i, "max_value", e.target.value)}
                    placeholder="No limit"
                    className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    name="tier_rate"
                    step="0.01"
                    value={row.rate_percent}
                    onChange={(e) => updateRow(i, "rate_percent", e.target.value)}
                    className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                    required
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-ink-dim hover:text-alert"
                    aria-label="Remove tier"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-ink hover:text-ink"
        >
          <Plus size={13} /> Add tier
        </button>
        <button
          type="submit"
          className="text-sm px-4 py-2 rounded-md bg-ink text-paper font-medium hover:bg-panel-raised"
        >
          Save rate table
        </button>
      </div>
    </form>
  );
}
