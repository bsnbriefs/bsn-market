import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  claimAdmin,
  createOrderRecord,
  markPaidRecord,
  publicProductIds,
  recordRefund,
  type Query,
} from "./records.ts";

describe("market database", () => {
  it("checks visibility, stock, commission, idempotency, and refunds", async () => {
    const pg = new PGlite();
    await pg.waitReady;
    await pg.exec(readFileSync("migrations/0002_market.sql", "utf8"));
    await pg.exec(readFileSync("migrations/0003_seed.sql", "utf8"));
    const sql: Query = {
      query: async (text, params) => {
        const result = await pg.query(text, params ?? []);
        return result.rows as never;
      },
    };

    const visible = await publicProductIds(sql);
    assert.equal(visible.includes("ankara-midi-dress"), true);
    assert.equal(visible.includes("draft-sample-bowl"), false);
    assert.equal(visible.includes("hidden-paused-cap"), false);

    const other = await sql.query<{ id: string }>(
      `select id from orders where user_id = $1`,
      ["someone-else"],
    );
    assert.equal(other.length, 0);

    await pg.exec("begin");
    const first = await createOrderRecord(sql, {
      userId: "cust-1",
      idempotencyKey: "key-1",
      provider: "sandbox",
      promoCode: "",
      customer: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "08030000000",
        line: "12 Market Road",
        state: "Lagos",
        city: "Ikeja",
        instructions: "",
      },
      lines: [
        { productId: "market-basket", variantId: null, qty: 1 },
        { productId: "parboiled-rice", variantId: null, qty: 2 },
        { productId: "ankara-midi-dress", variantId: "ankara-m", qty: 1 },
      ],
    });
    await pg.exec("commit");
    assert.equal(first.created, true);
    assert.equal(first.status, "pending_payment");
    assert.ok(first.totalKobo && first.totalKobo > first.subtotalKobo);

    const retailers = await sql.query<{ retailer_id: string }>(
      `select retailer_id from retailer_orders where order_id = $1 order by retailer_id`,
      [first.orderId],
    );
    assert.deepEqual(
      retailers.map((row) => row.retailer_id),
      ["r-abuja", "r-lagos", "r-ph"],
    );

    const stockBeforeRetry = await sql.query<{ stock: number }>(
      `select stock from products where id = 'market-basket'`,
    );
    await pg.exec("begin");
    const second = await createOrderRecord(sql, {
      userId: "cust-1",
      idempotencyKey: "key-1",
      provider: "sandbox",
      promoCode: "",
      customer: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "08030000000",
        line: "12 Market Road",
        state: "Lagos",
        city: "Ikeja",
        instructions: "",
      },
      lines: [{ productId: "market-basket", variantId: null, qty: 1 }],
    });
    await pg.exec("commit");
    assert.equal(second.created, false);
    assert.equal(second.orderId, first.orderId);
    const stockAfterRetry = await sql.query<{ stock: number }>(
      `select stock from products where id = 'market-basket'`,
    );
    assert.equal(Number(stockAfterRetry[0].stock), Number(stockBeforeRetry[0].stock));

    await assert.rejects(
      () =>
        createOrderRecord(sql, {
          userId: "cust-2",
          idempotencyKey: "key-bad",
          provider: "sandbox",
          promoCode: "",
          customer: {
            name: "Ken",
            email: "ken@example.com",
            phone: "08031111111",
            line: "1 Road",
            state: "Lagos",
            city: "Yaba",
            instructions: "",
          },
          lines: [{ productId: "hidden-paused-cap", variantId: null, qty: 1 }],
        }),
      /not available/,
    );

    await pg.exec("begin");
    await assert.rejects(
      () =>
        markPaidRecord(sql, {
          reference: first.reference,
          paidKobo: (first.totalKobo ?? 0) - 1,
          currency: "NGN",
          providerStatus: "success",
        }),
      /did not match/,
    );
    await pg.exec("rollback");

    await pg.exec("begin");
    const paid = await markPaidRecord(sql, {
      reference: first.reference,
      paidKobo: first.totalKobo ?? 0,
      currency: "NGN",
      providerStatus: "success",
    });
    const again = await markPaidRecord(sql, {
      reference: first.reference,
      paidKobo: first.totalKobo ?? 0,
      currency: "NGN",
      providerStatus: "success",
    });
    await pg.exec("commit");
    assert.equal(paid.duplicate, false);
    assert.equal(again.duplicate, true);
    const ledger = await sql.query<{ n: number }>(
      `select count(*)::int as n from commission_ledger where order_reference = $1`,
      [first.reference],
    );
    assert.equal(Number(ledger[0].n), 3);

    const basket = await sql.query<{ id: string; commission_kobo: number; line_kobo: number }>(
      `select id, commission_kobo, line_kobo from order_items
       where order_id = $1 and product_id = 'market-basket'`,
      [first.orderId],
    );
    assert.equal(Number(basket[0].commission_kobo), Math.round(Number(basket[0].line_kobo) * 0.1));
    await pg.exec("begin");
    await recordRefund(sql, {
      orderItemId: basket[0].id,
      amountKobo: Number(basket[0].line_kobo),
      reason: "Return",
      actorUserId: "admin-1",
    });
    await assert.rejects(
      () =>
        recordRefund(sql, {
          orderItemId: basket[0].id,
          amountKobo: 100,
          reason: "Again",
          actorUserId: "admin-1",
        }),
      /larger than/,
    );
    await pg.exec("commit");

    assert.equal(await claimAdmin(sql, "owner-1"), true);
    assert.equal(await claimAdmin(sql, "owner-2"), false);
    const admins = await sql.query<{ user_id: string }>(
      `select user_id from user_roles where role = 'admin'`,
    );
    assert.deepEqual(
      admins.map((row) => row.user_id),
      ["owner-1"],
    );
  });
});
