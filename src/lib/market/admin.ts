import { createServerFn } from "@tanstack/react-start";
import { getSql, withTransaction } from "@/lib/db";
import { audit, clean, ensureProfile, requireAdmin } from "./guard.ts";
import { notifyUser } from "./notify.ts";
import { evaluateProductAlerts } from "./radar.ts";
import { nairaToKobo, percentToBps } from "./money.ts";
import { MarketError, recordRefund, transitionFulfilment } from "./records.ts";
import { sessionMiddleware, type SessionContext } from "./session.ts";

async function adminSql(userId: string, email: string) {
  const sql = await getSql();
  await ensureProfile(sql, userId, email);
  await requireAdmin(sql, userId);
  return sql;
}

/** Admin datetime-local values are Nigerian local time. */
function lagosStamp(value: unknown): string | null {
  const text = clean(value, 40);
  if (!text) return null;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return `${text.slice(0, 16)}:00+01:00`;
  return null;
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const customers = await sql<{ n: number }>`select count(*)::int as n from user_roles where role = 'customer'`;
    const retailers = await sql<{ status: string; n: number }>`select status, count(*)::int as n from retailer_profiles group by status`;
    const products = await sql<{ status: string; n: number }>`select status, count(*)::int as n from products group by status`;
    const orders = await sql<{ status: string; n: number }>`select status, count(*)::int as n from orders group by status`;
    const gmv = await sql<{ n: number }>`
      select coalesce(sum(oi.line_kobo),0)::int as n from order_items oi
      join orders o on o.id = oi.order_id
      where o.status in ('paid','partially_refunded','refunded')`;
    const commission = await sql<{ n: number }>`select coalesce(sum(commission_kobo),0)::int as n from commission_ledger`;
    const refunds = await sql<{ n: number }>`select coalesce(sum(amount_kobo),0)::int as n from refunds where status = 'recorded'`;
    const outstanding = await sql<{ n: number }>`
      select coalesce(sum(settlement_kobo),0)::int as n from commission_ledger where settlement_status = 'pending'`;
    const delivered = await sql<{ n: number }>`
      select count(*)::int as n from orders o
      where o.status = 'paid' and not exists (
        select 1 from retailer_orders ro where ro.order_id = o.id and ro.status not in ('delivered','rejected','cancelled')
      ) and exists (select 1 from retailer_orders ro where ro.order_id = o.id and ro.status = 'delivered')`;
    return {
      customers: Number(customers[0]?.n ?? 0),
      retailers: Object.fromEntries(retailers.map((row) => [row.status, Number(row.n)])),
      products: Object.fromEntries(products.map((row) => [row.status, Number(row.n)])),
      orders: Object.fromEntries(orders.map((row) => [row.status, Number(row.n)])),
      gmvKobo: Number(gmv[0]?.n ?? 0),
      commissionKobo: Number(commission[0]?.n ?? 0),
      refundsKobo: Number(refunds[0]?.n ?? 0),
      outstandingKobo: Number(outstanding[0]?.n ?? 0),
      fullyDelivered: Number(delivered[0]?.n ?? 0),
      paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
      emailConfigured: Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS),
    };
  });

export const adminListRetailers = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    return sql<{
      id: string;
      business_name: string;
      contact_name: string;
      email: string;
      phone: string;
      state: string;
      city: string;
      status: string;
      review_reason: string | null;
      description: string;
      categories: string;
      is_sample: boolean;
      created_at: string;
    }>`select id, business_name, contact_name, email, phone, state, city, status, review_reason,
      description, categories, is_sample, created_at::text as created_at
      from retailer_profiles order by created_at desc`;
  });

