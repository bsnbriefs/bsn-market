import { c as getSql, d as nairaToKobo, h as withTransaction } from "./money-eRJ-C_HK.mjs";
import { d as notifyUser, g as retailerCanMutateProduct, s as fulfilmentTransitionAllowed, t as MarketError, v as transitionFulfilment } from "./notify-DZJIERaE.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { a as ownRetailer, i as ensureProfile, n as audit, o as rateLimit, r as clean, t as assertImageRef } from "./guard-BzDsEAOV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/retailer-CL8VvWQd.js
async function requireRetailer(userId, email) {
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	const retailer = await ownRetailer(sql, userId);
	if (!retailer) throw new MarketError("Apply as a retailer first");
	return {
		sql,
		retailer
	};
}
var getRetailerDashboard_createServerFn_handler = createServerRpc({
	id: "1318d8ef5632b6309cf4a4913ef934ce71ec844b25d17f63f4b7dbe3095d1f04",
	name: "getRetailerDashboard",
	filename: "src/lib/market/retailer.ts"
}, (opts) => getRetailerDashboard.__executeServer(opts));
var getRetailerDashboard = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(getRetailerDashboard_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const { sql, retailer } = await requireRetailer(userId, email);
	const counts = await sql`
      select status, count(*)::int as n from retailer_orders where retailer_id = ${retailer.id} group by status`;
	const ledger = await sql`select coalesce(sum(product_value_kobo),0)::int as gross,
              coalesce(sum(commission_kobo),0)::int as commission,
              coalesce(sum(refund_adjustment_kobo),0)::int as refunds,
              coalesce(sum(settlement_kobo),0)::int as settlement
       from commission_ledger where retailer_id = ${retailer.id}`;
	const low = await sql`
      select id, name, stock from products where retailer_id = ${retailer.id} and status <> 'archived' and stock <= 5
      order by stock asc limit 12`;
	const recent = await sql`
      select o.reference, ro.status, o.created_at::text as created_at
      from retailer_orders ro join orders o on o.id = ro.order_id
      where ro.retailer_id = ${retailer.id}
      order by o.created_at desc limit 8`;
	const by = Object.fromEntries(counts.map((row) => [row.status, Number(row.n)]));
	return {
		retailer,
		totalOrders: counts.reduce((sum, row) => sum + Number(row.n), 0),
		pending: (by.pending ?? 0) + (by.accepted ?? 0) + (by.preparing ?? 0) + (by.ready ?? 0),
		delivered: by.delivered ?? 0,
		cancelled: (by.cancelled ?? 0) + (by.rejected ?? 0),
		grossKobo: Number(ledger[0]?.gross ?? 0),
		commissionKobo: Number(ledger[0]?.commission ?? 0),
		refundKobo: Number(ledger[0]?.refunds ?? 0),
		settlementKobo: Number(ledger[0]?.settlement ?? 0),
		lowStock: low,
		recent
	};
});
var listMyProducts_createServerFn_handler = createServerRpc({
	id: "aad6a88b7f6d4010e07c5f41a0fefb268c5086ed385da70de8711656e1200d54",
	name: "listMyProducts",
	filename: "src/lib/market/retailer.ts"
}, (opts) => listMyProducts.__executeServer(opts));
var listMyProducts = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(listMyProducts_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const { sql, retailer } = await requireRetailer(userId, email);
	return {
		products: await sql`select id, name, price_kobo, stock, status, category_id, description, brand, moderation_reason
       from products where retailer_id = ${retailer.id} order by updated_at desc`,
		categories: await sql`select id, name from product_categories order by sort_order`,
		retailer
	};
});
var saveMyProduct_createServerFn_handler = createServerRpc({
	id: "d8b40029063f7a90aaaa57d914b20611c3fdaeadface2a6db9c0bd10467f6d18",
	name: "saveMyProduct",
	filename: "src/lib/market/retailer.ts"
}, (opts) => saveMyProduct.__executeServer(opts));
var saveMyProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(saveMyProduct_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	rateLimit(`product:${userId}`, 30, 36e5);
	const { sql, retailer } = await requireRetailer(userId, email);
	if (retailer.status === "suspended" || retailer.status === "rejected") throw new MarketError("Your retailer account cannot edit listings right now");
	const raw = data ?? {};
	const name = clean(raw.name, 120);
	const description = clean(raw.description, 2e3);
	const brand = clean(raw.brand, 60);
	const categoryId = clean(raw.categoryId, 40);
	if (name.length < 2) throw new MarketError("Enter a product name");
	const priceKobo = nairaToKobo(clean(raw.priceNaira, 12));
	const images = Array.isArray(raw.images) ? raw.images.filter((url) => typeof url === "string").slice(0, 4) : [];
	for (const image of images) assertImageRef(image);
	const variants = Array.isArray(raw.variants) ? raw.variants.slice(0, 12).flatMap((row) => {
		if (!row || typeof row !== "object") return [];
		const variant = row;
		const label = clean(variant.label, 40);
		const stock = Number(variant.stock);
		if (!label || !Number.isInteger(stock) || stock < 0 || stock > 1e5) return [];
		const extra = clean(variant.extraNaira, 12);
		return [{
			label,
			stock,
			delta: extra ? nairaToKobo(extra) : 0
		}];
	}) : [];
	const stock = variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : Number(raw.stock);
	if (!Number.isInteger(stock) || stock < 0 || stock > 1e5) throw new MarketError("Enter a stock quantity");
	const existingId = clean(raw.id, 80);
	let id = existingId;
	if (existingId) {
		const rows = await sql`select retailer_id, status from products where id = ${existingId}`;
		if (!rows[0] || !retailerCanMutateProduct(retailer.id, rows[0].retailer_id)) throw new MarketError("You cannot edit that product");
		const status = rows[0].status === "draft" && raw.submit !== true ? "draft" : "pending";
		await sql`update products set name = ${name}, description = ${description}, brand = ${brand}, category_id = ${categoryId || null},
        price_kobo = ${priceKobo}, stock = ${stock}, status = ${status}, return_eligible = ${raw.returnEligible !== false},
        updated_at = now() where id = ${existingId} and retailer_id = ${retailer.id}`;
		await sql`delete from product_images where product_id = ${existingId}`;
		await sql`delete from product_variants where product_id = ${existingId}`;
	} else {
		id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item"}-${crypto.randomUUID().slice(0, 6)}`;
		const status = raw.submit === true ? "pending" : "draft";
		await sql`insert into products (id, slug, retailer_id, category_id, name, description, brand, price_kobo, stock, status, return_eligible)
        values (${id}, ${id}, ${retailer.id}, ${categoryId || null}, ${name}, ${description}, ${brand}, ${priceKobo}, ${stock}, ${status}, ${raw.returnEligible !== false})`;
	}
	let sort = 0;
	for (const image of images) {
		await sql`insert into product_images (id, product_id, url, sort_order) values (${crypto.randomUUID()}, ${id}, ${image}, ${sort})`;
		sort += 1;
	}
	for (const variant of variants) await sql`insert into product_variants (id, product_id, label, sku, price_delta_kobo, stock)
        values (${crypto.randomUUID()}, ${id}, ${variant.label}, ${variant.label}, ${variant.delta}, ${variant.stock})`;
	if (raw.submit === true) await notifyUser(sql, {
		userId,
		title: "Product submitted",
		body: `${name} is waiting for approval. It is not public yet.`,
		href: "/retailer/products"
	});
	return { id };
});
var archiveMyProduct_createServerFn_handler = createServerRpc({
	id: "fa896dbec0c450335eae2e9808abc67c62372caaec8d9a97b97f40783f947095",
	name: "archiveMyProduct",
	filename: "src/lib/market/retailer.ts"
}, (opts) => archiveMyProduct.__executeServer(opts));
var archiveMyProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((id) => typeof id === "string" ? id : "").handler(archiveMyProduct_createServerFn_handler, async ({ context, data: id }) => {
	const { userId, email } = context;
	const { sql, retailer } = await requireRetailer(userId, email);
	if (!(await sql`update products set status = 'archived', updated_at = now()
      where id = ${id} and retailer_id = ${retailer.id} returning id`)[0]) throw new MarketError("Product was not found");
	return { ok: true };
});
var listRetailerOrders_createServerFn_handler = createServerRpc({
	id: "d0609ab71bcd81aee66fd9c8f1d0374c8a9cb69e51dad08027da1bb5ae8aeaa9",
	name: "listRetailerOrders",
	filename: "src/lib/market/retailer.ts"
}, (opts) => listRetailerOrders.__executeServer(opts));
var listRetailerOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(listRetailerOrders_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const { sql, retailer } = await requireRetailer(userId, email);
	const rows = await sql`select ro.id as fulfilment_id, ro.status, o.reference, o.id as order_id, o.customer_name, o.phone,
              o.address_line, o.city, o.state, o.instructions, o.created_at::text as created_at
       from retailer_orders ro join orders o on o.id = ro.order_id
       where ro.retailer_id = ${retailer.id}
       order by o.created_at desc limit 50`;
	const items = await sql`
      select order_id, name_snapshot, variant_snapshot, qty, line_kobo from order_items where retailer_id = ${retailer.id}`;
	return rows.map((row) => ({
		...row,
		items: items.filter((item) => item.order_id === row.order_id)
	}));
});
var updateMyFulfilment_createServerFn_handler = createServerRpc({
	id: "01d6214eca2f4654860eff1b069f191bed2e2143ff1e40b6449b3629a7bc849d",
	name: "updateMyFulfilment",
	filename: "src/lib/market/retailer.ts"
}, (opts) => updateMyFulfilment.__executeServer(opts));
var updateMyFulfilment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(updateMyFulfilment_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const { retailer } = await requireRetailer(userId, email);
	if (retailer.status !== "approved" && retailer.status !== "suspended") throw new MarketError("Only an approved retailer can update fulfilment. Suspended retailers can still finish existing orders.");
	const raw = data ?? {};
	const to = clean(raw.status, 40);
	if (!fulfilmentTransitionAllowed("pending", to) && to !== "preparing" && to !== "ready" && to !== "dispatched" && to !== "in_transit" && to !== "delivered" && to !== "failed" && to !== "cancelled" && to !== "accepted" && to !== "rejected") throw new MarketError("Unknown status");
	await withTransaction(async (sql) => {
		const rows = await sql`select retailer_id from retailer_orders where id = ${clean(raw.id, 80)}`;
		if (!rows[0] || rows[0].retailer_id !== retailer.id) throw new MarketError("That fulfilment is not yours");
		const result = await transitionFulfilment(sql, {
			retailerOrderId: clean(raw.id, 80),
			to,
			actorUserId: userId,
			note: clean(raw.note, 300),
			proof: clean(raw.proof, 120)
		});
		const buyer = await sql`select user_id, reference from orders where id = ${result.orderId}`;
		if (buyer[0]) await notifyUser(sql, {
			userId: buyer[0].user_id,
			title: `Order ${to.replaceAll("_", " ")}`,
			body: `${buyer[0].reference} was updated by the retailer.`,
			href: `/orders/${result.orderId}`
		});
		await audit(sql, userId, "fulfilment", "retailer_order", clean(raw.id, 80), to);
	});
	return { ok: true };
});
var getEarnings_createServerFn_handler = createServerRpc({
	id: "aebfbf6be58e57d495cbb3b5d25708fe70801686d94e2dc246896d40fd7faab0",
	name: "getEarnings",
	filename: "src/lib/market/retailer.ts"
}, (opts) => getEarnings.__executeServer(opts));
var getEarnings = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(getEarnings_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const { sql, retailer } = await requireRetailer(userId, email);
	return {
		rows: await sql`select order_reference, product_value_kobo, commission_bps, commission_kobo, refund_adjustment_kobo,
              other_adjustment_kobo, settlement_kobo, settlement_status
       from commission_ledger where retailer_id = ${retailer.id} order by order_reference desc limit 100`,
		settlements: await sql`
      select id, amount_kobo, status, reference, created_at::text as created_at
      from retailer_settlements where retailer_id = ${retailer.id} order by created_at desc`
	};
});
//#endregion
export { archiveMyProduct_createServerFn_handler, getEarnings_createServerFn_handler, getRetailerDashboard_createServerFn_handler, listMyProducts_createServerFn_handler, listRetailerOrders_createServerFn_handler, saveMyProduct_createServerFn_handler, updateMyFulfilment_createServerFn_handler };
