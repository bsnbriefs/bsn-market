import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { s as getMe } from "./account-DmIRgbiK.mjs";
import { t as Desk } from "./shell-x481ODGh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-DUlKyVbC.js
var import_jsx_runtime = require_jsx_runtime();
var links = [
	{
		to: "/admin",
		label: "Overview"
	},
	{
		to: "/admin/retailers",
		label: "Retailers"
	},
	{
		to: "/admin/products",
		label: "Products"
	},
	{
		to: "/admin/orders",
		label: "Orders"
	},
	{
		to: "/admin/commission",
		label: "Commission"
	},
	{
		to: "/admin/requests",
		label: "Requests"
	},
	{
		to: "/admin/support",
		label: "Support"
	},
	{
		to: "/admin/settings",
		label: "Settings"
	}
];
function AdminLayout() {
	const { user, isPending } = useCurrentUserState();
	const me = useQuery({
		queryKey: ["me", user?.id],
		enabled: Boolean(user),
		queryFn: () => getMe()
	});
	if (isPending || me.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-6 text-sm",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!me.data?.roles.includes("admin")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-6",
		children: "This desk is only for marketplace administrators. If nobody has claimed it yet, do that from Account."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {
		title: "Admin",
		links,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
//#endregion
export { AdminLayout as component };
