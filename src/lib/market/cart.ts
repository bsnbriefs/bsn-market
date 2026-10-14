import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { productId: string; variantId: string | null; qty: number };

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
};

function same(a: CartItem, productId: string, variantId: string | null) {
  return a.productId === productId && a.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const items = get().items.slice();
        const index = items.findIndex((row) => same(row, item.productId, item.variantId));
        if (index >= 0) items[index] = { ...items[index], qty: Math.min(10, items[index].qty + item.qty) };
        else items.push({ ...item, qty: Math.min(10, Math.max(1, item.qty)) });
        set({ items });
      },
      setQty: (productId, variantId, qty) => {
        set({
          items: get()
            .items.map((row) => (same(row, productId, variantId) ? { ...row, qty } : row))
            .filter((row) => row.qty > 0),
        });
      },
      remove: (productId, variantId) => {
        set({ items: get().items.filter((row) => !same(row, productId, variantId)) });
      },
      clear: () => set({ items: [] }),
      replace: (items) => set({ items }),
    }),
    { name: "bsn-market-cart" },
  ),
);
