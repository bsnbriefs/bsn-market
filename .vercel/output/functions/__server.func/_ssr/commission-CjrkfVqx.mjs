import { t as bpsToPercent } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
import { c as adminListRules, m as adminSaveRule, p as adminSavePromo } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/commission-CjrkfVqx.js
var import_jsx_runtime = require_jsx_runtime();
function CommissionPage() {
	const data = useQuery({
		queryKey: ["rules"],
		queryFn: () => adminListRules()
	});
	const queryClient = useQueryClient();
	async function saveRule(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		try {
			await adminSaveRule({ data: {
				scope: form.get("scope"),
				percent: form.get("percent"),
				categoryId: form.get("categoryId"),
				retailerId: form.get("retailerId"),
				effectiveFrom: form.get("effectiveFrom")
			} });
			toast.success("Rule saved. Old orders keep their original rate.");
			await queryClient.invalidateQueries({ queryKey: ["rules"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Commission"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Default starter rate is 10%. Retailers cannot change this. A new rule applies only to orders placed after its effective date."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 text-sm",
				children: (data.data?.rules ?? []).map((rule) => {
					const row = rule;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						row.scope,
						" · ",
						bpsToPercent(Number(row.bps)),
						"% from ",
						String(row.effective_from).slice(0, 10)
					] }, row.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: saveRule,
				className: "mt-3 grid gap-2 md:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "scope",
						"aria-label": "Scope",
						className: "h-11 rounded-xl border border-border bg-surface px-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "default",
								children: "Default"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "category",
								children: "Category"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "retailer",
								children: "Retailer"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "percent",
						required: true,
						placeholder: "Percent, e.g. 10",
						"aria-label": "Percent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "categoryId",
						"aria-label": "Category",
						className: "h-11 rounded-xl border border-border bg-surface px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Category if needed"
						}), (data.data?.categories ?? []).map((category) => {
							const row = category;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: row.id,
								children: row.name
							}, row.id);
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "retailerId",
						"aria-label": "Retailer",
						className: "h-11 rounded-xl border border-border bg-surface px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Retailer if needed"
						}), (data.data?.retailers ?? []).map((retailer) => {
							const row = retailer;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: row.id,
								children: row.business_name
							}, row.id);
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "effectiveFrom",
						type: "date",
						"aria-label": "Effective date"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						children: "Add rule"
					})
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-2",
			onSubmit: (event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				adminSavePromo({ data: {
					code: form.get("code"),
					percent: form.get("percent"),
					minNaira: form.get("minNaira")
				} }).then(() => toast.success("Code saved")).catch((error) => toast.error(errText(error)));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Discount code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "code",
					placeholder: "CODE",
					"aria-label": "Code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "percent",
					placeholder: "Percent off",
					"aria-label": "Percent off"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "minNaira",
					placeholder: "Minimum subtotal in naira",
					"aria-label": "Minimum"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "surface",
					children: "Save code"
				})
			]
		})]
	});
}
//#endregion
export { CommissionPage as component };
