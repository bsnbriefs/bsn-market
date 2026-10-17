import assert from "node:assert/strict";
import test from "node:test";
import { ownsAlert, priceAlertDecision, stockAlertDecision } from "./radar-rules.ts";

const listed = { status: "approved", retailerStatus: "approved", stock: 4, priceKobo: 12_000_000, targetKobo: 12_000_000 };

test("a price above the target waits, and the target price fires once the listing is still approved and in stock", () => {
  assert.equal(priceAlertDecision({ ...listed, priceKobo: 13_000_000 }), "wait");
  assert.equal(priceAlertDecision(listed), "fire");
  assert.equal(priceAlertDecision({ ...listed, priceKobo: 11_000_000 }), "fire");
});

test("an unapproved product or an empty shelf does not count as available", () => {
  assert.equal(priceAlertDecision({ ...listed, status: "pending" }), "wait");
  assert.equal(priceAlertDecision({ ...listed, retailerStatus: "suspended" }), "wait");
  assert.equal(priceAlertDecision({ ...listed, stock: 0 }), "wait");
  assert.equal(stockAlertDecision({ status: "pending", retailerStatus: "approved", stock: 3 }), "wait");
  assert.equal(stockAlertDecision({ status: "approved", retailerStatus: "approved", stock: 0 }), "wait");
  assert.equal(stockAlertDecision({ status: "approved", retailerStatus: "approved", stock: 2 }), "fire");
});

test("a customer cannot manage another customer's alert", () => {
  assert.equal(ownsAlert("customer-a", "customer-a"), true);
  assert.equal(ownsAlert("customer-a", "customer-b"), false);
  assert.equal(ownsAlert("customer-a", ""), false);
});
