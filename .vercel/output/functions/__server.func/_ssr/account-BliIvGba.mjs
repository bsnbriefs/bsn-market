import { c as getSql, h as withTransaction } from "./money-eRJ-C_HK.mjs";
import { d as notifyUser, i as claimAdmin, r as canReview, t as MarketError, u as notifyAdmins } from "./notify-DZJIERaE.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { a as ownRetailer, c as roleNames, i as ensureProfile, o as rateLimit, r as clean, t as assertImageRef } from "./guard-BzDsEAOV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-BliIvGba.js
var getMe_createServerFn_handler = createServerRpc({
	id: "a2bbbde0b1abf896e5be87d4046a6d2a567c76531893a88be1793127fbe8ad86",
	name: "getMe",
	filename: "src/lib/market/account.ts"
}, (opts) => getMe.__executeServer(opts));
var getMe = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(getMe_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	const profile = await sql`
      select full_name, phone, email from profiles where user_id = ${userId}`;
	const roles = await roleNames(sql, userId);
	const retailer = await ownRetailer(sql, userId);
	const addresses = await sql`select id, label, recipient, phone, line, state, city, instructions, is_default
       from customer_addresses where user_id = ${userId} order by is_default desc`;
	const notifications = await sql`
      select id, title, body, href, read_at::text as read_at, created_at::text as created_at, email_status
      from notifications where user_id = ${userId} order by created_at desc limit 30`;
	const adminCount = await sql`select count(*)::int as n from user_roles where role = 'admin'`;
	return {
		profile: {
			fullName: profile[0]?.full_name ?? "",
			phone: profile[0]?.phone ?? "",
			email: profile[0]?.email || email
		},
		roles,
		retailer,
		addresses,
		notifications,
		unread: notifications.filter((item) => !item.read_at).length,
		adminExists: Number(adminCount[0]?.n ?? 0) > 0,
		paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
		emailConfigured: Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS)
	};
});
var updateProfile_createServerFn_handler = createServerRpc({
	id: "8d530d1c9c020721e3070a8396f5f9aae65e30c4276218a2e5be20e14e7791e2",
	name: "updateProfile",
	filename: "src/lib/market/account.ts"
}, (opts) => updateProfile.__executeServer(opts));
var updateProfile = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(updateProfile_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	const raw = data ?? {};
	const fullName = clean(raw.fullName, 80);
	const phone = clean(raw.phone, 20);
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	await sql`update profiles set full_name = ${fullName}, phone = ${phone}, updated_at = now() where user_id = ${userId}`;
	return { ok: true };
});
var saveAddress_createServerFn_handler = createServerRpc({
	id: "6b6ca43c12404694a0fb11cb71f4d774c8c49e39f1c48d9324e5788e0c04cc8c",
	name: "saveAddress",
	filename: "src/lib/market/account.ts"
}, (opts) => saveAddress.__executeServer(opts));
var saveAddress = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(saveAddress_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const raw = data ?? {};
	const recipient = clean(raw.recipient, 80);
	const phone = clean(raw.phone, 20);
	const line = clean(raw.line, 160);
	const state = clean(raw.state, 40);
	const city = clean(raw.city, 60);
	const instructions = clean(raw.instructions, 240);
	if (recipient.length < 2 || phone.length < 7 || line.length < 4 || !city) throw new MarketError("Complete the address");
	if (!NIGERIAN_STATES.includes(state)) throw new MarketError("Choose a Nigerian state");
	const sql = await getSql();
	const id = clean(raw.id, 80) || crypto.randomUUID();
	if (raw.isDefault === true) await sql`update customer_addresses set is_default = false where user_id = ${userId}`;
	await sql`insert into customer_addresses (id, user_id, label, recipient, phone, line, state, city, instructions, is_default)
      values (${id}, ${userId}, ${clean(raw.label, 40) || "Home"}, ${recipient}, ${phone}, ${line}, ${state}, ${city}, ${instructions}, ${raw.isDefault === true})
      on conflict (id) do update set recipient = excluded.recipient, phone = excluded.phone, line = excluded.line,
        state = excluded.state, city = excluded.city, instructions = excluded.instructions, is_default = excluded.is_default
        where customer_addresses.user_id = ${userId}`;
	return { ok: true };
});
var deleteAddress_createServerFn_handler = createServerRpc({
	id: "c271358b8eb58b54dd712ace16dcdabfe1980fae92b3a68d11873d0e2cf5925a",
	name: "deleteAddress",
	filename: "src/lib/market/account.ts"
}, (opts) => deleteAddress.__executeServer(opts));
var deleteAddress = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((id) => typeof id === "string" ? id : "").handler(deleteAddress_createServerFn_handler, async ({ context, data: id }) => {
	const { userId } = context;
	await (await getSql())`delete from customer_addresses where id = ${id} and user_id = ${userId}`;
	return { ok: true };
});
var claimMarketplace_createServerFn_handler = createServerRpc({
	id: "28709b93062905e1de40f5251b8bbd0641301ac57944f93d2ac75e8f1f66c246",
	name: "claimMarketplace",
	filename: "src/lib/market/account.ts"
}, (opts) => claimMarketplace.__executeServer(opts));
var claimMarketplace = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).handler(claimMarketplace_createServerFn_handler, async ({ context }) => {
	const { userId, email } = context;
	if (!await withTransaction(async (sql) => {
		await ensureProfile(sql, userId, email);
		return claimAdmin(sql, userId);
	})) throw new MarketError("An administrator already exists. Ask them for access.");
	return { ok: true };
});
var applyRetailer_createServerFn_handler = createServerRpc({
	id: "249d0cddf6ddf8db48e4e297735b6390cb3825f6c6c25ae822068c742c155b57",
	name: "applyRetailer",
	filename: "src/lib/market/account.ts"
}, (opts) => applyRetailer.__executeServer(opts));
var applyRetailer = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(applyRetailer_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	rateLimit(`apply:${userId}`, 5, 36e5);
	const raw = data ?? {};
	const businessName = clean(raw.businessName, 80);
	const contactName = clean(raw.contactName, 80);
	const phone = clean(raw.phone, 20);
	const businessEmail = clean(raw.email, 120) || email;
	const address = clean(raw.address, 160);
	const state = clean(raw.state, 40);
	const city = clean(raw.city, 60);
	const categories = clean(raw.categories, 160);
	const description = clean(raw.description, 800);
	const catalogueNote = clean(raw.catalogueNote, 800);
	const registration = clean(raw.registrationNumber, 40);
	if (raw.termsAccepted !== true) throw new MarketError("Accept the retailer agreement to apply");
	if (businessName.length < 2 || contactName.length < 2 || phone.length < 7 || address.length < 4 || !city) throw new MarketError("Complete the business details");
	if (!NIGERIAN_STATES.includes(state)) throw new MarketError("Choose a Nigerian state");
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	const existing = await ownRetailer(sql, userId);
	if (existing && existing.status !== "rejected") throw new MarketError("You already have a retailer application");
	const id = existing?.id ?? crypto.randomUUID();
	if (existing) await sql`update retailer_profiles set business_name = ${businessName}, contact_name = ${contactName}, phone = ${phone},
        email = ${businessEmail}, address = ${address}, state = ${state}, city = ${city}, categories = ${categories},
        description = ${description}, catalogue_note = ${catalogueNote}, registration_number = ${registration},
        terms_accepted = true, status = 'pending', review_reason = '', updated_at = now()
        where id = ${id} and user_id = ${userId}`;
	else await sql`insert into retailer_profiles (
        id, user_id, business_name, contact_name, phone, email, address, state, city, categories, description,
        catalogue_note, registration_number, terms_accepted, status
      ) values (
        ${id}, ${userId}, ${businessName}, ${contactName}, ${phone}, ${businessEmail}, ${address}, ${state}, ${city},
        ${categories}, ${description}, ${catalogueNote}, ${registration}, true, 'pending'
      )`;
	await sql`insert into user_roles (user_id, role) values (${userId}, 'retailer') on conflict do nothing`;
	await sql`insert into retailer_verification_records (id, retailer_id, status, reason, actor_user_id)
      values (${crypto.randomUUID()}, ${id}, 'pending', 'Application submitted', ${userId})`;
	await notifyUser(sql, {
		userId,
		title: "Retailer application received",
		body: "An administrator will review your application before you can publish products.",
		href: "/retailer"
	});
	await notifyAdmins(sql, {
		title: "Retailer application",
		body: businessName,
		href: "/admin/retailers"
	});
	return { ok: true };
});
var createTicket_createServerFn_handler = createServerRpc({
	id: "29410b0313c8b606685074422a305b46455788b6cd12f820405a921679df41d4",
	name: "createTicket",
	filename: "src/lib/market/account.ts"
}, (opts) => createTicket.__executeServer(opts));
var createTicket = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createTicket_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	rateLimit(`ticket:${userId}`, 8, 36e5);
	const raw = data ?? {};
	const subject = clean(raw.subject, 120);
	const body = clean(raw.body, 2e3);
	if (subject.length < 3 || body.length < 8) throw new MarketError("Describe what you need help with");
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	const id = crypto.randomUUID();
	await sql`insert into support_tickets (id, user_id, subject) values (${id}, ${userId}, ${subject})`;
	await sql`insert into support_messages (id, ticket_id, author_user_id, body) values (${crypto.randomUUID()}, ${id}, ${userId}, ${body})`;
	await notifyAdmins(sql, {
		title: "Support ticket",
		body: subject,
		href: "/admin/support"
	});
	return { id };
});
var listMyTickets_createServerFn_handler = createServerRpc({
	id: "ddf78ab9252d2119a448e98cc9c1bc11a5d8faa06398e6b7b6005e1bd3aa044b",
	name: "listMyTickets",
	filename: "src/lib/market/account.ts"
}, (opts) => listMyTickets.__executeServer(opts));
var listMyTickets = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(listMyTickets_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	return (await getSql())`
      select id, subject, status, created_at::text as created_at from support_tickets
      where user_id = ${userId} order by created_at desc limit 30`;
});
var createProductRequest_createServerFn_handler = createServerRpc({
	id: "6c58a123b44c351f6f0dd54fed02677b5321e7c890cb3a75fe4a021220f9a6d4",
	name: "createProductRequest",
	filename: "src/lib/market/account.ts"
}, (opts) => createProductRequest.__executeServer(opts));
var createProductRequest = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createProductRequest_createServerFn_handler, async ({ context, data }) => {
	const { userId, email } = context;
	rateLimit(`request:${userId}`, 8, 36e5);
	const raw = data ?? {};
	const name = clean(raw.name, 120);
	const description = clean(raw.description, 1e3);
	if (name.length < 2) throw new MarketError("Name the product you want");
	const image = clean(raw.imageUrl, 45e4);
	if (image) assertImageRef(image);
	const sql = await getSql();
	await ensureProfile(sql, userId, email);
	const id = crypto.randomUUID();
	const reference = `PR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
	const min = clean(raw.budgetMin, 12);
	const max = clean(raw.budgetMax, 12);
	const { nairaToKobo } = await import("./money-eRJ-C_HK.mjs").then((n) => n.u).then((n) => n.s);
	await sql`insert into product_requests (
      id, reference, user_id, name, description, category, brand, budget_min_kobo, budget_max_kobo,
      state, city, image_url, contact_preference
    ) values (
      ${id}, ${reference}, ${userId}, ${name}, ${description}, ${clean(raw.category, 60)}, ${clean(raw.brand, 60)},
      ${min ? nairaToKobo(min) : null}, ${max ? nairaToKobo(max) : null},
      ${clean(raw.state, 40)}, ${clean(raw.city, 60)}, ${image}, ${clean(raw.contactPreference, 40) || "in_app"}
    )`;
	await notifyUser(sql, {
		userId,
		title: "Product request received",
		body: `Your reference is ${reference}. This is not an order.`,
		href: "/request"
	});
	await notifyAdmins(sql, {
		title: "Product request",
		body: `${reference}: ${name}`,
		href: "/admin/requests"
	});
	return { reference };
});
var listMyRequests_createServerFn_handler = createServerRpc({
	id: "d6686ad33e214dbc6cf5892cd4599cd74bacfa0a0088ea0e325b46ab324edc30",
	name: "listMyRequests",
	filename: "src/lib/market/account.ts"
}, (opts) => listMyRequests.__executeServer(opts));
var listMyRequests = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(listMyRequests_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	return (await getSql())`
      select reference, name, status, quotation_note, quotation_kobo, created_at::text as created_at
      from product_requests where user_id = ${userId} order by created_at desc limit 30`;
});
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "b987dd5073e639419ce13ba7c751e023d4ba7389a17b0bf19a6c90b70bcd5f9d",
	name: "markNotificationsRead",
	filename: "src/lib/market/account.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).handler(markNotificationsRead_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	await (await getSql())`update notifications set read_at = now() where user_id = ${userId} and read_at is null`;
	return { ok: true };
});
var createReview_createServerFn_handler = createServerRpc({
	id: "a4e1b136f17084897adb5349fbf29dd3dd802331331551bdc5bd66c5569f4198",
	name: "createReview",
	filename: "src/lib/market/account.ts"
}, (opts) => createReview.__executeServer(opts));
var createReview = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createReview_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const raw = data ?? {};
	const orderItemId = clean(raw.orderItemId, 80);
	const body = clean(raw.body, 800);
	const rating = Number(raw.rating);
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new MarketError("Choose a rating from 1 to 5");
	const sql = await getSql();
	const row = (await sql`select oi.product_id, o.user_id, ro.status as fulfilment
       from order_items oi
       join orders o on o.id = oi.order_id
       join retailer_orders ro on ro.order_id = oi.order_id and ro.retailer_id = oi.retailer_id
       where oi.id = ${orderItemId}`)[0];
	const existing = await sql`select id from product_reviews where order_item_id = ${orderItemId}`;
	if (!row?.product_id || !canReview({
		buyerId: row.user_id,
		userId,
		fulfilmentStatus: row.fulfilment,
		alreadyReviewed: existing.length > 0
	})) throw new MarketError("You can review this product after it is delivered");
	await sql`insert into product_reviews (id, product_id, user_id, order_item_id, rating, body)
      values (${crypto.randomUUID()}, ${row.product_id}, ${userId}, ${orderItemId}, ${rating}, ${body})`;
	return { ok: true };
});
//#endregion
export { applyRetailer_createServerFn_handler, claimMarketplace_createServerFn_handler, createProductRequest_createServerFn_handler, createReview_createServerFn_handler, createTicket_createServerFn_handler, deleteAddress_createServerFn_handler, getMe_createServerFn_handler, listMyRequests_createServerFn_handler, listMyTickets_createServerFn_handler, markNotificationsRead_createServerFn_handler, saveAddress_createServerFn_handler, updateProfile_createServerFn_handler };
