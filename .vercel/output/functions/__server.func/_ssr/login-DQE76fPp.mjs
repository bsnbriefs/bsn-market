import { o as __toESM } from "../_runtime.mjs";
import { t as GROK_PROVIDERS } from "./server-DioXkgY1.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as signIn, t as authClient } from "./client-IWHfIGH2.mjs";
import { c as errText, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DQE76fPp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("in");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const email = String(form.get("email") ?? "");
		const password = String(form.get("password") ?? "");
		const name = String(form.get("name") ?? "Customer");
		setBusy(true);
		try {
			if (mode === "up") {
				const result = await authClient.signUp.email({
					email,
					password,
					name,
					callbackURL: "/account"
				});
				if (result.error) throw new Error(result.error.message ?? "Could not create the account");
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
					callbackURL: "/account"
				});
				if (result.error) throw new Error(result.error.message ?? "Could not sign in");
			}
			navigate({ to: "/account" });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl",
				children: "BSN Market"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-lg font-semibold",
				children: mode === "in" ? "Sign in" : "Create an account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "You can browse without an account. Sign in before you place an order."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "mt-5 space-y-2",
				children: [
					mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "name",
						required: true,
						placeholder: "Your name",
						"aria-label": "Name"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "email",
						type: "email",
						required: true,
						placeholder: "Email",
						"aria-label": "Email",
						autoComplete: "email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "password",
						type: "password",
						required: true,
						minLength: 8,
						placeholder: "Password",
						"aria-label": "Password",
						autoComplete: mode === "up" ? "new-password" : "current-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						type: "submit",
						disabled: busy,
						children: busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm font-semibold text-primary",
						onClick: () => setMode(mode === "in" ? "up" : "in"),
						children: mode === "in" ? "Need an account? Create one" : "Already registered? Sign in"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-2",
				children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "surface",
					className: "w-full",
					type: "button",
					onClick: () => void signIn(provider.providerId, { callbackURL: "/account" }),
					children: ["Continue with ", provider.label]
				}, provider.providerId))
			})
		]
	});
}
//#endregion
export { LoginPage as component };
