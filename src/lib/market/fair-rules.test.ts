import assert from "node:assert/strict";
import test from "node:test";
import { canSelectOffer, offerPriceAllowed, plainDealText, validBudgetKobo, validQty } from "./fair-rules.ts";

test("budgets, quantities, and unsafe text are rejected", () => {
  assert.equal(validBudgetKobo(0), "Enter a budget of at least ₦1");
  assert.equal(validBudgetKobo(15_000_000), null);
  assert.equal(validQty(0), "Choose a quantity from 1 to 10");
  assert.equal(validQty(2), null);
  assert.match(plainDealText("<script>alert(1)</script>") ?? "", /HTML/);
  assert.equal(plainDealText("128GB, brand new"), null);
});

test("an offer cannot exceed the listed price or the customer's budget", () => {
  assert.equal(offerPriceAllowed({ unitKobo: 12_000_000, qty: 1, budgetKobo: 15_000_000, catalogueUnit: 9_800_000 }), "The offer cannot be above the listed price");
  assert.equal(offerPriceAllowed({ unitKobo: 9_000_000, qty: 2, budgetKobo: 15_000_000, catalogueUnit: 9_800_000 }), "That offer is above the customer's budget");
  assert.equal(offerPriceAllowed({ unitKobo: 9_000_000, qty: 1, budgetKobo: 15_000_000, catalogueUnit: 9_800_000 }), null);
});

test("only the owner can select one open offer", () => {
  const open = { ownerId: "a", viewerId: "a", requestStatus: "open", offerStatus: "pending", requestExpired: false, offerExpired: false };
  assert.equal(canSelectOffer(open), null);
  assert.match(canSelectOffer({ ...open, viewerId: "b" }) ?? "", /not yours/);
  assert.match(canSelectOffer({ ...open, requestStatus: "closed" }) ?? "", /no longer open/);
  assert.match(canSelectOffer({ ...open, offerExpired: true }) ?? "", /no longer be selected/);
  assert.match(canSelectOffer({ ...open, offerStatus: "selected" }) ?? "", /no longer be selected/);
});
