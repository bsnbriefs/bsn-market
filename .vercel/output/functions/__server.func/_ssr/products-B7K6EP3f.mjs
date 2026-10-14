import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText } from "./ui-BLoIMfat.mjs";
import { a as adminListProducts, u as adminModerateProduct } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/products-B7K6EP3f.js
var import_jsx_runtime = require_jsx_runtime();
function AdminProducts() {
	const products = useQuery({
		queryKey: ["admin-products"],
		queryFn: () => adminListProducts()
	});
	const queryClient = useQueryClient();
	async function moderate(id, status, featured) {
		const reason = status === "rejected" ? window.prompt("Why is this rejected?") ?? "" : "";
		try {
			await adminModerateProduct({ data: {
				id,
				status,
				reason,
				featured
			} });
			await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-3xl",
		children: "Product moderation"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 space-y-3 text-sm",
		children: (products.data ?? []).map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-2xl border border-border bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: product.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted",
					children: [
						product.business_name,
						" · ",
						product.status,
						" · ",
						formatNaira(Number(product.price_kobo)),
						" · stock ",
						product.stock,
						product.featured ? " · featured" : ""
					]
				}),
				product.moderation_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: product.moderation_reason }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full bg-primary px-3 text-primary-fg",
							onClick: () => void moderate(product.id, "approved", product.featured),
							children: "Approve"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-border px-3",
							onClick: () => void moderate(product.id, "rejected", false),
							children: "Reject"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-border px-3",
							onClick: () => void moderate(product.id, "archived", false),
							children: "Remove"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-border px-3",
							onClick: () => void moderate(product.id, product.status, !product.featured),
							children: product.featured ? "Unfeature" : "Feature"
						})
					]
				})
			]
		}, product.id))
	})] });
}
//#endregion
export { AdminProducts as component };
