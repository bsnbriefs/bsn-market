import { c as getSql } from "./money-eRJ-C_HK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sitemap.server-BB0Ibeld.js
async function listSitemapPaths() {
	const sql = await getSql();
	const products = await sql`
    select p.slug from products p
    join retailer_profiles r on r.id = p.retailer_id
    where p.status = 'approved' and r.status = 'approved'`;
	const policies = await sql`select slug from policies`;
	return [
		"/",
		"/shop",
		"/request",
		"/support",
		...products.map((row) => `/product/${row.slug}`),
		...policies.map((row) => `/policies/${row.slug}`)
	];
}
//#endregion
export { listSitemapPaths };
