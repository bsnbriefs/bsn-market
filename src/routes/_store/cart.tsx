import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { quoteCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { Button, EmptyState, Money } from "@/components/market/ui";

export const Route = createFileRoute("/_store/cart")({
  head: () => ({ meta: [{ title: "Cart · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQty);
  const remove = useCartStore((state) => state.remove);
  const navigate = useNavigate();
  const quote = useQuery({
    queryKey: ["quote", items],
    queryFn: () => quoteCart({ data: { items, state: "", city: "", promoCode: "" } }),
  });
  const lines = quote.data?.lines ?? [];
  const byRetailer = new Map<string, typeof lines>();
  for (const line of lines) {
    const list = byRetailer.get(line.retailerName) ?? [];
    list.push(line);
    byRetailer.set(line.retailerName, list);
  }
  return (
    <div>
      <h1 className="text-xl font-bold">Cart</h1>
      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Your cart is empty" body="Browse the shop and add something you actually want." action={<Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 }} className="font-semibold text-primary">Start shopping</Link>} />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 pb-28 lg:grid-cols-[1fr_280px] lg:pb-0">
          <div className="space-y-4">
            {quote.isFetching ? <div className="bsn-pulse h-1 w-full rounded-full bg-primary/50" aria-hidden /> : null}
            {quote.isLoading ? <p className="text-sm text-muted">Checking live prices and stock…</p> : null}
            {quote.data?.issues.map((issue) => (
              <p key={issue} className="rounded-xl bg-danger px-3 py-2 text-sm text-danger-fg">{issue}</p>
            ))}
            {[...byRetailer.entries()].map(([retailer, group]) => (
              <section key={retailer} className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold">Fulfilled by {retailer}</h2>
                <p className="text-xs text-muted">Ships separately from other retailers.</p>
                <ul className="mt-3 space-y-3">
                  {group.map((line) => (
                    <li key={`${line.productId}-${line.variantId}-${line.offerId ?? ""}`} className="bsn-fade flex items-start justify-between gap-3">
                      <div>
                        <Link to="/product/$slug" params={{ slug: line.productId }} className="font-medium">{line.name}</Link>
                        {line.variantLabel ? <p className="text-xs text-muted">{line.variantLabel}</p> : null}
                        {line.offerId ? <p className="text-xs text-link">Agreed Fair Deal price</p> : null}
                        <p className="text-sm"><Money kobo={line.unitKobo} /></p>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-muted" htmlFor={`q-${line.productId}-${line.offerId ?? "list"}`}>Qty</label>
                          <input id={`q-${line.productId}-${line.offerId ?? "list"}`} type="number" min={1} max={Math.min(10, line.stock)} value={line.qty} onChange={(event) => setQty(line.productId, line.variantId, Math.min(line.stock, 10, Math.max(0, Number(event.target.value) || 0)), line.offerId)} className="h-11 w-16 rounded-xl border border-border px-2 text-base" />
                          <button type="button" className="min-h-11 px-2 text-sm text-danger" onClick={() => remove(line.productId, line.variantId, line.offerId)}>Remove</button>
                        </div>
                      </div>
                      <p className="font-semibold"><Money kobo={line.lineKobo} /></p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <aside className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface p-3 lg:static lg:bottom-auto lg:h-fit lg:rounded-2xl lg:border lg:p-4">
            <h2 className="font-display text-xl">Estimate</h2>
            <p className="mt-2 flex justify-between text-sm"><span>Items</span><Money kobo={quote.data?.subtotalKobo ?? 0} /></p>
            <p className="mt-1 text-xs text-muted">Delivery is calculated at checkout from your state. Prices above come from the database, not from this page.</p>
            <Button className="mt-4 w-full" type="button" onClick={() => void navigate({ to: "/checkout" })}>Checkout</Button>
          </aside>
        </div>
      )}
    </div>
  );
}
