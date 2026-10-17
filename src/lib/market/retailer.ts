import { createServerFn } from "@tanstack/react-start";
import { getSql, withTransaction } from "@/lib/db";
import { fulfilmentTransitionAllowed, retailerCanMutateProduct } from "./authz.ts";
import { assertImageRef, audit, clean, ensureProfile, ownRetailer, rateLimit } from "./guard.ts";
import { notifyUser } from "./notify.ts";
import { nairaToKobo } from "./money.ts";
import { MarketError, transitionFulfilment } from "./records.ts";
import { sessionMiddleware, type SessionContext } from "./session.ts";

async function requireRetailer(userId: string, email: string) {
  const sql = await getSql();
  await ensureProfile(sql, userId, email);
  const retailer = await ownRetailer(sql, userId);
  if (!retailer) throw new MarketError("Apply as a retailer first");
  return { sql, retailer };
}

export const getRetailerDashboard = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    const counts = await sql<{ status: string; n: number }>`
      select status, count(*)::int as n from retailer_orders where retailer_id = ${retailer.id} group by status`;
    const ledger = await sql<{
      gross: number;
      commission: number;
      refunds: number;
      settlement: number;
    }>`select coalesce(sum(product_value_kobo),0)::int as gross,
              coalesce(sum(commission_kobo),0)::int as commission,
              coalesce(sum(refund_adjustment_kobo),0)::int as refunds,
              coalesce(sum(settlement_kobo),0)::int as settlement
       from commission_ledger where retailer_id = ${retailer.id}`;
    const low = await sql<{ id: string; name: string; stock: number }>`
      select id, name, stock from products where retailer_id = ${retailer.id} and status <> 'archived' and stock <= 5
      order by stock asc limit 12`;
    const recent = await sql<{ reference: string; status: string; created_at: string }>`
      select o.reference, ro.status, o.created_at::text as created_at
      from retailer_orders ro join orders o on o.id = ro.order_id
      where ro.retailer_id = ${retailer.id}
      order by o.created_at desc limit 8`;
    const by = Object.fromEntries(counts.map((row) => [row.status, Number(row.n)]));
    const total = counts.reduce((sum, row) => sum + Number(row.n), 0);
    return {
      retailer,
      totalOrders: total,
      pending: (by.pending ?? 0) + (by.accepted ?? 0) + (by.preparing ?? 0) + (by.ready ?? 0),
      delivered: by.delivered ?? 0,
      cancelled: (by.cancelled ?? 0) + (by.rejected ?? 0),
      grossKobo: Number(ledger[0]?.gross ?? 0),
      commissionKobo: Number(ledger[0]?.commission ?? 0),
      refundKobo: Number(ledger[0]?.refunds ?? 0),
      settlementKobo: Number(ledger[0]?.settlement ?? 0),
      lowStock: low,
      recent,
    };
  });

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    const products = await sql<{
      id: string;
      name: string;
      price_kobo: number;
      stock: number;
      status: string;
      category_id: string | null;
      description: string;
      brand: string;
      moderation_reason: string;
    }>`select id, name, price_kobo, stock, status, category_id, description, brand, moderation_reason
       from products where retailer_id = ${retailer.id} order by updated_at desc`;
    const categories = await sql<{ id: string; name: string; parent_id: string | null }>`
      select id, name, parent_id from product_categories order by sort_order, name`;
    return { products, categories, retailer };
  });