export const adminSetRetailerStatus = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const status = clean(raw.status, 20);
    if (!["approved", "rejected", "suspended", "pending"].includes(status)) throw new MarketError("Unknown status");
    const id = clean(raw.id, 80);
    const reason = clean(raw.reason, 400);
    const rows = await sql<{ user_id: string; business_name: string }>`
      update retailer_profiles set status = ${status}, review_reason = ${reason}, updated_at = now()
      where id = ${id} returning user_id, business_name`;
    if (!rows[0]) throw new MarketError("Retailer was not found");
    await sql`insert into retailer_verification_records (id, retailer_id, status, reason, actor_user_id)
      values (${crypto.randomUUID()}, ${id}, ${status}, ${reason}, ${userId})`;
    await audit(sql, userId, "retailer_status", "retailer", id, `${status}: ${reason}`);
    if (!rows[0].user_id.startsWith("catalogue-seed")) {
      await notifyUser(sql, {
        userId: rows[0].user_id,
        title: `Retailer application ${status}`,
        body: reason || `Status is now ${status}.`,
        href: "/retailer",
      });
    }
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    return sql<{
      id: string;
      name: string;
      status: string;
      price_kobo: number;
      stock: number;
      featured: boolean;
      business_name: string;
      moderation_reason: string;
    }>`select p.id, p.name, p.status, p.price_kobo, p.stock, p.featured, r.business_name, p.moderation_reason
       from products p join retailer_profiles r on r.id = p.retailer_id
       order by p.updated_at desc limit 200`;
  });

export const adminModerateProduct = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const status = clean(raw.status, 20);
    if (!["approved", "rejected", "archived", "pending"].includes(status)) throw new MarketError("Unknown status");
    const id = clean(raw.id, 80);
    const reason = clean(raw.reason, 400);
    const featured = raw.featured === true;
    const rows = await sql<{ user_id: string; name: string }>`
      update products set status = ${status}, moderation_reason = ${reason}, featured = ${featured}, updated_at = now()
      where id = ${id}
      returning (select user_id from retailer_profiles r where r.id = products.retailer_id) as user_id, name`;
    if (!rows[0]) throw new MarketError("Product was not found");
    await audit(sql, userId, "moderate_product", "product", id, status);
    if (rows[0].user_id && !rows[0].user_id.startsWith("catalogue-seed")) {
      await notifyUser(sql, {
        userId: rows[0].user_id,
        title: `Product ${status}`,
        body: `${rows[0].name}. ${reason}`.trim(),
        href: "/retailer/products",
      });
    }
    if (status === "approved") await evaluateProductAlerts(sql, id);
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const orders = await sql<{
      id: string;
      reference: string;
      status: string;
      total_kobo: number | null;
      state: string;
      city: string;
      created_at: string;
      customer_name: string;
    }>`select id, reference, status, total_kobo, state, city, created_at::text as created_at, customer_name
       from orders order by created_at desc limit 100`;
    const payments = await sql<{ order_id: string; reference: string; status: string; provider: string; amount_kobo: number }>`
      select order_id, reference, status, provider, amount_kobo from payments`;
    return { orders, payments };
  });

export const adminSetQuote = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const feeEach = nairaToKobo(clean(raw.feeNaira, 12));
    const orderId = clean(raw.orderId, 80);
    await withTransaction(async (sql) => {
      const orders = await sql<{ status: string; subtotal_kobo: number; discount_kobo: number; user_id: string; reference: string }>`
        select status, subtotal_kobo, discount_kobo, user_id, reference from orders where id = ${orderId} for update`;
      const order = orders[0];
      if (!order || order.status !== "awaiting_quote") throw new MarketError("This order is not waiting for a quote");
      const groups = await sql<{ n: number }>`select count(*)::int as n from retailer_orders where order_id = ${orderId}`;
      const delivery = feeEach * Number(groups[0]?.n ?? 1);
      const total = Number(order.subtotal_kobo) - Number(order.discount_kobo) + delivery;
      await sql`update orders set delivery_kobo = ${delivery}, total_kobo = ${total}, status = 'pending_payment' where id = ${orderId}`;
      await sql`update retailer_orders set delivery_kobo = ${feeEach} where order_id = ${orderId}`;
      const provider = process.env.PAYSTACK_SECRET_KEY ? "paystack" : "sandbox";
      await sql`insert into payments (id, order_id, reference, amount_kobo, currency, status, provider)
        values (${crypto.randomUUID()}, ${orderId}, ${order.reference}, ${total}, 'NGN', 'pending', ${provider})
        on conflict (reference) do update set amount_kobo = excluded.amount_kobo, status = 'pending'`;
      await notifyUser(sql, {
        userId: order.user_id,
        title: "Delivery fee ready",
        body: `${order.reference} can now be paid. You have not been charged yet.`,
        href: `/orders/${orderId}`,
      });
      await audit(sql, userId, "delivery_quote", "order", orderId, String(delivery));
    });
    return { ok: true };
  });

