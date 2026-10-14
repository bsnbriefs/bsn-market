import { l as lagosToday, m as settlementKobo, n as buildCheckoutDraft, p as pickCommission, r as chooseDeliveryFee } from "./money-eRJ-C_HK.mjs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/notify-DZJIERaE.js
function orderAccess(args) {
	if (args.isAdmin) return "admin";
	if (args.userId === args.orderUserId) return "customer";
	if (args.actorRetailerId && args.itemRetailerIds.includes(args.actorRetailerId)) return "retailer";
	return false;
}
function retailerCanMutateProduct(actorRetailerId, productRetailerId) {
	return actorRetailerId !== null && actorRetailerId === productRetailerId;
}
function canReview(args) {
	return args.buyerId === args.userId && args.fulfilmentStatus === "delivered" && !args.alreadyReviewed;
}
function canCustomerCancel(fulfilmentStatuses) {
	if (fulfilmentStatuses.length === 0) return false;
	return fulfilmentStatuses.every((status) => status === "pending" || status === "rejected" || status === "cancelled");
}
var ALLOWED_FULFILMENT = /* @__PURE__ */ new Set([
	"pending",
	"accepted",
	"rejected",
	"preparing",
	"ready",
	"dispatched",
	"in_transit",
	"delivered",
	"failed",
	"cancelled"
]);
var TRANSITIONS = {
	pending: ["accepted", "rejected"],
	accepted: ["preparing", "cancelled"],
	preparing: ["ready", "cancelled"],
	ready: ["dispatched", "cancelled"],
	dispatched: ["in_transit", "failed"],
	in_transit: ["delivered", "failed"]
};
function fulfilmentTransitionAllowed(from, to) {
	if (!ALLOWED_FULFILMENT.has(to)) return false;
	return (TRANSITIONS[from] ?? []).includes(to);
}
function signPaystack(raw, secret) {
	return createHmac("sha512", secret).update(raw).digest("hex");
}
function paystackSignatureValid(raw, header, secret) {
	if (!header || !secret) return false;
	const digest = signPaystack(raw, secret);
	const a = Buffer.from(digest);
	const b = Buffer.from(header.trim());
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
function eventKey(raw) {
	return createHash("sha256").update(raw).digest("hex");
}
function paymentAccepted(args) {
	return args.status === "success" && args.currency === "NGN" && Number.isInteger(args.paidKobo) && args.paidKobo === args.orderKobo && args.orderKobo > 0;
}
/** Sandbox confirmation is allowed only when Paystack is not configured. */
function sandboxConfirmAllowed(paystackConfigured, provider) {
	return !paystackConfigured && provider === "sandbox";
}
var MarketError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "MarketError";
	}
};
function asBool(value) {
	return value === true || value === "t" || value === "true" || value === 1;
}
function isUnique(error) {
	if (typeof error !== "object" || error === null) return false;
	const code = "code" in error ? String(error.code) : "";
	const message = error instanceof Error ? error.message : "";
	return code === "23505" || /duplicate key|unique constraint/i.test(message);
}
async function loadPricedCart(sql, input) {
	const merged = /* @__PURE__ */ new Map();
	for (const line of input.lines) {
		if (!line.productId) continue;
		const key = `${line.productId}::${line.variantId ?? ""}`;
		const prev = merged.get(key);
		merged.set(key, {
			productId: line.productId,
			variantId: line.variantId,
			qty: (prev?.qty ?? 0) + line.qty
		});
	}
	const rules = await sql.query(`select id, scope, category_id, retailer_id, bps, effective_from::text as effective_from, active
     from commission_rules`);
	const today = lagosToday();
	const mappedRules = rules.map((rule) => ({
		id: rule.id,
		scope: rule.scope,
		categoryId: rule.category_id,
		retailerId: rule.retailer_id,
		bps: Number(rule.bps),
		effectiveFrom: String(rule.effective_from).slice(0, 10),
		active: asBool(rule.active)
	}));
	const items = [];
	for (const line of merged.values()) {
		const lockSql = input.lock ? " for update of p" : "";
		const product = (await sql.query(`select p.id, p.name, p.price_kobo, p.stock, p.status, p.retailer_id, p.category_id,
              p.return_eligible, r.status as retailer_status, r.business_name
       from products p
       join retailer_profiles r on r.id = p.retailer_id
       where p.id = $1${lockSql}`, [line.productId]))[0];
		if (!product) {
			items.push(blankItem(line, "missing"));
			continue;
		}
		const variantCount = await sql.query(`select id from product_variants where product_id = $1`, [product.id]);
		let variantLabel = null;
		let variantId = null;
		let unit = Number(product.price_kobo);
		let stock = Number(product.stock);
		let productStatus = product.status;
		if (variantCount.length > 0) {
			if (!line.variantId) {
				items.push(knownItem(product, line, unit, stock, null, null, "needs_variant", 0));
				continue;
			}
			const vlock = input.lock ? " for update" : "";
			const variant = (await sql.query(`select id, label, price_delta_kobo, stock from product_variants
         where id = $1 and product_id = $2${vlock}`, [line.variantId, product.id]))[0];
			if (!variant) {
				items.push(knownItem(product, line, unit, 0, line.variantId, null, "bad_variant", 0));
				continue;
			}
			variantId = variant.id;
			variantLabel = variant.label;
			unit += Number(variant.price_delta_kobo);
			stock = Number(variant.stock);
		}
		let commissionBps = 0;
		try {
			commissionBps = pickCommission(mappedRules, {
				retailerId: product.retailer_id,
				categoryId: product.category_id,
				on: today
			}).bps;
		} catch {
			productStatus = "no_commission";
		}
		items.push(knownItem(product, line, unit, stock, variantId, variantLabel, productStatus, commissionBps));
	}
	const zones = await sql.query(`select state, city, fee_kobo from delivery_zones`);
	const deliveryFeeEach = chooseDeliveryFee(zones.map((zone) => ({
		state: zone.state,
		city: zone.city,
		feeKobo: Number(zone.fee_kobo)
	})), input.state, input.city);
	let discountBps = 0;
	let minSubtotal = 0;
	const code = input.promoCode.trim();
	if (code) {
		const promo = (await sql.query(`select bps_off, min_subtotal_kobo, active from promo_codes where lower(code) = lower($1)`, [code]))[0];
		if (!promo || !asBool(promo.active)) {
			const draft = buildCheckoutDraft({
				items,
				deliveryFeeEach,
				discountBps: 0
			});
			draft.issues.push("That discount code is not valid");
			return {
				...draft,
				promoCode: ""
			};
		}
		discountBps = Number(promo.bps_off);
		minSubtotal = Number(promo.min_subtotal_kobo);
	}
	return {
		...buildCheckoutDraft({
			items,
			deliveryFeeEach,
			discountBps,
			minSubtotalKobo: minSubtotal
		}),
		promoCode: discountBps > 0 ? code : ""
	};
}
function blankItem(line, productStatus) {
	return {
		productId: line.productId,
		variantId: line.variantId,
		retailerId: "",
		retailerName: "",
		retailerStatus: "missing",
		productStatus,
		name: "An item",
		variantLabel: null,
		unitKobo: 0,
		qty: line.qty,
		stock: 0,
		commissionBps: 0,
		returnEligible: false
	};
}
function knownItem(product, line, unit, stock, variantId, variantLabel, productStatus, commissionBps) {
	return {
		productId: product.id,
		variantId,
		retailerId: product.retailer_id,
		retailerName: product.business_name,
		retailerStatus: product.retailer_status,
		productStatus,
		name: product.name,
		variantLabel,
		unitKobo: unit,
		qty: line.qty,
		stock,
		commissionBps,
		returnEligible: asBool(product.return_eligible)
	};
}
async function createOrderRecord(sql, input) {
	const existing = await sql.query(`select id, reference, status, total_kobo, subtotal_kobo, discount_kobo, delivery_kobo
     from orders where user_id = $1 and idempotency_key = $2 for update`, [input.userId, input.idempotencyKey]);
	if (existing[0]) return {
		orderId: existing[0].id,
		reference: existing[0].reference,
		status: existing[0].status,
		totalKobo: existing[0].total_kobo === null ? null : Number(existing[0].total_kobo),
		subtotalKobo: Number(existing[0].subtotal_kobo),
		discountKobo: Number(existing[0].discount_kobo),
		deliveryKobo: existing[0].delivery_kobo === null ? null : Number(existing[0].delivery_kobo),
		created: false
	};
	const priced = await loadPricedCart(sql, {
		lines: input.lines,
		state: input.customer.state,
		city: input.customer.city,
		promoCode: input.promoCode,
		lock: true
	});
	if (priced.issues.length > 0) throw new MarketError(priced.issues[0]);
	const orderId = crypto.randomUUID();
	const reference = `BSN-${(/* @__PURE__ */ new Date()).getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
	const status = priced.totalKobo === null ? "awaiting_quote" : "pending_payment";
	try {
		await sql.query(`insert into orders (
         id, reference, user_id, idempotency_key, status, customer_name, email, phone,
         address_line, state, city, instructions, subtotal_kobo, discount_kobo, delivery_kobo,
         total_kobo, promo_code
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
       )`, [
			orderId,
			reference,
			input.userId,
			input.idempotencyKey,
			status,
			input.customer.name,
			input.customer.email,
			input.customer.phone,
			input.customer.line,
			input.customer.state,
			input.customer.city,
			input.customer.instructions,
			priced.subtotalKobo,
			priced.discountKobo,
			priced.deliveryKobo,
			priced.totalKobo,
			priced.promoCode
		]);
	} catch (error) {
		if (!isUnique(error)) throw error;
		const again = await sql.query(`select id, reference, status, total_kobo, subtotal_kobo, discount_kobo, delivery_kobo
       from orders where user_id = $1 and idempotency_key = $2`, [input.userId, input.idempotencyKey]);
		if (!again[0]) throw error;
		return {
			orderId: again[0].id,
			reference: again[0].reference,
			status: again[0].status,
			totalKobo: again[0].total_kobo === null ? null : Number(again[0].total_kobo),
			subtotalKobo: Number(again[0].subtotal_kobo),
			discountKobo: Number(again[0].discount_kobo),
			deliveryKobo: again[0].delivery_kobo === null ? null : Number(again[0].delivery_kobo),
			created: false
		};
	}
	const groups = /* @__PURE__ */ new Map();
	for (const line of priced.lines) {
		const itemId = crypto.randomUUID();
		await sql.query(`insert into order_items (
         id, order_id, retailer_id, product_id, variant_id, name_snapshot, variant_snapshot,
         retailer_name_snapshot, unit_price_kobo, qty, line_kobo, commission_bps, commission_kobo,
         return_eligible
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
			itemId,
			orderId,
			line.retailerId,
			line.productId,
			line.variantId,
			line.name,
			line.variantLabel ?? "",
			line.retailerName,
			line.unitKobo,
			line.qty,
			line.lineKobo,
			line.commissionBps,
			line.commissionKobo,
			line.returnEligible
		]);
		if (line.variantId) {
			if (!(await sql.query(`update product_variants set stock = stock - $1 where id = $2 and stock >= $1 returning id`, [line.qty, line.variantId]))[0]) throw new MarketError(`${line.name} just sold out`);
		}
		if (!(await sql.query(`update products set stock = stock - $1 where id = $2 and stock >= $1 returning id`, [line.qty, line.productId]))[0]) throw new MarketError(`${line.name} just sold out`);
		groups.set(line.retailerId, { delivery: priced.deliveryFeeEach });
	}
	for (const [retailerId, group] of groups) await sql.query(`insert into retailer_orders (id, order_id, retailer_id, status, delivery_kobo)
       values ($1,$2,$3,'pending',$4)`, [
		crypto.randomUUID(),
		orderId,
		retailerId,
		group.delivery
	]);
	if (status === "pending_payment" && priced.totalKobo !== null) await sql.query(`insert into payments (id, order_id, reference, amount_kobo, currency, status, provider)
       values ($1,$2,$3,$4,'NGN','pending',$5)`, [
		crypto.randomUUID(),
		orderId,
		reference,
		priced.totalKobo,
		input.provider
	]);
	return {
		orderId,
		reference,
		status,
		totalKobo: priced.totalKobo,
		subtotalKobo: priced.subtotalKobo,
		discountKobo: priced.discountKobo,
		deliveryKobo: priced.deliveryKobo,
		created: true
	};
}
async function releaseOrderStock(sql, orderId) {
	const items = await sql.query(`select product_id, variant_id, qty from order_items where order_id = $1 for update`, [orderId]);
	for (const item of items) {
		if (item.variant_id) await sql.query(`update product_variants set stock = stock + $1 where id = $2`, [item.qty, item.variant_id]);
		if (item.product_id) await sql.query(`update products set stock = stock + $1 where id = $2`, [item.qty, item.product_id]);
	}
}
async function markPaidRecord(sql, input) {
	const payment = (await sql.query(`select id, order_id, amount_kobo, status, reference from payments where reference = $1 for update`, [input.reference]))[0];
	if (!payment) throw new MarketError("Payment reference was not found");
	if (payment.status === "success") return {
		duplicate: true,
		orderId: payment.order_id
	};
	if (!paymentAccepted({
		orderKobo: Number(payment.amount_kobo),
		paidKobo: input.paidKobo,
		currency: input.currency,
		status: input.providerStatus
	})) throw new MarketError("Payment amount, currency, or status did not match the order");
	if (!(await sql.query(`update orders set status = 'paid' where id = $1 and status = 'pending_payment' returning id`, [payment.order_id]))[0]) {
		if ((await sql.query(`select status from orders where id = $1`, [payment.order_id]))[0]?.status === "paid") return {
			duplicate: true,
			orderId: payment.order_id
		};
		throw new MarketError("This order cannot be marked paid");
	}
	await sql.query(`update payments set status = 'success', verified_at = now() where id = $1 and status <> 'success'`, [payment.id]);
	const items = await sql.query(`select oi.id, oi.retailer_id, oi.line_kobo, oi.commission_bps, oi.commission_kobo
     from order_items oi where oi.order_id = $1`, [payment.order_id]);
	const order = await sql.query(`select reference from orders where id = $1`, [payment.order_id]);
	for (const item of items) {
		const settlement = settlementKobo(Number(item.line_kobo), Number(item.commission_kobo), 0, 0);
		await sql.query(`insert into commission_ledger (
         id, order_item_id, retailer_id, order_reference, product_value_kobo, commission_bps,
         commission_kobo, refund_adjustment_kobo, other_adjustment_kobo, settlement_kobo, settlement_status
       ) values ($1,$2,$3,$4,$5,$6,$7,0,0,$8,'pending')
       on conflict (order_item_id) do nothing`, [
			crypto.randomUUID(),
			item.id,
			item.retailer_id,
			order[0]?.reference ?? input.reference,
			item.line_kobo,
			item.commission_bps,
			item.commission_kobo,
			settlement
		]);
	}
	return {
		duplicate: false,
		orderId: payment.order_id
	};
}
async function recordRefund(sql, input) {
	const item = (await sql.query(`select id, order_id, line_kobo, return_eligible from order_items where id = $1 for update`, [input.orderItemId]))[0];
	if (!item) throw new MarketError("Order item was not found");
	const ledger = (await sql.query(`select id, product_value_kobo, commission_kobo, refund_adjustment_kobo, other_adjustment_kobo
     from commission_ledger where order_item_id = $1 for update`, [item.id]))[0];
	if (!ledger) throw new MarketError("Refunds start only after payment is verified");
	const nextRefund = Number(ledger.refund_adjustment_kobo) + input.amountKobo;
	if (nextRefund > Number(ledger.product_value_kobo)) throw new MarketError("Refund is larger than the amount left on this item");
	const settlement = settlementKobo(Number(ledger.product_value_kobo), Number(ledger.commission_kobo), nextRefund, Number(ledger.other_adjustment_kobo));
	await sql.query(`update commission_ledger
     set refund_adjustment_kobo = $1, settlement_kobo = $2
     where id = $3`, [
		nextRefund,
		settlement,
		ledger.id
	]);
	await sql.query(`insert into refunds (id, order_id, order_item_id, amount_kobo, reason, status, actor_user_id)
     values ($1,$2,$3,$4,$5,'recorded',$6)`, [
		crypto.randomUUID(),
		item.order_id,
		item.id,
		input.amountKobo,
		input.reason,
		input.actorUserId
	]);
	const fully = (await sql.query(`select product_value_kobo, refund_adjustment_kobo from commission_ledger
     where order_reference = (select reference from orders where id = $1)`, [item.order_id])).every((row) => Number(row.refund_adjustment_kobo) >= Number(row.product_value_kobo));
	await sql.query(`update orders set status = $1 where id = $2 and status in ('paid', 'partially_refunded')`, [fully ? "refunded" : "partially_refunded", item.order_id]);
}
async function claimAdmin(sql, userId) {
	return (await sql.query(`insert into user_roles (user_id, role)
     select $1, 'admin'
     where not exists (select 1 from user_roles where role = 'admin')
     returning user_id`, [userId])).length > 0;
}
async function transitionFulfilment(sql, input) {
	const row = (await sql.query(`select id, order_id, retailer_id, status from retailer_orders where id = $1 for update`, [input.retailerOrderId]))[0];
	if (!row) throw new MarketError("Fulfilment record was not found");
	if (!fulfilmentTransitionAllowed(row.status, input.to)) throw new MarketError(`Cannot move this fulfilment from ${row.status} to ${input.to}`);
	await sql.query(`update retailer_orders set status = $1, note = $2 where id = $3`, [
		input.to,
		input.note || row.status,
		row.id
	]);
	await sql.query(`insert into delivery_records (id, retailer_order_id, status, proof_ref, note, actor_user_id)
     values ($1,$2,$3,$4,$5,$6)`, [
		crypto.randomUUID(),
		row.id,
		input.to,
		input.proof,
		input.note,
		input.actorUserId
	]);
	if (input.to === "rejected" || input.to === "cancelled") {
		const items = await sql.query(`select product_id, variant_id, qty from order_items where order_id = $1 and retailer_id = $2`, [row.order_id, row.retailer_id]);
		for (const item of items) {
			if (item.variant_id) await sql.query(`update product_variants set stock = stock + $1 where id = $2`, [item.qty, item.variant_id]);
			if (item.product_id) await sql.query(`update products set stock = stock + $1 where id = $2`, [item.qty, item.product_id]);
		}
	}
	return {
		orderId: row.order_id,
		retailerId: row.retailer_id,
		from: row.status
	};
}
async function notifyUser(sql, input) {
	const email = (await sql`select email from profiles where user_id = ${input.userId}`)[0]?.email ?? "";
	let emailStatus = "not_configured";
	const key = process.env.EMAIL_PROVIDER_API_KEY;
	const from = process.env.EMAIL_FROM_ADDRESS;
	if (key && from && email) try {
		emailStatus = (await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				from,
				to: email,
				subject: input.title,
				text: input.body
			})
		})).ok ? "sent" : "failed";
	} catch {
		emailStatus = "failed";
	}
	else if (!email) emailStatus = "skipped";
	await sql`insert into notifications (id, user_id, title, body, href, email_status)
    values (${crypto.randomUUID()}, ${input.userId}, ${input.title}, ${input.body}, ${input.href ?? ""}, ${emailStatus})`;
}
async function notifyAdmins(sql, input) {
	const admins = await sql`select user_id from user_roles where role = 'admin'`;
	for (const admin of admins) await notifyUser(sql, {
		...input,
		userId: admin.user_id
	});
}
//#endregion
export { sandboxConfirmAllowed as _, createOrderRecord as a, loadPricedCart as c, notifyUser as d, orderAccess as f, retailerCanMutateProduct as g, releaseOrderStock as h, claimAdmin as i, markPaidRecord as l, recordRefund as m, canCustomerCancel as n, eventKey as o, paystackSignatureValid as p, canReview as r, fulfilmentTransitionAllowed as s, MarketError as t, notifyAdmins as u, transitionFulfilment as v };
