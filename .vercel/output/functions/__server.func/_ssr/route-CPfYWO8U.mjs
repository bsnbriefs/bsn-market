import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { t as Desk } from "./shell-x481ODGh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-CPfYWO8U.js
var import_jsx_runtime = require_jsx_runtime();
var links = [
	{
		to: "/retailer",
		label: "Overview"
	},
	{
		to: "/retailer/products",
		label: "Products"
	},
	{
		to: "/retailer/orders",
		label: "Orders"
	},
	{
		to: "/retailer/earnings",
		label: "Earnings"
	},
	{
		to: "/retailer/apply",
		label: "Application"
	}
];
function RetailerLayout() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-6 text-sm",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {
		title: "Retailer",
		links,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
//#endregion
export { RetailerLayout as component };
