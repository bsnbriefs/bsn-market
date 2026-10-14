import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-Bh98bnz8.js
function same(a, productId, variantId) {
	return a.productId === productId && a.variantId === variantId;
}
var useCartStore = create()(persist((set, get) => ({
	items: [],
	add: (item) => {
		const items = get().items.slice();
		const index = items.findIndex((row) => same(row, item.productId, item.variantId));
		if (index >= 0) items[index] = {
			...items[index],
			qty: Math.min(10, items[index].qty + item.qty)
		};
		else items.push({
			...item,
			qty: Math.min(10, Math.max(1, item.qty))
		});
		set({ items });
	},
	setQty: (productId, variantId, qty) => {
		set({ items: get().items.map((row) => same(row, productId, variantId) ? {
			...row,
			qty
		} : row).filter((row) => row.qty > 0) });
	},
	remove: (productId, variantId) => {
		set({ items: get().items.filter((row) => !same(row, productId, variantId)) });
	},
	clear: () => set({ items: [] }),
	replace: (items) => set({ items })
}), { name: "bsn-market-cart" }));
//#endregion
export { useCartStore as t };
