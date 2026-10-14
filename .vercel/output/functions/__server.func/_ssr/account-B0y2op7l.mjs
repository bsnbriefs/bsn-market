import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useCurrentUserState } from "./use-current-user-LXzd1evx.mjs";
import { n as UserButton, t as RedirectToSignIn } from "./gates-B2MA7bLJ.mjs";
import { d as saveAddress, f as updateProfile, n as claimMarketplace, o as deleteAddress, s as getMe, u as markNotificationsRead } from "./account-DmIRgbiK.mjs";
import { c as errText, r as Field, t as Button } from "./ui-BLoIMfat.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-B0y2op7l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	const { user, isPending } = useCurrentUserState();
	const me = useQuery({
		queryKey: ["me", user?.id],
		enabled: Boolean(user),
		queryFn: () => getMe()
	});
	const queryClient = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (isPending || me.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading account…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!me.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Could not load your account." });
	const data = me.data;
	async function run(task, success) {
		setBusy(true);
		try {
			await task();
			toast.success(success);
			await queryClient.invalidateQueries({ queryKey: ["me"] });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Account"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: data.profile.email
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2 text-sm font-semibold",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orders",
						className: "rounded-full bg-surface px-3 py-2",
						children: "Orders"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/retailer",
						className: "rounded-full bg-surface px-3 py-2",
						children: "Sell"
					}),
					data.roles.includes("admin") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin",
						className: "rounded-full bg-primary px-3 py-2 text-primary-fg",
						children: "Admin"
					}) : null
				]
			}),
			!data.adminExists ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "No marketplace owner yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "The first person to claim this becomes the only bootstrap administrator. After that, only an admin can grant access."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						type: "button",
						disabled: busy,
						onClick: () => run(() => claimMarketplace(), "You are the marketplace administrator"),
						children: "Claim administrator role"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2",
				onSubmit: (event) => {
					event.preventDefault();
					const form = new FormData(event.currentTarget);
					run(() => updateProfile({ data: {
						fullName: form.get("fullName"),
						phone: form.get("phone")
					} }), "Profile saved");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "fullName",
						defaultValue: data.profile.fullName,
						placeholder: "Full name",
						"aria-label": "Full name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						name: "phone",
						defaultValue: data.profile.phone,
						placeholder: "Phone",
						"aria-label": "Phone"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy,
						children: "Save profile"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Addresses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2 text-sm",
					children: data.addresses.map((address) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							address.recipient,
							", ",
							address.line,
							", ",
							address.city,
							", ",
							address.state,
							address.is_default ? " · default" : ""
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-danger",
							onClick: () => run(() => deleteAddress({ data: address.id }), "Address removed"),
							children: "Remove"
						})]
					}, address.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 grid gap-2",
					onSubmit: (event) => {
						event.preventDefault();
						const form = new FormData(event.currentTarget);
						run(() => saveAddress({ data: {
							recipient: form.get("recipient"),
							phone: form.get("phone"),
							line: form.get("line"),
							state: form.get("state"),
							city: form.get("city"),
							instructions: form.get("instructions"),
							isDefault: true
						} }), "Address saved");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "recipient",
							required: true,
							placeholder: "Recipient",
							"aria-label": "Recipient"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "phone",
							required: true,
							placeholder: "Phone",
							"aria-label": "Address phone"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "line",
							required: true,
							placeholder: "Address",
							"aria-label": "Address line"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								name: "state",
								"aria-label": "State",
								className: "h-11 rounded-xl border border-border bg-surface px-3",
								defaultValue: "Lagos",
								children: NIGERIAN_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: state }, state))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "city",
								required: true,
								placeholder: "City or LGA",
								"aria-label": "City"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							name: "instructions",
							placeholder: "Instructions",
							"aria-label": "Instructions"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "surface",
							disabled: busy,
							children: "Save address"
						})
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Notifications"
				}), data.unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-sm font-semibold text-primary",
					onClick: () => run(() => markNotificationsRead(), "Marked read"),
					children: "Mark read"
				}) : null]
			}), data.notifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Nothing yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-2",
				children: data.notifications.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl border border-border bg-surface p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: item.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.body }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: ["Email: ", item.email_status === "sent" ? "sent" : item.email_status === "failed" ? "the provider rejected it" : "not sent — email is not configured"]
						})
					]
				}, item.id))
			})] })
		]
	});
}
//#endregion
export { AccountPage as component };
