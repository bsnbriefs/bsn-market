import assert from "node:assert/strict";
import test from "node:test";
import { basketSubtotal, canSwap, planCustom, proposeBundle, quantityWithinBudget, remainingBudget, trimToBudget } from "./bundle.ts";

test("a goal basket uses real priced offers and does not pass the budget", () => {
  const result = proposeBundle(
    [
      { category: "home", offers: [{ id: "pillow", priceKobo: 1_400_000, stock: 4 }, { id: "pots", priceKobo: 4_200_000, stock: 2 }] },
      { category: "groceries", offers: [{ id: "rice", priceKobo: 1_250_000, stock: 8 }] },
    ],
    3_000_000,
  );
  assert.deepEqual(result.ids, ["pillow", "rice"]);
  assert.deepEqual(result.gaps, []);
  const subtotal = 1_400_000 + 1_250_000;
  assert.equal(basketSubtotal([{ unitKobo: 1_400_000, qty: 1 }, { unitKobo: 1_250_000, qty: 1 }]), subtotal);
  assert.equal(remainingBudget(3_000_000, subtotal), 350_000);
  assert.ok(subtotal <= 3_000_000);
});

test("a missing or too-expensive category is a gap, not a made-up product", () => {
  const result = proposeBundle(
    [
      { category: "baby", offers: [] },
      { category: "home", offers: [{ id: "pots", priceKobo: 4_200_000, stock: 0 }] },
    ],
    5_000_000,
  );
  assert.deepEqual(result.ids, []);
  assert.deepEqual(result.gaps, ["baby", "home"]);
});

test("quantity, budget changes, and swaps stay inside the limit", () => {
  assert.equal(quantityWithinBudget({ next: 3, current: 1, unitKobo: 1_250_000, otherKobo: 0, budgetKobo: 2_000_000, stock: 8 }).message, "That quantity would pass your budget.");
  assert.equal(quantityWithinBudget({ next: 2, current: 1, unitKobo: 650_000, otherKobo: 0, budgetKobo: 2_000_000, stock: 8 }).qty, 2);
  const trimmed = trimToBudget(
    [{ id: "fan", unitKobo: 4_500_000, qty: 1 }, { id: "soap", unitKobo: 480_000, qty: 1 }],
    1_000_000,
  );
  assert.deepEqual(trimmed.dropped, ["fan"]);
  assert.equal(basketSubtotal(trimmed.kept), 480_000);
  assert.equal(canSwap({ nextUnit: 4_200_000, otherKobo: 0, budgetKobo: 2_000_000 }), false);
  assert.equal(canSwap({ nextUnit: 720_000, otherKobo: 480_000, budgetKobo: 2_000_000 }), true);
});

test("a custom request maps only to catalogue sections that exist", () => {
  assert.deepEqual(planCustom("groceries for the family").categories, ["groceries"]);
  assert.deepEqual(planCustom("baby starter pack").categories, ["baby"]);
  assert.equal(planCustom("gaming console").categories.length, 0);
  assert.match(planCustom("gaming console").query, /gaming/);
});
