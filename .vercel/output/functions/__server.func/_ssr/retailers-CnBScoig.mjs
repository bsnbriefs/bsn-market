import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
import { _ as adminSetRetailerStatus, s as adminListRetailers, t as adminCreateSettlement } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/retailers-CnBScoig.js
var import_jsx_runtime = require_jsx_runtime();
function RetailersPage() {
	const retailers = useQuery({
		queryKey: ["admin-retailers"],
		queryFn: () => adminListRetailers()
	});
	const queryClient = useQueryClient();
	async function setStatus(id, status) {
		const reason = window.prompt("Reason for the retailer") ?? "";
		try {
			await adminSetRetailerStatus({ data: {
				id,
				status,
				reason
			} });
			await queryClient.invalidateQueries({ queryKey: ["admin-retailers"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-3xl",
		children: "Retailers"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 space-y-3",
		children: (retailers.data ?? []).map((retailer) => {
			const row = retailer;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-semibold",
						children: [
							row.business_name,
							" ",
							row.is_sample ? "· sample catalogue" : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "capitalize text-muted",
						children: [
							row.status,
							" · ",
							row.city,
							", ",
							row.state
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: row.description }),
					row.review_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Last note: ", row.review_reason] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [
							"approved",
							"rejected",
							"suspended",
							"pending"
						].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-border px-3 capitalize",
							onClick: () => void setStatus(row.id, status),
							children: status
						}, status))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-2 flex gap-2",
						onSubmit: (event) => {
							event.preventDefault();
							const reference = String(new FormData(event.currentTarget).get("reference") ?? "");
							adminCreateSettlement({ data: {
								retailerId: row.id,
								reference,
								note: "Recorded by admin"
							} }).then((result) => toast.success(result.note)).catch((error) => toast.error(errText(error)));
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "reference",
							placeholder: "Settlement reference",
							"aria-label": "Settlement reference"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "surface",
							children: "Record settlement"
						})]
					})
				]
			}, row.id);
		})
	})] });
}
//#endregion
export { RetailersPage as component };
