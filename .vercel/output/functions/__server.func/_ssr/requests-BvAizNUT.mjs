import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { o as adminListRequests, v as adminUpdateRequest } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/requests-BvAizNUT.js
var import_jsx_runtime = require_jsx_runtime();
var statuses = [
	"under_review",
	"retailer_contacted",
	"quotation_available",
	"customer_considering",
	"converted",
	"unavailable",
	"closed"
];
function RequestsPage() {
	const requests = useQuery({
		queryKey: ["admin-requests"],
		queryFn: () => adminListRequests()
	});
	const queryClient = useQueryClient();
	async function onSubmit(event, id) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		try {
			await adminUpdateRequest({ data: {
				id,
				status: form.get("status"),
				adminNote: form.get("adminNote"),
				quotationNote: form.get("quotationNote"),
				quotationNaira: form.get("quotationNaira")
			} });
			toast.success("Request updated. The customer still has to accept a real product before it becomes an order.");
			await queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-3xl",
		children: "Product requests"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 space-y-4",
		children: (requests.data ?? []).map((request) => {
			const row = request;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-semibold",
						children: [
							row.reference,
							" · ",
							row.name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: row.description }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							row.state,
							" ",
							row.city,
							" · ",
							row.status.replaceAll("_", " ")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-2 space-y-2",
						onSubmit: (event) => void onSubmit(event, row.id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								name: "status",
								defaultValue: row.status,
								"aria-label": "Status",
								className: "h-11 w-full rounded-xl border border-border bg-bg px-3",
								children: statuses.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: status,
									children: status.replaceAll("_", " ")
								}, status))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
								name: "adminNote",
								placeholder: "Internal note",
								"aria-label": "Internal note"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "quotationNaira",
								placeholder: "Quotation in naira",
								"aria-label": "Quotation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
								name: "quotationNote",
								placeholder: "What the customer should know",
								"aria-label": "Quotation note"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								children: "Update request"
							})
						]
					})
				]
			}, row.id);
		})
	})] });
}
//#endregion
export { RequestsPage as component };
