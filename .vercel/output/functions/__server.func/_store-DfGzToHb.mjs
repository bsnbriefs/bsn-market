import { i as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { _ as Baby, a as Sparkles, g as CookingPot, h as Dumbbell, l as Shirt, m as Headphones, o as Smartphone, s as ShoppingBasket, t as Wheat } from "./_libs/lucide-react.mjs";
import { s as Route$25 } from "./_ssr/router-3DsyBKek.mjs";
import { n as EmptyState, o as ProductRail } from "./_ssr/ui-BLoIMfat.mjs";
import { n as SearchForm } from "./_ssr/shell-x481ODGh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_store-DfGzToHb.js
var import_jsx_runtime = require_jsx_runtime();
var icons = {
	fashion: Shirt,
	beauty: Sparkles,
	home: CookingPot,
	groceries: Wheat,
	phones: Smartphone,
	electronics: Headphones,
	baby: Baby,
	sports: Dumbbell
};
function Home() {
	const data = Route$25.useLoaderData();
	const campaign = data.campaigns[0];
	const hasProducts = data.featured.length + data.newest.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold uppercase tracking-[0.16em] text-primary",
			children: "Barrister Street Network"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-4xl leading-tight md:text-5xl",
			children: data.tagline
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchForm, {})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1",
			children: data.categories.map((category) => {
				const Icon = icons[category.slug] ?? ShoppingBasket;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/shop",
					search: {
						q: "",
						category: category.slug,
						retailer: "",
						brand: "",
						state: "",
						min: "",
						max: "",
						sort: "newest",
						page: 1
					},
					className: "flex h-16 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-xs font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), category.name]
				}, category.slug);
			})
		}),
		campaign ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
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
			className: "mt-5 block overflow-hidden rounded-3xl border border-border bg-surface",
			children: [campaign.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: campaign.image_url,
				alt: "",
				className: "h-48 w-full object-cover md:h-72"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.14em] text-accent",
						children: "This week"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl",
						children: campaign.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xl text-sm text-muted",
						children: campaign.subtitle
					})
				]
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "Starter listings are sample stock so you can try the shop. They are not retailer partnerships. Approve real retailers before taking live orders."
		}),
		hasProducts ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductRail, {
				title: "Featured",
				products: data.featured
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductRail, {
				title: "Popular right now",
				products: data.trending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductRail, {
				title: "New arrivals",
				products: data.newest
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductRail, {
				title: "Special offers",
				products: data.offers
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "The market is quiet",
				body: "No approved products are live yet. Retailers can apply, and an administrator publishes listings.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/retailer/apply",
					className: "font-semibold text-primary",
					children: "Apply to sell"
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-10 grid gap-3 sm:grid-cols-3",
			children: [
				[
					"Delivery",
					"Fees only where an administrator has set them.",
					"/policies/delivery"
				],
				[
					"Returns",
					"Eligibility is shown on each product.",
					"/policies/returns"
				],
				[
					"Support",
					"Send a message from your account.",
					"/support"
				]
			].map(([title, body, href]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href,
				className: "rounded-2xl border border-border bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: body
				})]
			}, title))
		})
	] });
}
//#endregion
export { Home as component };
