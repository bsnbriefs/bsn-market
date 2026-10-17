import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getSql, withTransaction } from "@/lib/db";
import { canCustomerCancel, orderAccess } from "./authz.ts";
import { clean, ensureProfile, rateLimit, roleNames } from "./guard.ts";
import { notifyAdmins, notifyUser } from "./notify.ts";
import { sandboxConfirmAllowed } from "./pay.ts";
import {
  createOrderRecord,
  loadPricedCart,
  MarketError,
  markPaidRecord,
  releaseOrderStock,
  type CartLineInput,
  type Query,
} from "./records.ts";
import { optionalSessionMiddleware, sessionMiddleware, type SessionContext } from "./session.ts";

function asQuery(sql: Awaited<ReturnType<typeof getSql>>): Query {
  return { query: (text, params) => sql.query(text, params) };
}

function linesOf(input: unknown): CartLineInput[] {
  const raw = (input as { items?: unknown })?.items;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as { productId?: unknown; variantId?: unknown; qty?: unknown; offerId?: unknown };
    const qty = Number(item.qty);
    if (typeof item.productId !== "string" || !Number.isInteger(qty)) return [];
    return [
      {
        productId: item.productId.slice(0, 80),
        variantId: typeof item.variantId === "string" && item.variantId ? item.variantId.slice(0, 80) : null,
        offerId: typeof item.offerId === "string" && item.offerId ? item.offerId.slice(0, 80) : null,
        qty,
      },
    ];
  });
}

export const quoteCart = createServerFn({ method: "POST" })
  .middleware([optionalSessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    const body = (data ?? {}) as { items?: unknown; state?: unknown; city?: unknown; promoCode?: unknown };
    const sql = await getSql();
    const priced = await loadPricedCart(asQuery(sql), {
      lines: linesOf({ items: body.items }),
      state: typeof body.state === "string" ? body.state : "",
      city: typeof body.city === "string" ? body.city : "",
      promoCode: typeof body.promoCode === "string" ? body.promoCode : "",
      lock: false,
      buyerId: (context as SessionContext).userId,
    });
    return {
      lines: priced.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        name: line.name,
        variantLabel: line.variantLabel,
        retailerId: line.retailerId,
        retailerName: line.retailerName,
        unitKobo: line.unitKobo,
        qty: line.qty,
        lineKobo: line.lineKobo,
        stock: line.stock,
        offerId: line.offerId ?? null,
      })),
      retailerIds: priced.retailerIds,
      subtotalKobo: priced.subtotalKobo,
      discountKobo: priced.discountKobo,
      deliveryKobo: priced.deliveryKobo,
      totalKobo: priced.totalKobo,
      issues: priced.issues,
    };
  });

export const getServerCart = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const rows = await sql<{ product_id: string; variant_id: string; qty: number; offer_id: string }>`
      select product_id, variant_id, qty, offer_id from cart_items where user_id = ${userId}`;
    return rows.map((row) => ({
      productId: row.product_id,
      variantId: row.variant_id || null,
      offerId: row.offer_id || null,
      qty: Number(row.qty),
    }));
  });

export const syncCart = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => linesOf(input))
  .handler(async ({ context, data }) => {
    const { userId } = context as SessionContext;
    await withTransaction(async (sql) => {
      await sql`insert into carts (user_id) values (${userId}) on conflict (user_id) do update set updated_at = now()`;
      await sql`delete from cart_items where user_id = ${userId}`;
      for (const item of data) {
        if (item.qty < 1 || item.qty > 10) continue;
        await sql`insert into cart_items (id, user_id, product_id, variant_id, qty, offer_id)
          values (${crypto.randomUUID()}, ${userId}, ${item.productId}, ${item.variantId ?? ""}, ${item.qty}, ${item.offerId ?? ""})`;
      }
    });
    return { ok: true };
  });

function customerOf(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const customer = {
    name: clean(raw.name, 80),
    email: clean(raw.email, 120),
    phone: clean(raw.phone, 20),
    line: clean(raw.line, 160),
    state: clean(raw.state, 40),
    city: clean(raw.city, 60),
    instructions: clean(raw.instructions, 240),
  };
  if (customer.name.length < 2) throw new MarketError("Enter the recipient name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new MarketError("Enter a valid email");
  if (customer.phone.length < 7) throw new MarketError("Enter a phone number");
  if (customer.line.length < 4) throw new MarketError("Enter a delivery address");
  if (!customer.state || !customer.city) throw new MarketError("Enter the state and city");
  return customer;
}

function paystackOn(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

async function initializePaystack(args: { email: string; amount: number; reference: string; callbackUrl: string }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: args.email,
      amount: args.amount,
      currency: "NGN",
      reference: args.reference,
      callback_url: args.callbackUrl,
    }),
  });
  const body = (await response.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string } };
  if (!response.ok || !body.status || !body.data?.authorization_url) {
    throw new MarketError(body.message || "Paystack did not start checkout");
  }
  return body.data.authorization_url;
}

