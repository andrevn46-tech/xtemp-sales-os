import type { CommissionTier } from "./types";

/** Finds the tier whose range contains this value. Tiers are flat-rate: the
 *  matched tier's rate applies to the FULL value, not a marginal/bracket
 *  calculation. */
export function findTierForValue(value: number, tiers: CommissionTier[]): CommissionTier | null {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  for (const tier of sorted) {
    if (value >= tier.min_value && (tier.max_value === null || value <= tier.max_value)) {
      return tier;
    }
  }
  return null;
}

export function computeCommission(
  value: number,
  tiers: CommissionTier[]
): { rate: number | null; amount: number | null; tier: CommissionTier | null } {
  const tier = findTierForValue(value, tiers);
  if (!tier) return { rate: null, amount: null, tier: null };
  const amount = Math.round(value * (tier.rate_percent / 100) * 100) / 100;
  return { rate: tier.rate_percent, amount, tier };
}

export function formatTierRange(tier: CommissionTier): string {
  const fmt = (n: number) => `R${n.toLocaleString("en-ZA")}`;
  if (tier.max_value === null) return `Above ${fmt(tier.min_value - 1)}`;
  return `${fmt(tier.min_value)} – ${fmt(tier.max_value)}`;
}