export const saveMyProduct = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`product:${userId}`, 30, 60 * 60 * 1000);
    const { sql, retailer } = await requireRetailer(userId, email);
    if (retailer.status === "suspended" || retailer.status === "rejected") {
      throw new MarketError("Your retailer account cannot edit listings right now");
    }
    const raw = (data ?? {}) as Record<string, unknown>;
    const name = clean(raw.name, 120);
    const description = clean(raw.description, 2000);
    const brand = clean(raw.brand, 60);
    const categoryId = clean(raw.categoryId, 40);
    if (name.length < 2) throw new MarketError("Enter a product name");
    let storedCategory = categoryId || null;
    if (categoryId) {
      const chosen = await sql<{ id: string; kids: number }>`
        select c.id, (select count(*)::int from product_categories child where child.parent_id = c.id) as kids
        from product_categories c where c.id = ${categoryId}`;
      if (!chosen[0]) throw new MarketError("Choose a category");
      if (Number(chosen[0].kids) > 0) throw new MarketError("Choose a subcategory");
      storedCategory = chosen[0].id;
    }
    const priceKobo = nairaToKobo(clean(raw.priceNaira, 12));
    const images = Array.isArray(raw.images) ? raw.images.filter((url): url is string => typeof url === "string").slice(0, 4) : [];
    for (const image of images) assertImageRef(image);
    const variants = Array.isArray(raw.variants)
      ? raw.variants.slice(0, 12).flatMap((row) => {
          if (!row || typeof row !== "object") return [];
          const variant = row as { label?: unknown; stock?: unknown; extraNaira?: unknown };
          const label = clean(variant.label, 40);
          const stock = Number(variant.stock);
          if (!label || !Number.isInteger(stock) || stock < 0 || stock > 100000) return [];
          const extra = clean(variant.extraNaira, 12);
          return [{ label, stock, delta: extra ? nairaToKobo(extra) : 0 }];
        })
      : [];
    const stock = variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : Number(raw.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) throw new MarketError("Enter a stock quantity");
    const existingId = clean(raw.id, 80);
    let id = existingId;
    if (existingId) {
      const rows = await sql<{ retailer_id: string; status: string }>`select retailer_id, status from products where id = ${existingId}`;
      if (!rows[0] || !retailerCanMutateProduct(retailer.id, rows[0].retailer_id)) {
        throw new MarketError("You cannot edit that product");
      }
      const status = rows[0].status === "draft" && raw.submit !== true ? "draft" : "pending";
      await sql`update products set name = ${name}, description = ${description}, brand = ${brand}, category_id = ${storedCategory},
        price_kobo = ${priceKobo}, stock = ${stock}, status = ${status}, return_eligible = ${raw.returnEligible !== false},
        updated_at = now() where id = ${existingId} and retailer_id = ${retailer.id}`;
      await sql`delete from product_images where product_id = ${existingId}`;
      await sql`delete from product_variants where product_id = ${existingId}`;
    } else {
      id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item"}-${crypto.randomUUID().slice(0, 6)}`;
      const status = raw.submit === true ? "pending" : "draft";
      await sql`insert into products (id, slug, retailer_id, category_id, name, description, brand, price_kobo, stock, status, return_eligible)
        values (${id}, ${id}, ${retailer.id}, ${storedCategory}, ${name}, ${description}, ${brand}, ${priceKobo}, ${stock}, ${status}, ${raw.returnEligible !== false})`;
    }
    let sort = 0;
    for (const image of images) {
      await sql`insert into product_images (id, product_id, url, sort_order) values (${crypto.randomUUID()}, ${id}, ${image}, ${sort})`;
      sort += 1;
    }
    for (const variant of variants) {
      await sql`insert into product_variants (id, product_id, label, sku, price_delta_kobo, stock)
        values (${crypto.randomUUID()}, ${id}, ${variant.label}, ${variant.label}, ${variant.delta}, ${variant.stock})`;
    }
    if (raw.submit === true) {
      await notifyUser(sql, {
        userId,
        title: "Product submitted",
        body: `${name} is waiting for approval. It is not public yet.`,
        href: "/retailer/products",
      });
    }
    return { id };
  });

export const archiveMyProduct = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id : ""))
  .handler(async ({ context, data: id }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    const updated = await sql<{ id: string }>`update products set status = 'archived', updated_at = now()
      where id = ${id} and retailer_id = ${retailer.id} returning id`;
    if (!updated[0]) throw new MarketError("Product was not found");
    return { ok: true };
  });

export const listRetailerOrders = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    const rows = await sql<{
      fulfilment_id: string;
      status: string;
      reference: string;
      order_id: string;
      customer_name: string;
      phone: string;
      address_line: string;
      city: string;
      state: string;
      instructions: string;
      created_at: string;
    }>`select ro.id as fulfilment_id, ro.status, o.reference, o.id as order_id, o.customer_name, o.phone,
              o.address_line, o.city, o.state, o.instructions, o.created_at::text as created_at
       from retailer_orders ro join orders o on o.id = ro.order_id
       where ro.retailer_id = ${retailer.id}
       order by o.created_at desc limit 50`;
    const items = await sql<{ order_id: string; name_snapshot: string; variant_snapshot: string; qty: number; line_kobo: number }>`
      select order_id, name_snapshot, variant_snapshot, qty, line_kobo from order_items where retailer_id = ${retailer.id}`;
    return rows.map((row) => ({
      ...row,
      items: items.filter((item) => item.order_id === row.order_id),
    }));
  });

