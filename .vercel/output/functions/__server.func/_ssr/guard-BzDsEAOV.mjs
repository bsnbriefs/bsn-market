import { t as MarketError } from "./notify-DZJIERaE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guard-BzDsEAOV.js
var buckets = /* @__PURE__ */ new Map();
function rateLimit(key, max, windowMs) {
	const now = Date.now();
	const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
	if (recent.length >= max) throw new MarketError("Please wait a moment and try again");
	recent.push(now);
	buckets.set(key, recent);
}
async function ensureProfile(sql, userId, email) {
	await sql`insert into profiles (user_id, email) values (${userId}, ${email})
    on conflict (user_id) do update set email = case when profiles.email = '' then excluded.email else profiles.email end`;
	await sql`insert into user_roles (user_id, role) values (${userId}, 'customer') on conflict do nothing`;
}
async function roleNames(sql, userId) {
	return (await sql`select role from user_roles where user_id = ${userId}`).map((row) => row.role);
}
async function requireAdmin(sql, userId) {
	if (!(await roleNames(sql, userId)).includes("admin")) throw new MarketError("You do not have administrator access");
}
async function ownRetailer(sql, userId) {
	return (await sql`select id, status, business_name, user_id from retailer_profiles where user_id = ${userId}`)[0] ?? null;
}
function clean(value, max) {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, max);
}
function assertImageRef(url) {
	if (url.startsWith("/") && url.length < 400 && !url.includes("..")) return;
	if (url.startsWith("https://") && url.length < 2e3) return;
	if (url.startsWith("data:image/jpeg;base64,") && url.length < 45e4) return;
	throw new MarketError("Use a JPEG photo or an https image link");
}
async function audit(sql, actor, action, entity, entityId, detail) {
	await sql`insert into audit_logs (id, actor_user_id, action, entity, entity_id, detail)
    values (${crypto.randomUUID()}, ${actor}, ${action}, ${entity}, ${entityId}, ${detail.slice(0, 500)})`;
}
//#endregion
export { ownRetailer as a, roleNames as c, ensureProfile as i, audit as n, rateLimit as o, clean as r, requireAdmin as s, assertImageRef as t };
