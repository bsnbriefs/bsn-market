import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as getAdminOverview } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-VE3nJAZq.js
var import_jsx_runtime = require_jsx_runtime();
function AdminHome() {
	const overview = useQuery({
		queryKey: ["admin-overview"],
		queryFn: () => getAdminOverview()
	});
	if (overview.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm",
		children: "Loading figures…"
	});
	if (!overview.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Could not load the overview." });
	const data = overview.data;
	const rows = [
		["Customers", String(data.customers)],
		["Approved retailers", String(data.retailers.approved ?? 0)],
		["Pending applications", String(data.retailers.pending ?? 0)],
		["Products", String(Object.values(data.products).reduce((sum, n) => sum + Number(n), 0))],
		["Awaiting product approval", String(data.products.pending ?? 0)],
		["Orders", String(Object.values(data.orders).reduce((sum, n) => sum + Number(n), 0))],
		["Fully delivered paid orders", String(data.fullyDelivered)],
		["Gross merchandise value", formatNaira(data.gmvKobo)],
		["Commission recorded (not profit)", formatNaira(data.commissionKobo)],
		["Refunds recorded", formatNaira(data.refundsKobo)],
		["Outstanding retailer settlements", formatNaira(data.outstandingKobo)]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Marketplace overview"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				"Gross merchandise value is the value of paid goods. Commission is BSN Market’s recorded fee, not profit. Paystack: ",
				data.paystack ? "connected" : "not connected",
				". Email: ",
				data.emailConfigured ? "connected" : "not connected",
				"."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid grid-cols-2 gap-2 md:grid-cols-3",
			children: rows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-surface p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-semibold tabular-nums",
					children: value
				})]
			}, label))
		})
	] });
}
//#endregion
export { AdminHome as component };
