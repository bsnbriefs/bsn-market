import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { C as useNavigate, m as useRouterState, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as ShoppingBag, d as Package, f as LayoutGrid, i as Store, n as UserRound, p as House, u as Search } from "../_libs/lucide-react.mjs";
import { a as getServerCart, u as syncCart } from "./commerce-D6xgnPlf.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as useCartStore } from "./cart-Bh98bnz8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-x481ODGh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		to: "/",
		label: "Home",
		icon: House
	},
	{
		to: "/shop",
		label: "Shop",
		icon: LayoutGrid
	},
	{
		to: "/cart",
		label: "Cart",
		icon: ShoppingBag
	},
	{
		to: "/orders",
		label: "Orders",
		icon: Package
	},
	{
		to: "/account",
		label: "Account",
		icon: UserRound
	}
];
function StoreShell({ children }) {
	const path = useRouterState({ select: (state) => state.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-6xl items-center gap-3 px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "shrink-0 leading-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl font-semibold",
								children: "BSN"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary",
								children: "Market"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden text-xs text-muted sm:block",
							children: "Nigeria · Naira"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto hidden items-center gap-4 text-sm font-medium md:flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
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
									children: "Shop"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/request",
									children: "Request"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/retailer",
									className: "inline-flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-4" }), " Sell"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									children: "Account"
								})
							]
						})
					]
				}), path !== "/" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-6xl px-4 pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchForm, {})
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartSync, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-6xl px-4 pb-24 pt-4 md:pb-12",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mx-auto grid max-w-lg grid-cols-5",
					children: tabs.map((tab) => {
						const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
						const Icon = tab.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: tab.to,
							className: `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), tab.to === "/cart" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartBadge, {}) : null]
							}), tab.label]
						}) }, tab.to);
					})
				})
			})
		]
	});
}
function CartBadge() {
	const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	if (!ready || count < 1) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg",
		children: count > 9 ? "9+" : count
	});
}
function SearchForm({ initial = "" }) {
	const navigate = useNavigate();
	const [q, setQ] = (0, import_react.useState)(initial);
	(0, import_react.useEffect)(() => setQ(initial), [initial]);
	function onSubmit(event) {
		event.preventDefault();
		navigate({
			to: "/shop",
			search: {
				q,
				category: "",
				retailer: "",
				brand: "",
				state: "",
				min: "",
				max: "",
				sort: "relevance",
				page: 1
			}
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "relative",
		role: "search",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value: q,
			onChange: (event) => setQ(event.target.value),
			placeholder: "Search products, brands, markets",
			"aria-label": "Search products",
			className: "h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none"
		})]
	});
}
function CartSync() {
	const { user } = useCurrentUserState();
	const items = useCartStore((state) => state.items);
	const replace = useCartStore((state) => state.replace);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		let cancel = false;
		getServerCart().then((server) => {
			if (cancel) return;
			const local = useCartStore.getState().items;
			if (local.length === 0 && server.length) replace(server);
			else if (local.length) syncCart({ data: { items: local } }).catch(() => void 0);
		}).catch(() => void 0).finally(() => {
			if (!cancel) setReady(true);
		});
		return () => {
			cancel = true;
		};
	}, [replace, user]);
	(0, import_react.useEffect)(() => {
		if (!user || !ready) return;
		const timer = setTimeout(() => {
			syncCart({ data: { items } }).catch(() => void 0);
		}, 400);
		return () => clearTimeout(timer);
	}, [
		items,
		ready,
		user
	]);
	return null;
}
function Desk({ title, links, children }) {
	const path = useRouterState({ select: (state) => state.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-surface",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "font-display text-lg font-semibold",
						children: "BSN Market"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex w-full gap-2 overflow-x-auto text-sm md:ml-auto md:w-auto",
						children: links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: link.to,
							className: `shrink-0 rounded-full px-3 py-2 ${path === link.to ? "bg-fg text-surface" : "text-muted"}`,
							children: link.label
						}, link.to))
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto max-w-6xl px-4 py-6",
			children
		})]
	});
}
//#endregion
export { SearchForm as n, StoreShell as r, Desk as t };
