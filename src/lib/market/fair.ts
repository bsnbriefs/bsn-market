import { createServerFn } from "@tanstack/react-start";
import { getSql, withTransaction } from "@/lib/db";
import { audit, clean, ensureProfile, ownRetailer, rateLimit, requireAdmin } from "./guard.ts";
import { nairaToKobo } from "./money.ts";
import { notifyUser } from "./notify.ts";
import { MarketError } from "./records.ts";
import { sessionMiddleware, type SessionContext } from "./session.ts";
import { canSelectOffer, offerPriceAllowed, plainDealText, validBudgetKobo, validQty } from "./fair-rules.ts";
import { retailerBadge } from "./trust.ts";

function on(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

const conditions = new Set(["new", "used", "either"]);
const days = new Set([3, 7, 14]);

function text(value: unknown, max: number): string {
  const cleanValue = clean(value, max);
  const unsafe = plainDealText(cleanValue);
  if (unsafe) throw new MarketError(unsafe);
  return cleanValue;
}

function money(value: unknown): number {
  try {
    return nairaToKobo(clean(value, 12));
  } catch {
    throw new MarketError("Enter a valid amount in naira");
  }
}

async function expire(sql: Awaited<ReturnType<typeof getSql>>, userId = "") {
  if (userId) {
    await sql`update fair_requests set status = 'expired', closed_at = now() where user_id = ${userId} and status = 'open' and expires_at <= now()`;
  } else {
    await sql`update fair_requests set status = 'expired', closed_at = now() where status = 'open' and expires_at <= now()`;
  }
  await sql`update fair_offers set status = 'expired' where status = 'pending' and expires_at <= now()`;
}

export const createFairRequest = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`fair-request:${userId}`, 5, 10 * 60 * 1000);
    const raw = (data ?? {}) as Record<string, unknown>;
    const name = text(raw.name, 80);
    const description = text(raw.description, 800);
    if (name.length < 2) throw new MarketError("Name the product");
    const budget = money(raw.budgetNaira);
    const budgetError = validBudgetKobo(budget);
    if (budgetError) throw new MarketError(budgetError);
    const qty = Number(raw.qty);
    const qtyError = validQty(qty);
    if (qtyError) throw new MarketError(qtyError);
    const condition = clean(raw.condition, 10);
    if (!conditions.has(condition)) throw new MarketError("Choose new, used, or either");
    const span = Number(raw.days);
    if (!days.has(span)) throw new MarketError("Choose how long the request stays open");
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const id = crypto.randomUUID();
    await sql`insert into fair_requests (id, user_id, name, description, category, brand, specs, condition, qty, budget_kobo, state, note, expires_at)
      values (${id}, ${userId}, ${name}, ${description}, ${text(raw.category, 40)}, ${text(raw.brand, 60)}, ${text(raw.specs, 240)}, ${condition}, ${qty}, ${budget}, ${text(raw.state, 40)}, ${text(raw.note, 240)}, now() + make_interval(days => ${span}))`;
    return { id };
  });

export const listMyFairRequests = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    await expire(sql, userId);
    return sql<{
      id: string; name: string; status: string; budget_kobo: number; qty: number; state: string;
      expires_at: string; offer_count: number; latest_offer: string | null;
    }>`select r.id, r.name, r.status, r.budget_kobo, r.qty, r.state, r.expires_at::text as expires_at,
      (select count(*)::int from fair_offers o where o.request_id = r.id) as offer_count,
      (select max(o.created_at)::text from fair_offers o where o.request_id = r.id) as latest_offer
      from fair_requests r where r.user_id = ${userId} order by r.created_at desc limit 40`;
  });

