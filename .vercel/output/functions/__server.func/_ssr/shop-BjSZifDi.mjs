import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as Route$20 } from "./router-3DsyBKek.mjs";
import { a as ProductCardView, n as EmptyState } from "./ui-BLoIMfat.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-BjSZifDi.js
var import_jsx_runtime = require_jsx_runtime();
var empty = {
	q: "",
	category: "",
	retailer: "",
	brand: "",
	state: "",
	min: "",
	max: "",
	sort: "newest",
	page: 1
};
function ShopPage() {
	const search = Route$20.useSearch();
	const data = Route$20.useLoaderData();
	const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: search.category ? data.categories.find((c) => c.slug === search.category)?.name ?? "Shop" : "Shop"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				data.total,
				" approved ",
				data.total === 1 ? "product" : "products"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 grid gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4",
			action: "/shop",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "q",
					defaultValue: search.q,
					placeholder: "Search",
					"aria-label": "Search",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "category",
					defaultValue: search.category,
					"aria-label": "Category",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "All categories"
					}), data.categories.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: category.slug,
						children: category.name
					}, category.slug))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "retailer",
					defaultValue: search.retailer,
					"aria-label": "Retailer",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "All retailers"
					}), data.retailers.map((retailer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: retailer.id,
						children: retailer.name
					}, retailer.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "brand",
					defaultValue: search.brand,
					"aria-label": "Brand",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "All brands"
					}), data.brands.map((brand) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: brand,
						children: brand
					}, brand))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "state",
					defaultValue: search.state,
					"aria-label": "Fulfilled from",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Fulfilled from anywhere"
					}), NIGERIAN_STATES.filter((state) => data.states.includes(state)).map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: state,
						children: state
					}, state))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "min",
					defaultValue: search.min,
					inputMode: "decimal",
					placeholder: "Min ₦",
					"aria-label": "Minimum price in naira",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "max",
					defaultValue: search.max,
					inputMode: "decimal",
					placeholder: "Max ₦",
					"aria-label": "Maximum price in naira",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "sort",
					defaultValue: search.sort,
					"aria-label": "Sort",
					className: "h-11 rounded-xl border border-border bg-bg px-3 text-base",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "newest",
							children: "Newest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "relevance",
							children: "Relevance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "price_asc",
							children: "Price: low to high"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "price_desc",
							children: "Price: high to low"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg sm:col-span-2 lg:col-span-1",
					type: "submit",
					children: "Apply filters"
				})
			]
		}),
		data.products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "Nothing matches",
				body: "Try another word, or clear the filters. Only approved products from active retailers are shown.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/shop",
					search: empty,
					className: "font-semibold text-primary",
					children: "Clear filters"
				})
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5 grid grid-cols-2 gap-3 md:grid-cols-4",
			children: data.products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCardView, { product }, product.id))
		}),
		pages > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex gap-2",
			children: [
				search.page > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/shop",
					search: {
						...search,
						page: search.page - 1
					},
					className: "rounded-full border border-border bg-surface px-4 py-2 text-sm",
					children: "Previous"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "px-2 py-2 text-sm text-muted",
					children: [
						"Page ",
						search.page,
						" of ",
						pages
					]
				}),
				search.page < pages ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/shop",
					search: {
						...search,
						page: search.page + 1
					},
					className: "rounded-full border border-border bg-surface px-4 py-2 text-sm",
					children: "Next"
				}) : null
			]
		}) : null
	] });
}
//#endregion
export { ShopPage as component };
