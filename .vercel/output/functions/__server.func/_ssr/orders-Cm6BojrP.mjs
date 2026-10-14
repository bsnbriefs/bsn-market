import { a as formatLagos, o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as listMyOrders } from "./commerce-D6xgnPlf.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { n as EmptyState } from "./ui-BLoIMfat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders-Cm6BojrP.js
var import_jsx_runtime = require_jsx_runtime();
function OrdersPage() {
	const { user, isPending } = useCurrentUserState();
	const orders = useQuery({
		queryKey: ["orders", user?.id],
		enabled: Boolean(user),
		queryFn: () => listMyOrders()
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Your orders"
		}),
		orders.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "Loading orders…"
		}) : null,
		orders.data && orders.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No orders yet",
				body: "When you check out, the order will show here with its real payment status."
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-3",
			children: (orders.data ?? []).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/orders/$id",
				params: { id: order.id },
				className: "block rounded-2xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: order.reference
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm capitalize text-muted",
						children: order.status.replaceAll("_", " ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: order.total_kobo === null ? "Delivery quote pending" : formatNaira(Number(order.total_kobo))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: formatLagos(order.created_at)
					})
				]
			}) }, order.id))
		})
	] });
}
//#endregion
export { OrdersPage as component };