export const getFairRequest = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: id }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    await expire(sql, userId);
    const requests = await sql<{
      id: string; user_id: string; name: string; description: string; category: string; brand: string; specs: string;
      condition: string; qty: number; budget_kobo: number; state: string; note: string; status: string; expires_at: string;
    }>`select id, user_id, name, description, category, brand, specs, condition, qty, budget_kobo, state, note, status, expires_at::text as expires_at
      from fair_requests where id = ${id}`;
    const request = requests[0];
    if (!request || request.user_id !== userId) throw new MarketError("That request is not yours");
    const offers = await sql<{
      id: string; price_kobo: number; condition: string; message: string; status: string; expires_at: string; variant_id: string;
      product_id: string; name: string; stock: number; product_status: string; list_kobo: number; slug: string;
      delivery_days_min: number | null; delivery_days_max: number | null; business_name: string; retailer_status: string;
      image_url: string; verification: string | null;
    }>`select o.id, o.price_kobo, o.condition, o.message, o.status, o.expires_at::text as expires_at, o.variant_id,
      p.id as product_id, p.name, p.stock, p.status as product_status, p.price_kobo as list_kobo, p.slug,
      p.delivery_days_min, p.delivery_days_max, r.business_name, r.status as retailer_status,
      coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
      (select v.status from retailer_verification_records v where v.retailer_id = r.id order by v.created_at desc limit 1) as verification
      from fair_offers o
      join products p on p.id = o.product_id
      join retailer_profiles r on r.id = o.retailer_id
      where o.request_id = ${id}
      order by o.created_at desc`;
    return {
      request,
      offers: offers.map((offer) => ({ ...offer, badge: retailerBadge(offer.retailer_status, offer.verification) })),
    };
  });

export const closeFairRequest = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: id }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const retailers = await withTransaction(async (tx) => {
      const rows = await tx<{ id: string }>`update fair_requests set status = 'closed', closed_at = now()
        where id = ${id} and user_id = ${userId} and status = 'open' and expires_at > now() returning id`;
      if (!rows[0]) throw new MarketError("That request is not yours to close");
      const pending = await tx<{ user_id: string }>`select r.user_id from fair_offers o
        join retailer_profiles r on r.id = o.retailer_id
        where o.request_id = ${id} and o.status = 'pending'`;
      await tx`update fair_offers set status = 'declined' where request_id = ${id} and status = 'pending'`;
      return pending.map((row) => row.user_id);
    });
    for (const retailerUser of retailers) {
      if (retailerUser.startsWith("catalogue-seed")) continue;
      await notifyUser(sql, { userId: retailerUser, title: "Request closed", body: "A Fair Deal request you offered on was closed.", href: "/retailer/fair" });
    }
    return { ok: true };
  });

export const selectFairOffer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: offerId }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const selected = await withTransaction(async (tx) => {
      const offers = await tx<{
        id: string; request_id: string; product_id: string; variant_id: string; price_kobo: number; retailer_user: string; status: string; offer_open: boolean;
      }>`select o.id, o.request_id, o.product_id, o.variant_id, o.price_kobo, o.status, o.expires_at > now() as offer_open, r.user_id as retailer_user
        from fair_offers o join retailer_profiles r on r.id = o.retailer_id where o.id = ${offerId} for update of o`;
      const offer = offers[0];
      if (!offer) throw new MarketError("That offer was not found");
      const requests = await tx<{
        id: string; user_id: string; status: string; qty: number; budget_kobo: number; request_open: boolean;
      }>`select id, user_id, status, qty, budget_kobo, expires_at > now() as request_open from fair_requests where id = ${offer.request_id} for update`;
      const request = requests[0];
      if (!request) throw new MarketError("That request was not found");
      if (!on(request.request_open) && request.status === "open") {
        await tx`update fair_requests set status = 'expired', closed_at = now() where id = ${request.id}`;
      }
      const reason = canSelectOffer({
        ownerId: request.user_id,
        viewerId: userId,
        requestStatus: on(request.request_open) ? request.status : "expired",
        offerStatus: on(offer.offer_open) ? offer.status : "expired",
        requestExpired: !on(request.request_open),
        offerExpired: !on(offer.offer_open),
      });
      if (reason) throw new MarketError(reason);
      const products = await tx<{ price_kobo: number; stock: number; status: string; retailer_id: string }>`
        select p.price_kobo, p.stock, p.status, p.retailer_id from products p
        join fair_offers o on o.product_id = p.id and o.retailer_id = p.retailer_id
        where p.id = ${offer.product_id} and o.id = ${offer.id}`;
      const product = products[0];
      if (!product || product.status !== "approved") throw new MarketError("That product is no longer available");
      let unit = Number(product.price_kobo);
      let stock = Number(product.stock);
      if (offer.variant_id) {
        const variants = await tx<{ price_delta_kobo: number; stock: number }>`
          select price_delta_kobo, stock from product_variants where id = ${offer.variant_id} and product_id = ${offer.product_id}`;
        if (!variants[0]) throw new MarketError("That option is no longer available");
        unit += Number(variants[0].price_delta_kobo);
        stock = Number(variants[0].stock);
      }
      if (stock < Number(request.qty)) throw new MarketError("There is not enough stock for this offer");
      const priceError = offerPriceAllowed({ unitKobo: Number(offer.price_kobo), qty: Number(request.qty), budgetKobo: Number(request.budget_kobo), catalogueUnit: unit });
      if (priceError) throw new MarketError(priceError);
      const won = await tx<{ id: string }>`update fair_offers set status = 'selected', selected_at = now()
        where id = ${offer.id} and status = 'pending' returning id`;
      if (!won[0]) throw new MarketError("That offer can no longer be selected");
      await tx`update fair_offers set status = 'declined' where request_id = ${request.id} and id <> ${offer.id} and status = 'pending'`;
      const closed = await tx<{ id: string }>`update fair_requests set status = 'fulfilled', closed_at = now()
        where id = ${request.id} and status = 'open' returning id`;
      if (!closed[0]) throw new MarketError("This request is no longer open");
      return { ...offer, qty: Number(request.qty) };
    });
    if (!selected.retailer_user.startsWith("catalogue-seed")) {
      await notifyUser(sql, { userId: selected.retailer_user, title: "Your offer was selected", body: "The customer chose your Fair Deal offer. It still has to be checked out.", href: "/retailer/fair" });
    }
    return { offerId: selected.id, productId: selected.product_id, variantId: selected.variant_id || null, qty: selected.qty, priceKobo: Number(selected.price_kobo) };
  });

