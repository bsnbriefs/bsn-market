import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { closeFairRequest, getFairRequest, selectFairOffer } from "@/lib/market/fair";
import { useCartStore } from "@/lib/market/cart";
import { formatNaira } from "@/lib/market/money";
import { Button, errText } from "@/components/market/ui";

export const Route = createFileRoute("/_store/fair/$id")({
  head: () => ({ meta: [{ title: "Compare offers · SEEK" }] }),
  component: FairDetail,
});

function FairDetail() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const detail = useQuery({ queryKey: ["fair", id], enabled: Boolean(user), queryFn: () => getFairRequest({ data: id }) });
  const queryClient = useQueryClient();
  const add = useCartStore((state) => state.add);
  const [busy, setBusy] = useState("");
  if (isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  if (detail.isLoading) return <p className="text-sm text-muted">Loading offers…</p>;
  if (detail.error) return <p>{errText(detail.error)}</p>;
  const data = detail.data;
  if (!data) return null;
  const request = data.request;
  async function choose(offerId: string) {
    if (!window.confirm("Select this offer? The other offers will be declined. You still pay through the normal checkout.")) return;
    setBusy(offerId);
    try {
      const chosen = await selectFairOffer({ data: offerId });
      add({ productId: chosen.productId, variantId: chosen.variantId, qty: chosen.qty, offerId: chosen.offerId });
      toast.success("Offer selected and added to your cart at the agreed price.");
      await queryClient.invalidateQueries({ queryKey: ["fair", id] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy("");
    }
  }
  async function closeRequest() {
    if (!window.confirm("Close this request? Retailers will not be able to send new offers.")) return;
    setBusy("close");
    try {
      await closeFairRequest({ data: id });
      toast.success("Request closed");
      await queryClient.invalidateQueries({ queryKey: ["fair"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-4">
      <Link to="/fair" className="text-sm font-semibold text-link">All requests</Link>
      <div>
        <h1 className="font-display text-3xl">{request.name}</h1>
        <p className="mt-1 text-sm capitalize text-muted">{request.status} · budget {formatNaira(Number(request.budget_kobo))} · qty {request.qty} · {request.condition}</p>
        {request.description ? <p className="mt-2 text-sm">{request.description}</p> : null}
        <p className="mt-2 text-xs text-muted">{[request.brand && `Brand: ${request.brand}`, request.specs, request.state && `Deliver to ${request.state}`, request.note].filter(Boolean).join(" · ")}</p>
      </div>
      {request.status === "open" ? <Button type="button" variant="surface" disabled={busy === "close"} onClick={() => void closeRequest()}>Close request</Button> : null}
      {data.offers.length === 0 ? <p className="text-sm text-muted">No offers yet. A retailer has to answer with one of their approved products.</p> : null}
      <ul className="space-y-3">
        {data.offers.map((offer) => (
          <li key={offer.id} className="rounded-2xl border border-border bg-surface p-3">
            <div className="flex gap-3">
              {offer.image_url ? <img src={offer.image_url} alt="" className="size-16 rounded-xl object-cover" /> : <span className="size-16 rounded-xl bg-cream" />}
              <div>
                <Link to="/product/$slug" params={{ slug: offer.slug }} className="font-semibold">{offer.name}</Link>
                <p className="text-sm">{offer.business_name}{offer.badge ? ` · ${offer.badge}` : " · Verification not on file"}</p>
                <p className="text-sm">Offer {formatNaira(Number(offer.price_kobo))} · listed {formatNaira(Number(offer.list_kobo))}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">Retailer says {offer.condition}. SEEK has not inspected the item. Stock shown: {offer.stock}. {offer.product_status === "approved" ? "Listing is approved." : "Listing is not currently approved."}</p>
            <p className="text-xs text-muted">{offer.delivery_days_min && offer.delivery_days_max ? `The listing says ${offer.delivery_days_min}–${offer.delivery_days_max} days. That is not a new promise.` : "No delivery estimate is stored."} Delivery charges are calculated at checkout, not here.</p>
            {offer.message ? <p className="mt-2 text-sm">{offer.message}</p> : null}
            <p className="mt-2 text-xs font-semibold capitalize text-link">{offer.status}</p>
            {request.status === "open" && offer.status === "pending" ? (
              <Button type="button" className="mt-3" disabled={busy === offer.id} onClick={() => void choose(offer.id)}>Choose this deal</Button>
            ) : null}
            {offer.status === "selected" ? <Link to="/checkout" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link">Continue to checkout</Link> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
