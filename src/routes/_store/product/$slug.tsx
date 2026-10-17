import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getProduct } from "@/lib/market/catalog";
import { createTrustReport } from "@/lib/market/account";
import { savePriceAlert, saveStockAlert } from "@/lib/market/radar";
import { useCartStore } from "@/lib/market/cart";
import { formatLagos, formatNaira } from "@/lib/market/money";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button, errText, Field, ProductRail, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/_store/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct({ data: params.slug });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} · SEEK` },
          { name: "description", content: loaderData.description.slice(0, 160) },
        ]
      : [{ title: "Product · SEEK" }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: loaderData.name,
              description: loaderData.description,
              image: loaderData.images,
              brand: loaderData.brand || undefined,
              offers: {
                "@type": "Offer",
                priceCurrency: "NGN",
                price: (loaderData.priceKobo / 100).toFixed(2),
                availability: loaderData.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            }).replace(/</g, "\\u003c"),
          },
        ]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const add = useCartStore((state) => state.add);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | undefined>(undefined);
  const variant = product.variants.find((item) => item.id === variantId);
  const price = product.priceKobo + (variant?.priceDeltaKobo ?? 0);
  const compareAt = !variant?.priceDeltaKobo ? product.compareAtKobo : null;
  const saving = compareAt && compareAt > price ? compareAt - price : 0;
  const stock = variant ? variant.stock : product.stock;
  const images = product.images.length ? product.images : product.imageUrl ? [product.imageUrl] : [];

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  function addToCart(buyNow: boolean) {
    if (product.variants.length > 0 && !variant) {
      toast.error("Choose an option");
      return;
    }
    if (stock < 1) {
      toast.error("This option is out of stock");
      return;
    }
    const already = useCartStore.getState().items.find((item) => item.productId === product.id && item.variantId === (variant?.id ?? null) && !item.offerId)?.qty ?? 0;
    if (already + qty > stock) {
      toast.error("That's all that's in stock");
      return;
    }
    add({ productId: product.id, variantId: variant?.id ?? null, qty });
    setJustAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 900);
    toast.success("Added to cart");
    if (buyNow) void navigate({ to: "/checkout" });
  }

  return (
    <article>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-border">
            {images[photo] ? <img key={photo} src={images[photo]} alt={product.name} className="bsn-fade h-full w-full object-cover" /> : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-2 flex gap-2">
              {images.map((image, index) => (
                <button key={image} type="button" onClick={() => setPhoto(index)} className={`size-16 overflow-hidden rounded-xl border transition duration-200 ${index === photo ? "border-primary" : "border-border"}`}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{product.categoryName}</p>
          <h1 className="text-2xl font-bold md:text-4xl">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            <span key={price} className="bsn-fade inline-block">{formatNaira(price)}</span>
            {saving > 0 && compareAt ? (
              <span className="ml-2 text-base font-normal text-muted line-through">{formatNaira(compareAt)}</span>
            ) : null}
          </p>
          {saving > 0 ? <p className="mt-1 text-sm font-semibold text-accent">Save {formatNaira(saving)}</p> : null}
          {product.rating ? <p className="mt-1 text-sm text-muted">{product.rating} / 5 from {product.reviewCount} verified {product.reviewCount === 1 ? "review" : "reviews"}</p> : <p className="mt-1 text-sm text-muted">No verified reviews yet</p>}
          <p className="mt-4 text-sm leading-6">{product.description}</p>
          {product.brand ? <p className="mt-2 text-sm"><span className="text-muted">Brand · </span>{product.brand}</p> : null}
          <p className="mt-2 text-sm"><span className="text-muted">Sold by · </span>{product.retailerName}, {product.retailerCity}, {product.retailerState}</p>
          {product.retailerBadge ? <p className="mt-1 text-sm font-semibold text-link">{product.retailerBadge}</p> : null}
          {product.retailerDescription ? <p className="text-sm text-muted">{product.retailerDescription}</p> : null}
          <p className="mt-2 text-sm">{stock > 0 ? `${stock} in stock` : "Out of stock"}</p>
          {product.deliveryDaysMin ? <p className="text-sm text-muted">Retailer estimate {product.deliveryDaysMin}–{product.deliveryDaysMax} days after dispatch. The fee depends on your state.</p> : null}
          <p className="text-sm text-muted">{product.returnEligible ? "Return eligible after delivery. See the returns policy for the rules." : "Not marked return-eligible."}</p>
          <p className="mt-2 text-sm">
            <Link to="/policies/$slug" params={{ slug: "delivery" }} className="font-semibold text-link">Delivery</Link>
            <span className="text-muted"> · </span>
            <Link to="/policies/$slug" params={{ slug: "returns" }} className="font-semibold text-link">Returns</Link>
            <span className="text-muted"> · </span>
            <Link to="/support" className="font-semibold text-link">Support</Link>
          </p>
          {product.variants.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.variants.map((item) => (
                <button key={item.id} type="button" onClick={() => setVariantId(item.id)} className={`min-h-11 rounded-full border px-3 text-sm transition duration-200 active:scale-95 ${item.id === variantId ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface hover:border-primary/40"}`}>
                  {item.label}{item.stock < 1 ? " · sold out" : ""}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm">Quantity</span>
            <div className="inline-flex items-center overflow-hidden rounded-xl border border-border bg-surface">
              <button type="button" className="size-11 text-lg transition-colors hover:bg-bg" aria-label="Decrease quantity" onClick={() => setQty((current) => Math.max(1, current - 1))}>−</button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" className="size-11 text-lg transition-colors hover:bg-bg" aria-label="Increase quantity" onClick={() => setQty((current) => Math.min(stock > 0 ? stock : current, 10, current + 1))}>+</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="surface" onClick={() => addToCart(false)} disabled={stock < 1}>{justAdded ? "Added" : "Add to cart"}</Button>
            <Button type="button" onClick={() => addToCart(true)} disabled={stock < 1}>Buy now</Button>
          </div>
          <PriceRadar productId={product.id} priceKobo={price} inStock={stock > 0} signedIn={Boolean(user)} />
        </div>
      </div>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Verified reviews</h2>
        {product.reviews.length === 0 ? <p className="mt-2 text-sm text-muted">Reviews appear only after a delivered purchase.</p> : (
          <ul className="mt-3 space-y-3">
            {product.reviews.map((review) => (
              <li key={`${review.createdAt}-${review.name}`} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold">{review.rating} / 5 · {review.name}</p>
                <p className="text-xs text-muted">{formatLagos(review.createdAt)}</p>
                {review.body ? <p className="mt-2 text-sm">{review.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <ReportListing productId={product.id} signedIn={Boolean(user)} />
      <ProductRail title="Related" products={product.related} />
      <p className="mt-6 pb-16 text-sm md:pb-0"><Link to="/shop" search={{ q: "", category: product.categorySlug, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 }} className="font-semibold text-primary">More in {product.categoryName}</Link></p>
      <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <p className="min-w-0 flex-1 text-sm font-semibold tabular-nums">{formatNaira(price)}</p>
          <Button type="button" className="shrink-0" onClick={() => addToCart(false)} disabled={stock < 1}>{justAdded ? "Added" : "Add to cart"}</Button>
        </div>
      </div>
    </article>
  );
}

function PriceRadar({ productId, priceKobo, inStock, signedIn }: { productId: string; priceKobo: number; inStock: boolean; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await savePriceAlert({ data: { productId, targetNaira: form.get("targetNaira") } });
      toast.success("Price alert saved. We'll notify you if the live price reaches it.");
      setOpen(false);
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  async function watchStock() {
    setBusy(true);
    try {
      await saveStockAlert({ data: { productId } });
      toast.success("We'll notify you if this product is available again.");
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  if (!signedIn) {
    return <p className="mt-3 text-sm"><Link to="/login" className="font-semibold text-link">Sign in</Link> to set a price or stock alert.</p>;
  }
  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
      <p className="text-sm font-semibold">Price Radar</p>
      {inStock ? (
        open ? (
          <form className="mt-2 space-y-2" onSubmit={(event) => void onSubmit(event)}>
            <Field name="targetNaira" inputMode="decimal" required placeholder="Target price in naira" aria-label="Target price" />
            <p className="text-xs text-muted">We'll notify you when this product reaches that price or less, and is still available. Current price {formatNaira(priceKobo)}.</p>
            <div className="flex gap-2">
              <Button type="button" variant="surface" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save alert"}</Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant="surface" className="mt-2" onClick={() => setOpen(true)}>Set Price Alert</Button>
        )
      ) : (
        <div className="mt-2">
          <p className="text-sm text-muted">This product is unavailable. We'll notify you if the approved listing has stock again.</p>
          <Button type="button" variant="surface" className="mt-2" disabled={busy} onClick={() => void watchStock()}>Notify me when available</Button>
        </div>
      )}
      <p className="mt-2 text-xs"><Link to="/radar" className="font-semibold text-link">My alerts</Link></p>
    </div>
  );
}

function ReportListing({ productId, signedIn }: { productId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await createTrustReport({ data: { productId, category: form.get("category"), body: form.get("body") } });
      toast.success("Report sent. The listing stays up until an administrator reviews it.");
      setOpen(false);
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold">Report this listing</h2>
      <p className="mt-1 text-sm text-muted">Use this for a misleading listing, a suspected counterfeit, wrong details, or suspected fraud. A report does not remove the product.</p>
      {signedIn ? (
        open ? (
          <form className="mt-3 space-y-2" onSubmit={(event) => void onSubmit(event)}>
            <select name="category" aria-label="Reason" className="h-11 w-full rounded-xl border border-border bg-bg px-3" defaultValue="misleading">
              <option value="misleading">Misleading listing</option>
              <option value="counterfeit">Suspected counterfeit</option>
              <option value="incorrect">Incorrect information</option>
              <option value="suspicious">Suspicious retailer</option>
              <option value="fraud">Suspected fraud</option>
              <option value="other">Something else</option>
            </select>
            <TextArea name="body" required minLength={10} placeholder="What looks wrong?" aria-label="Report details" />
            <div className="flex gap-2">
              <Button type="button" variant="surface" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Submit report"}</Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant="surface" className="mt-3" onClick={() => setOpen(true)}>Report</Button>
        )
      ) : (
        <p className="mt-3 text-sm"><Link to="/login" className="font-semibold text-link">Sign in</Link> to send a report.</p>
      )}
    </section>
  );
}
