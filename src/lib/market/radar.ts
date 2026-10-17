import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { formatNaira, nairaToKobo } from "./money.ts";
import { notifyUser } from "./notify.ts";
import { MarketError, type Query } from "./records.ts";
import { priceAlertDecision, stockAlertDecision } from "./radar-rules.ts";
import { clean, ensureProfile } from "./guard.ts";
import { sessionMiddleware, type SessionContext } from "./session.ts";

export { ownsAlert, priceAlertDecision, stockAlertDecision } from "./radar-rules.ts";

export async function evaluateProductAlerts(sql: Query, productId: string): Promise<number> {
  const products = await sql.query<{
    id: string;
    name: string;
    slug: string;
    price_kobo: number;
    stock: number;
    status: string;
    retailer_status: string;
  }>(
    `select p.id, p.name, p.slug, p.price_kobo, p.stock, p.status, r.status as retailer_status
     from products p join retailer_profiles r on r.id = p.retailer_id where p.id = $1`,
    [productId],
  );
  const product = products[0];
  if (!product) return 0;
  const alerts = await sql.query<{
    id: string;
    user_id: string;
    kind: string;
    target_kobo: number | null;
    status: string;
    notify_status: string;
  }>(
    `select id, user_id, kind, target_kobo, status, notify_status from price_alerts
     where product_id = $1 and (status = 'active' or (status = 'triggered' and notify_status = 'pending'))`,
    [productId],
  );
  let sent = 0;
  for (const alert of alerts) {
    const decision = alert.kind === "stock"
      ? stockAlertDecision({ status: product.status, retailerStatus: product.retailer_status, stock: Number(product.stock) })
      : priceAlertDecision({
          status: product.status,
          retailerStatus: product.retailer_status,
          stock: Number(product.stock),
          priceKobo: Number(product.price_kobo),
          targetKobo: Number(alert.target_kobo),
        });
    if (alert.status === "active") {
      if (decision !== "fire") continue;
      const claimed = await sql.query<{ id: string }>(
        `update price_alerts set status = 'triggered', triggered_at = now(), notify_status = 'pending'
         where id = $1 and status = 'active' returning id`,
        [alert.id],
      );
      if (!claimed[0]) continue;
    }
    const target = Number(alert.target_kobo ?? 0);
    const body = alert.kind === "stock"
      ? `${product.name} is available again, with ${product.stock} in stock at ${formatNaira(Number(product.price_kobo))}.`
      : `${product.name} is now ${formatNaira(Number(product.price_kobo))}. That is at or below your target of ${formatNaira(target)}.`;
    try {
      await notifyUser(sql, {
        userId: alert.user_id,
        title: alert.kind === "stock" ? "Back in stock" : "Price alert",
        body,
        href: `/product/${product.slug}`,
      });
      await sql.query(`update price_alerts set notify_status = 'sent' where id = $1`, [alert.id]);
      sent += 1;
    } catch {
      await sql.query(`update price_alerts set notify_status = 'pending' where id = $1`, [alert.id]);
    }
  }
  return sent;
}

async function publicProduct(sql: Sql, productId: string) {
  const rows = await sql<{ id: string; price_kobo: number; stock: number; status: string; retailer_status: string }>`
    select p.id, p.price_kobo, p.stock, p.status, r.status as retailer_status
    from products p join retailer_profiles r on r.id = p.retailer_id
    where p.id = ${productId} and p.status = 'approved' and r.status = 'approved'`;
  return rows[0] ?? null;
}

export const listMyAlerts = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    return sql<{
      id: string;
      kind: string;
      target_kobo: number | null;
      status: string;
      created_at: string;
      triggered_at: string | null;
      name: string;
      slug: string;
      price_kobo: number;
      stock: number;
      product_status: string;
      image_url: string;
    }>`select a.id, a.kind, a.target_kobo, a.status, a.created_at::text as created_at, a.triggered_at::text as triggered_at,
      p.name, p.slug, p.price_kobo, p.stock, p.status as product_status,
      coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url
      from price_alerts a join products p on p.id = a.product_id
      where a.user_id = ${userId} and a.status <> 'cancelled'
      order by a.created_at desc limit 50`;
  });

export const savePriceAlert = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const productId = clean(raw.productId, 80);
    let target = 0;
    try {
      target = nairaToKobo(clean(raw.targetNaira, 12));
    } catch {
      throw new MarketError("Enter a valid target price");
    }
    if (target < 100) throw new MarketError("Enter a target of at least ₦1");
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const product = await publicProduct(sql, productId);
    if (!product) throw new MarketError("That product is not a public listing");
    if (Number(product.stock) < 1) throw new MarketError("This product is unavailable. Ask to be notified when it is back.");
    if (target >= Number(product.price_kobo)) throw new MarketError("Choose a target below the current price");
    const existing = await sql<{ id: string }>`select id from price_alerts where user_id = ${userId} and product_id = ${product.id} and kind = 'price' and status = 'active'`;
    if (existing[0]) throw new MarketError("You already have a price alert for this product");
    try {
      await sql`insert into price_alerts (id, user_id, product_id, kind, target_kobo, status)
        values (${crypto.randomUUID()}, ${userId}, ${product.id}, 'price', ${target}, 'active')`;
    } catch (error) {
      if (String(error).includes("price_alerts_one_active")) throw new MarketError("You already have a price alert for this product");
      throw error;
    }
    return { ok: true };
  });

export const saveStockAlert = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const productId = clean(raw.productId, 80);
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const product = await publicProduct(sql, productId);
    if (!product) throw new MarketError("That product is not a public listing");
    if (Number(product.stock) > 0) throw new MarketError("This product is already available");
    const existing = await sql<{ id: string }>`select id from price_alerts where user_id = ${userId} and product_id = ${product.id} and kind = 'stock' and status = 'active'`;
    if (existing[0]) throw new MarketError("You already have a stock alert for this product");
    try {
      await sql`insert into price_alerts (id, user_id, product_id, kind, status)
        values (${crypto.randomUUID()}, ${userId}, ${product.id}, 'stock', 'active')`;
    } catch (error) {
      if (String(error).includes("price_alerts_one_active")) throw new MarketError("You already have a stock alert for this product");
      throw error;
    }
    return { ok: true };
  });

export const updatePriceAlert = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const id = clean(raw.id, 80);
    let target = 0;
    try {
      target = nairaToKobo(clean(raw.targetNaira, 12));
    } catch {
      throw new MarketError("Enter a valid target price");
    }
    if (target < 100) throw new MarketError("Enter a target of at least ₦1");
    const sql = await getSql();
    const rows = await sql<{ product_id: string }>`select product_id from price_alerts where id = ${id} and user_id = ${userId} and kind = 'price' and status = 'active'`;
    if (!rows[0]) throw new MarketError("That alert is not yours to edit");
    const product = await publicProduct(sql, rows[0].product_id);
    if (product && target >= Number(product.price_kobo)) throw new MarketError("Choose a target below the current price");
    await sql`update price_alerts set target_kobo = ${target} where id = ${id} and user_id = ${userId} and status = 'active'`;
    return { ok: true };
  });

export const cancelAlert = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: id }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const rows = await sql<{ id: string }>`update price_alerts set status = 'cancelled'
      where id = ${id} and user_id = ${userId} and status = 'active' returning id`;
    if (!rows[0]) throw new MarketError("That alert is not yours to remove");
    return { ok: true };
  });