export const updateMyFulfilment = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const { retailer } = await requireRetailer(userId, email);
    if (retailer.status !== "approved" && retailer.status !== "suspended") {
      throw new MarketError("Only an approved retailer can update fulfilment. Suspended retailers can still finish existing orders.");
    }
    const raw = (data ?? {}) as Record<string, unknown>;
    const to = clean(raw.status, 40);
    if (!fulfilmentTransitionAllowed("pending", to) && to !== "preparing" && to !== "ready" && to !== "dispatched" && to !== "in_transit" && to !== "delivered" && to !== "failed" && to !== "cancelled" && to !== "accepted" && to !== "rejected") {
      throw new MarketError("Unknown status");
    }
    await withTransaction(async (sql) => {
      const rows = await sql<{ retailer_id: string }>`select retailer_id from retailer_orders where id = ${clean(raw.id, 80)}`;
      if (!rows[0] || rows[0].retailer_id !== retailer.id) throw new MarketError("That fulfilment is not yours");
      const result = await transitionFulfilment(sql, {
        retailerOrderId: clean(raw.id, 80),
        to,
        actorUserId: userId,
        note: clean(raw.note, 300),
        proof: clean(raw.proof, 120),
      });
      const buyer = await sql<{ user_id: string; reference: string }>`select user_id, reference from orders where id = ${result.orderId}`;
      if (buyer[0]) {
        await notifyUser(sql, {
          userId: buyer[0].user_id,
          title: `Order ${to.replaceAll("_", " ")}`,
          body: `${buyer[0].reference} was updated by the retailer.`,
          href: `/orders/${result.orderId}`,
        });
      }
      await audit(sql, userId, "fulfilment", "retailer_order", clean(raw.id, 80), to);
    });
    return { ok: true };
  });

export const getEarnings = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    const rows = await sql<{
      order_reference: string;
      product_value_kobo: number;
      commission_bps: number;
      commission_kobo: number;
      refund_adjustment_kobo: number;
      other_adjustment_kobo: number;
      settlement_kobo: number;
      settlement_status: string;
    }>`select order_reference, product_value_kobo, commission_bps, commission_kobo, refund_adjustment_kobo,
              other_adjustment_kobo, settlement_kobo, settlement_status
       from commission_ledger where retailer_id = ${retailer.id} order by order_reference desc limit 100`;
    const settlements = await sql<{ id: string; amount_kobo: number; status: string; reference: string; created_at: string }>`
      select id, amount_kobo, status, reference, created_at::text as created_at
      from retailer_settlements where retailer_id = ${retailer.id} order by created_at desc`;
    return { rows, settlements };
  });

export const submitAdCampaign = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const { sql, retailer } = await requireRetailer(userId, email);
    if (retailer.status !== "approved") throw new MarketError("An administrator must approve your store before it can request a banner");
    const raw = (data ?? {}) as Record<string, unknown>;
    const title = clean(raw.title, 80);
    const subtitle = clean(raw.subtitle, 160);
    const productId = clean(raw.productId, 80);
    if (title.length < 3) throw new MarketError("Enter a headline");
    if (productId) {
      const owned = await sql<{ id: string }>`select id from products where id = ${productId} and retailer_id = ${retailer.id} and status = 'approved'`;
      if (!owned[0]) throw new MarketError("Choose one of your approved products");
    }
    await sql`insert into promotional_campaigns (id, title, subtitle, image_url, link_path, active, sort_order, retailer_id, status)
      values (${crypto.randomUUID()}, ${title}, ${subtitle}, ${productId ? "" : "/products/hero.jpg"},
        ${productId ? `/product/${productId}` : "/shop"}, false, 20, ${retailer.id}, 'submitted')`;
    await audit(sql, userId, "campaign", "promotional_campaigns", retailer.id, "submitted");
    return { ok: true };
  });
