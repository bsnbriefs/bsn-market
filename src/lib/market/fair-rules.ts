export function validBudgetKobo(kobo: number): string | null {
  if (!Number.isInteger(kobo) || kobo < 100) return "Enter a budget of at least ₦1";
  if (kobo > 2_000_000_000) return "That budget is too large";
  return null;
}

export function validQty(qty: number): string | null {
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return "Choose a quantity from 1 to 10";
  return null;
}

export function offerPriceAllowed(input: { unitKobo: number; qty: number; budgetKobo: number; catalogueUnit: number }): string | null {
  if (!Number.isInteger(input.unitKobo) || input.unitKobo < 100) return "Enter an offer price of at least ₦1";
  if (input.unitKobo > input.catalogueUnit) return "The offer cannot be above the listed price";
  if (input.unitKobo * input.qty > input.budgetKobo) return "That offer is above the customer's budget";
  return null;
}

export function canSelectOffer(input: { ownerId: string; viewerId: string; requestStatus: string; offerStatus: string; requestExpired: boolean; offerExpired: boolean }): string | null {
  if (!input.viewerId || input.viewerId !== input.ownerId) return "That request is not yours";
  if (input.requestExpired || input.requestStatus !== "open") return "This request is no longer open";
  if (input.offerExpired || input.offerStatus !== "pending") return "That offer can no longer be selected";
  return null;
}

export function plainDealText(value: string): string | null {
  if (/[<>]/.test(value)) return "Remove any code or HTML from the text";
  return null;
}
