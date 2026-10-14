import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canCustomerCancel, canReview, fulfilmentTransitionAllowed, isPublicListing, orderAccess, retailerCanMutateProduct, roleGrantAllowed } from "./authz.ts";
import {
  buildCheckoutDraft,
  commissionKobo,
  nairaToKobo,
  percentToBps,
  pickCommission,
  settlementKobo,
} from "./money.ts";
import { eventKey, paymentAccepted, paystackSignatureValid, sandboxConfirmAllowed, signPaystack } from "./pay.ts";

describe("money", () => {
  it("converts naira without floating point drift", () => {
    assert.equal(nairaToKobo("24500"), 2450000);
    assert.equal(nairaToKobo("10.50"), 1050);
    assert.equal(percentToBps("10"), 1000);
    assert.equal(percentToBps("12.5"), 1250);
  });

  it("calculates commission and settlement in kobo", () => {
    assert.equal(commissionKobo(2450000, 1000), 245000);
    assert.equal(settlementKobo(100000, 10000, 0), 90000);
    assert.equal(settlementKobo(100000, 10000, 100000), 0);
    assert.equal(settlementKobo(100000, 10000, 50000), 45000);
  });

  it("picks retailer commission over category and default, and ignores future rules", () => {
    const rules = [
      { id: "d", scope: "default", categoryId: null, retailerId: null, bps: 1000, effectiveFrom: "2020-01-01", active: true },
      { id: "c", scope: "category", categoryId: "groceries", retailerId: null, bps: 800, effectiveFrom: "2020-01-01", active: true },
      { id: "r", scope: "retailer", categoryId: null, retailerId: "r-ph", bps: 1200, effectiveFrom: "2020-01-01", active: true },
      { id: "future", scope: "default", categoryId: null, retailerId: null, bps: 500, effectiveFrom: "2099-01-01", active: true },
    ];
    assert.equal(pickCommission(rules, { retailerId: "r-ph", categoryId: "groceries", on: "2026-10-14" }).id, "r");
    assert.equal(pickCommission(rules, { retailerId: "r-lagos", categoryId: "groceries", on: "2026-10-14" }).bps, 800);
    assert.equal(pickCommission(rules, { retailerId: "r-lagos", categoryId: "home", on: "2026-10-14" }).bps, 1000);
  });

  it("prices a multi-retailer cart and blocks bad stock", () => {
    const draft = buildCheckoutDraft({
      deliveryFeeEach: 250000,
      discountBps: 0,
      items: [
        item({ retailerId: "a", unitKobo: 100000, qty: 2, commissionBps: 1000 }),
        item({ retailerId: "b", unitKobo: 50000, qty: 1, commissionBps: 1000, productId: "p2" }),
      ],
    });
    assert.equal(draft.issues.length, 0);
    assert.equal(draft.subtotalKobo, 250000);
    assert.equal(draft.deliveryKobo, 500000);
    assert.equal(draft.totalKobo, 750000);
    assert.equal(draft.lines[0].commissionKobo, 20000);
    const short = buildCheckoutDraft({
      deliveryFeeEach: null,
      discountBps: 0,
      items: [item({ stock: 1, qty: 2 })],
    });
    assert.match(short.issues[0], /Only 1 left/);
    assert.equal(short.totalKobo, null);
  });
});

describe("access", () => {
  it("hides unapproved products and blocks self-admin", () => {
    assert.equal(isPublicListing("approved", "approved"), true);
    assert.equal(isPublicListing("approved", "suspended"), false);
    assert.equal(isPublicListing("draft", "approved"), false);
    assert.equal(roleGrantAllowed({ actorIsAdmin: false, requestedRole: "admin", noAdminYet: true }), true);
    assert.equal(roleGrantAllowed({ actorIsAdmin: false, requestedRole: "admin", noAdminYet: false }), false);
    assert.equal(roleGrantAllowed({ actorIsAdmin: false, requestedRole: "retailer", noAdminYet: true }), false);
  });

  it("isolates orders and products", () => {
    assert.equal(
      orderAccess({ userId: "c1", isAdmin: false, actorRetailerId: null, orderUserId: "c2", itemRetailerIds: ["r1"] }),
      false,
    );
    assert.equal(
      orderAccess({ userId: "c1", isAdmin: false, actorRetailerId: "r1", orderUserId: "c2", itemRetailerIds: ["r1"] }),
      "retailer",
    );
    assert.equal(retailerCanMutateProduct("r1", "r2"), false);
    assert.equal(canReview({ buyerId: "c1", userId: "c2", fulfilmentStatus: "delivered", alreadyReviewed: false }), false);
    assert.equal(canCustomerCancel(["pending", "pending"]), true);
    assert.equal(canCustomerCancel(["accepted"]), false);
    assert.equal(fulfilmentTransitionAllowed("pending", "delivered"), false);
    assert.equal(fulfilmentTransitionAllowed("dispatched", "delivered"), false);
    assert.equal(fulfilmentTransitionAllowed("in_transit", "delivered"), true);
  });
});

describe("paystack", () => {
  it("rejects a bad signature and a mismatched amount", () => {
    const raw = JSON.stringify({ event: "charge.success", data: { amount: 100 } });
    const secret = "sk_test_example";
    const good = signPaystack(raw, secret);
    assert.equal(paystackSignatureValid(raw, good, secret), true);
    assert.equal(paystackSignatureValid(raw, "nope", secret), false);
    assert.equal(paystackSignatureValid(raw, good, ""), false);
    assert.equal(paymentAccepted({ orderKobo: 100, paidKobo: 100, currency: "NGN", status: "success" }), true);
    assert.equal(paymentAccepted({ orderKobo: 100, paidKobo: 99, currency: "NGN", status: "success" }), false);
    assert.equal(paymentAccepted({ orderKobo: 100, paidKobo: 100, currency: "USD", status: "success" }), false);
    assert.equal(eventKey(raw), eventKey(raw));
    assert.notEqual(eventKey(raw), eventKey(`${raw} `));
    assert.equal(sandboxConfirmAllowed(false, "sandbox"), true);
    assert.equal(sandboxConfirmAllowed(true, "sandbox"), false);
  });
});

function item(overrides: Partial<Parameters<typeof buildCheckoutDraft>[0]["items"][number]> = {}) {
  return {
    productId: "p1",
    variantId: null,
    retailerId: "a",
    retailerName: "A",
    retailerStatus: "approved",
    productStatus: "approved",
    name: "Bowl",
    variantLabel: null,
    unitKobo: 100000,
    qty: 1,
    stock: 5,
    commissionBps: 1000,
    returnEligible: true,
    ...overrides,
  };
}
