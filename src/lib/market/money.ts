/** Money is integer kobo. 100 kobo = ₦1. Never use binary floats for prices. */

export type TrustedItem = {
  productId: string;
  variantId: string | null;
  retailerId: string;
  retailerName: string;
  retailerStatus: string;
  productStatus: string;
  name: string;
  variantLabel: string | null;
  unitKobo: number;
  qty: number;
  stock: number;
  commissionBps: number;
  returnEligible: boolean;
};

export type PricedLine = TrustedItem & {
  lineKobo: number;
  commissionKobo: number;
};

export type CheckoutDraft = {
  lines: PricedLine[];
  retailerIds: string[];
  subtotalKobo: number;
  discountKobo: number;
  deliveryFeeEach: number | null;
  deliveryKobo: number | null;
  totalKobo: number | null;
  issues: string[];
};

export type CommissionRule = {
  id: string;
  scope: string;
  categoryId: string | null;
  retailerId: string | null;
  bps: number;
  effectiveFrom: string;
  active: boolean;
};

export function lagosToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatLagos(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatNaira(kobo: number): string {
  const whole = kobo % 100 === 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(kobo / 100);
}

export function nairaToKobo(input: string): number {
  const cleaned = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error("Enter a valid amount in naira");
  }
  const [naira, frac = ""] = cleaned.split(".");
  const padded = `${frac}00`.slice(0, 2);
  const kobo = Number(naira) * 100 + Number(padded);
  if (!Number.isSafeInteger(kobo) || kobo < 0) throw new Error("Amount is out of range");
  return kobo;
}

/** Percent with at most one decimal. 10.5 → 1050 basis points (10.50%). */
export function percentToBps(input: string): number {
  const cleaned = input.trim();
  if (!/^\d{1,3}(\.\d)?$/.test(cleaned)) throw new Error("Enter a percentage such as 10 or 12.5");
  const [whole, frac = "0"] = cleaned.split(".");
  const bps = Number(whole) * 100 + Number(frac) * 10;
  if (bps < 0 || bps > 10000) throw new Error("Commission must be between 0 and 100");
  return bps;
}

export function bpsToPercent(bps: number): string {
  const whole = Math.floor(bps / 100);
  const frac = Math.floor((bps % 100) / 10);
  return frac === 0 ? String(whole) : `${whole}.${frac}`;
}

export function commissionKobo(lineKobo: number, bps: number): number {
  if (!Number.isInteger(lineKobo) || lineKobo < 0) throw new Error("Invalid line amount");
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) throw new Error("Invalid commission rate");
  return Math.round((lineKobo * bps) / 10000);
}

export function settlementKobo(
  productKobo: number,
  commission: number,
  refundKobo: number,
  otherKobo = 0,
): number {
  if (refundKobo < 0 || refundKobo > productKobo) throw new Error("Invalid refund");
  const reversal = productKobo === 0 ? 0 : Math.round((commission * refundKobo) / productKobo);
  return productKobo - commission - refundKobo + reversal + otherKobo;
}

export function pickCommission(
  rules: CommissionRule[],
  args: { retailerId: string; categoryId: string | null; on: string },
): { id: string; bps: number } {
  const eligible = rules.filter((rule) => rule.active && rule.effectiveFrom <= args.on);
  const rank = (rule: CommissionRule) => {
    if (rule.scope === "retailer" && rule.retailerId === args.retailerId) return 0;
    if (rule.scope === "category" && rule.categoryId && rule.categoryId === args.categoryId) return 1;
    if (rule.scope === "default") return 2;
    return 9;
  };
  const sorted = eligible
    .filter((rule) => rank(rule) < 9)
    .sort((a, b) => rank(a) - rank(b) || (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  const winner = sorted[0];
  if (!winner) throw new Error("No commission rule is configured");
  return { id: winner.id, bps: winner.bps };
}

export function chooseDeliveryFee(
  zones: { state: string; city: string; feeKobo: number }[],
  state: string,
  city: string,
): number | null {
  const cityHit = zones.find(
    (zone) => zone.state === state && zone.city !== "" && zone.city.toLowerCase() === city.toLowerCase(),
  );
  if (cityHit) return cityHit.feeKobo;
  const stateHit = zones.find((zone) => zone.state === state && zone.city === "");
  return stateHit ? stateHit.feeKobo : null;
}

export function discountKobo(subtotal: number, bps: number, minSubtotal = 0): number {
  if (bps <= 0 || subtotal < minSubtotal) return 0;
  return Math.min(subtotal, Math.round((subtotal * bps) / 10000));
}

export function buildCheckoutDraft(args: {
  items: TrustedItem[];
  deliveryFeeEach: number | null;
  discountBps: number;
  minSubtotalKobo?: number;
}): CheckoutDraft {
  const issues: string[] = [];
  if (args.items.length === 0) issues.push("Your cart is empty");
  const lines: PricedLine[] = [];
  for (const item of args.items) {
    if (item.productStatus === "needs_variant") {
      issues.push(`Choose an option for ${item.name}`);
      continue;
    }
    if (item.productStatus === "bad_variant") {
      issues.push(`That option is not available for ${item.name}`);
      continue;
    }
    if (item.productStatus === "missing") {
      issues.push("A product in your cart is no longer listed");
      continue;
    }
    if (item.productStatus === "no_commission") {
      issues.push(`Pricing for ${item.name} is not configured`);
      continue;
    }
    if (item.retailerStatus !== "approved") {
      issues.push(`${item.name} is not available from an active retailer`);
      continue;
    }
    if (item.productStatus !== "approved") {
      issues.push(`${item.name} is not available to buy`);
      continue;
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      issues.push(`Choose a quantity between 1 and 10 for ${item.name}`);
      continue;
    }
    if (!Number.isInteger(item.unitKobo) || item.unitKobo < 0) {
      issues.push(`Price for ${item.name} could not be confirmed`);
      continue;
    }
    if (item.qty > item.stock) {
      issues.push(
        item.stock < 1 ? `${item.name} is out of stock` : `Only ${item.stock} left of ${item.name}`,
      );
      continue;
    }
    const lineKobo = item.unitKobo * item.qty;
    lines.push({
      ...item,
      lineKobo,
      commissionKobo: commissionKobo(lineKobo, item.commissionBps),
    });
  }
  const retailerIds = [...new Set(lines.map((line) => line.retailerId))];
  const subtotalKobo = lines.reduce((sum, line) => sum + line.lineKobo, 0);
  const off = discountKobo(subtotalKobo, args.discountBps, args.minSubtotalKobo ?? 0);
  const deliveryFeeEach = args.deliveryFeeEach;
  const deliveryKobo =
    lines.length === 0 || deliveryFeeEach === null ? null : deliveryFeeEach * retailerIds.length;
  const totalKobo = deliveryKobo === null || lines.length === 0 ? null : subtotalKobo - off + deliveryKobo;
  return {
    lines,
    retailerIds,
    subtotalKobo,
    discountKobo: off,
    deliveryFeeEach,
    deliveryKobo,
    totalKobo,
    issues,
  };
}
