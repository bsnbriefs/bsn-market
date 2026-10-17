import assert from "node:assert/strict";
import test from "node:test";
import { canReview } from "./authz.ts";
import { canReadReport, reportCategory, retailerBadge } from "./trust.ts";

test("a retailer badge requires both an approved profile and an approval record", () => {
  assert.equal(retailerBadge("approved", "approved"), "Approved retailer");
  assert.equal(retailerBadge("approved", null), null);
  assert.equal(retailerBadge("approved", "pending"), null);
  assert.equal(retailerBadge("suspended", "approved"), null);
  assert.equal(retailerBadge("pending", null), null);
});

test("report categories are limited and private reports stay with the reporter or an admin", () => {
  assert.equal(reportCategory("counterfeit"), "counterfeit");
  assert.equal(reportCategory("refund"), null);
  assert.equal(canReadReport("customer-a", "customer-a", false), true);
  assert.equal(canReadReport("customer-b", "customer-a", false), false);
  assert.equal(canReadReport("retailer", "customer-a", false), false);
  assert.equal(canReadReport("admin", "customer-a", true), true);
});

test("a review still requires the buyer, a delivery, and no earlier review", () => {
  assert.equal(canReview({ buyerId: "c1", userId: "c1", fulfilmentStatus: "delivered", alreadyReviewed: false }), true);
  assert.equal(canReview({ buyerId: "c1", userId: "c2", fulfilmentStatus: "delivered", alreadyReviewed: false }), false);
  assert.equal(canReview({ buyerId: "c1", userId: "c1", fulfilmentStatus: "pending", alreadyReviewed: false }), false);
  assert.equal(canReview({ buyerId: "c1", userId: "c1", fulfilmentStatus: "delivered", alreadyReviewed: true }), false);
});
