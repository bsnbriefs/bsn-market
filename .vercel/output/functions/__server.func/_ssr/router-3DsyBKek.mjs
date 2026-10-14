import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { c as getSql, h as withTransaction } from "./money-eRJ-C_HK.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-DioXkgY1.mjs";
import { d as notifyUser, h as releaseOrderStock, l as markPaidRecord, o as eventKey, p as paystackSignatureValid } from "./notify-DZJIERaE.mjs";
import { a as require_react, i as require_jsx_runtime, n as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { Z as notFound, _ as Outlet, b as createRootRoute, f as Scripts, g as createRouter, p as HeadContent, v as lazyRouteComponent, w as useRouter, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-B2Izd0c7.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-CAdPWYKz.js
var getStorefront = createServerFn({ method: "GET" }).handler(createSsrRpc("274fb1155063942b58553271142e89d09c7e489c157c35d647c813b5d9dc2e21"));
function readShop(input) {
	const raw = input ?? {};
	const sort = typeof raw.sort === "string" ? raw.sort : "newest";
	const allowed = /* @__PURE__ */ new Set([
		"newest",
		"price_asc",
		"price_desc",
		"relevance"
	]);
	const page = Number(raw.page);
	return {
		q: typeof raw.q === "string" ? raw.q.slice(0, 80) : "",
		category: typeof raw.category === "string" ? raw.category.slice(0, 40) : "",
		retailer: typeof raw.retailer === "string" ? raw.retailer.slice(0, 40) : "",
		brand: typeof raw.brand === "string" ? raw.brand.slice(0, 60) : "",
		state: typeof raw.state === "string" ? raw.state.slice(0, 40) : "",
		min: typeof raw.min === "string" ? raw.min.slice(0, 12) : "",
		max: typeof raw.max === "string" ? raw.max.slice(0, 12) : "",
		sort: allowed.has(sort) ? sort : "newest",
		page: Number.isInteger(page) && page > 0 ? Math.min(page, 100) : 1
	};
}
var searchProducts = createServerFn({ method: "GET" }).validator((input) => readShop(input)).handler(createSsrRpc("312bcaa3bdb930d2631f3014e3cf38cc8759996cf82d7ad1d38f85e88867af60"));
var getProduct = createServerFn({ method: "GET" }).validator((slug) => typeof slug === "string" ? slug.slice(0, 80) : "").handler(createSsrRpc("977c115b08ed02e57127eebe8cef273a472b888bbef0931bda7481f2a8806c26"));
var getPolicy = createServerFn({ method: "GET" }).validator((slug) => typeof slug === "string" ? slug.slice(0, 40) : "").handler(createSsrRpc("abb24bcf3a32ac8d43bc4852e5e5fe387c9bc8c68295f8ed95c6ce2d5436b05b"));
createServerFn({ method: "GET" }).handler(createSsrRpc("cfe8bf2b9e1408ff638e4059d331a7273f7302ef9b4d292f8594c872b7fa096b"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-3DsyBKek.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-DB5ZdrsI.css";
var Route$32 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "BSN Market" },
			{
				name: "description",
				content: "BSN Market is a multi-vendor marketplace. Your Market. Your Choice. Delivered."
			},
			{
				name: "theme-color",
				content: "#0C6B4D"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,650&family=Outfit:wght@400;500;600;700&display=swap"
			}
		]
	}),
	component: Root
});
function Root() {
	const [queryClient] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		retry: false,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
				client: queryClient,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { position: "top-center" })]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