export const checkout = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const key = clean(raw.idempotencyKey, 80);
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) throw new MarketError("Checkout could not be repeated safely. Refresh and try again.");
    rateLimit(`checkout:${userId}`, 8, 10 * 60 * 1000);
    const customer = customerOf(raw);
    const lines = linesOf(raw);
    const promoCode = clean(raw.promoCode, 40);
    const provider = paystackOn() ? "paystack" : "sandbox";
    const order = await withTransaction(async (sql) => {
      await ensureProfile(sql, userId, email || customer.email);
      return createOrderRecord(asQuery(sql), {
        userId,
        idempotencyKey: key,
        customer: { ...customer, email: customer.email || email },
        lines,
        promoCode,
        provider,
      });
    });
    const sql = await getSql();
    if (order.created) {
      await notifyUser(sql, {
        userId,
        title: order.status === "awaiting_quote" ? "Delivery quote requested" : "Order placed",
        body:
          order.status === "awaiting_quote"
            ? `${order.reference} is waiting for a delivery fee. Nothing has been marked paid.`
            : `${order.reference} is waiting for payment verification.`,
        href: `/orders/${order.orderId}`,
      });
      const retailers = await sql<{ user_id: string }>`
        select distinct r.user_id from retailer_orders ro
        join retailer_profiles r on r.id = ro.retailer_id
        where ro.order_id = ${order.orderId}`;
      for (const retailer of retailers) {
        if (retailer.user_id.startsWith("catalogue-seed")) continue;
        await notifyUser(sql, {
          userId: retailer.user_id,
          title: "New order to fulfil",
          body: `${order.reference} includes your products.`,
          href: "/retailer/orders",
        });
      }
      await notifyAdmins(sql, {
        title: "New marketplace order",
        body: order.reference,
        href: "/admin/orders",
      });
    }
    let authorizationUrl: string | null = null;
    let paymentNote = "";
    if (order.status === "awaiting_quote") {
      paymentNote = "No delivery fee is configured for this state. An administrator will quote it. You have not been charged.";
    } else if (order.totalKobo && provider === "paystack") {
      try {
        const request = getRequest();
        const origin = process.env.APP_BASE_URL || new URL(request.url).origin;
        authorizationUrl = await initializePaystack({
          email: customer.email,
          amount: order.totalKobo,
          reference: order.reference,
          callbackUrl: `${origin}/orders/${order.orderId}`,
        });
      } catch (error) {
        paymentNote = error instanceof Error ? error.message : "Paystack could not start";
      }
    } else {
      paymentNote =
        "Paystack is not connected. This order is unpaid. You can record a clearly labelled test payment, which is not a real charge.";
    }
    return { ...order, authorizationUrl, paymentNote, provider };
  });

export const confirmSandboxPayment = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((orderId: unknown) => (typeof orderId === "string" ? orderId : ""))
  .handler(async ({ context, data: orderId }) => {
    const { userId } = context as SessionContext;
    if (!sandboxConfirmAllowed(paystackOn(), "sandbox")) {
      throw new MarketError("Test payment is unavailable because Paystack is configured");
    }
    const sql = await getSql();
    const rows = await sql<{ reference: string; amount_kobo: number; provider: string; user_id: string }>`
      select p.reference, p.amount_kobo, p.provider, o.user_id
      from payments p join orders o on o.id = p.order_id
      where o.id = ${orderId}`;
    const payment = rows[0];
    if (!payment || payment.user_id !== userId) throw new MarketError("Order was not found");
    if (!sandboxConfirmAllowed(paystackOn(), payment.provider)) {
      throw new MarketError("This order is not a test payment");
    }
    await withTransaction(async (tx) => {
      await markPaidRecord(asQuery(tx), {
        reference: payment.reference,
        paidKobo: Number(payment.amount_kobo),
        currency: "NGN",
        providerStatus: "success",
      });
    });
    await notifyUser(sql, {
      userId,
      title: "Test payment recorded",
      body: `${payment.reference} was marked paid in sandbox mode. This was not a Paystack charge.`,
      href: `/orders/${orderId}`,
    });
    return { ok: true };
  });

