import type { CommissionTier, SaleType } from "./types";

/** Tiers that apply to a given sale type — tiers with sale_type=null apply
 *  to every sale (used by workspaces like XTEMP that don't distinguish sale
 *  types at all). */
function tiersForSaleType(tiers: CommissionTier[], saleType: SaleType | null): CommissionTier[] {
  return tiers.filter((t) => t.sale_type === saleType || t.sale_type === null);
}

/** Finds the tier whose range contains this value, within the tiers that
 *  apply to this sale type. Tiers are flat-rate: the matched tier's rate (or
 *  flat amount) applies to the FULL value, not a marginal/bracket calculation. */
export function findTierForValue(
  value: number,
  tiers: CommissionTier[],
  saleType: SaleType | null = null
): CommissionTier | null {
  const candidates = tiersForSaleType(tiers, saleType);
  const sorted = [...candidates].sort((a, b) => a.sort_order - b.sort_order);
  for (const tier of sorted) {
    if (value >= tier.min_value && (tier.max_value === null || value <= tier.max_value)) {
      return tier;
    }
  }
  return null;
}

export interface ComputedCommission {
  rate: number | null; // null when the matched tier is a flat amount, not a percentage
  amount: number | null;
  tier: CommissionTier | null;
  isFlat: boolean;
}

export function computeCommission(
  value: number,
  tiers: CommissionTier[],
  saleType: SaleType | null = null
): ComputedCommission {
  const tier = findTierForValue(value, tiers, saleType);
  if (!tier) return { rate: null, amount: null, tier: null, isFlat: false };

  if (tier.flat_amount !== null) {
    return { rate: null, amount: tier.flat_amount, tier, isFlat: true };
  }

  const rate = tier.rate_percent ?? 0;
  const amount = Math.round(value * (rate / 100) * 100) / 100;
  return { rate, amount, tier, isFlat: false };
}

export function formatTierRange(tier: CommissionTier): string {
  const fmt = (n: number) => `R${n.toLocaleString("en-ZA")}`;
  if (tier.max_value === null) return `Above ${fmt(tier.min_value - 1)}`;
  return `${fmt(tier.min_value)} – ${fmt(tier.max_value)}`;
}
