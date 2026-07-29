"use client";

import { setDealOutcomeAction } from "@/lib/actions";
import { computeCommission, formatTierRange } from "@/lib/commissions";
import { SALE_TYPE_META } from "@/lib/constants";
import type { CommissionTier, SaleType } from "@/lib/types";
import { useMemo, useState } from "react";

export function OutcomeControls({
  dealId,
  estimatedValue,
  tiers,
  workspaceSlug,
  tracksSaleType,
  dealSaleType,
}: {
  dealId: string;
  estimatedValue: number | null;
  tiers: CommissionTier[];
  workspaceSlug: string;
  tracksSaleType: boolean;
  dealSaleType: SaleType | null;
}) {
  const [mode, setMode] = useState<"idle" | "won" | "lost">("idle");
  const [actualValue, setActualValue] = useState(estimatedValue ? String(estimatedValue) : "");
  const [saleType, setSaleType] = useState<string>(dealSaleType ?? "");
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [amountOverride, setAmountOverride] = useState<string | null>(null);

  const computed = useMemo(() => {
    const v = Number(actualValue);
    if (!Number.isFinite(v) || v <= 0) return { rate: null, amount: null, tier: null, isFlat: false };
    return computeCommission(v, tiers, (saleType || null) as SaleType | null);
  }, [actualValue, tiers, saleType]);

  const effectiveRate = rateOverride ?? (computed.rate !== null ? String(computed.rate) : "");
  const effectiveAmount = amountOverride ?? (computed.amount !== null ? String(computed.amount) : "");

  if (mode === "lost") {
    return (
      <form action={setDealOutcomeAction} className="flex items-center gap-2">
        <input type="hidden" name="deal_id" value={dealId} />
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
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
        <button type="button" onClick={() => setMode("idle")} className="text-xs text-ink-dim hover:text-ink">
          Cancel
        </button>
      </form>
    );
  }

  if (mode === "won") {
    return (
      <form
        action={setDealOutcomeAction}
        className="flex flex-col gap-3 rounded-lg border border-signal bg-signal-dim/30 p-4 w-full sm:w-96"
      >
        <input type="hidden" name="deal_id" value={dealId} />
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="outcome" value="won" />
        <p className="text-sm font-medium text-ink">Confirm the win</p>

        {tracksSaleType && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-dim">Sale type</span>
            <select
              name="sale_type"
              value={saleType}
              onChange={(e) => {
                setSaleType(e.target.value);
                setRateOverride(null);
                setAmountOverride(null);
              }}
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
              required
            >
              <option value="" disabled>
                Select…
              </option>
              {(Object.keys(SALE_TYPE_META) as SaleType[]).map((st) => (
                <option key={st} value={st}>
                  {SALE_TYPE_META[st]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-dim">Actual sale value (ZAR)</span>
          <input
            type="number"
            name="actual_value_zar"
            min="0"
            step="1000"
            required
            value={actualValue}
            onChange={(e) => {
              setActualValue(e.target.value);
              setRateOverride(null);
              setAmountOverride(null);
            }}
            className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised"
          />
        </label>

        {computed.tier && (
          <p className="text-xs text-ink-dim">
            Falls in tier <span className="text-ink font-medium">{formatTierRange(computed.tier)}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {!computed.isFlat && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-dim">Rate (%)</span>
              <input
                type="number"
                name="commission_rate_percent"
                min="0"
                step="0.01"
                value={effectiveRate}
                onChange={(e) => setRateOverride(e.target.value)}
                className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised font-mono"
              />
            </label>
          )}
          <label className={computed.isFlat ? "col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}>
            <span className="text-xs text-ink-dim">Commission (ZAR)</span>
            <input
              type="number"
              name="commission_amount_zar"
              min="0"
              step="1"
              value={effectiveAmount}
              onChange={(e) => setAmountOverride(e.target.value)}
              className="text-sm border border-line rounded-md px-3 py-2 bg-paper-raised font-mono"
            />
          </label>
        </div>
        <p className="text-[11px] text-ink-dim">
          {computed.isFlat
            ? "Flat amount from your commission rate table — override if this one's a manual exception."
            : "Auto-calculated from your commission tier table — override either field if this one's different."}
        </p>

        <div className="flex gap-2">
          <button type="submit" className="text-sm px-4 py-2 rounded-md bg-signal text-panel font-medium hover:opacity-90">
            Confirm won
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="text-sm px-4 py-2 rounded-md border border-line text-ink-dim hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode("won")}
        className="text-xs px-3 py-1.5 rounded bg-signal text-panel font-medium hover:opacity-90"
      >
        Mark won
      </button>
      <button
        onClick={() => setMode("lost")}
        className="text-xs px-3 py-1.5 rounded border border-line text-ink-dim hover:border-alert hover:text-alert"
      >
        Mark lost
      </button>
    </div>
  );
}