export const listOpenFairRequests = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const retailer = await ownRetailer(sql, userId);
    if (!retailer || retailer.status !== "approved") throw new MarketError("Only an approved retailer can view requests");
    await expire(sql);
    const raw = (data ?? {}) as Record<string, unknown>;
    const category = clean(raw.category, 40);
    const state = clean(raw.state, 40);
    const rows = await sql<{
      id: string; name: string; description: string; category: string; brand: string; specs: string; condition: string;
      qty: number; budget_kobo: number; state: string; note: string; created_at: string; expires_at: string;
    }>`select id, name, description, category, brand, specs, condition, qty, budget_kobo, state, note, created_at::text as created_at, expires_at::text as expires_at
      from fair_requests where status = 'open' and expires_at > now()
      and (${category} = '' or category = ${category} or name ilike ${`%${category}%`})
      and (${state} = '' or state = ${state})
      order by created_at desc limit 50`;
    return rows;
  });

export const submitFairOffer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`fair-offer:${userId}`, 10, 10 * 60 * 1000);
    const raw = (data ?? {}) as Record<string, unknown>;
    const requestId = clean(raw.requestId, 80);
    const productId = clean(raw.productId, 80);
    const variantId = clean(raw.variantId, 80);
    const condition = clean(raw.condition, 10);
    if (condition !== "new" && condition !== "used") throw new MarketError("Say whether the item is new or used");
    const message = text(raw.message, 240);
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const retailer = await ownRetailer(sql, userId);
    if (!retailer || retailer.status !== "approved") throw new MarketError("Only an approved retailer can offer");
    const requests = await sql<{ qty: number; budget_kobo: number; status: string; open: boolean }>`
      select qty, budget_kobo, status, expires_at > now() as open from fair_requests where id = ${requestId}`;
    const request = requests[0];
    if (!request || request.status !== "open" || !on(request.open)) throw new MarketError("That request is not open");
    const products = await sql<{ price_kobo: number; stock: number; status: string }>`
      select price_kobo, stock, status from products where id = ${productId} and retailer_id = ${retailer.id}`;
    const product = products[0];
    if (!product || product.status !== "approved") throw new MarketError("Offer one of your approved products");
    let unit = Number(product.price_kobo);
    let stock = Number(product.stock);
    if (variantId) {
      const variants = await sql<{ price_delta_kobo: number; stock: number }>`
        select price_delta_kobo, stock from product_variants where id = ${variantId} and product_id = ${productId}`;
      if (!variants[0]) throw new MarketError("That option is not on your product");
      unit += Number(variants[0].price_delta_kobo);
      stock = Number(variants[0].stock);
    } else {
      const counted = await sql<{ n: number }>`select count(*)::int as n from product_variants where product_id = ${productId}`;
      if (Number(counted[0]?.n) > 0) throw new MarketError("Choose an option for that product");
    }
    if (stock < Number(request.qty)) throw new MarketError("You do not have enough stock");
    const price = money(raw.priceNaira);
    const priceError = offerPriceAllowed({ unitKobo: price, qty: Number(request.qty), budgetKobo: Number(request.budget_kobo), catalogueUnit: unit });
    if (priceError) throw new MarketError(priceError);
    const id = crypto.randomUUID();
    try {
      await sql`insert into fair_offers (id, request_id, retailer_id, product_id, variant_id, price_kobo, condition, message, expires_at)
        values (${id}, ${requestId}, ${retailer.id}, ${productId}, ${variantId}, ${price}, ${condition}, ${message}, now() + interval '7 days')`;
    } catch (error) {
      if (/duplicate|unique/i.test(error instanceof Error ? error.message : "")) throw new MarketError("You already have an offer for that product");
      throw error;
    }
    const owners = await sql<{ user_id: string }>`select user_id from fair_requests where id = ${requestId}`;
    if (owners[0]) {
      await notifyUser(sql, { userId: owners[0].user_id, title: "New Fair Deal offer", body: "A retailer offered one of their listings.", href: `/fair/${requestId}` });
    }
    return { id };
  });

