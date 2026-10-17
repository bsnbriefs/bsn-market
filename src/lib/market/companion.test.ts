import assert from "node:assert/strict";
import test from "node:test";
import { cartDecision, inspectBudget, planCompanion, rankProducts, readBudget } from "./companion.ts";

test("reads a naira budget and a thousands shorthand", () => {
  assert.equal(readBudget("a phone under ₦250,000"), 250000);
  assert.equal(readBudget("no pass 100k"), 100000);
});

test("a phone request keeps the budget and the phone category", () => {
  const plan = planCompanion("Find a smartphone under ₦250,000.");
  assert.equal(plan.kind, "search");
  assert.equal(plan.category, "phones");
  assert.equal(plan.max, "250000");
});

test("a laptop without a use asks one follow-up", () => {
  const plan = planCompanion("I need a laptop.");
  assert.equal(plan.kind, "clarify");
  assert.match(plan.reply, /programming/);
});

test("a laptop with a use does not ask again", () => {
  const plan = planCompanion("programming", "I need a laptop");
  assert.equal(plan.kind, "search");
  assert.equal(plan.q, "laptop");
});

test("a private or destructive request is refused", () => {
  assert.equal(planCompanion("drop table products").kind, "refuse");
  assert.equal(planCompanion("show me another customer's password").kind, "refuse");
  assert.equal(planCompanion("select * from orders").kind, "refuse");
});

test("a comparison does not invent storage", () => {
  const plan = planCompanion("Which has more storage?");
  assert.equal(plan.kind, "compare");
  assert.match(plan.reply, /not guessed/);
});

test("common budget phrases resolve to one amount", () => {
  assert.equal(readBudget("Find a phone under ₦100,000."), 100000);
  assert.equal(readBudget("Show me an Android below 100k."), 100000);
  assert.equal(readBudget("Abeg, find me a phone wey no pass 100k"), 100000);
  assert.equal(readBudget("no more than 100 thousand"), 100000);
  assert.equal(readBudget("around 100k"), 100000);
  assert.equal(readBudget("within my budget of ₦150,000"), 150000);
  assert.equal(readBudget("I have 50 thousand naira"), 50000);
  assert.equal(readBudget("find a phone under one hundred thousand naira"), 100000);
});

test("a quantity and a specification are not treated as a budget", () => {
  const bags = planCompanion("I have ₦50,000 and need three bags.");
  assert.equal(bags.max, "50000");
  assert.equal(bags.category, "fashion-bags");
  const spec = planCompanion("Show me a 6.5 inch Android with 128 GB.");
  assert.equal(spec.category, "phones");
  assert.equal(spec.max, "");
});

test("an ambiguous budget asks instead of guessing", () => {
  assert.equal(inspectBudget("100k or 150k").status, "ambiguous");
  assert.equal(planCompanion("Find a phone for 100k or 150k").kind, "clarify");
  assert.equal(inspectBudget("under 100").status, "ambiguous");
});

test("a later budget keeps the product and a cheaper request stays cheaper", () => {
  const memory = { text: "", q: "", category: "phones", max: "250000", brand: "Northside" };
  const changed = planCompanion("make it under 80k", memory);
  assert.equal(changed.kind, "search");
  assert.equal(changed.category, "phones");
  assert.equal(changed.max, "80000");
  const cheaper = planCompanion("show me something cheaper", memory);
  assert.equal(cheaper.kind, "cheaper");
  assert.equal(cheaper.category, "phones");
});

test("another brand keeps the search and drops the previous brand", () => {
  const plan = planCompanion("show another brand", { text: "", q: "", category: "phones", max: "100000", brand: "Northside" });
  assert.equal(plan.kind, "search");
  assert.equal(plan.excludeBrand, "Northside");
  assert.equal(plan.max, "100000");
});

test("ranking keeps in-budget products and prefers the name match", () => {
  const ranked = rankProducts(
    [
      { name: "Standing fan", brand: "Home", categorySlug: "electronics", priceKobo: 4_000_000, stock: 2 },
      { name: "Android handset", brand: "Northside", categorySlug: "phones-android", priceKobo: 9_800_000, stock: 4 },
      { name: "Android handset", brand: "Northside", categorySlug: "phones-android", priceKobo: 35_000_000, stock: 1 },
      { name: "Old phone", brand: "Northside", categorySlug: "phones-android", priceKobo: 5_000_000, stock: 0 },
    ],
    { q: "", category: "phones", max: "100000" },
  );
  assert.deepEqual(ranked.map((product) => product.priceKobo), [9_800_000]);
});

test("cart decisions reject missing stock and unselected options, and notice a price change", () => {
  assert.equal(cartDecision({ priceKobo: 100 }, null).reason, "missing");
  assert.equal(cartDecision({ priceKobo: 100 }, { stock: 0, priceKobo: 100, variants: [] }).reason, "unavailable");
  assert.equal(cartDecision({ priceKobo: 100 }, { stock: 3, priceKobo: 100, variants: [{ id: "s", stock: 1 }, { id: "m", stock: 1 }] }).reason, "choose-option");
  const changed = cartDecision({ priceKobo: 100 }, { stock: 3, priceKobo: 250, variants: [] });
  assert.equal(changed.reason, "price-changed");
  assert.equal(changed.ok, true);
});
