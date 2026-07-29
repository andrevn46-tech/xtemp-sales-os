"use client";

import { saveCommissionTiersAction } from "@/lib/actions";
import { SALE_TYPE_META } from "@/lib/constants";
import type { CommissionTier, SaleType } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Row = {
  saleType: string; // "" = applies to every sale
  min: string;
  max: string;
  mode: "rate" | "flat";
  value: string;
};

function tierToRow(t: CommissionTier): Row {
  return {
    saleType: t.sale_type ?? "",
    min: String(t.min_value),
    max: t.max_value === null ? "" : String(t.max_value),
    mode: t.flat_amount !== null ? "flat" : "rate",
    value: t.flat_amount !== null ? String(t.flat_amount) : String(t.rate_percent ?? ""),
  };
}

export function TierEditor({
  tiers,
  workspaceSlug,
  tracksSaleType,
}: {
  tiers: CommissionTier[];
  workspaceSlug: string;
  tracksSaleType: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    tiers.length > 0
      ? tiers.map(tierToRow)
      : tracksSaleType
      ? []
      : [{ saleType: "", min: "0", max: "", mode: "rate", value: "" }]
  );

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow(saleType: string) {
    setRows((prev) => [...prev, { saleType, min: "", max: "", mode: "rate", value: "" }]);
  }

  function removeRow(globalIndex: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== globalIndex));
  }

  function renderTable(saleType: string, label: string) {
    const indexed = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.saleType === saleType);

    return (
      <div key={saleType || "generic"} className="flex flex-col gap-2">
        {label && <h3 className="text-sm font-medium text-ink">{label}</h3>}
        <div className="rounded-lg border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-dim border-b border-line bg-paper">
                <th className="px-3 py-2 font-medium">From (ZAR)</th>
                <th className="px-3 py-2 font-medium">To — blank means no limit</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {indexed.map(({ r, i }) => (
                <tr key={i} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      name="tier_min"
                      value={r.min}
                      onChange={(e) => updateRow(i, "min", e.target.value)}
                      className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      name="tier_max"
                      value={r.max}
                      onChange={(e) => updateRow(i, "max", e.target.value)}
                      placeholder="No limit"
                      className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      name="tier_mode"
                      value={r.mode}
                      onChange={(e) => updateRow(i, "mode", e.target.value as Row["mode"])}
                      className="text-sm border border-line rounded px-2 py-1.5 bg-paper-raised"
                    >
                      <option value="rate">Rate %</option>
                      <option value="flat">Flat R</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      name="tier_value"
                      step="0.01"
                      value={r.value}
                      onChange={(e) => updateRow(i, "value", e.target.value)}
                      placeholder={r.mode === "flat" ? "e.g. 350" : "e.g. 2.00"}
                      className="w-full text-sm border border-line rounded px-2 py-1.5 bg-paper-raised font-mono"
                      required
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input type="hidden" name="tier_sale_type" value={r.saleType} />
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
              {indexed.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-xs text-ink-dim">
                    No tiers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => addRow(saleType)}
          className="self-start flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-ink hover:text-ink"
        >
          <Plus size={13} /> Add tier
        </button>
      </div>
    );
  }

  return (
    <form action={saveCommissionTiersAction} className="flex flex-col gap-6">
      <input type="hidden" name="workspace_slug" value={workspaceSlug} />

      {tracksSaleType
        ? (Object.keys(SALE_TYPE_META) as SaleType[]).map((st) => renderTable(st, SALE_TYPE_META[st]))
        : renderTable("", "")}

      <button
        type="submit"
        className="self-start text-sm px-4 py-2 rounded-md bg-ink text-paper font-medium hover:bg-panel-raised"
      >
        Save rate table
      </button>
    </form>
  );
}
