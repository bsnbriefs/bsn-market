import { o as __toESM } from "../_runtime.mjs";
import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { i as listMyProducts, o as saveMyProduct, t as archiveMyProduct } from "./retailer-C_xbb5pz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/products-lUJnA2hZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductsPage() {
	const products = useQuery({
		queryKey: ["my-products"],
		queryFn: () => listMyProducts()
	});
	const queryClient = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const submit = event.nativeEvent.submitter?.getAttribute("value") === "submit";
		const file = form.get("photo");
		let images = [];
		if (file instanceof File && file.size > 0) images = [await fileToJpeg(file)];
		setBusy(true);
		try {
			await saveMyProduct({ data: {
				name: form.get("name"),
				description: form.get("description"),
				brand: form.get("brand"),
				categoryId: form.get("categoryId"),
				priceNaira: form.get("priceNaira"),
				stock: Number(form.get("stock") ?? 0),
				returnEligible: form.get("returnEligible") === "on",
				submit,
				images,
				variants: String(form.get("variants") ?? "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
					const [label, stock, extra] = line.split(",").map((part) => part.trim());
					return {
						label,
						stock: Number(stock || 0),
						extraNaira: extra || ""
					};
				})
			} });
			toast.success(submit ? "Submitted for approval" : "Draft saved");
			event.currentTarget.reset();
			await queryClient.invalidateQueries({ queryKey: ["my-products"] });
		} catch (error) {
			toast.error(errText(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit,
			className: "space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "New product"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Saving an approved product sends it back for review. You cannot approve your own listing."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "name",
					required: true,
					placeholder: "Name",
					"aria-label": "Product name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
					name: "description",
					placeholder: "Description",
					"aria-label": "Description"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "brand",
					placeholder: "Brand",
					"aria-label": "Brand"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "categoryId",
					"aria-label": "Category",
					className: "h-11 w-full rounded-xl border border-border bg-surface px-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Category"
					}), (products.data?.categories ?? []).map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: category.id,
						children: category.name
					}, category.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "priceNaira",
					required: true,
					inputMode: "decimal",
					placeholder: "Price in naira",
					"aria-label": "Price"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "stock",
					type: "number",
					min: 0,
					defaultValue: 0,
					placeholder: "Stock if there are no variants",
					"aria-label": "Stock"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
					name: "variants",
					placeholder: "Variants, one per line: label, stock, extra naira\nM, 4, 0\nL, 2, 500",
					"aria-label": "Variants"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: ["Photo JPEG", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "photo",
						type: "file",
						accept: "image/*",
						className: "mt-1 block w-full text-sm"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "returnEligible",
						type: "checkbox",
						defaultChecked: true
					}), " Return eligible"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						name: "intent",
						value: "draft",
						variant: "surface",
						disabled: busy,
						children: "Save draft"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						name: "intent",
						value: "submit",
						disabled: busy,
						children: "Submit for approval"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Your products"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-2 text-sm",
			children: (products.data?.products ?? []).map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl border border-border bg-surface p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: product.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "capitalize text-muted",
						children: [
							product.status,
							" · ",
							formatNaira(Number(product.price_kobo)),
							" · stock ",
							product.stock
						]
					}),
					product.moderation_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: product.moderation_reason }) : null,
					product.status !== "archived" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-danger",
						onClick: () => archiveMyProduct({ data: product.id }).then(() => queryClient.invalidateQueries({ queryKey: ["my-products"] })).catch((error) => toast.error(errText(error))),
						children: "Archive"
					}) : null
				]
			}, product.id))
		})] })]
	});
}
async function fileToJpeg(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not read that image");
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	const url = canvas.toDataURL("image/jpeg", .72);
	if (url.length > 45e4) throw new Error("That photo is too large");
	return url;
}
//#endregion
export { ProductsPage as component };
