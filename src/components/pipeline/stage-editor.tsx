"use client";

import { savePipelineStagesAction } from "@/lib/actions";
import { NEXT_ACTION_META } from "@/lib/constants";
import type { NextActionType, PipelineStage } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Row = {
  key: string;
  label: string;
  color: "wire" | "amber" | "signal";
  days: string;
  type: NextActionType;
};

export function StageEditor({ stages, workspaceSlug }: { stages: PipelineStage[]; workspaceSlug: string }) {
  const [rows, setRows] = useState<Row[]>(
    stages.length > 0
      ? [...stages]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s) => ({
            key: s.key,
            label: s.label,
            color: s.color,
            days: String(s.default_followup_days),
            type: s.default_followup_type,
          }))
      : [{ key: "new", label: "New", color: "wire", days: "2", type: "call" }]
  );

  function updateRow<K extends keyof Row>(i: number, field: K, value: Row[K]) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { key: "", label: "", color: "wire", days: "3", type: "call" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={savePipelineStagesAction} className="flex flex-col gap-4">
      <input type="hidden" name="workspace_slug" value={workspaceSlug} />

      <div className="rounded-lg border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line bg-paper">
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Colour</th>
              <th className="px-3 py-2 font-medium">Default follow-up</th>
              <th className="px-3 py-2 font-medium">After</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line last:border-b-0">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    name="stage_label"
                    value={row.label}
                    onChange={(e) => {
                      updateRow(i, "label", e.target.value);
                      updateRow(i, "key", e.target.value.trim().toLowerCase().replace(/\s+/g, "_"));
                    }}
                    placeholder="e.g. Pending"
                    className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised"
                    required
                  />
                  <input type="hidden" name="stage_key" value={row.key} />
                </td>
                <td className="px-3 py-2">
                  <select
                    name="stage_color"
                    value={row.color}
                    onChange={(e) => updateRow(i, "color", e.target.value as Row["color"])}
                    className="text-sm border border-line rounded px-2 py-1.5 bg-paper-raised"
                  >
                    <option value="wire">Blue</option>
                    <option value="amber">Amber</option>
                    <option value="signal">Green</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    name="stage_type"
                    value={row.type}
                    onChange={(e) => updateRow(i, "type", e.target.value as NextActionType)}
                    className="text-sm border border-line rounded px-2 py-1.5 bg-paper-raised"
                  >
                    {(Object.keys(NEXT_ACTION_META) as NextActionType[]).map((t) => (
                      <option key={t} value={t}>
                        {NEXT_ACTION_META[t]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      name="stage_days"
                      min="0"
                      value={row.days}
                      onChange={(e) => updateRow(i, "days", e.target.value)}
                      className="w-16 text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                    />
                    <span className="text-xs text-ink-dim">days</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-ink-dim hover:text-alert"
                    aria-label="Remove stage"
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
          <Plus size={13} /> Add stage
        </button>
        <button type="submit" className="text-sm px-4 py-2 rounded-md bg-ink text-paper font-medium hover:bg-panel-raised">
          Save stages
        </button>
      </div>
    </form>
  );
}