export const adminRecordRefund = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const amount = nairaToKobo(clean(raw.amountNaira, 12));
    const reason = clean(raw.reason, 400);
    const orderItemId = clean(raw.orderItemId, 80);
    if (reason.length < 3) throw new MarketError("Record a reason");
    await withTransaction(async (sql) => {
      await recordRefund(sql, { orderItemId, amountKobo: amount, reason, actorUserId: userId });
      await audit(sql, userId, "refund", "order_item", orderItemId, reason);
    });
    return { ok: true, note: "Refund recorded on the ledger. Paystack is not called unless you settle it in the Paystack dashboard." };
  });

export const adminFulfil = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    await withTransaction(async (sql) => {
      await transitionFulfilment(sql, {
        retailerOrderId: clean(raw.id, 80),
        to: clean(raw.status, 40),
        actorUserId: userId,
        note: clean(raw.note, 300),
        proof: clean(raw.proof, 120),
      });
    });
    return { ok: true };
  });

export const adminListRules = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const rules = await sql<{
      id: string;
      scope: string;
      category_id: string | null;
      retailer_id: string | null;
      bps: number;
      effective_from: string;
      active: boolean;
    }>`select id, scope, category_id, retailer_id, bps, effective_from::text as effective_from, active
      from commission_rules order by effective_from desc`;
    const categories = await sql<{ id: string; name: string }>`select id, name from product_categories order by sort_order`;
    const retailers = await sql<{ id: string; business_name: string }>`select id, business_name from retailer_profiles order by business_name`;
    const promos = await sql<{ code: string; bps_off: number; min_subtotal_kobo: number; active: boolean }>`select code, bps_off, min_subtotal_kobo, active from promo_codes order by code`;
    return { rules, categories, retailers, promos };
  });

export const adminSaveRule = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const scope = clean(raw.scope, 20);
    if (!["default", "category", "retailer"].includes(scope)) throw new MarketError("Unknown commission scope");
    const bps = percentToBps(clean(raw.percent, 8));
    const id = crypto.randomUUID();
    await sql`insert into commission_rules (id, scope, category_id, retailer_id, bps, effective_from, active)
      values (${id}, ${scope}, ${clean(raw.categoryId, 40) || null}, ${clean(raw.retailerId, 80) || null}, ${bps}, ${clean(raw.effectiveFrom, 10) || new Date().toISOString().slice(0, 10)}, true)`;
    await audit(sql, userId, "commission_rule", "commission_rule", id, `${scope} ${bps}`);
    return { ok: true };
  });

export const adminSavePromo = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const code = clean(raw.code, 24).toUpperCase();
    if (!/^[A-Z0-9]{3,24}$/.test(code)) throw new MarketError("Use letters and numbers for the code");
    const bps = percentToBps(clean(raw.percent, 8));
    const min = clean(raw.minNaira, 12);
    await sql`insert into promo_codes (code, bps_off, min_subtotal_kobo, active)
      values (${code}, ${bps}, ${min ? nairaToKobo(min) : 0}, true)
      on conflict (code) do update set bps_off = excluded.bps_off, min_subtotal_kobo = excluded.min_subtotal_kobo, active = true`;
    await audit(sql, userId, "promo", "promo_code", code, String(bps));
    return { ok: true };
  });

export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    return sql<{
      id: string;
      reference: string;
      name: string;
      description: string;
      category: string;
      brand: string;
      budget_min_kobo: number | null;
      budget_max_kobo: number | null;
      state: string;
      city: string;
      status: string;
      admin_note: string | null;
      quotation_kobo: number | null;
      quotation_note: string | null;
      created_at: string;
      user_id: string;
    }>`select id, reference, name, description, category, brand, budget_min_kobo, budget_max_kobo,
      state, city, status, admin_note, quotation_kobo, quotation_note, created_at::text as created_at, user_id
      from product_requests order by created_at desc limit 100`;
  });

