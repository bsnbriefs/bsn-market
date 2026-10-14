import { o as __toESM } from "../_runtime.mjs";
import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { c as listMyRequests, r as createProductRequest } from "./account-DmIRgbiK.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/request-DuZaD4WT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RequestPage() {
	const { user, isPending } = useCurrentUserState();
	const requests = useQuery({
		queryKey: ["requests", user?.id],
		enabled: Boolean(user),
		queryFn: () => listMyRequests()
	});
	const queryClient = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		if (!user) return;
		const form = new FormData(event.currentTarget);
		setBusy(true);
		try {
			const result = await createProductRequest({ data: {
				name: form.get("name"),
				description: form.get("description"),
				category: form.get("category"),
				brand: form.get("brand"),
				budgetMin: form.get("budgetMin"),
				budgetMax: form.get("budgetMax"),
				state: form.get("state"),
				city: form.get("city"),
				contactPreference: form.get("contact")
			} });
			toast.success(`Request ${result.reference} received. This is not an order.`);
			event.currentTarget.reset();
			await queryClient.invalidateQueries({ queryKey: ["requests"] });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Request a product"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "If it is not in the shop, ask for it. An administrator can look for a retailer and send a quotation. You only buy if you later accept a real listing and pay."
			}),
			isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm",
				children: "Loading…"
			}) : null,
			!isPending && !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {}) : null,
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "mt-4 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "name",
						required: true,
						placeholder: "Product name",
						"aria-label": "Product name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						name: "description",
						placeholder: "Description",
						"aria-label": "Description"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "category",
						placeholder: "Category",
						"aria-label": "Category"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "brand",
						placeholder: "Preferred brand or model",
						"aria-label": "Brand"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "budgetMin",
							inputMode: "decimal",
							placeholder: "Budget from ₦",
							"aria-label": "Minimum budget"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "budgetMax",
							inputMode: "decimal",
							placeholder: "Budget to ₦",
							"aria-label": "Maximum budget"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						name: "state",
						"aria-label": "State",
						className: "h-11 w-full rounded-xl border border-border bg-surface px-3",
						defaultValue: "Lagos",
						children: NIGERIAN_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: state }, state))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "city",
						placeholder: "City",
						"aria-label": "City"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "contact",
						"aria-label": "Contact preference",
						className: "h-11 w-full rounded-xl border border-border bg-surface px-3",
						defaultValue: "in_app",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "in_app",
								children: "Contact me in the app"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "phone",
								children: "Phone"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "email",
								children: "Email"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy,
						children: "Submit request"
					})
				]
			}) : null
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Your requests"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-2 text-sm",
			children: (requests.data ?? []).map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: request.reference
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: request.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "capitalize text-muted",
						children: request.status.replaceAll("_", " ")
					}),
					request.quotation_kobo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Quotation ",
						formatNaira(Number(request.quotation_kobo)),
						". ",
						request.quotation_note
					] }) : null
				]
			}, request.reference))
		})] })]
	});
}
//#endregion
export { RequestPage as component };