export const refreshPayment = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((orderId: unknown) => (typeof orderId === "string" ? orderId : ""))
  .handler(async ({ context, data: orderId }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const roles = await roleNames(sql, userId);
    const rows = await sql<{ reference: string; user_id: string; status: string }>`
      select p.reference, o.user_id, o.status from payments p
      join orders o on o.id = p.order_id where o.id = ${orderId}`;
    const payment = rows[0];
    if (!payment) return { checked: false as const, reason: "No payment to verify" };
    if (payment.user_id !== userId && !roles.includes("admin")) throw new MarketError("Order was not found");
    if (payment.status === "paid") return { checked: true as const, status: "paid" };
    const { verifyPaystack } = await import("./paystack.server");
    const verified = await verifyPaystack(payment.reference);
    if (!verified) return { checked: false as const, reason: "Paystack is not connected or did not verify this reference" };
    if (verified.status !== "success") return { checked: true as const, status: verified.status ?? "pending" };
    await withTransaction(async (tx) => {
      await markPaidRecord(asQuery(tx), {
        reference: payment.reference,
        paidKobo: Number(verified.amount),
        currency: verified.currency ?? "",
        providerStatus: verified.status ?? "",
      });
    });
    return { checked: true as const, status: "paid" };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    return sql<{ id: string; reference: string; status: string; total_kobo: number | null; created_at: string }>`
      select id, reference, status, total_kobo, created_at::text as created_at
      from orders where user_id = ${userId} order by created_at desc limit 50`;
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .validator((orderId: unknown) => (typeof orderId === "string" ? orderId : ""))
  .handler(async ({ context, data: orderId }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    const roles = await roleNames(sql, userId);
    const retailer = await sql<{ id: string }>`select id from retailer_profiles where user_id = ${userId}`;
    const orders = await sql<{
      id: string;
      reference: string;
      user_id: string;
      status: string;
      customer_name: string;
      email: string;
      phone: string;
      address_line: string;
      state: string;
      city: string;
      instructions: string;
      subtotal_kobo: number;
      discount_kobo: number;
      delivery_kobo: number | null;
      total_kobo: number | null;
      created_at: string;
    }>`select id, reference, user_id, status, customer_name, email, phone, address_line, state, city,
              instructions, subtotal_kobo, discount_kobo, delivery_kobo, total_kobo, created_at::text as created_at
       from orders where id = ${orderId}`;
    const order = orders[0];
    if (!order) return null;
    const items = await sql<{
      id: string;
      retailer_id: string;
      name_snapshot: string;
      variant_snapshot: string;
      retailer_name_snapshot: string;
      unit_price_kobo: number;
      qty: number;
      line_kobo: number;
      commission_bps: number;
      commission_kobo: number;
      return_eligible: boolean;
    }>`select id, retailer_id, name_snapshot, variant_snapshot, retailer_name_snapshot, unit_price_kobo, qty,
              line_kobo, commission_bps, commission_kobo, return_eligible
       from order_items where order_id = ${orderId}`;
    const access = orderAccess({
      userId,
      isAdmin: roles.includes("admin"),
      actorRetailerId: retailer[0]?.id ?? null,
      orderUserId: order.user_id,
      itemRetailerIds: items.map((item) => item.retailer_id),
    });
    if (!access) return null;
    const fulfilments = await sql<{
      id: string;
      retailer_id: string;
      status: string;
      delivery_kobo: number | null;
      note: string;
    }>`select id, retailer_id, status, delivery_kobo, note from retailer_orders where order_id = ${orderId}`;
    const payments = await sql<{ reference: string; status: string; provider: string; amount_kobo: number }>`
      select reference, status, provider, amount_kobo from payments where order_id = ${orderId}`;
    const visibleItems =
      access === "retailer" ? items.filter((item) => item.retailer_id === retailer[0]?.id) : items;
    const visibleFulfilment =
      access === "retailer" ? fulfilments.filter((row) => row.retailer_id === retailer[0]?.id) : fulfilments;
    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      createdAt: order.created_at,
      subtotalKobo: Number(order.subtotal_kobo),
      discountKobo: Number(order.discount_kobo),
      deliveryKobo: order.delivery_kobo === null ? null : Number(order.delivery_kobo),
      totalKobo: order.total_kobo === null ? null : Number(order.total_kobo),
      access,
      contact:
        access === "retailer"
          ? {
              name: order.customer_name,
              phone: order.phone,
              line: order.address_line,
              state: order.state,
              city: order.city,
              instructions: order.instructions,
            }
          : {
              name: order.customer_name,
              email: order.email,
              phone: order.phone,
              line: order.address_line,
              state: order.state,
              city: order.city,
              instructions: order.instructions,
            },
      items: visibleItems.map((item) => ({
        id: item.id,
        retailerId: item.retailer_id,
        name: item.name_snapshot,
        variant: item.variant_snapshot,
        retailerName: item.retailer_name_snapshot,
        unitKobo: Number(item.unit_price_kobo),
        qty: Number(item.qty),
        lineKobo: Number(item.line_kobo),
        commissionBps: access === "customer" ? null : Number(item.commission_bps),
        commissionKobo: access === "customer" ? null : Number(item.commission_kobo),
        returnEligible: Boolean(item.return_eligible),
      })),
      fulfilments: visibleFulfilment.map((row) => ({
        id: row.id,
        retailerId: row.retailer_id,
        status: row.status,
        deliveryKobo: row.delivery_kobo === null ? null : Number(row.delivery_kobo),
        note: row.note,
      })),
      payment: payments[0]
        ? {
            reference: payments[0].reference,
            status: payments[0].status,
            provider: payments[0].provider,
            amountKobo: Number(payments[0].amount_kobo),
          }
        : null,
      paystackConfigured: paystackOn(),
      canCancel: access === "customer" && canCustomerCancel(fulfilments.map((row) => row.status)) && ["pending_payment", "awaiting_quote"].includes(order.status),
    };
  });

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((orderId: unknown) => (typeof orderId === "string" ? orderId : ""))
  .handler(async ({ context, data: orderId }) => {
    const { userId } = context as SessionContext;
    await withTransaction(async (sql) => {
      const orders = await sql<{ status: string; user_id: string }>`
        select status, user_id from orders where id = ${orderId} for update`;
      const order = orders[0];
      if (!order || order.user_id !== userId) throw new MarketError("Order was not found");
      const fulfilments = await sql<{ status: string }>`select status from retailer_orders where order_id = ${orderId}`;
      if (!canCustomerCancel(fulfilments.map((row) => row.status)) || !["pending_payment", "awaiting_quote"].includes(order.status)) {
        throw new MarketError("This order can no longer be cancelled here");
      }
      await releaseOrderStock(asQuery(sql), orderId);
      await sql`update orders set status = 'cancelled' where id = ${orderId}`;
      await sql`update retailer_orders set status = 'cancelled' where order_id = ${orderId} and status = 'pending'`;
      await sql`update payments set status = 'abandoned' where order_id = ${orderId} and status = 'pending'`;
    });
    return { ok: true };
  });

export const requestReturn = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId } = context as SessionContext;
    const raw = (data ?? {}) as { orderItemId?: unknown; reason?: unknown };
    const orderItemId = clean(raw.orderItemId, 80);
    const reason = clean(raw.reason, 400);
    if (reason.length < 4) throw new MarketError("Tell us why you want a return");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      order_id: string;
      return_eligible: boolean;
      user_id: string;
      fulfilment: string;
      line_kobo: number;
    }>`
      select oi.id, oi.order_id, oi.return_eligible, oi.line_kobo, o.user_id, ro.status as fulfilment
      from order_items oi
      join orders o on o.id = oi.order_id
      join retailer_orders ro on ro.order_id = oi.order_id and ro.retailer_id = oi.retailer_id
      where oi.id = ${orderItemId}`;
    const row = rows[0];
    if (!row || row.user_id !== userId) throw new MarketError("Item was not found");
    if (!row.return_eligible || row.fulfilment !== "delivered") {
      throw new MarketError("This item is not eligible for a return yet");
    }
    await sql`insert into refunds (id, order_id, order_item_id, amount_kobo, reason, status, actor_user_id)
      values (${crypto.randomUUID()}, ${row.order_id}, ${row.id}, ${row.line_kobo}, ${reason}, 'requested', ${userId})`;
    await notifyAdmins(sql, {
      title: "Return requested",
      body: reason,
      href: "/admin/orders",
    });
    return { ok: true, note: "Request recorded. A refund is not complete until an administrator records it." };
  });