export const adminUpdateRequest = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const status = clean(raw.status, 40);
    const allowed = ["submitted", "under_review", "retailer_contacted", "quotation_available", "customer_considering", "converted", "unavailable", "closed"];
    if (!allowed.includes(status)) throw new MarketError("Unknown request status");
    const quote = clean(raw.quotationNaira, 12);
    const id = clean(raw.id, 80);
    const rows = await sql<{ user_id: string; reference: string }>`
      update product_requests set status = ${status}, admin_note = ${clean(raw.adminNote, 800)},
        quotation_note = ${clean(raw.quotationNote, 800)},
        quotation_kobo = ${quote ? nairaToKobo(quote) : null}
      where id = ${id} returning user_id, reference`;
    if (!rows[0]) throw new MarketError("Request was not found");
    await notifyUser(sql, {
      userId: rows[0].user_id,
      title: "Product request updated",
      body: `${rows[0].reference} is now ${status.replaceAll("_", " ")}. This is not an order until you check out a real listing.`,
      href: "/request",
    });
    return { ok: true };
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const tickets = await sql<{ id: string; user_id: string; subject: string; status: string; created_at: string }>`select id, user_id, subject, status, created_at::text as created_at from support_tickets order by created_at desc limit 50`;
    const messages = await sql<{ ticket_id: string; body: string; created_at: string; author_user_id: string }>`select ticket_id, body, created_at::text as created_at, author_user_id from support_messages order by created_at`;
    return { tickets, messages };
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const ticketId = clean(raw.ticketId, 80);
    const body = clean(raw.body, 2000);
    if (body.length < 2) throw new MarketError("Write a reply");
    const tickets = await sql<{ user_id: string }>`update support_tickets set status = 'answered' where id = ${ticketId} returning user_id`;
    if (!tickets[0]) throw new MarketError("Ticket was not found");
    await sql`insert into support_messages (id, ticket_id, author_user_id, body) values (${crypto.randomUUID()}, ${ticketId}, ${userId}, ${body})`;
    await notifyUser(sql, { userId: tickets[0].user_id, title: "Support replied", body, href: "/support" });
    return { ok: true };
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const settings = await sql<{
      store_name: string;
      tagline: string;
      support_email: string;
      support_phone: string;
      contact_address: string;
    }>`select store_name, tagline, support_email, support_phone, contact_address from site_settings where id = 'default'`;
    const policies = await sql<{ slug: string; title: string; body: string }>`select slug, title, body from policies order by slug`;
    const zones = await sql<{ id: string; state: string; city: string; fee_kobo: number }>`select id, state, city, fee_kobo from delivery_zones order by state, city`;
    const campaigns = await sql<{
      id: string;
      title: string;
      status: string;
      active: boolean;
      retailer_id: string | null;
      rejection_reason: string;
    }>`select id, title, subtitle, image_url, link_path, active, status, retailer_id, rejection_reason from promotional_campaigns order by sort_order, title`;
    const categories = await sql<{ id: string; name: string }>`select id, name from product_categories order by sort_order`;
    return {
      settings: settings[0] ?? {
        store_name: "SEEK",
        tagline: "Building on Trust.",
        support_email: "",
        support_phone: "",
        contact_address: "",
      },
      policies,
      zones,
      campaigns,
      categories,
    };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    await sql`update site_settings set store_name = ${clean(raw.storeName, 60) || "SEEK"},
      tagline = ${clean(raw.tagline, 120)}, support_email = ${clean(raw.supportEmail, 120)},
      support_phone = ${clean(raw.supportPhone, 30)}, contact_address = ${clean(raw.contactAddress, 200)}
      where id = 'default'`;
    if (typeof raw.policySlug === "string" && typeof raw.policyBody === "string") {
      await sql`update policies set body = ${raw.policyBody.slice(0, 20000)}, title = ${clean(raw.policyTitle, 80)}, updated_at = now()
        where slug = ${clean(raw.policySlug, 40)}`;
    }
    if (typeof raw.zoneState === "string" && raw.zoneState && typeof raw.zoneFee === "string" && raw.zoneFee) {
      const fee = nairaToKobo(clean(raw.zoneFee, 12));
      const city = clean(raw.zoneCity, 60);
      await sql`insert into delivery_zones (id, state, city, fee_kobo)
        values (${crypto.randomUUID()}, ${clean(raw.zoneState, 40)}, ${city}, ${fee})
        on conflict (state, city) do update set fee_kobo = excluded.fee_kobo`;
    }
    if (typeof raw.categoryName === "string" && raw.categoryName.trim()) {
      const name = clean(raw.categoryName, 40);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await sql`insert into product_categories (id, slug, name, sort_order) values (${slug}, ${slug}, ${name}, 50)
        on conflict (id) do nothing`;
    }
    if (typeof raw.campaignTitle === "string" && raw.campaignTitle.trim()) {
      const starts = lagosStamp(raw.campaignStarts);
      const ends = lagosStamp(raw.campaignEnds);
      await sql`insert into promotional_campaigns (id, title, subtitle, image_url, link_path, active, starts_at, ends_at, status)
        values (${crypto.randomUUID()}, ${clean(raw.campaignTitle, 80)}, ${clean(raw.campaignSubtitle, 160)},
          ${clean(raw.campaignImage, 400) || "/products/hero.jpg"}, ${clean(raw.campaignLink, 80) || "/shop"}, true,
          ${starts}, ${ends}, 'approved')`;
    }
    await audit(sql, userId, "settings", "site", "default", "updated");
    return { ok: true };
  });

