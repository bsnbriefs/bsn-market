import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { C as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as quoteCart } from "./commerce-D6xgnPlf.mjs";
import { i as Money, n as EmptyState, t as Button } from "./ui-BLoIMfat.mjs";
import { t as useCartStore } from "./cart-Bh98bnz8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-BqJBvq8x.js
var import_jsx_runtime = require_jsx_runtime();
function CartPage() {
	const items = useCartStore((state) => state.items);
	const setQty = useCartStore((state) => state.setQty);
	const remove = useCartStore((state) => state.remove);
	const navigate = useNavigate();
	const quote = useQuery({
		queryKey: ["quote", items],
		queryFn: () => quoteCart({ data: {
			items,
			state: "",
			city: "",
			promoCode: ""
		} })
	});
	const lines = quote.data?.lines ?? [];
	const byRetailer = /* @__PURE__ */ new Map();
	for (const line of lines) {
		const list = byRetailer.get(line.retailerName) ?? [];
		list.push(line);
		byRetailer.set(line.retailerName, list);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-3xl",
		children: "Cart"
	}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "Your cart is empty",
			body: "Browse the shop and add something you actually want.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/shop",
				search: {
					q: "",
					category: "",
					retailer: "",
					brand: "",
					state: "",
					min: "",
					max: "",
					sort: "newest",
					page: 1
				},
				className: "font-semibold text-primary",
				children: "Start shopping"
			})
		})
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 grid gap-4 lg:grid-cols-[1fr_280px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				quote.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Checking live prices and stock…"
				}) : null,
				quote.data?.issues.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl bg-danger px-3 py-2 text-sm text-danger-fg",
					children: issue
				}, issue)),
				[...byRetailer.entries()].map(([retailer, group]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-sm font-semibold",
							children: ["Fulfilled by ", retailer]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Ships separately from other retailers."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-3",
							children: group.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/product/$slug",
										params: { slug: line.productId },
										className: "font-medium",
										children: line.name
									}),
									line.variantLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: line.variantLabel
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: line.unitKobo })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-xs text-muted",
												htmlFor: `q-${line.productId}`,
												children: "Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: `q-${line.productId}`,
												type: "number",
												min: 1,
												max: 10,
												value: line.qty,
												onChange: (event) => setQty(line.productId, line.variantId, Math.min(10, Math.max(0, Number(event.target.value) || 0))),
												className: "h-11 w-16 rounded-xl border border-border px-2 text-base"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "text-sm text-danger",
												onClick: () => remove(line.productId, line.variantId),
												children: "Remove"
											})
										]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: line.lineKobo })
								})]
							}, `${line.productId}-${line.variantId}`))
						})
					]
				}, retailer))
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "h-fit rounded-2xl border border-border bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Estimate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: quote.data?.subtotalKobo ?? 0 })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "Delivery is calculated at checkout from your state. Prices above come from the database, not from this page."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4 w-full",
					type: "button",
					onClick: () => void navigate({ to: "/checkout" }),
					children: "Checkout"
				})
			]
		})]
	})] });
}
//#endregion
export { CartPage as component };
