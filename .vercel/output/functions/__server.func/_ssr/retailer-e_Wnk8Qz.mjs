import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as errText } from "./ui-BLoIMfat.mjs";
import { r as getRetailerDashboard } from "./retailer-C_xbb5pz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/retailer-e_Wnk8Qz.js
var import_jsx_runtime = require_jsx_runtime();
function RetailerHome() {
	const dash = useQuery({
		queryKey: ["retailer-dash"],
		queryFn: () => getRetailerDashboard()
	});
	if (dash.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading your desk…"
	});
	if (dash.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Sell on BSN Market"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm",
			children: errText(dash.error)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/retailer/apply",
			className: "mt-3 inline-block font-semibold text-primary",
			children: "Start an application"
		})
	] });
	const data = dash.data;
	if (!data) return null;
	const cards = [
		["Orders", String(data.totalOrders)],
		["Still to fulfil", String(data.pending)],
		["Delivered", String(data.delivered)],
		["Cancelled or rejected", String(data.cancelled)],
		["Gross sales", formatNaira(data.grossKobo)],
		["Commission", formatNaira(data.commissionKobo)],
		["Refund adjustments", formatNaira(data.refundKobo)],
		["Net settlement", formatNaira(data.settlementKobo)]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: data.retailer.business_name
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm capitalize text-muted",
			children: [
				"Status: ",
				data.retailer.status,
				". Figures come from your orders only."
			]
		}),
		data.retailer.status !== "approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm",
			children: "You cannot publish live products until an administrator approves the business."
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid grid-cols-2 gap-2 md:grid-cols-4",
			children: cards.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-surface p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-lg font-semibold tabular-nums",
					children: value
				})]
			}, label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-6 font-display text-2xl",
			children: "Low stock"
		}),
		data.lowStock.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "No products at 5 or below."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 text-sm",
			children: data.lowStock.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				item.name,
				" · ",
				item.stock,
				" left"
			] }, item.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-6 font-display text-2xl",
			children: "Recent orders"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-1 text-sm",
			children: data.recent.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				row.reference,
				" · ",
				row.status
			] }, row.reference))
		})
	] });
}
//#endregion
export { RetailerHome as component };