var $$splitComponentImporter$27 = () => import("../_store-Ca9h3hZf.mjs");
var Route$31 = createFileRoute("/_store")({ component: lazyRouteComponent($$splitComponentImporter$27, "component") });
var $$splitComponentImporter$26 = () => import("./route-DUlKyVbC.mjs");
var Route$30 = createFileRoute("/admin")({ component: lazyRouteComponent($$splitComponentImporter$26, "component") });
var $$splitComponentImporter$25 = () => import("./login-DQE76fPp.mjs");
var Route$29 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign in · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./route-CPfYWO8U.mjs");
var Route$28 = createFileRoute("/retailer")({ component: lazyRouteComponent($$splitComponentImporter$24, "component") });
var Route$27 = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => new Response([
	"User-agent: *",
	"Allow: /",
	"Disallow: /account",
	"Disallow: /checkout",
	"Disallow: /cart",
	"Disallow: /orders",
	"Disallow: /admin",
	"Disallow: /retailer",
	"Disallow: /login"
].join("\n"), { headers: { "content-type": "text/plain" } }) } } });
var Route$26 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async ({ request }) => {
	const { listSitemapPaths } = await import("./sitemap.server-BB0Ibeld.mjs");
	const origin = new URL(request.url).origin;
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${(await listSitemapPaths()).map((path) => `<url><loc>${origin}${path}</loc></url>`).join("\n")}\n</urlset>`;
	return new Response(body, { headers: { "content-type": "application/xml" } });
} } } });
var $$splitComponentImporter$23 = () => import("../_store-DfGzToHb.mjs");
var Route$25 = createFileRoute("/_store/")({
	loader: () => getStorefront(),
	head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.storeName ?? "BSN Market"} · Shop` }, {
		name: "description",
		content: loaderData?.tagline ?? "Your Market. Your Choice. Delivered."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./account-B0y2op7l.mjs");
var Route$24 = createFileRoute("/_store/account")({
	head: () => ({ meta: [{ title: "Account · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./cart-BqJBvq8x.mjs");
var Route$23 = createFileRoute("/_store/cart")({
	head: () => ({ meta: [{ title: "Cart · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./checkout-ACAGWr5w.mjs");
var Route$22 = createFileRoute("/_store/checkout")({
	head: () => ({ meta: [{ title: "Checkout · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./request-DuZaD4WT.mjs");
var Route$21 = createFileRoute("/_store/request")({
	head: () => ({ meta: [{ title: "Request a product · BSN Market" }, {
		name: "description",
		content: "Ask BSN Market to source a product that is not listed. A request is not an order."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./shop-BjSZifDi.mjs");
var Route$20 = createFileRoute("/_store/shop")({
	validateSearch: (search) => ({
		q: typeof search.q === "string" ? search.q : "",
		category: typeof search.category === "string" ? search.category : "",
		retailer: typeof search.retailer === "string" ? search.retailer : "",
		brand: typeof search.brand === "string" ? search.brand : "",
		state: typeof search.state === "string" ? search.state : "",
		min: typeof search.min === "string" ? search.min : "",
		max: typeof search.max === "string" ? search.max : "",
		sort: typeof search.sort === "string" ? search.sort : "newest",
		page: Number(search.page) > 0 ? Number(search.page) : 1
	}),
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => searchProducts({ data: deps }),
	head: ({ match }) => ({ meta: [{ title: match.search.q ? `Search “${match.search.q}” · BSN Market` : "Shop · BSN Market" }, {
		name: "description",
		content: "Browse approved products from active retailers on BSN Market."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./support-BA-_Pvbc.mjs");
var Route$19 = createFileRoute("/_store/support")({
	loader: () => getStorefront(),
	head: () => ({ meta: [{ title: "Support · BSN Market" }, {
		name: "description",
		content: "Contact BSN Market support."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./admin-VE3nJAZq.mjs");
var Route$18 = createFileRoute("/admin/")({
	head: () => ({ meta: [{ title: "Admin · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./commission-CjrkfVqx.mjs");
var Route$17 = createFileRoute("/admin/commission")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./orders-CCmlNtq_.mjs");
var Route$16 = createFileRoute("/admin/orders")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./products-B7K6EP3f.mjs");
var Route$15 = createFileRoute("/admin/products")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./requests-BvAizNUT.mjs");
var Route$14 = createFileRoute("/admin/requests")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./retailers-CnBScoig.mjs");
var Route$13 = createFileRoute("/admin/retailers")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./settings-tb3MmDpC.mjs");
var Route$12 = createFileRoute("/admin/settings")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./support-C-cvg7Q0.mjs");
var Route$11 = createFileRoute("/admin/support")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./retailer-e_Wnk8Qz.mjs");
var Route$10 = createFileRoute("/retailer/")({
	head: () => ({ meta: [{ title: "Retailer · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./apply-6Lsl3tyg.mjs");
var Route$9 = createFileRoute("/retailer/apply")({
	head: () => ({ meta: [{ title: "Apply to sell · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./earnings-CHXspyK_.mjs");
var Route$8 = createFileRoute("/retailer/earnings")({
	head: () => ({ meta: [{ title: "Earnings · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./orders-CtEf91wh.mjs");
var Route$7 = createFileRoute("/retailer/orders")({
	head: () => ({ meta: [{ title: "Fulfilment · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./products-lUJnA2hZ.mjs");
var Route$6 = createFileRoute("/retailer/products")({
	head: () => ({ meta: [{ title: "Products · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./orders-Cm6BojrP.mjs");
var Route$5 = createFileRoute("/_store/orders/")({
	head: () => ({ meta: [{ title: "Orders · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("../_id-D4y3yylJ.mjs");
var Route$4 = createFileRoute("/_store/orders/$id")({
	head: () => ({ meta: [{ title: "Order · BSN Market" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("../_slug-BND91XRg.mjs");
var Route$3 = createFileRoute("/_store/policies/$slug")({
	loader: ({ params }) => getPolicy({ data: params.slug }),
	head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Policy"} · BSN Market` }, {
		name: "description",
		content: loaderData?.body.slice(0, 150) ?? "Marketplace policy"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_slug-3itNJ0rM.mjs");
var Route$2 = createFileRoute("/_store/product/$slug")({
	loader: async ({ params }) => {
		const product = await getProduct({ data: params.slug });
		if (!product) throw notFound();
		return product;
	},
	head: ({ loaderData }) => ({
		meta: loaderData ? [{ title: `${loaderData.name} · BSN Market` }, {
			name: "description",
			content: loaderData.description.slice(0, 160)
		}] : [{ title: "Product · BSN Market" }],
		scripts: loaderData ? [{
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Product",
				name: loaderData.name,
				description: loaderData.description,
				image: loaderData.images,
				brand: loaderData.brand || void 0,
				offers: {
					"@type": "Offer",
					priceCurrency: "NGN",
					price: (loaderData.priceKobo / 100).toFixed(2),
					availability: loaderData.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
				}
			}).replace(/</g, "\\u003c")
		}] : []
	}),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route$1 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var Route = createFileRoute("/api/paystack/webhook")({ server: { handlers: { POST: async ({ request }) => handle(request) } } });
async function handle(request) {
	const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "";
	const raw = await request.text();
	if (!paystackSignatureValid(raw, request.headers.get("x-paystack-signature"), secret)) return Response.json({
		ok: false,
		error: "Invalid signature"
	}, { status: 401 });
	const id = eventKey(raw);
	const sql = await getSql();
	try {
		await sql`insert into payment_events (id) values (${id})`;
	} catch {
		return Response.json({
			ok: true,
			duplicate: true
		});
	}
	let payload = {};
	try {
		payload = JSON.parse(raw);
	} catch {
		return Response.json({
			ok: false,
			error: "Invalid JSON"
		}, { status: 400 });
	}
	const reference = payload.data?.reference;
	if (!reference) return Response.json({
		ok: true,
		ignored: true
	});
	const { verifyPaystack } = await import("./paystack.server-CsLVe7XK.mjs");
	const verified = await verifyPaystack(reference);
	if (!verified) return Response.json({
		ok: false,
		error: "Could not verify with Paystack"
	}, { status: 400 });
	if (verified.status === "success") {
		try {
			const result = await withTransaction((tx) => markPaidRecord(tx, {
				reference,
				paidKobo: Number(verified.amount),
				currency: verified.currency ?? "",
				providerStatus: "success"
			}));
			if (!result.duplicate) {
				const buyers = await sql`select user_id from orders where id = ${result.orderId}`;
				if (buyers[0]) await notifyUser(sql, {
					userId: buyers[0].user_id,
					title: "Payment confirmed",
					body: `${reference} was verified with Paystack.`,
					href: `/orders/${result.orderId}`
				});
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Payment was not applied";
			return Response.json({
				ok: false,
				error: message
			}, { status: 400 });
		}
		return Response.json({ ok: true });
	}
	if (verified.status === "failed" || payload.event === "charge.failed") await withTransaction(async (tx) => {
		const payment = (await tx`
        select order_id, status from payments where reference = ${reference} for update`)[0];
		if (!payment || payment.status === "success") return;
		await tx`update payments set status = 'failed', failure_reason = ${verified.status ?? "failed"} where reference = ${reference}`;
		if ((await tx`select status from orders where id = ${payment.order_id} for update`)[0]?.status === "pending_payment") {
			await releaseOrderStock(tx, payment.order_id);
			await tx`update orders set status = 'payment_failed' where id = ${payment.order_id}`;
		}
	});
	return Response.json({ ok: true });
}
var StoreRoute = Route$31.update({
	id: "/_store",
	getParentRoute: () => Route$32
});
var AdminRouteRoute = Route$30.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$32
});
var LoginRoute = Route$29.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$32
});
var RetailerRouteRoute = Route$28.update({
	id: "/retailer",
	path: "/retailer",
	getParentRoute: () => Route$32
});
var RobotsDottxtRoute = Route$27.update({
	id: "/robots.txt",
	path: "/robots.txt",
	getParentRoute: () => Route$32
});
var SitemapDotxmlRoute = Route$26.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$32
});
var StoreIndexRoute = Route$25.update({
	id: "/",
	path: "/",
	getParentRoute: () => StoreRoute
});
var StoreAccountRoute = Route$24.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => StoreRoute
});
var StoreCartRoute = Route$23.update({
	id: "/cart",
	path: "/cart",
	getParentRoute: () => StoreRoute
});
var StoreCheckoutRoute = Route$22.update({
	id: "/checkout",
	path: "/checkout",
	getParentRoute: () => StoreRoute
});
var StoreRequestRoute = Route$21.update({
	id: "/request",
	path: "/request",
	getParentRoute: () => StoreRoute
});
var StoreShopRoute = Route$20.update({
	id: "/shop",
	path: "/shop",
	getParentRoute: () => StoreRoute
});
var StoreSupportRoute = Route$19.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => StoreRoute
});
var AdminIndexRoute = Route$18.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminRouteRoute
});
var AdminCommissionRoute = Route$17.update({
	id: "/commission",
	path: "/commission",
	getParentRoute: () => AdminRouteRoute
});
var AdminOrdersRoute = Route$16.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => AdminRouteRoute
});
var AdminProductsRoute = Route$15.update({
	id: "/products",
	path: "/products",
	getParentRoute: () => AdminRouteRoute
});
var AdminRequestsRoute = Route$14.update({
	id: "/requests",
	path: "/requests",
	getParentRoute: () => AdminRouteRoute
});
var AdminRetailersRoute = Route$13.update({
	id: "/retailers",
	path: "/retailers",
	getParentRoute: () => AdminRouteRoute
});
var AdminSettingsRoute = Route$12.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AdminRouteRoute
});
var AdminSupportRoute = Route$11.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => AdminRouteRoute
});
var RetailerIndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => RetailerRouteRoute
});
var RetailerApplyRoute = Route$9.update({
	id: "/apply",
	path: "/apply",
	getParentRoute: () => RetailerRouteRoute
});
var RetailerEarningsRoute = Route$8.update({
	id: "/earnings",
	path: "/earnings",
	getParentRoute: () => RetailerRouteRoute
});
var RetailerOrdersRoute = Route$7.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => RetailerRouteRoute
});
var RetailerProductsRoute = Route$6.update({
	id: "/products",
	path: "/products",
	getParentRoute: () => RetailerRouteRoute
});
var StoreOrdersIndexRoute = Route$5.update({
	id: "/orders/",
	path: "/orders/",
	getParentRoute: () => StoreRoute
});
var StoreOrdersIdRoute = Route$4.update({
	id: "/orders/$id",
	path: "/orders/$id",
	getParentRoute: () => StoreRoute
});
var StorePoliciesSlugRoute = Route$3.update({
	id: "/policies/$slug",
	path: "/policies/$slug",
	getParentRoute: () => StoreRoute
});
var StoreProductSlugRoute = Route$2.update({
	id: "/product/$slug",
	path: "/product/$slug",
	getParentRoute: () => StoreRoute
});
var ApiAuthSplatRoute = Route$1.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$32
});
var ApiPaystackWebhookRoute = Route.update({
	id: "/api/paystack/webhook",
	path: "/api/paystack/webhook",
	getParentRoute: () => Route$32
});
var AdminRouteRouteChildren = {
	AdminCommissionRoute,
	AdminOrdersRoute,
	AdminProductsRoute,
	AdminRequestsRoute,
	AdminRetailersRoute,
	AdminSettingsRoute,
	AdminSupportRoute,
	AdminIndexRoute
};
var AdminRouteRouteWithChildren = AdminRouteRoute._addFileChildren(AdminRouteRouteChildren);
var RetailerRouteRouteChildren = {
	RetailerApplyRoute,
	RetailerEarningsRoute,
	RetailerOrdersRoute,
	RetailerProductsRoute,
	RetailerIndexRoute
};
var RetailerRouteRouteWithChildren = RetailerRouteRoute._addFileChildren(RetailerRouteRouteChildren);
var StoreRouteChildren = {
	StoreAccountRoute,
	StoreCartRoute,
	StoreCheckoutRoute,
	StoreRequestRoute,
	StoreShopRoute,
	StoreSupportRoute,
	StoreIndexRoute,
	StoreOrdersIdRoute,
	StorePoliciesSlugRoute,
	StoreProductSlugRoute,
	StoreOrdersIndexRoute
};
var rootRouteChildren = {
	AdminRouteRoute: AdminRouteRouteWithChildren,
	RetailerRouteRoute: RetailerRouteRouteWithChildren,
	StoreRoute: StoreRoute._addFileChildren(StoreRouteChildren),
	LoginRoute,
	RobotsDottxtRoute,
	SitemapDotxmlRoute,
	ApiAuthSplatRoute,
	ApiPaystackWebhookRoute
};
var routeTree = Route$32._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$19 as a, createSsrRpc as c, Route$4 as i, Route$2 as n, Route$20 as o, Route$3 as r, Route$25 as s, router_exports as t };
