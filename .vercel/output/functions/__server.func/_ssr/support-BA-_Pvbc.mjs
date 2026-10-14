import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Route$19 } from "./router-3DsyBKek.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { a as createTicket, l as listMyTickets } from "./account-DmIRgbiK.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support-BA-_Pvbc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SupportPage() {
	const store = Route$19.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const tickets = useQuery({
		queryKey: ["tickets", user?.id],
		enabled: Boolean(user),
		queryFn: () => listMyTickets()
	});
	const queryClient = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		try {
			await createTicket({ data: {
				subject: form.get("subject"),
				body: form.get("body")
			} });
			toast.success("Message sent to the marketplace team");
			event.currentTarget.reset();
			await queryClient.invalidateQueries({ queryKey: ["tickets"] });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Customer support"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "BSN Market connects you with retailers. The retailer supplies the product. Use this form for marketplace help."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 space-y-1 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: store.supportEmail || "Not set yet. An administrator can add it." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Phone"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: store.supportPhone || "Not set yet." })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-4 space-y-1 text-sm font-semibold text-primary",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "terms" },
						children: "Terms"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "privacy" },
						children: "Privacy"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "returns" },
						children: "Returns"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "delivery" },
						children: "Delivery"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "prohibited" },
						children: "Prohibited products"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/policies/$slug",
						params: { slug: "retailer-agreement" },
						children: "Retailer agreement"
					}) })
				]
			}),
			isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm",
				children: "Loading…"
			}) : null,
			!isPending && !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "font-semibold text-primary",
					children: "Sign in"
				}), " to send a message."]
			}) : null,
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "mt-4 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "subject",
						required: true,
						placeholder: "Subject",
						"aria-label": "Subject"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						name: "body",
						required: true,
						placeholder: "How can we help?",
						"aria-label": "Message"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy,
						children: "Send"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 text-sm",
				children: (tickets.data ?? []).map((ticket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl border border-border bg-surface p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: ticket.subject
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "capitalize text-muted",
						children: ticket.status
					})]
				}, ticket.id))
			})
		]
	});
}
//#endregion
export { SupportPage as component };
