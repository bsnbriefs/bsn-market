import { c as getSql, d as nairaToKobo, f as percentToBps, h as withTransaction } from "./money-eRJ-C_HK.mjs";
import { d as notifyUser, m as recordRefund, t as MarketError, v as transitionFulfilment } from "./notify-DZJIERaE.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { i as ensureProfile, n as audit, r as clean, s as requireAdmin } from "./guard-BzDsEAOV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CzAotWeu.js
async function adminSql(userId, email) {
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	await requireAdmin(sql, userId);
	return sql;
}
var getAdminOverview_createServerFn_handler = createServerRpc({
	id: "0184ed58d7b7102737531c9f77f2de3fc6a1398de85c70704b6d264d6fe4305a",
	name: "getAdminOverview",
	filename: "src/lib/market/admin.ts"
}, (opts) => getAdminOverview.__executeServer(opts));
var getAdminOverview = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(getAdminOverview_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const customers = await sql`select count(*)::int as n from user_roles where role = 'customer'`;
	const retailers = await sql`select status, count(*)::int as n from retailer_profiles group by status`;
	const products = await sql`select status, count(*)::int as n from products group by status`;
	const orders = await sql`select status, count(*)::int as n from orders group by status`;
	const gmv = await sql`
      select coalesce(sum(oi.line_kobo),0)::int as n from order_items oi
      join orders o on o.id = oi.order_id
      where o.status in ('paid','partially_refunded','refunded')`;
	const commission = await sql`select coalesce(sum(commission_kobo),0)::int as n from commission_ledger`;
	const refunds = await sql`select coalesce(sum(amount_kobo),0)::int as n from refunds where status = 'recorded'`;
	const outstanding = await sql`
      select coalesce(sum(settlement_kobo),0)::int as n from commission_ledger where settlement_status = 'pending'`;
	const delivered = await sql`
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
		emailConfigured: Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS)
	};
});
var adminListRetailers_createServerFn_handler = createServerRpc({
	id: "ad4029746cf7170eba9da62ce834d131c592653daf1205bf6abb9922ca22b9b3",
	name: "adminListRetailers",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListRetailers.__executeServer(opts));
var adminListRetailers = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListRetailers_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	return (await adminSql(userId, email))`select id, business_name, contact_name, email, phone, state, city, status, review_reason,
      description, categories, is_sample, created_at::text as created_at
      from retailer_profiles order by created_at desc`;
});
var adminSetRetailerStatus_createServerFn_handler = createServerRpc({
	id: "e948c51f8bb0955f6a60a101675aff9582421bdf03e80d90d7372f10a2408ccb",
	name: "adminSetRetailerStatus",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminSetRetailerStatus.__executeServer(opts));
var adminSetRetailerStatus = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminSetRetailerStatus_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	const status = clean(raw.status, 20);
	if (![
		"approved",
		"rejected",
		"suspended",
		"pending"
	].includes(status)) throw new MarketError("Unknown status");
	const id = clean(raw.id, 80);
	const reason = clean(raw.reason, 400);
	const rows = await sql`
      update retailer_profiles set status = ${status}, review_reason = ${reason}, updated_at = now()
      where id = ${id} returning user_id, business_name`;
	if (!rows[0]) throw new MarketError("Retailer was not found");
	await sql`insert into retailer_verification_records (id, retailer_id, status, reason, actor_user_id)
      values (${crypto.randomUUID()}, ${id}, ${status}, ${reason}, ${userId})`;
	await audit(sql, userId, "retailer_status", "retailer", id, `${status}: ${reason}`);
	if (!rows[0].user_id.startsWith("catalogue-seed")) await notifyUser(sql, {
		userId: rows[0].user_id,
		title: `Retailer application ${status}`,
		body: reason || `Status is now ${status}.`,
		href: "/retailer"
	});
	return { ok: true };
});
var adminListProducts_createServerFn_handler = createServerRpc({
	id: "25659dfbf1e3e40fffde7ff791453b83c1e0a8dc4a966f875e4317da18f69a85",
	name: "adminListProducts",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListProducts.__executeServer(opts));
var adminListProducts = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListProducts_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	return (await adminSql(userId, email))`select p.id, p.name, p.status, p.price_kobo, p.stock, p.featured, r.business_name, p.moderation_reason
       from products p join retailer_profiles r on r.id = p.retailer_id
       order by p.updated_at desc limit 200`;
});
var adminModerateProduct_createServerFn_handler = createServerRpc({
	id: "5576a3df97bc3c945adfb2921dbdfa166718e6f72627e0219618d82833655e83",
	name: "adminModerateProduct",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminModerateProduct.__executeServer(opts));
var adminModerateProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminModerateProduct_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	const status = clean(raw.status, 20);
	if (![
		"approved",
		"rejected",
		"archived",
		"pending"
	].includes(status)) throw new MarketError("Unknown status");
	const id = clean(raw.id, 80);
	const reason = clean(raw.reason, 400);
	const rows = await sql`
      update products set status = ${status}, moderation_reason = ${reason}, featured = ${raw.featured === true}, updated_at = now()
      where id = ${id}
      returning (select user_id from retailer_profiles r where r.id = products.retailer_id) as user_id, name`;
	if (!rows[0]) throw new MarketError("Product was not found");
	await audit(sql, userId, "moderate_product", "product", id, status);
	if (rows[0].user_id && !rows[0].user_id.startsWith("catalogue-seed")) await notifyUser(sql, {
		userId: rows[0].user_id,
		title: `Product ${status}`,
		body: `${rows[0].name}. ${reason}`.trim(),
		href: "/retailer/products"
	});
	return { ok: true };
});
var adminListOrders_createServerFn_handler = createServerRpc({
	id: "bc51345c9c0db2dded675934e01c81b5f0cdea916ea44ddfc8839693f7d6271c",
	name: "adminListOrders",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListOrders.__executeServer(opts));
var adminListOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListOrders_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	return {
		orders: await sql`select id, reference, status, total_kobo, state, city, created_at::text as created_at, customer_name
       from orders order by created_at desc limit 100`,
		payments: await sql`
      select order_id, reference, status, provider, amount_kobo from payments`
	};
});
var adminSetQuote_createServerFn_handler = createServerRpc({
	id: "e797a2004fe671a5a87bfbc4d09d3ec3d476c4d08d81ad2ffa561178e51e9a6d",
	name: "adminSetQuote",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminSetQuote.__executeServer(opts));
var adminSetQuote = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminSetQuote_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	await adminSql(userId, email);
	const raw = data ?? {};
	const feeEach = nairaToKobo(clean(raw.feeNaira, 12));
	const orderId = clean(raw.orderId, 80);
	await withTransaction(async (sql) => {
		const order = (await sql`
        select status, subtotal_kobo, discount_kobo, user_id, reference from orders where id = ${orderId} for update`)[0];
		if (!order || order.status !== "awaiting_quote") throw new MarketError("This order is not waiting for a quote");
		const groups = await sql`select count(*)::int as n from retailer_orders where order_id = ${orderId}`;
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
			href: `/orders/${orderId}`
		});
		await audit(sql, userId, "delivery_quote", "order", orderId, String(delivery));
	});
	return { ok: true };
});
var adminRecordRefund_createServerFn_handler = createServerRpc({
	id: "146481859b6e1eccced251b2365134f6f5bdb8520b5c01ff15f0e2bd6dcd0007",
	name: "adminRecordRefund",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminRecordRefund.__executeServer(opts));
var adminRecordRefund = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminRecordRefund_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	await adminSql(userId, email);
	const raw = data ?? {};
	const amount = nairaToKobo(clean(raw.amountNaira, 12));
	const reason = clean(raw.reason, 400);
	const orderItemId = clean(raw.orderItemId, 80);
	if (reason.length < 3) throw new MarketError("Record a reason");
	await withTransaction(async (sql) => {
		await recordRefund(sql, {
			orderItemId,
			amountKobo: amount,
			reason,
			actorUserId: userId
		});
		await audit(sql, userId, "refund", "order_item", orderItemId, reason);
	});
	return {
		ok: true,
		note: "Refund recorded on the ledger. Paystack is not called unless you settle it in the Paystack dashboard."
	};
});
var adminFulfil_createServerFn_handler = createServerRpc({
	id: "e099e9cd93fe835723a7a6a2c4acfdc90644c32251c1aa45150e2bf09aae9f5a",
	name: "adminFulfil",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminFulfil.__executeServer(opts));
var adminFulfil = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminFulfil_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	await adminSql(userId, email);
	const raw = data ?? {};
	await withTransaction(async (sql) => {
		await transitionFulfilment(sql, {
			retailerOrderId: clean(raw.id, 80),
			to: clean(raw.status, 40),
			actorUserId: userId,
			note: clean(raw.note, 300),
			proof: clean(raw.proof, 120)
		});
	});
	return { ok: true };
});
var adminListRules_createServerFn_handler = createServerRpc({
	id: "86cd95e8fbe4c05aed157221719141567179b9988db420b8e2d3e953d4aa36bf",
	name: "adminListRules",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListRules.__executeServer(opts));
var adminListRules = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListRules_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	return {
		rules: await sql`select id, scope, category_id, retailer_id, bps, effective_from::text as effective_from, active
      from commission_rules order by effective_from desc`,
		categories: await sql`select id, name from product_categories order by sort_order`,
		retailers: await sql`select id, business_name from retailer_profiles order by business_name`,
		promos: await sql`select code, bps_off, min_subtotal_kobo, active from promo_codes order by code`
	};
});
var adminSaveRule_createServerFn_handler = createServerRpc({
	id: "2d57acaf6be0afebade1d2798f82cc8127655bfe5208a887018b08dab66745f7",
	name: "adminSaveRule",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminSaveRule.__executeServer(opts));
var adminSaveRule = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminSaveRule_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	const scope = clean(raw.scope, 20);
	if (![
		"default",
		"category",
		"retailer"
	].includes(scope)) throw new MarketError("Unknown commission scope");
	const bps = percentToBps(clean(raw.percent, 8));
	const id = crypto.randomUUID();
	await sql`insert into commission_rules (id, scope, category_id, retailer_id, bps, effective_from, active)
      values (${id}, ${scope}, ${clean(raw.categoryId, 40) || null}, ${clean(raw.retailerId, 80) || null}, ${bps}, ${clean(raw.effectiveFrom, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}, true)`;
	await audit(sql, userId, "commission_rule", "commission_rule", id, `${scope} ${bps}`);
	return { ok: true };
});
var adminSavePromo_createServerFn_handler = createServerRpc({
	id: "a20fb93e10ad031d0f0669391835caa5562509d5aaf0642c5e4de07369d59ff2",
	name: "adminSavePromo",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminSavePromo.__executeServer(opts));
var adminSavePromo = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminSavePromo_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
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
var adminListRequests_createServerFn_handler = createServerRpc({
	id: "b6b354dcb1d92ab587ca1348299c3cde4f2df993b8c8165309fcbec0a90d4952",
	name: "adminListRequests",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListRequests.__executeServer(opts));
var adminListRequests = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListRequests_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	return (await adminSql(userId, email))`select id, reference, name, description, category, brand, budget_min_kobo, budget_max_kobo,
      state, city, status, admin_note, quotation_kobo, quotation_note, created_at::text as created_at, user_id
      from product_requests order by created_at desc limit 100`;
});
var adminUpdateRequest_createServerFn_handler = createServerRpc({
	id: "db3d0aa189b911762b1a28879fe52daade2110e64d81e278c577ef41e2873cd1",
	name: "adminUpdateRequest",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminUpdateRequest.__executeServer(opts));
var adminUpdateRequest = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminUpdateRequest_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	const status = clean(raw.status, 40);
	if (![
		"submitted",
		"under_review",
		"retailer_contacted",
		"quotation_available",
		"customer_considering",
		"converted",
		"unavailable",
		"closed"
	].includes(status)) throw new MarketError("Unknown request status");
	const quote = clean(raw.quotationNaira, 12);
	const id = clean(raw.id, 80);
	const rows = await sql`
      update product_requests set status = ${status}, admin_note = ${clean(raw.adminNote, 800)},
        quotation_note = ${clean(raw.quotationNote, 800)},
        quotation_kobo = ${quote ? nairaToKobo(quote) : null}
      where id = ${id} returning user_id, reference`;
	if (!rows[0]) throw new MarketError("Request was not found");
	await notifyUser(sql, {
		userId: rows[0].user_id,
		title: "Product request updated",
		body: `${rows[0].reference} is now ${status.replaceAll("_", " ")}. This is not an order until you check out a real listing.`,
		href: "/request"
	});
	return { ok: true };
});
var adminListTickets_createServerFn_handler = createServerRpc({
	id: "85beddd9135937357e6031888c97e066348e838aaa0b27b96e1a23c6aacace1c",
	name: "adminListTickets",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminListTickets.__executeServer(opts));
var adminListTickets = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminListTickets_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	return {
		tickets: await sql`select id, user_id, subject, status, created_at::text as created_at from support_tickets order by created_at desc limit 50`,
		messages: await sql`select ticket_id, body, created_at::text as created_at, author_user_id from support_messages order by created_at`
	};
});
var adminReplyTicket_createServerFn_handler = createServerRpc({
	id: "9d17c1395d95a1cf8c851ead81df46b7b56d5fffe07a4b62ec87ced7fd1f98b3",
	name: "adminReplyTicket",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminReplyTicket.__executeServer(opts));
var adminReplyTicket = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminReplyTicket_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	const ticketId = clean(raw.ticketId, 80);
	const body = clean(raw.body, 2e3);
	if (body.length < 2) throw new MarketError("Write a reply");
	const tickets = await sql`update support_tickets set status = 'answered' where id = ${ticketId} returning user_id`;
	if (!tickets[0]) throw new MarketError("Ticket was not found");
	await sql`insert into support_messages (id, ticket_id, author_user_id, body) values (${crypto.randomUUID()}, ${ticketId}, ${userId}, ${body})`;
	await notifyUser(sql, {
		userId: tickets[0].user_id,
		title: "Support replied",
		body,
		href: "/support"
	});
	return { ok: true };
});
var adminGetSettings_createServerFn_handler = createServerRpc({
	id: "d9859b9575f9011f37b49175aad781ed0bdf2eb834f44cd5d106a734f4a88d14",
	name: "adminGetSettings",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminGetSettings.__executeServer(opts));
var adminGetSettings = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(adminGetSettings_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const settings = await sql`select store_name, tagline, support_email, support_phone, contact_address from site_settings where id = 'default'`;
	const policies = await sql`select slug, title, body from policies order by slug`;
	const zones = await sql`select id, state, city, fee_kobo from delivery_zones order by state, city`;
	const campaigns = await sql`select id, title, subtitle, image_url, link_path, active from promotional_campaigns order by sort_order`;
	const categories = await sql`select id, name from product_categories order by sort_order`;
	return {
		settings: settings[0] ?? {
			store_name: "BSN Market",
			tagline: "",
			support_email: "",
			support_phone: "",
			contact_address: ""
		},
		policies,
		zones,
		campaigns,
		categories
	};
});
var adminSaveSettings_createServerFn_handler = createServerRpc({
	id: "e3b9ba33e6b2dd1628a083b76ebccd644c6fbbf08314bb4d5e639ce39ea3dfb3",
	name: "adminSaveSettings",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminSaveSettings.__executeServer(opts));
var adminSaveSettings = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminSaveSettings_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const sql = await adminSql(userId, email);
	const raw = data ?? {};
	await sql`update site_settings set store_name = ${clean(raw.storeName, 60) || "BSN Market"},
      tagline = ${clean(raw.tagline, 120)}, support_email = ${clean(raw.supportEmail, 120)},
      support_phone = ${clean(raw.supportPhone, 30)}, contact_address = ${clean(raw.contactAddress, 200)}
      where id = 'default'`;
	if (typeof raw.policySlug === "string" && typeof raw.policyBody === "string") await sql`update policies set body = ${raw.policyBody.slice(0, 2e4)}, title = ${clean(raw.policyTitle, 80)}, updated_at = now()
        where slug = ${clean(raw.policySlug, 40)}`;
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
	if (typeof raw.campaignTitle === "string" && raw.campaignTitle.trim()) await sql`insert into promotional_campaigns (id, title, subtitle, image_url, link_path, active)
        values (${crypto.randomUUID()}, ${clean(raw.campaignTitle, 80)}, ${clean(raw.campaignSubtitle, 160)},
          ${clean(raw.campaignImage, 400) || "/products/hero.jpg"}, ${clean(raw.campaignLink, 80) || "/shop"}, true)`;
	await audit(sql, userId, "settings", "site", "default", "updated");
	return { ok: true };
});
var adminCreateSettlement_createServerFn_handler = createServerRpc({
	id: "f9664334f1f7e94a358281b5719a83e65e7cee48e583fa00055c248ff11de3da",
	name: "adminCreateSettlement",
	filename: "src/lib/market/admin.ts"
}, (opts) => adminCreateSettlement.__executeServer(opts));
var adminCreateSettlement = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(adminCreateSettlement_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	await adminSql(userId, email);
	const raw = data ?? {};
	const retailerId = clean(raw.retailerId, 80);
	const reference = clean(raw.reference, 80);
	const note = clean(raw.note, 200);
	await withTransaction(async (tx) => {
		const rows = await tx`
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
	return {
		ok: true,
		note: "Settlement recorded. This does not move money by itself."
	};
});
//#endregion
export { adminCreateSettlement_createServerFn_handler, adminFulfil_createServerFn_handler, adminGetSettings_createServerFn_handler, adminListOrders_createServerFn_handler, adminListProducts_createServerFn_handler, adminListRequests_createServerFn_handler, adminListRetailers_createServerFn_handler, adminListRules_createServerFn_handler, adminListTickets_createServerFn_handler, adminModerateProduct_createServerFn_handler, adminRecordRefund_createServerFn_handler, adminReplyTicket_createServerFn_handler, adminSavePromo_createServerFn_handler, adminSaveRule_createServerFn_handler, adminSaveSettings_createServerFn_handler, adminSetQuote_createServerFn_handler, adminSetRetailerStatus_createServerFn_handler, adminUpdateRequest_createServerFn_handler, getAdminOverview_createServerFn_handler };
