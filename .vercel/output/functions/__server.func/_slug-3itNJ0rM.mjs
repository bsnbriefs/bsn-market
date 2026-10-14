import { o as __toESM } from "./_runtime.mjs";
import { a as formatLagos, o as formatNaira } from "./_ssr/money-eRJ-C_HK.mjs";
import { a as require_react, i as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { C as useNavigate, x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { n as Route$2 } from "./_ssr/router-3DsyBKek.mjs";
import { o as ProductRail, t as Button } from "./_ssr/ui-BLoIMfat.mjs";
import { t as useCartStore } from "./_ssr/cart-Bh98bnz8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-3itNJ0rM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductPage() {
	const product = Route$2.useLoaderData();
	const navigate = useNavigate();
	const add = useCartStore((state) => state.add);
	const [variantId, setVariantId] = (0, import_react.useState)(product.variants[0]?.id ?? "");
	const [qty, setQty] = (0, import_react.useState)(1);
	const [photo, setPhoto] = (0, import_react.useState)(0);
	const variant = product.variants.find((item) => item.id === variantId);
	const price = product.priceKobo + (variant?.priceDeltaKobo ?? 0);
	const stock = variant ? variant.stock : product.stock;
	const images = product.images.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
	function addToCart(buyNow) {
		if (product.variants.length > 0 && !variant) {
			toast.error("Choose an option");
			return;
		}
		if (stock < 1) {
			toast.error("This option is out of stock");
			return;
		}
		add({
			productId: product.id,
			variantId: variant?.id ?? null,
			qty
		});
		toast.success("Added to cart");
		if (buyNow) navigate({ to: "/checkout" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "aspect-square overflow-hidden rounded-3xl bg-border",
				children: images[photo] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: images[photo],
					alt: product.name,
					className: "h-full w-full object-cover"
				}) : null
			}), images.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-2",
				children: images.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setPhoto(index),
					className: "size-16 overflow-hidden rounded-xl border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: image,
						alt: "",
						className: "h-full w-full object-cover"
					})
				}, image))
			}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted",
					children: product.categoryName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl",
					children: product.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-2xl font-semibold tabular-nums",
					children: [formatNaira(price), product.compareAtKobo && !variant?.priceDeltaKobo && product.compareAtKobo > product.priceKobo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-base font-normal text-muted line-through",
						children: formatNaira(product.compareAtKobo)
					}) : null]
				}),
				product.rating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						product.rating,
						" / 5 from ",
						product.reviewCount,
						" verified ",
						product.reviewCount === 1 ? "review" : "reviews"
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "No verified reviews yet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-6",
					children: product.description
				}),
				product.brand ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Brand · "
					}), product.brand]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Sold by · "
						}),
						product.retailerName,
						", ",
						product.retailerCity,
						", ",
						product.retailerState
					]
				}),
				product.retailerDescription ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: product.retailerDescription
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: stock > 0 ? `${stock} in stock` : "Out of stock"
				}),
				product.deliveryDaysMin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"Retailer estimate ",
						product.deliveryDaysMin,
						"–",
						product.deliveryDaysMax,
						" days after dispatch. The fee depends on your state."
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: product.returnEligible ? "Return eligible after delivery." : "Not marked return-eligible."
				}),
				product.variants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: product.variants.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setVariantId(item.id),
						className: `min-h-11 rounded-full border px-3 text-sm ${item.id === variantId ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface"}`,
						children: [item.label, item.stock < 1 ? " · sold out" : ""]
					}, item.id))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm",
						htmlFor: "qty",
						children: "Quantity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "qty",
						type: "number",
						min: 1,
						max: 10,
						value: qty,
						onChange: (event) => setQty(Math.min(10, Math.max(1, Number(event.target.value) || 1))),
						className: "h-11 w-20 rounded-xl border border-border bg-surface px-3 text-base"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "surface",
						onClick: () => addToCart(false),
						disabled: stock < 1,
						children: "Add to cart"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => addToCart(true),
						disabled: stock < 1,
						children: "Buy now"
					})]
				})
			] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Verified reviews"
			}), product.reviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Reviews appear only after a delivered purchase."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-3",
				children: product.reviews.map((review) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-semibold",
							children: [
								review.rating,
								" / 5 · ",
								review.name
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: formatLagos(review.createdAt)
						}),
						review.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: review.body
						}) : null
					]
				}, `${review.createdAt}-${review.name}`))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductRail, {
			title: "Related",
			products: product.related
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/shop",
				search: {
					q: "",
					category: product.categorySlug,
					retailer: "",
					brand: "",
					state: "",
					min: "",
					max: "",
					sort: "newest",
					page: 1
				},
				className: "font-semibold text-primary",
				children: ["More in ", product.categoryName]
			})
		})
	] });
}
//#endregion
export { ProductPage as component };