export const listMyFairOffers = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    const retailer = await ownRetailer(sql, userId);
    if (!retailer) throw new MarketError("Apply as a retailer first");
    await ensureProfile(sql, userId, email);
    return sql<{ id: string; status: string; price_kobo: number; name: string; request_name: string; request_status: string }>`
      select o.id, o.status, o.price_kobo, p.name, r.name as request_name, r.status as request_status
      from fair_offers o
      join products p on p.id = o.product_id
      join fair_requests r on r.id = o.request_id
      where o.retailer_id = ${retailer.id}
      order by o.created_at desc limit 40`;
  });

export const withdrawFairOffer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: id }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const retailer = await ownRetailer(sql, userId);
    if (!retailer) throw new MarketError("Apply as a retailer first");
    const rows = await sql<{ id: string }>`update fair_offers set status = 'withdrawn'
      where id = ${id} and retailer_id = ${retailer.id} and status = 'pending' returning id`;
    if (!rows[0]) throw new MarketError("That offer cannot be withdrawn");
    return { ok: true };
  });

export const listOfferProducts = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const retailer = await ownRetailer(sql, userId);
    if (!retailer) throw new MarketError("Apply as a retailer first");
    const rows = await sql<{ id: string; name: string; price_kobo: number; stock: number; variants: unknown }>`
      select p.id, p.name, p.price_kobo, p.stock,
        coalesce((select json_agg(json_build_object('id', v.id, 'label', v.label, 'stock', v.stock, 'delta', v.price_delta_kobo) order by v.label)
          from product_variants v where v.product_id = p.id), '[]'::json) as variants
      from products p where p.retailer_id = ${retailer.id} and p.status = 'approved' order by p.name`;
    return rows.map((row) => {
      let raw = row.variants;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch {
          raw = [];
        }
      }
      const variants = Array.isArray(raw) ? raw.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const variant = item as { id?: unknown; label?: unknown; stock?: unknown; delta?: unknown };
        return typeof variant.id === "string" && typeof variant.label === "string"
          ? [{ id: variant.id, label: variant.label, stock: Number(variant.stock) || 0, delta: Number(variant.delta) || 0 }]
          : [];
      }) : [];
      return { ...row, variants };
    });
  });

export const adminListFair = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    await requireAdmin(sql, userId);
    await ensureProfile(sql, userId, email);
    const requests = await sql<{ id: string; name: string; status: string; budget_kobo: number; created_at: string; offer_count: number }>`
      select r.id, r.name, r.status, r.budget_kobo, r.created_at::text as created_at,
      (select count(*)::int from fair_offers o where o.request_id = r.id) as offer_count
      from fair_requests r order by r.created_at desc limit 80`;
    return requests;
  });

export const adminCloseFair = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id.slice(0, 80) : ""))
  .handler(async ({ context, data: id }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    await requireAdmin(sql, userId);
    await ensureProfile(sql, userId, email);
    const rows = await sql<{ id: string }>`update fair_requests set status = 'closed', closed_at = now()
      where id = ${id} and status = 'open' returning id`;
    if (!rows[0]) throw new MarketError("That request is not open");
    await sql`update fair_offers set status = 'declined' where request_id = ${id} and status = 'pending'`;
    await audit(sql, userId, "close_fair_request", "fair_request", id, "closed");
    return { ok: true };
  });
