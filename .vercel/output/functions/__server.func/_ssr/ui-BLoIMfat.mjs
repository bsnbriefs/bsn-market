import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-BLoIMfat.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...parts) {
	return parts.filter(Boolean).join(" ");
}
function Button({ variant = "primary", className, ...props }) {
	const look = {
		primary: "bg-primary text-primary-fg",
		surface: "border border-border bg-surface text-fg",
		ghost: "text-fg",
		danger: "bg-danger text-danger-fg"
	}[variant];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50", look, className),
		...props
	});
}
function Field(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		...props,
		className: cn("h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg outline-none", props.className)
	});
}
function TextArea(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		...props,
		className: cn("min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-fg outline-none", props.className)
	});
}
function Money({ kobo }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "tabular-nums",
		children: formatNaira(kobo)
	});
}
function EmptyState({ title, body, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl text-fg",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted",
				children: body
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			}) : null
		]
	});
}
function ProductCardView({ product }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/product/$slug",
		params: { slug: product.id },
		className: "group flex w-40 shrink-0 flex-col md:w-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-square overflow-hidden rounded-2xl bg-border",
				children: [product.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: product.imageUrl,
					alt: product.name,
					loading: "lazy",
					className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-full place-items-center text-sm text-muted",
					children: "No photo"
				}), product.stock < 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-2 rounded-full bg-fg px-2 py-1 text-xs text-surface",
					children: "Sold out"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 line-clamp-2 text-sm font-medium leading-snug",
				children: product.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: product.retailerCity
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: product.priceKobo }), product.compareAtKobo && product.compareAtKobo > product.priceKobo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-xs font-normal text-muted line-through",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { kobo: product.compareAtKobo })
				}) : null]
			})
		]
	});
}
function ProductRail({ title, products }) {
	if (products.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
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
				className: "text-sm font-semibold text-primary",
				children: "See all"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0",
			children: products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCardView, { product }, product.id))
		})]
	});
}
function errText(error) {
	if (error instanceof Error && error.message) return error.message;
	return "Something went wrong. Please try again.";
}
//#endregion
export { ProductCardView as a, errText as c, Money as i, EmptyState as n, ProductRail as o, Field as r, TextArea as s, Button as t };
