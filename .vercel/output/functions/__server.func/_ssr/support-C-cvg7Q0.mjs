import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { f as adminReplyTicket, l as adminListTickets } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support-C-cvg7Q0.js
var import_jsx_runtime = require_jsx_runtime();
function SupportAdmin() {
	const data = useQuery({
		queryKey: ["admin-tickets"],
		queryFn: () => adminListTickets()
	});
	const queryClient = useQueryClient();
	async function reply(event, ticketId) {
		event.preventDefault();
		const body = String(new FormData(event.currentTarget).get("body") ?? "");
		try {
			await adminReplyTicket({ data: {
				ticketId,
				body
			} });
			toast.success("Reply saved");
			await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-3xl",
		children: "Support"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 space-y-4",
		children: (data.data?.tickets ?? []).map((ticket) => {
			const row = ticket;
			const messages = (data.data?.messages ?? []).filter((message) => message.ticket_id === row.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: row.subject
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "capitalize text-muted",
						children: row.status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: message.body }, message.body))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-2 space-y-2",
						onSubmit: (event) => void reply(event, row.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
							name: "body",
							placeholder: "Reply",
							"aria-label": "Reply"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Send reply"
						})]
					})
				]
			}, row.id);
		})
	})] });
}
//#endregion
export { SupportAdmin as component };
