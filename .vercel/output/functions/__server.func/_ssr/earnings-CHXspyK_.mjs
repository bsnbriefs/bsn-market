import { o as formatNaira, t as bpsToPercent } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as getEarnings } from "./retailer-C_xbb5pz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/earnings-CHXspyK_.js
var import_jsx_runtime = require_jsx_runtime();
function EarningsPage() {
	const earnings = useQuery({
		queryKey: ["earnings"],
		queryFn: () => getEarnings()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Earnings ledger"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Commission was copied onto each item when the order was paid. Later rate changes do not rewrite these rows. Settlement here is a record, not a bank transfer."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[640px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Order" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Value" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Commission" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Refunds" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Settlement" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (earnings.data?.rows ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: row.order_reference
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatNaira(Number(row.product_value_kobo)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [bpsToPercent(Number(row.commission_bps)), "%"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatNaira(Number(row.commission_kobo)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatNaira(Number(row.refund_adjustment_kobo)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatNaira(Number(row.settlement_kobo)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "capitalize",
							children: row.settlement_status
						})
					]
				}, `${row.order_reference}-${row.product_value_kobo}`)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-6 font-display text-2xl",
			children: "Settlement batches"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 text-sm",
			children: (earnings.data?.settlements ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				formatNaira(Number(row.amount_kobo)),
				" · ",
				row.status,
				" · ",
				row.reference || "no reference"
			] }, row.id))
		})
	] });
}
//#endregion
export { EarningsPage as component };
