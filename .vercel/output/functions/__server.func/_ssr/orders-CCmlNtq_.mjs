import { o as __toESM } from "../_runtime.mjs";
import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as getMyOrder } from "./commerce-D6xgnPlf.mjs";
import { c as errText, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
import { d as adminRecordRefund, g as adminSetQuote, i as adminListOrders, n as adminFulfil } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders-CCmlNtq_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminOrders() {
	const orders = useQuery({
		queryKey: ["admin-orders"],
		queryFn: () => adminListOrders()
	});
	const [open, setOpen] = (0, import_react.useState)(null);
	const detail = useQuery({
		queryKey: ["order", open],
		enabled: Boolean(open),
		queryFn: () => getMyOrder({ data: open ?? "" })
	});
	const queryClient = useQueryClient();
	async function run(task) {
		try {
			await task();
			toast.success("Saved");
			await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
			await queryClient.invalidateQueries({ queryKey: ["order", open] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Orders"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-2 text-sm",
			children: (orders.data?.orders ?? []).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "w-full rounded-2xl border border-border bg-surface p-3 text-left",
				onClick: () => setOpen(order.id),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: order.reference
					}),
					" · ",
					order.status.replaceAll("_", " "),
					" · ",
					order.customer_name,
					" · ",
					order.total_kobo === null ? "no total yet" : formatNaira(Number(order.total_kobo))
				]
			}) }, order.id))
		}),
		detail.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 rounded-2xl border border-border bg-surface p-4 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: detail.data.reference
				}),
				detail.data.status === "awaiting_quote" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-2 flex gap-2",
					onSubmit: (event) => {
						event.preventDefault();
						const feeNaira = String(new FormData(event.currentTarget).get("fee") ?? "");
						run(() => adminSetQuote({ data: {
							orderId: detail.data?.id,
							feeNaira
						} }));
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "fee",
						required: true,
						placeholder: "Delivery fee per retailer, naira",
						"aria-label": "Delivery fee"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						children: "Set quote"
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: detail.data.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						item.name,
						" · ",
						formatNaira(item.lineKobo),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-1 flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								const form = new FormData(event.currentTarget);
								run(() => adminRecordRefund({ data: {
									orderItemId: item.id,
									amountNaira: form.get("amount"),
									reason: form.get("reason")
								} }));
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									name: "amount",
									placeholder: "Refund naira",
									"aria-label": "Refund amount"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									name: "reason",
									placeholder: "Reason",
									"aria-label": "Refund reason"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									variant: "surface",
									children: "Record refund"
								})
							]
						})
					] }, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: detail.data.fulfilments.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "capitalize",
							children: row.status.replaceAll("_", " ")
						}), [
							"accepted",
							"preparing",
							"ready",
							"dispatched",
							"in_transit",
							"delivered",
							"failed",
							"cancelled"
						].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-full border border-border px-2 py-1",
							onClick: () => void run(() => adminFulfil({ data: {
								id: row.id,
								status,
								note: "Admin update",
								proof: ""
							} })),
							children: status
						}, status))]
					}, row.id))
				})
			]
		}) : null
	] });
}
//#endregion
export { AdminOrders as component };
