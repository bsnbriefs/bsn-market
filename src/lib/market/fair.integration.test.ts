import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { createOrderRecord, type Query } from "./records.ts";

test("the agreed offer price is charged, and two selected offers cannot exist", async () => {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec(readFileSync("migrations/0002_market.sql", "utf8"));
  await pg.exec(readFileSync("migrations/0003_seed.sql", "utf8"));
  await pg.exec(readFileSync("migrations/0010_fair_deal.sql", "utf8"));
  const sql: Query = { query: async (text, params) => (await pg.query(text, params ?? [])).rows as never };
  await sql.query(
    `insert into fair_requests (id, user_id, name, qty, budget_kobo, expires_at, status)
     values ('req-1', 'cust-1', 'Basket', 1, 2000000, now() + interval '7 days', 'fulfilled')`,
  );
  await sql.query(
    `insert into fair_offers (id, request_id, retailer_id, product_id, price_kobo, expires_at, status)
     values ('off-1', 'req-1', 'r-lagos', 'market-basket', 1000000, now() + interval '7 days', 'selected')`,
  );
  await pg.exec("begin");
  const order = await createOrderRecord(sql, {
    userId: "cust-1",
    idempotencyKey: "fair-key",
    provider: "sandbox",
    promoCode: "",
    customer: { name: "Ada Lovelace", email: "ada@example.com", phone: "08030000000", line: "12 Market Road", state: "Lagos", city: "Ikeja", instructions: "" },
    lines: [{ productId: "market-basket", variantId: null, qty: 1, offerId: "off-1" }],
  });
  await pg.exec("commit");
  assert.equal(order.subtotalKobo, 1_000_000);

  await assert.rejects(
    createOrderRecord(sql, {
      userId: "someone-else",
      idempotencyKey: "fair-other",
      provider: "sandbox",
      promoCode: "",
      customer: { name: "Grace Hopper", email: "grace@example.com", phone: "08030000001", line: "4 Creek Road", state: "Lagos", city: "Ikeja", instructions: "" },
      lines: [{ productId: "market-basket", variantId: null, qty: 1, offerId: "off-1" }],
    }),
    /not on your account/,
  );

  await sql.query(
    `insert into fair_offers (id, request_id, retailer_id, product_id, price_kobo, expires_at, status)
     values ('off-2', 'req-1', 'r-lagos', 'pot-set', 900000, now() + interval '7 days', 'pending')`,
  );
  await assert.rejects(
    sql.query(`update fair_offers set status = 'selected' where id = 'off-2'`),
    /duplicate|unique/i,
  );
});
