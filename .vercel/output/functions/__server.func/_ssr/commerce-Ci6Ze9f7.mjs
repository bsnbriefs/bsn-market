import { c as getSql, h as withTransaction } from "./money-eRJ-C_HK.mjs";
import { _ as sandboxConfirmAllowed, a as createOrderRecord, c as loadPricedCart, d as notifyUser, f as orderAccess, h as releaseOrderStock, l as markPaidRecord, n as canCustomerCancel, t as MarketError, u as notifyAdmins } from "./notify-DZJIERaE.mjs";
import { o as getRequest, r as createServerFn } from "./ssr.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as roleNames, i as ensureProfile, o as rateLimit, r as clean } from "./guard-BzDsEAOV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/commerce-Ci6Ze9f7.js
function asQuery(sql) {
	return { query: (text, params) => sql.query(text, params) };
}
function linesOf(input) {
	const raw = input?.items;
	if (!Array.isArray(raw)) return [];
	return raw.slice(0, 30).flatMap((row) => {
		if (!row || typeof row !== "object") return [];
		const item = row;
		const qty = Number(item.qty);
		if (typeof item.productId !== "string" || !Number.isInteger(qty)) return [];
		return [{
			productId: item.productId.slice(0, 80),
			variantId: typeof item.variantId === "string" && item.variantId ? item.variantId.slice(0, 80) : null,
			qty
		}];
	});
}
var quoteCart_createServerFn_handler = createServerRpc({
	id: "5963b489058568510f0f43a4b3cd19d48f99e66914a2e0e64f9321812d20b1da",
	name: "quoteCart",
	filename: "src/lib/market/commerce.ts"
}, (opts) => quoteCart.__executeServer(opts));
var quoteCart = createServerFn({ method: "POST" }).validator((input) => input).handler(quoteCart_createServerFn_handler, async ({ data }) => {
	const body = data ?? {};
	const sql = await getSql();
	const priced = await loadPricedCart(asQuery(sql), {
		lines: linesOf({ items: body.items }),
		state: typeof body.state === "string" ? body.state : "",
		city: typeof body.city === "string" ? body.city : "",
		promoCode: typeof body.promoCode === "string" ? body.promoCode : "",
		lock: false
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
			stock: line.stock
		})),
		retailerIds: priced.retailerIds,
		subtotalKobo: priced.subtotalKobo,
		discountKobo: priced.discountKobo,
		deliveryKobo: priced.deliveryKobo,
		totalKobo: priced.totalKobo,
		issues: priced.issues
	};
});
var getServerCart_createServerFn_handler = createServerRpc({
	id: "e2722ed9bd3de9705900bd9192f64f1e535ac1cdbea087da6824365c95d49631",
	name: "getServerCart",
	filename: "src/lib/market/commerce.ts"
}, (opts) => getServerCart.__executeServer(opts));
var getServerCart = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(getServerCart_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	return (await (await getSql())`
      select product_id, variant_id, qty from cart_items where user_id = ${userId}`).map((row) => ({
		productId: row.product_id,
		variantId: row.variant_id || null,
		qty: Number(row.qty)
	}));
});
var syncCart_createServerFn_handler = createServerRpc({
	id: "02594af8c873dde0162c1c3e878ed84c4e6a78ce8371584a5aa5cf698d4ff406",
	name: "syncCart",
	filename: "src/lib/market/commerce.ts"
}, (opts) => syncCart.__executeServer(opts));
var syncCart = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => linesOf(input)).handler(syncCart_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	await withTransaction(async (sql) => {
		await sql`insert into carts (user_id) values (${userId}) on conflict (user_id) do update set updated_at = now()`;
		await sql`delete from cart_items where user_id = ${userId}`;
		for (const item of data) {
			if (item.qty < 1 || item.qty > 10) continue;
			await sql`insert into cart_items (id, user_id, product_id, variant_id, qty)
          values (${crypto.randomUUID()}, ${userId}, ${item.productId}, ${item.variantId ?? ""}, ${item.qty})`;
		}
	});
	return { ok: true };
});
function customerOf(input) {
	const raw = input ?? {};
	const customer = {
		name: clean(raw.name, 80),
		email: clean(raw.email, 120),
		phone: clean(raw.phone, 20),
		line: clean(raw.line, 160),
		state: clean(raw.state, 40),
		city: clean(raw.city, 60),
		instructions: clean(raw.instructions, 240)
	};
	if (customer.name.length < 2) throw new MarketError("Enter the recipient name");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new MarketError("Enter a valid email");
	if (customer.phone.length < 7) throw new MarketError("Enter a phone number");
	if (customer.line.length < 4) throw new MarketError("Enter a delivery address");
	if (!customer.state || !customer.city) throw new MarketError("Enter the state and city");
	return customer;
}
function paystackOn() {
	return Boolean(process.env.PAYSTACK_SECRET_KEY);
}
async function initializePaystack(args) {
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) return null;
	const response = await fetch("https://api.paystack.co/transaction/initialize", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${secret}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email: args.email,
			amount: args.amount,
			currency: "NGN",
			reference: args.reference,
			callback_url: args.callbackUrl
		})
	});
	const body = await response.json();
	if (!response.ok || !body.status || !body.data?.authorization_url) throw new MarketError(body.message || "Paystack did not start checkout");
	return body.data.authorization_url;
}
var checkout_createServerFn_handler = createServerRpc({
	id: "97e6c883d74b5cad95c7515e9e4bc025b4621dd8f840c2a2ca3da3d070e615fe",
	name: "checkout",
	filename: "src/lib/market/commerce.ts"
}, (opts) => checkout.__executeServer(opts));
var checkout = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(checkout_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const raw = data ?? {};
	const key = clean(raw.idempotencyKey, 80);
	if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) throw new MarketError("Checkout could not be repeated safely. Refresh and try again.");
	rateLimit(`checkout:${userId}`, 8, 6e5);
	const customer = customerOf(raw);
	const lines = linesOf(raw);
	const promoCode = clean(raw.promoCode, 40);
	const provider = paystackOn() ? "paystack" : "sandbox";
	const order = await withTransaction(async (sql) => {
		await ensureProfile(sql, userId, email || customer.email);
		return createOrderRecord(asQuery(sql), {
			userId,
			idempotencyKey: key,
			customer: {
				...customer,
				email: customer.email || email
			},
			lines,
			promoCode,
			provider
		});
	});
	const sql = await getSql();
	if (order.created) {
		await notifyUser(sql, {
			userId,
			title: order.status === "awaiting_quote" ? "Delivery quote requested" : "Order placed",
			body: order.status === "awaiting_quote" ? `${order.reference} is waiting for a delivery fee. Nothing has been marked paid.` : `${order.reference} is waiting for payment verification.`,
			href: `/orders/${order.orderId}`
		});
		const retailers = await sql`
        select distinct r.user_id from retailer_orders ro
        join retailer_profiles r on r.id = ro.retailer_id
        where ro.order_id = ${order.orderId}`;
		for (const retailer of retailers) {
			if (retailer.user_id.startsWith("catalogue-seed")) continue;
			await notifyUser(sql, {
				userId: retailer.user_id,
				title: "New order to fulfil",
				body: `${order.reference} includes your products.`,
				href: "/retailer/orders"
			});
		}
		await notifyAdmins(sql, {
			title: "New marketplace order",
			body: order.reference,
			href: "/admin/orders"
		});
	}
	let authorizationUrl = null;
	let paymentNote = "";
	if (order.status === "awaiting_quote") paymentNote = "No delivery fee is configured for this state. An administrator will quote it. You have not been charged.";
	else if (order.totalKobo && provider === "paystack") try {
		const request = getRequest();
		const origin = process.env.APP_BASE_URL || new URL(request.url).origin;
		authorizationUrl = await initializePaystack({
			email: customer.email,
			amount: order.totalKobo,
			reference: order.reference,
			callbackUrl: `${origin}/orders/${order.orderId}`
		});
	} catch (error) {
		paymentNote = error instanceof Error ? error.message : "Paystack could not start";
	}
	else paymentNote = "Paystack is not connected. This order is unpaid. You can record a clearly labelled test payment, which is not a real charge.";
	return {
		...order,
		authorizationUrl,
		paymentNote,
		provider
	};
});
var confirmSandboxPayment_createServerFn_handler = createServerRpc({
	id: "8e9adfa8f4fbba4b22ed8b69aeb94182ecd633c36240dc6e8ac0c70c6e19e18e",
	name: "confirmSandboxPayment",
	filename: "src/lib/market/commerce.ts"
}, (opts) => confirmSandboxPayment.__executeServer(opts));
var confirmSandboxPayment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(confirmSandboxPayment_createServerFn_handler, async ({ context, data: orderId }) => {
	const { userId } = context;
	if (!sandboxConfirmAllowed(paystackOn(), "sandbox")) throw new MarketError("Test payment is unavailable because Paystack is configured");
	const sql = await getSql();
	const payment = (await sql`
      select p.reference, p.amount_kobo, p.provider, o.user_id
      from payments p join orders o on o.id = p.order_id
      where o.id = ${orderId}`)[0];
	if (!payment || payment.user_id !== userId) throw new MarketError("Order was not found");
	if (!sandboxConfirmAllowed(paystackOn(), payment.provider)) throw new MarketError("This order is not a test payment");
	await withTransaction(async (tx) => {
		await markPaidRecord(asQuery(tx), {
			reference: payment.reference,
			paidKobo: Number(payment.amount_kobo),
			currency: "NGN",
			providerStatus: "success"
		});
	});
	await notifyUser(sql, {
		userId,
		title: "Test payment recorded",
		body: `${payment.reference} was marked paid in sandbox mode. This was not a Paystack charge.`,
		href: `/orders/${orderId}`
	});
	return { ok: true };
});
var refreshPayment_createServerFn_handler = createServerRpc({
	id: "3bbd31d27438d04d32202c0fe146b129786dc713b6dc792061b68cf6a158a110",
	name: "refreshPayment",
	filename: "src/lib/market/commerce.ts"
}, (opts) => refreshPayment.__executeServer(opts));
var refreshPayment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(refreshPayment_createServerFn_handler, async ({ context, data: orderId }) => {
	const { userId } = context;
	const sql = await getSql();
	const roles = await roleNames(sql, userId);
	const payment = (await sql`
      select p.reference, o.user_id, o.status from payments p
      join orders o on o.id = p.order_id where o.id = ${orderId}`)[0];
	if (!payment) return {
		checked: false,
		reason: "No payment to verify"
	};
	if (payment.user_id !== userId && !roles.includes("admin")) throw new MarketError("Order was not found");
	if (payment.status === "paid") return {
		checked: true,
		status: "paid"
	};
	const { verifyPaystack } = await import("./paystack.server-CsLVe7XK.mjs");
	const verified = await verifyPaystack(payment.reference);
	if (!verified) return {
		checked: false,
		reason: "Paystack is not connected or did not verify this reference"
	};
	if (verified.status !== "success") return {
		checked: true,
		status: verified.status ?? "pending"
	};
	await withTransaction(async (tx) => {
		await markPaidRecord(asQuery(tx), {
			reference: payment.reference,
			paidKobo: Number(verified.amount),
			currency: verified.currency ?? "",
			providerStatus: verified.status ?? ""
		});
	});
	return {
		checked: true,
		status: "paid"
	};
});
var listMyOrders_createServerFn_handler = createServerRpc({
	id: "fe927b044aa63be080a3bd310cb576091f28fc671db53211e07b660ead2fc868",
	name: "listMyOrders",
	filename: "src/lib/market/commerce.ts"
}, (opts) => listMyOrders.__executeServer(opts));
var listMyOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(listMyOrders_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	return (await getSql())`
      select id, reference, status, total_kobo, created_at::text as created_at
      from orders where user_id = ${userId} order by created_at desc limit 50`;
});
var getMyOrder_createServerFn_handler = createServerRpc({
	id: "e65ca05e8271455c8fd033e94bf611fc338de2082d309a6dcc9ff98641ed836d",
	name: "getMyOrder",
	filename: "src/lib/market/commerce.ts"
}, (opts) => getMyOrder.__executeServer(opts));
var getMyOrder = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(getMyOrder_createServerFn_handler, async ({ context, data: orderId }) => {
	const { userId } = context;
	const sql = await getSql();
	const roles = await roleNames(sql, userId);
	const retailer = await sql`select id from retailer_profiles where user_id = ${userId}`;
	const order = (await sql`select id, reference, user_id, status, customer_name, email, phone, address_line, state, city,
              instructions, subtotal_kobo, discount_kobo, delivery_kobo, total_kobo, created_at::text as created_at
       from orders where id = ${orderId}`)[0];
	if (!order) return null;
	const items = await sql`select id, retailer_id, name_snapshot, variant_snapshot, retailer_name_snapshot, unit_price_kobo, qty,
              line_kobo, commission_bps, commission_kobo, return_eligible
       from order_items where order_id = ${orderId}`;
	const access = orderAccess({
		userId,
		isAdmin: roles.includes("admin"),
		actorRetailerId: retailer[0]?.id ?? null,
		orderUserId: order.user_id,
		itemRetailerIds: items.map((item) => item.retailer_id)
	});
	if (!access) return null;
	const fulfilments = await sql`select id, retailer_id, status, delivery_kobo, note from retailer_orders where order_id = ${orderId}`;
	const payments = await sql`
      select reference, status, provider, amount_kobo from payments where order_id = ${orderId}`;
	const visibleItems = access === "retailer" ? items.filter((item) => item.retailer_id === retailer[0]?.id) : items;
	const visibleFulfilment = access === "retailer" ? fulfilments.filter((row) => row.retailer_id === retailer[0]?.id) : fulfilments;
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
		contact: access === "retailer" ? {
			name: order.customer_name,
			phone: order.phone,
			line: order.address_line,
			state: order.state,
			city: order.city,
			instructions: order.instructions
		} : {
			name: order.customer_name,
			email: order.email,
			phone: order.phone,
			line: order.address_line,
			state: order.state,
			city: order.city,
			instructions: order.instructions
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
			returnEligible: Boolean(item.return_eligible)
		})),
		fulfilments: visibleFulfilment.map((row) => ({
			id: row.id,
			retailerId: row.retailer_id,
			status: row.status,
			deliveryKobo: row.delivery_kobo === null ? null : Number(row.delivery_kobo),
			note: row.note
		})),
		payment: payments[0] ? {
			reference: payments[0].reference,
			status: payments[0].status,
			provider: payments[0].provider,
			amountKobo: Number(payments[0].amount_kobo)
		} : null,
		paystackConfigured: paystackOn(),
		canCancel: access === "customer" && canCustomerCancel(fulfilments.map((row) => row.status)) && ["pending_payment", "awaiting_quote"].includes(order.status)
	};
});
var cancelMyOrder_createServerFn_handler = createServerRpc({
	id: "985e94eb2bb192bd7a1a458feee91922b49d05a8704766d2ea0e71c7e680ff83",
	name: "cancelMyOrder",
	filename: "src/lib/market/commerce.ts"
}, (opts) => cancelMyOrder.__executeServer(opts));
var cancelMyOrder = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(cancelMyOrder_createServerFn_handler, async ({ context, data: orderId }) => {
	const { userId } = context;
	await withTransaction(async (sql) => {
		const order = (await sql`
        select status, user_id from orders where id = ${orderId} for update`)[0];
		if (!order || order.user_id !== userId) throw new MarketError("Order was not found");
		const fulfilments = await sql`select status from retailer_orders where order_id = ${orderId}`;
		if (!canCustomerCancel(fulfilments.map((row) => row.status)) || !["pending_payment", "awaiting_quote"].includes(order.status)) throw new MarketError("This order can no longer be cancelled here");
		await releaseOrderStock(asQuery(sql), orderId);
		await sql`update orders set status = 'cancelled' where id = ${orderId}`;
		await sql`update retailer_orders set status = 'cancelled' where order_id = ${orderId} and status = 'pending'`;
		await sql`update payments set status = 'abandoned' where order_id = ${orderId} and status = 'pending'`;
	});
	return { ok: true };
});
var requestReturn_createServerFn_handler = createServerRpc({
	id: "0b71663f2a646a10092b2e6b1c27573229b4b150b9a7180e34c09b93b6565ded",
	name: "requestReturn",
	filename: "src/lib/market/commerce.ts"
}, (opts) => requestReturn.__executeServer(opts));
var requestReturn = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(requestReturn_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const raw = data ?? {};
	const orderItemId = clean(raw.orderItemId, 80);
	const reason = clean(raw.reason, 400);
	if (reason.length < 4) throw new MarketError("Tell us why you want a return");
	const sql = await getSql();
	const row = (await sql`
      select oi.id, oi.order_id, oi.return_eligible, oi.line_kobo, o.user_id, ro.status as fulfilment
      from order_items oi
      join orders o on o.id = oi.order_id
      join retailer_orders ro on ro.order_id = oi.order_id and ro.retailer_id = oi.retailer_id
      where oi.id = ${orderItemId}`)[0];
	if (!row || row.user_id !== userId) throw new MarketError("Item was not found");
	if (!row.return_eligible || row.fulfilment !== "delivered") throw new MarketError("This item is not eligible for a return yet");
	await sql`insert into refunds (id, order_id, order_item_id, amount_kobo, reason, status, actor_user_id)
      values (${crypto.randomUUID()}, ${row.order_id}, ${row.id}, ${row.line_kobo}, ${reason}, 'requested', ${userId})`;
	await notifyAdmins(sql, {
		title: "Return requested",
		body: reason,
		href: "/admin/orders"
	});
	return {
		ok: true,
		note: "Request recorded. A refund is not complete until an administrator records it."
	};
});
//#endregion
export { cancelMyOrder_createServerFn_handler, checkout_createServerFn_handler, confirmSandboxPayment_createServerFn_handler, getMyOrder_createServerFn_handler, getServerCart_createServerFn_handler, listMyOrders_createServerFn_handler, quoteCart_createServerFn_handler, refreshPayment_createServerFn_handler, requestReturn_createServerFn_handler, syncCart_createServerFn_handler };
