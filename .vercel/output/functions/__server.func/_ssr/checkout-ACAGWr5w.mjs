import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as checkout, s as quoteCart } from "./commerce-D6xgnPlf.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { s as getMe } from "./account-DmIRgbiK.mjs";
import { c as errText, i as Money, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
import { t as useCartStore } from "./cart-Bh98bnz8.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-ACAGWr5w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CheckoutPage() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Checking your account…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutForm, {});
}
function CheckoutForm() {
	const items = useCartStore((state) => state.items);
	const clear = useCartStore((state) => state.clear);
	const navigate = useNavigate();
	const me = useQuery({
		queryKey: ["me"],
		queryFn: () => getMe()
	});
	const [stateName, setStateName] = (0, import_react.useState)("Lagos");
	const [city, setCity] = (0, import_react.useState)("");
	const [promo, setPromo] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const quote = useQuery({
		queryKey: [
			"quote",
			items,
			stateName,
			city,
			promo
		],
		queryFn: () => quoteCart({ data: {
			items,
			state: stateName,
			city,
			promoCode: promo
		} })
	});
	const address = me.data?.addresses.find((item) => item.is_default) ?? me.data?.addresses[0];
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		try {
			const key = sessionStorage.getItem("bsn-checkout-key") ?? crypto.randomUUID();
			sessionStorage.setItem("bsn-checkout-key", key);
			const result = await checkout({ data: {
				idempotencyKey: key,
				items,
				name: String(form.get("name") ?? ""),
				email: String(form.get("email") ?? ""),
				phone: String(form.get("phone") ?? ""),
				line: String(form.get("line") ?? ""),
				state: String(form.get("state") ?? ""),
				city: String(form.get("city") ?? ""),
				instructions: String(form.get("instructions") ?? ""),
				promoCode: promo
			} });
			sessionStorage.removeItem("bsn-checkout-key");
			clear();
			if (result.authorizationUrl) {
				window.location.href = result.authorizationUrl;
				return;
			}
			toast.success(result.paymentNote || "Order created");
			navigate({
				to: "/orders/$id",
				params: { id: result.orderId }
			});
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "grid gap-6 lg:grid-cols-[1fr_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Checkout"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "The server recalculates every price. Reaching this page does not mean you have paid."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "name",
					required: true,
					placeholder: "Recipient name",
					defaultValue: address?.recipient || me.data?.profile.fullName || "",
					"aria-label": "Recipient name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "email",
					type: "email",
					required: true,
					placeholder: "Email",
					defaultValue: me.data?.profile.email || "",
					"aria-label": "Email"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "phone",
					required: true,
					placeholder: "Phone",
					defaultValue: address?.phone || me.data?.profile.phone || "",
					"aria-label": "Phone"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "line",
					required: true,
					placeholder: "Delivery address",
					defaultValue: address?.line || "",
					"aria-label": "Delivery address"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						name: "state",
						value: stateName,
						onChange: (event) => setStateName(event.target.value),
						"aria-label": "State",
						className: "h-11 rounded-xl border border-border bg-surface px-3 text-base",
						children: NIGERIAN_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: state }, state))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "city",
						required: true,
						placeholder: "City or LGA",
						value: city,
						onChange: (event) => setCity(event.target.value),
						"aria-label": "City"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "instructions",
					placeholder: "Delivery instructions (optional)",
					"aria-label": "Delivery instructions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					value: promo,
					onChange: (event) => setPromo(event.target.value),
					placeholder: "Discount code (optional)",
					"aria-label": "Discount code"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "h-fit rounded-2xl border border-border bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Order"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2 text-sm",
					children: (quote.data?.lines ?? []).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							line.qty,
							" × ",
							line.name,
							line.variantLabel ? ` (${line.variantLabel})` : "",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: line.retailerName
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: line.lineKobo })]
					}, `${line.productId}-${line.variantId}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: quote.data?.subtotalKobo ?? 0 })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: quote.data?.discountKobo ?? 0 })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery" }), quote.data?.deliveryKobo === null || quote.data?.deliveryKobo === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Quote needed" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: quote.data.deliveryKobo })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 flex justify-between font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), quote.data?.totalKobo === null || quote.data?.totalKobo === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pending quote" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: quote.data.totalKobo })]
				}),
				(quote.data?.retailerIds.length ?? 0) > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted",
					children: [
						"This cart has ",
						quote.data?.retailerIds.length,
						" retailers. Each one fulfils separately, and delivery is charged per retailer where a fee exists."
					]
				}) : null,
				quote.data?.issues.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-danger",
					children: issue
				}, issue)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4 w-full",
					type: "submit",
					disabled: busy || items.length === 0,
					children: busy ? "Placing order…" : "Place order"
				})
			]
		})]
	});
}
//#endregion
export { CheckoutPage as component };
