import { i as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { Z as notFound } from "./_libs/@tanstack/react-router+[...].mjs";
import { r as Route$3 } from "./_ssr/router-3DsyBKek.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-BND91XRg.js
var import_jsx_runtime = require_jsx_runtime();
function PolicyPage() {
	const policy = Route$3.useLoaderData();
	if (!policy) throw notFound();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "max-w-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl",
			children: policy.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-3 text-sm leading-6",
			children: policy.body.split("\n").filter((line) => line.trim()).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line }, line.slice(0, 40)))
		})]
	});
}
//#endregion
export { PolicyPage as component };
