import { o as __toESM } from "./_runtime.mjs";
import { a as formatLagos, o as formatNaira } from "./_ssr/money-eRJ-C_HK.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "./_libs/react+tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { i as Route$4 } from "./_ssr/router-3DsyBKek.mjs";
import { c as refreshPayment, i as getMyOrder, l as requestReturn, r as confirmSandboxPayment, t as cancelMyOrder } from "./_ssr/commerce-D6xgnPlf.mjs";
import { n as useCurrentUserState } from "./_ssr/use-current-user-LXzd1evx.mjs";
import { t as RedirectToSignIn } from "./_ssr/gates-B2MA7bLJ.mjs";
import { i as createReview } from "./_ssr/account-DmIRgbiK.mjs";
import { c as errText, r as Field, t as Button } from "./_ssr/ui-BLoIMfat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id-D4y3yylJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OrderPage() {
	const { id } = Route$4.useParams();
	const { user, isPending } = useCurrentUserState();
	const queryClient = useQueryClient();
	const order = useQuery({
		queryKey: [
			"order",
			id,
			user?.id
		],
		enabled: Boolean(user),
		queryFn: () => getMyOrder({ data: id })
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!order.data || order.data.payment?.provider !== "paystack" || order.data.status !== "pending_payment") return;
		refreshPayment({ data: id }).then(() => queryClient.invalidateQueries({ queryKey: ["order", id] })).catch(() => void 0);
	}, [
		id,
		order.data,
		queryClient
	]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (order.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading order…"
	});
	if (!order.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This order is not available on your account." });
	const data = order.data;
	async function act(task, success) {
		setBusy(true);
		try {
			await task();
			toast.success(success);
			await queryClient.invalidateQueries({ queryKey: ["order", id] });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted",
					children: data.reference
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl capitalize",
					children: data.status.replaceAll("_", " ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: formatLagos(data.createdAt)
				})
			] }),
			data.payment?.provider === "sandbox" && data.status === "pending_payment" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-accent bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Test payment"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Paystack is not connected, so this cannot take a real card payment. Confirming here only marks a sandbox payment. It is not a Paystack success."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						type: "button",
						disabled: busy,
						onClick: () => act(() => confirmSandboxPayment({ data: id }), "Sandbox payment recorded"),
						children: "Record test payment"
					})
				]
			}) : null,
			data.status === "awaiting_quote" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl bg-surface p-4 text-sm",
				children: "We do not have a delivery fee for this address yet. An administrator must set one before you can pay. Nothing has been charged."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: "Delivery"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.contact.name }),
					"email" in data.contact && data.contact.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.contact.email }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.contact.phone }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						data.contact.line,
						", ",
						data.contact.city,
						", ",
						data.contact.state
					] }),
					data.contact.instructions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: data.contact.instructions
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: data.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [
								item.qty,
								" × ",
								item.name,
								item.variant ? ` · ${item.variant}` : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: ["Sold by ", item.retailerName]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: formatNaira(item.lineKobo)
						}),
						data.access === "customer" && data.fulfilments.some((row) => row.retailerId === item.retailerId && row.status === "delivered") && item.returnEligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-2 flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
								act(() => requestReturn({ data: {
									orderItemId: item.id,
									reason
								} }), "Return requested. It is not a completed refund.");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "reason",
								placeholder: "Reason for return",
								"aria-label": "Return reason"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								variant: "surface",
								disabled: busy,
								children: "Request return"
							})]
						}) : null,
						data.access === "customer" && data.fulfilments.some((row) => row.retailerId === item.retailerId && row.status === "delivered") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-2 flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								const form = new FormData(event.currentTarget);
								act(() => createReview({ data: {
									orderItemId: item.id,
									rating: Number(form.get("rating")),
									body: String(form.get("body") ?? "")
								} }), "Review saved");
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "rating",
									"aria-label": "Rating",
									className: "h-11 rounded-xl border border-border bg-bg px-2",
									defaultValue: "5",
									children: [
										5,
										4,
										3,
										2,
										1
									].map((rating) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: rating,
										children: rating
									}, rating))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									name: "body",
									placeholder: "Review (optional)",
									"aria-label": "Review"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									variant: "surface",
									disabled: busy,
									children: "Review"
								})
							]
						}) : null
					]
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-surface p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatNaira(data.subtotalKobo) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatNaira(data.discountKobo) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: data.deliveryKobo === null ? "Not quoted" : formatNaira(data.deliveryKobo) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 flex justify-between font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: data.totalKobo === null ? "—" : formatNaira(data.totalKobo) })]
					}),
					data.payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted",
						children: [
							"Payment ",
							data.payment.reference,
							" · ",
							data.payment.provider,
							" · ",
							data.payment.status
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted",
						children: "No payment record yet."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl",
				children: "Fulfilment"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-2 text-sm",
				children: data.fulfilments.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl border border-border bg-surface px-3 py-2 capitalize",
					children: [row.status.replaceAll("_", " "), row.note ? ` · ${row.note}` : ""]
				}, row.id))
			})] }),
			data.canCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "danger",
				disabled: busy,
				onClick: () => act(() => cancelMyOrder({ data: id }), "Order cancelled and stock released"),
				children: "Cancel order"
			}) : null
		]
	});
}
//#endregion
export { OrderPage as component };
