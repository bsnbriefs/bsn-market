export type BundleGoal = {
  id: string;
  title: string;
  body: string;
  budget: string;
  categories: string[];
  note: string;
};

export const bundleGoals: BundleGoal[] = [
  { id: "home", title: "Home essentials", body: "Kitchen and household items that are listed.", budget: "150000", categories: ["home"], note: "This is the home range in the shop, not a full apartment fit-out." },
  { id: "grocery", title: "Family grocery basket", body: "Pantry items from the grocery catalogue.", budget: "50000", categories: ["groceries"], note: "Only listed foodstuffs can be included." },
  { id: "baby", title: "Baby starter", body: "Baby items that are approved right now.", budget: "50000", categories: ["baby"], note: "The baby range is small. Missing items are not invented." },
  { id: "work", title: "Work wardrobe", body: "Listed clothing.", budget: "80000", categories: ["fashion-women", "fashion-men"], note: "This is clothing from the shop, not a complete wardrobe." },
  { id: "care", title: "Personal care", body: "Listed beauty products.", budget: "20000", categories: ["beauty"], note: "" },
  { id: "student", title: "Student starter", body: "A listed bag, then small electronics if they fit.", budget: "40000", categories: ["fashion-bags", "electronics"], note: "A phone is only suggested if the budget can cover a listed handset." },
  { id: "gift", title: "Birthday gift", body: "In-stock listings that fit the budget, cheapest first.", budget: "30000", categories: ["*"], note: "These are real listings, not a made-up gift set." },
];

const customRules: { test: RegExp; categories: string[] }[] = [
  { test: /apartment|home|kitchen|household|moving/, categories: ["home"] },
  { test: /groc|food|rice|pantry/, categories: ["groceries"] },
  { test: /baby|nursery/, categories: ["baby"] },
  { test: /wardrobe|clothes|shirt|dress|kaftan/, categories: ["fashion-women", "fashion-men"] },
  { test: /soap|skincare|beauty|lotion/, categories: ["beauty"] },
  { test: /student|school|backpack/, categories: ["fashion-bags"] },
  { test: /phone|handset/, categories: ["phones"] },
  { test: /gift|birthday/, categories: ["*"] },
];

export function planCustom(text: string): { categories: string[]; query: string; note: string } {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const matched = customRules.find((rule) => rule.test.test(clean));
  if (matched) return { categories: matched.categories, query: "", note: "Matched to a real catalogue section. Unrelated items are left out." };
  const words = clean.split(" ").filter((word) => word.length > 2).slice(0, 4).join(" ");
  return { categories: [], query: words, note: words ? "Searching the approved catalogue for those words." : "Describe what you want, or pick a goal." };
}

export type BundleOffer = { id: string; priceKobo: number; stock: number };

export function proposeBundle(groups: { category: string; offers: BundleOffer[] }[], budgetKobo: number): { ids: string[]; gaps: string[] } {
  let left = budgetKobo;
  const used = new Set<string>();
  const ids: string[] = [];
  const gaps: string[] = [];
  for (const group of groups) {
    const pick = group.offers
      .filter((offer) => offer.stock > 0 && offer.priceKobo > 0 && offer.priceKobo <= left && !used.has(offer.id))
      .sort((a, b) => a.priceKobo - b.priceKobo)[0];
    if (!pick) {
      gaps.push(group.category);
      continue;
    }
    used.add(pick.id);
    ids.push(pick.id);
    left -= pick.priceKobo;
  }
  const rest = groups
    .flatMap((group) => group.offers)
    .filter((offer) => offer.stock > 0 && offer.priceKobo > 0 && !used.has(offer.id))
    .sort((a, b) => a.priceKobo - b.priceKobo);
  for (const offer of rest) {
    if (offer.priceKobo > left) continue;
    used.add(offer.id);
    ids.push(offer.id);
    left -= offer.priceKobo;
  }
  return { ids, gaps };
}

export function lineKobo(unitKobo: number, qty: number): number {
  return unitKobo * qty;
}

export function basketSubtotal(lines: { unitKobo: number; qty: number }[]): number {
  return lines.reduce((sum, line) => sum + lineKobo(line.unitKobo, line.qty), 0);
}

export function remainingBudget(budgetKobo: number, subtotalKobo: number): number {
  return budgetKobo - subtotalKobo;
}

export function trimToBudget(lines: { id: string; unitKobo: number; qty: number }[], budgetKobo: number): { kept: { id: string; unitKobo: number; qty: number }[]; dropped: string[] } {
  const kept = lines.map((line) => ({ ...line }));
  const dropped: string[] = [];
  const total = () => basketSubtotal(kept);
  while (kept.length > 0 && total() > budgetKobo) {
    let index = 0;
    for (let i = 1; i < kept.length; i += 1) {
      if (lineKobo(kept[i].unitKobo, kept[i].qty) > lineKobo(kept[index].unitKobo, kept[index].qty)) index = i;
    }
    dropped.push(kept[index].id);
    kept.splice(index, 1);
  }
  return { kept, dropped };
}

export function quantityWithinBudget(args: { next: number; current: number; unitKobo: number; otherKobo: number; budgetKobo: number; stock: number }): { qty: number; message: string | null } {
  const next = Math.floor(args.next);
  if (!Number.isInteger(next) || next < 1) return { qty: args.current, message: "Quantity must be at least 1." };
  if (next > 10) return { qty: args.current, message: "The most you can add is 10." };
  if (next > args.stock) return { qty: args.current, message: args.stock < 1 ? "This is out of stock." : `Only ${args.stock} in stock.` };
  if (args.unitKobo * next + args.otherKobo > args.budgetKobo) return { qty: args.current, message: "That quantity would pass your budget." };
  return { qty: next, message: null };
}

export function canSwap(args: { nextUnit: number; otherKobo: number; budgetKobo: number }): boolean {
  return args.nextUnit > 0 && args.nextUnit + args.otherKobo <= args.budgetKobo;
}
