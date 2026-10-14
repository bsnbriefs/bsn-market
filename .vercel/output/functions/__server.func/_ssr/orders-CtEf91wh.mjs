import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText } from "./ui-BLoIMfat.mjs";
import { a as listRetailerOrders, s as updateMyFulfilment } from "./retailer-C_xbb5pz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders-CtEf91wh.js
var import_jsx_runtime = require_jsx_runtime();
var next = {
	pending: ["accepted", "rejected"],
	accepted: ["preparing", "cancelled"],
	preparing: ["ready", "cancelled"],
	ready: ["dispatched", "cancelled"],
	dispatched: ["in_transit", "failed"],
	in_transit: ["delivered", "failed"]
};
function RetailerOrders() {
	const orders = useQuery({
		queryKey: ["retailer-orders"],
		queryFn: () => listRetailerOrders()
	});
	const queryClient = useQueryClient();
	async function move(id, status) {
		try {
			await updateMyFulfilment({ data: {
				id,
				status,
				note: "",
				proof: ""
			} });
			await queryClient.invalidateQueries({ queryKey: ["retailer-orders"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Orders to fulfil"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "You see the name, phone, and address needed to deliver. Customer email stays hidden."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-3",
			children: (orders.data ?? []).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-semibold",
						children: [
							order.reference,
							" · ",
							order.status.replaceAll("_", " ")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						order.customer_name,
						" · ",
						order.phone
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						order.address_line,
						", ",
						order.city,
						", ",
						order.state
					] }),
					order.instructions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: order.instructions
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2",
						children: order.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							item.qty,
							" × ",
							item.name_snapshot,
							item.variant_snapshot ? ` (${item.variant_snapshot})` : "",
							" · ",
							formatNaira(Number(item.line_kobo))
						] }, item.name_snapshot))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: (next[order.status] ?? []).map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-border px-3 capitalize",
							onClick: () => void move(order.fulfilment_id, status),
							children: status.replaceAll("_", " ")
						}, status))
					})
				]
			}, order.fulfilment_id))
		})
	] });
}
//#endregion
export { RetailerOrders as component };
