import { c as getSql, d as nairaToKobo } from "./money-eRJ-C_HK.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-GicCo2Jo.js
var CARD_SQL = `
  select p.id, p.name, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
         coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
         r.business_name, r.city as retailer_city, r.state as retailer_state,
         coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
         coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
  from products p
  join retailer_profiles r on r.id = p.retailer_id
  left join product_categories c on c.id = p.category_id
  where p.status = 'approved' and r.status = 'approved'
`;
function toCard(row) {
	return {
		id: row.id,
		name: row.name,
		priceKobo: Number(row.price_kobo),
		compareAtKobo: row.compare_at_kobo === null ? null : Number(row.compare_at_kobo),
		brand: row.brand,
		stock: Number(row.stock),
		imageUrl: row.image_url,
		retailerName: row.business_name,
		retailerCity: row.retailer_city,
		retailerState: row.retailer_state,
		categorySlug: row.category_slug,
		categoryName: row.category_name,
		reviewCount: Number(row.review_count)
	};
}
var getStorefront_createServerFn_handler = createServerRpc({
	id: "274fb1155063942b58553271142e89d09c7e489c157c35d647c813b5d9dc2e21",
	name: "getStorefront",
	filename: "src/lib/market/catalog.ts"
}, (opts) => getStorefront.__executeServer(opts));
var getStorefront = createServerFn({ method: "GET" }).handler(getStorefront_createServerFn_handler, async () => {
	const sql = await getSql();
	const settings = await sql`
    select store_name, tagline, support_email, support_phone from site_settings where id = 'default'`;
	const categories = await sql`
    select slug, name from product_categories order by sort_order, name`;
	const campaigns = await sql`
    select title, subtitle, image_url, link_path from promotional_campaigns where active order by sort_order`;
	const featured = (await sql.query(`${CARD_SQL} and p.featured = true order by p.created_at desc limit 8`)).map(toCard);
	const newest = (await sql.query(`${CARD_SQL} order by p.created_at desc limit 8`)).map(toCard);
	const offers = (await sql.query(`${CARD_SQL} and p.compare_at_kobo is not null and p.compare_at_kobo > p.price_kobo order by p.created_at desc limit 8`)).map(toCard);
	const trendIds = await sql`
    select oi.product_id from order_items oi
    join orders o on o.id = oi.order_id
    where o.status in ('paid', 'partially_refunded', 'refunded') and oi.product_id is not null
    group by oi.product_id order by count(*) desc limit 8`;
	let trending = [];
	if (trendIds.length) {
		const ids = trendIds.map((row) => row.product_id);
		const rows = await sql.query(`${CARD_SQL} and p.id = any($1::text[])`, [ids]);
		const byId = new Map(rows.map((row) => [row.id, toCard(row)]));
		trending = ids.flatMap((id) => {
			const card = byId.get(id);
			return card ? [card] : [];
		});
	}
	return {
		storeName: settings[0]?.store_name ?? "BSN Market",
		tagline: settings[0]?.tagline ?? "Your Market. Your Choice. Delivered.",
		supportEmail: settings[0]?.support_email ?? "",
		supportPhone: settings[0]?.support_phone ?? "",
		categories,
		campaigns,
		featured,
		newest,
		offers,
		trending
	};
});
function readShop(input) {
	const raw = input ?? {};
	const sort = typeof raw.sort === "string" ? raw.sort : "newest";
	const allowed = /* @__PURE__ */ new Set([
		"newest",
		"price_asc",
		"price_desc",
		"relevance"
	]);
	const page = Number(raw.page);
	return {
		q: typeof raw.q === "string" ? raw.q.slice(0, 80) : "",
		category: typeof raw.category === "string" ? raw.category.slice(0, 40) : "",
		retailer: typeof raw.retailer === "string" ? raw.retailer.slice(0, 40) : "",
		brand: typeof raw.brand === "string" ? raw.brand.slice(0, 60) : "",
		state: typeof raw.state === "string" ? raw.state.slice(0, 40) : "",
		min: typeof raw.min === "string" ? raw.min.slice(0, 12) : "",
		max: typeof raw.max === "string" ? raw.max.slice(0, 12) : "",
		sort: allowed.has(sort) ? sort : "newest",
		page: Number.isInteger(page) && page > 0 ? Math.min(page, 100) : 1
	};
}
var searchProducts_createServerFn_handler = createServerRpc({
	id: "312bcaa3bdb930d2631f3014e3cf38cc8759996cf82d7ad1d38f85e88867af60",
	name: "searchProducts",
	filename: "src/lib/market/catalog.ts"
}, (opts) => searchProducts.__executeServer(opts));
var searchProducts = createServerFn({ method: "GET" }).validator((input) => readShop(input)).handler(searchProducts_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const where = ["p.status = 'approved'", "r.status = 'approved'"];
	const params = [];
	const add = (sqlText, value) => {
		params.push(value);
		where.push(sqlText.replace("$#", `$${params.length}`));
	};
	if (data.q.trim()) add(`(p.name ilike $# or p.brand ilike $# or p.description ilike $#) `, `%${data.q.trim()}%`);
	if (data.q.trim()) {
		where.pop();
		params.pop();
		const like = `%${data.q.trim()}%`;
		params.push(like, like, like);
		const a = params.length - 2;
		const b = params.length - 1;
		const c = params.length;
		where.push(`(p.name ilike $${a} or p.brand ilike $${b} or p.description ilike $${c})`);
	}
	if (data.category) add("c.slug = $#", data.category);
	if (data.retailer) add("r.id = $#", data.retailer);
	if (data.brand) add("p.brand = $#", data.brand);
	if (data.state) add("r.state = $#", data.state);
	if (data.min.trim()) try {
		add("p.price_kobo >= $#", nairaToKobo(data.min));
	} catch {}
	if (data.max.trim()) try {
		add("p.price_kobo <= $#", nairaToKobo(data.max));
	} catch {}
	const order = data.sort === "price_asc" ? "p.price_kobo asc" : data.sort === "price_desc" ? "p.price_kobo desc" : data.sort === "relevance" && data.q.trim() ? "case when p.name ilike $" + String(params.findIndex((value) => value === `%${data.q.trim()}%`) + 1) + " then 0 else 1 end, p.created_at desc" : "p.created_at desc";
	const whereSql = where.join(" and ");
	const countRows = await sql.query(`select count(*)::int as n from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where ${whereSql}`, params);
	const pageSize = 12;
	const offset = (data.page - 1) * pageSize;
	const rows = await sql.query(`select p.id, p.name, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
              coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
              r.business_name, r.city as retailer_city, r.state as retailer_state,
              coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
              coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
       from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where ${whereSql}
       order by ${order}
       limit ${pageSize} offset ${offset}`, params);
	const facets = await sql.query(`select distinct p.brand, r.id as retailer_id, r.business_name, r.state
       from products p join retailer_profiles r on r.id = p.retailer_id
       where p.status = 'approved' and r.status = 'approved'`);
	const categories = await sql`select slug, name from product_categories order by sort_order`;
	return {
		products: rows.map(toCard),
		total: Number(countRows[0]?.n ?? 0),
		page: data.page,
		pageSize,
		categories,
		brands: [...new Set(facets.map((row) => row.brand).filter(Boolean))].sort(),
		retailers: [...new Map(facets.map((row) => [row.retailer_id, row.business_name])).entries()].map(([id, name]) => ({
			id,
			name
		})),
		states: [...new Set(facets.map((row) => row.state))].sort()
	};
});
var getProduct_createServerFn_handler = createServerRpc({
	id: "977c115b08ed02e57127eebe8cef273a472b888bbef0931bda7481f2a8806c26",
	name: "getProduct",
	filename: "src/lib/market/catalog.ts"
}, (opts) => getProduct.__executeServer(opts));
var getProduct = createServerFn({ method: "GET" }).validator((slug) => typeof slug === "string" ? slug.slice(0, 80) : "").handler(getProduct_createServerFn_handler, async ({ data: slug }) => {
	const sql = await getSql();
	const product = (await sql.query(`select p.id, p.name, p.description, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
              p.return_eligible, p.delivery_days_min, p.delivery_days_max, p.retailer_id,
              coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
              r.business_name, r.city as retailer_city, r.state as retailer_state, r.description as retailer_description,
              coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
              coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
       from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where p.slug = $1 and p.status = 'approved' and r.status = 'approved'`, [slug]))[0];
	if (!product) return null;
	const images = await sql`select url from product_images where product_id = ${product.id} order by sort_order`;
	const variants = await sql`
      select id, label, price_delta_kobo, stock from product_variants where product_id = ${product.id} order by label`;
	const reviews = await sql`
      select rv.rating, rv.body, rv.created_at::text as created_at, coalesce(pr.full_name, 'Customer') as full_name
      from product_reviews rv
      left join profiles pr on pr.user_id = rv.user_id
      where rv.product_id = ${product.id}
      order by rv.created_at desc limit 20`;
	const related = (await sql.query(`${CARD_SQL} and c.slug = $1 and p.id <> $2 order by p.created_at desc limit 4`, [product.category_slug, product.id])).map(toCard);
	const rating = reviews.length === 0 ? null : Math.round(reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length);
	return {
		...toCard(product),
		description: product.description,
		returnEligible: Boolean(product.return_eligible),
		deliveryDaysMin: product.delivery_days_min,
		deliveryDaysMax: product.delivery_days_max,
		retailerId: product.retailer_id,
		retailerDescription: product.retailer_description ?? "",
		images: images.map((image) => image.url),
		variants: variants.map((variant) => ({
			id: variant.id,
			label: variant.label,
			priceDeltaKobo: Number(variant.price_delta_kobo),
			stock: Number(variant.stock)
		})),
		reviews: reviews.map((review) => ({
			rating: Number(review.rating),
			body: review.body,
			createdAt: review.created_at,
			name: review.full_name || "Customer"
		})),
		rating,
		related
	};
});
var getPolicy_createServerFn_handler = createServerRpc({
	id: "abb24bcf3a32ac8d43bc4852e5e5fe387c9bc8c68295f8ed95c6ce2d5436b05b",
	name: "getPolicy",
	filename: "src/lib/market/catalog.ts"
}, (opts) => getPolicy.__executeServer(opts));
var getPolicy = createServerFn({ method: "GET" }).validator((slug) => typeof slug === "string" ? slug.slice(0, 40) : "").handler(getPolicy_createServerFn_handler, async ({ data: slug }) => {
	const rows = await (await getSql())`
      select title, body, updated_at::text as updated_at from policies where slug = ${slug}`;
	return rows[0] ? {
		slug,
		title: rows[0].title,
		body: rows[0].body,
		updatedAt: rows[0].updated_at
	} : null;
});
var listPolicyLinks_createServerFn_handler = createServerRpc({
	id: "cfe8bf2b9e1408ff638e4059d331a7273f7302ef9b4d292f8594c872b7fa096b",
	name: "listPolicyLinks",
	filename: "src/lib/market/catalog.ts"
}, (opts) => listPolicyLinks.__executeServer(opts));
var listPolicyLinks = createServerFn({ method: "GET" }).handler(listPolicyLinks_createServerFn_handler, async () => {
	return (await getSql())`select slug, title from policies order by title`;
});
//#endregion
export { getPolicy_createServerFn_handler, getProduct_createServerFn_handler, getStorefront_createServerFn_handler, listPolicyLinks_createServerFn_handler, searchProducts_createServerFn_handler };
