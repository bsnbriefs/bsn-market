import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as applyRetailer } from "./account-DmIRgbiK.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/apply-6Lsl3tyg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApplyPage() {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		try {
			await applyRetailer({ data: {
				businessName: form.get("businessName"),
				contactName: form.get("contactName"),
				email: form.get("email"),
				phone: form.get("phone"),
				address: form.get("address"),
				state: form.get("state"),
				city: form.get("city"),
				categories: form.get("categories"),
				description: form.get("description"),
				catalogueNote: form.get("catalogueNote"),
				registrationNumber: form.get("registrationNumber"),
				termsAccepted: form.get("terms") === "on"
			} });
			setDone(true);
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Application received"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm",
			children: "An administrator reviews new retailers. You cannot publish products or receive live orders until you are approved."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/retailer",
			className: "mt-3 inline-block font-semibold text-primary",
			children: "Go to the desk"
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "max-w-xl space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Retailer application"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Signing in is not the same as being approved. Read the ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "retailer-agreement" },
						className: "text-primary",
						children: "retailer agreement"
					}),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "businessName",
				required: true,
				placeholder: "Business name",
				"aria-label": "Business name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "contactName",
				required: true,
				placeholder: "Contact person",
				"aria-label": "Contact person"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "email",
				type: "email",
				placeholder: "Business email",
				"aria-label": "Business email"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "phone",
				required: true,
				placeholder: "Phone",
				"aria-label": "Phone"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "address",
				required: true,
				placeholder: "Business address",
				"aria-label": "Address"
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
				required: true,
				placeholder: "City",
				"aria-label": "City"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "categories",
				placeholder: "Product categories you sell",
				"aria-label": "Categories"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
				name: "description",
				placeholder: "About the business",
				"aria-label": "Description"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
				name: "catalogueNote",
				placeholder: "What you plan to list",
				"aria-label": "Catalogue"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "registrationNumber",
				placeholder: "Registration number (optional)",
				"aria-label": "Registration number"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-start gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "terms",
					type: "checkbox",
					required: true,
					className: "mt-1"
				}), " I agree to the marketplace terms and retailer agreement."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				disabled: busy,
				children: "Submit application"
			})
		]
	});
}
//#endregion
export { ApplyPage as component };
