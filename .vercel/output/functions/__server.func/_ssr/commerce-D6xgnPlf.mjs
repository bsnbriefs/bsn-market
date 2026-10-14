import { r as createServerFn } from "./ssr.mjs";
import { c as createSsrRpc } from "./router-3DsyBKek.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/commerce-D6xgnPlf.js
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
var quoteCart = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("5963b489058568510f0f43a4b3cd19d48f99e66914a2e0e64f9321812d20b1da"));
var getServerCart = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("e2722ed9bd3de9705900bd9192f64f1e535ac1cdbea087da6824365c95d49631"));
var syncCart = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => linesOf(input)).handler(createSsrRpc("02594af8c873dde0162c1c3e878ed84c4e6a78ce8371584a5aa5cf698d4ff406"));
var checkout = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("97e6c883d74b5cad95c7515e9e4bc025b4621dd8f840c2a2ca3da3d070e615fe"));
var confirmSandboxPayment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(createSsrRpc("8e9adfa8f4fbba4b22ed8b69aeb94182ecd633c36240dc6e8ac0c70c6e19e18e"));
var refreshPayment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(createSsrRpc("3bbd31d27438d04d32202c0fe146b129786dc713b6dc792061b68cf6a158a110"));
var listMyOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("fe927b044aa63be080a3bd310cb576091f28fc671db53211e07b660ead2fc868"));
var getMyOrder = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(createSsrRpc("e65ca05e8271455c8fd033e94bf611fc338de2082d309a6dcc9ff98641ed836d"));
var cancelMyOrder = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((orderId) => typeof orderId === "string" ? orderId : "").handler(createSsrRpc("985e94eb2bb192bd7a1a458feee91922b49d05a8704766d2ea0e71c7e680ff83"));
var requestReturn = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("0b71663f2a646a10092b2e6b1c27573229b4b150b9a7180e34c09b93b6565ded"));
//#endregion
export { getServerCart as a, refreshPayment as c, getMyOrder as i, requestReturn as l, checkout as n, listMyOrders as o, confirmSandboxPayment as r, quoteCart as s, cancelMyOrder as t, syncCart as u };