export const adminReviewCampaign = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const id = clean(raw.id, 80);
    const decision = clean(raw.decision, 20);
    if (decision !== "approved" && decision !== "rejected" && decision !== "paused") throw new MarketError("Unknown decision");
    const reason = clean(raw.reason, 200);
    await sql`update promotional_campaigns set status = ${decision}, active = ${decision === "approved"}, rejection_reason = ${reason} where id = ${id}`;
    await audit(sql, userId, "campaign", "promotional_campaigns", id, decision);
    return { ok: true };
  });

export const adminCreateSettlement = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const retailerId = clean(raw.retailerId, 80);
    const reference = clean(raw.reference, 80);
    const note = clean(raw.note, 200);
    await withTransaction(async (tx) => {
      const rows = await tx<{ settlement_kobo: number }>`
        select settlement_kobo from commission_ledger
        where retailer_id = ${retailerId} and settlement_status = 'pending' for update`;
      const amount = rows.reduce((sum, row) => sum + Number(row.settlement_kobo), 0);
      if (!rows.length) throw new MarketError("Nothing is waiting to settle for that retailer");
      const id = crypto.randomUUID();
      await tx`insert into retailer_settlements (id, retailer_id, amount_kobo, status, reference, note, paid_at)
        values (${id}, ${retailerId}, ${amount}, 'paid', ${reference}, ${note}, now())`;
      await tx`update commission_ledger set settlement_status = 'paid', settlement_id = ${id}
        where retailer_id = ${retailerId} and settlement_status = 'pending'`;
      await audit(tx, userId, "settlement", "retailer", retailerId, reference || id);
    });
    return { ok: true, note: "Settlement recorded. This does not move money by itself." };
  });

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    return sql<{
      id: string;
      product_id: string;
      retailer_id: string;
      category: string;
      body: string;
      status: string;
      admin_note: string;
      created_at: string;
      user_id: string;
      business_name: string;
    }>`select t.id, t.user_id, t.product_id, t.retailer_id, t.category, t.body, t.status, t.admin_note,
        t.created_at::text as created_at, r.business_name
      from trust_reports t
      join retailer_profiles r on r.id = t.retailer_id
      order by t.created_at desc limit 100`;
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const sql = await adminSql(userId, email);
    const raw = (data ?? {}) as Record<string, unknown>;
    const status = clean(raw.status, 20);
    if (!["open", "reviewing", "resolved"].includes(status)) throw new MarketError("Unknown report status");
    const id = clean(raw.id, 80);
    const rows = await sql<{ id: string }>`
      update trust_reports set status = ${status}, admin_note = ${clean(raw.adminNote, 800)}
      where id = ${id} returning id`;
    if (!rows[0]) throw new MarketError("Report was not found");
    await audit(sql, userId, "trust_report", "trust_report", id, status);
    return { ok: true };
  });
