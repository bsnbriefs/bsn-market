import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { listOpenFairRequests, listMyFairOffers, listOfferProducts, submitFairOffer, withdrawFairOffer } from "@/lib/market/fair";
import { formatNaira } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/retailer/fair")({
  head: () => ({ meta: [{ title: "Fair Deal · Retailer" }, { name: "robots", content: "noindex" }] }),
  component: RetailerFair,
});

function RetailerFair() {
  const [category, setCategory] = useState("");
  const [stateName, setStateName] = useState("");
  const requests = useQuery({ queryKey: ["fair-open", category, stateName], queryFn: () => listOpenFairRequests({ data: { category, state: stateName } }) });
  const mine = useQuery({ queryKey: ["fair-mine"], queryFn: () => listMyFairOffers() });
  const products = useQuery({ queryKey: ["offer-products"], queryFn: () => listOfferProducts() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState("");
  const approved = products.data ?? [];
  async function offer(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(requestId);
    try {
      await submitFairOffer({
        data: {
          requestId,
          productId: form.get("productId"),
          variantId: form.get("variantId"),
          priceNaira: form.get("priceNaira"),
          condition: form.get("condition"),
          message: form.get("message"),
        },
      });
      toast.success("Offer sent. The catalogue price was not changed.");
      await queryClient.invalidateQueries({ queryKey: ["fair-mine"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Fair Deal</h1>
        <p className="text-sm text-muted">Offer one of your approved products. The price can be at or below its listed price, and it must fit the customer's budget. Customer contact details are not shown.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category or name" aria-label="Filter by category" />
        <Field value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="State" aria-label="Filter by state" />
      </div>
      {requests.isLoading ? <p className="text-sm text-muted">Loading requests…</p> : null}
      {requests.error ? <p className="text-sm">{errText(requests.error)}</p> : null}
      {requests.data?.length === 0 ? <p className="text-sm text-muted">No open requests match.</p> : null}
      <ul className="space-y-3">
        {(requests.data ?? []).map((request) => (
          <li key={request.id} className="rounded-2xl border border-border bg-surface p-3">
            <h2 className="font-semibold">{request.name}</h2>
            <p className="text-sm text-muted">Budget {formatNaira(Number(request.budget_kobo))} · qty {request.qty} · {request.condition}{request.state ? ` · ${request.state}` : ""}</p>
            {request.description ? <p className="mt-1 text-sm">{request.description}</p> : null}
            <p className="text-xs text-muted">{[request.brand, request.specs, request.note].filter(Boolean).join(" · ")}</p>
            <form className="mt-3 space-y-2" onSubmit={(event) => void offer(event, request.id)}>
              <select name="productId" required aria-label={`Product for ${request.name}`} className="h-11 w-full rounded-xl border border-border bg-bg px-3">
                <option value="">Choose your product</option>
                {approved.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatNaira(Number(product.price_kobo))}</option>)}
              </select>
              {approved.some((product) => product.variants.length > 0) ? (
                <select name="variantId" aria-label="Product option" className="h-11 w-full rounded-xl border border-border bg-bg px-3">
                  <option value="">No extra option</option>
                  {approved.flatMap((product) => product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>{product.name} · {variant.label}{variant.stock < 1 ? " · sold out" : ""}</option>
                  )))}
                </select>
              ) : null}
              <Field name="priceNaira" required inputMode="decimal" placeholder="Your offer in naira" aria-label="Offer price" />
              <select name="condition" aria-label="Condition you are offering" className="h-11 w-full rounded-xl border border-border bg-bg px-3" defaultValue="new">
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
              <Field name="message" placeholder="Short note" aria-label="Message" />
              <Button type="submit" disabled={busy === request.id}>{busy === request.id ? "Sending…" : "Send offer"}</Button>
            </form>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="font-display text-2xl">My offers</h2>
        {mine.data?.length === 0 ? <p className="mt-2 text-sm text-muted">You have not offered yet.</p> : null}
        <ul className="mt-2 space-y-2 text-sm">
          {(mine.data ?? []).map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3">
              <span>{offer.name} for “{offer.request_name}” · {formatNaira(Number(offer.price_kobo))} · {offer.status}</span>
              {offer.status === "pending" ? <button type="button" className="font-semibold text-danger" onClick={() => void withdrawFairOffer({ data: offer.id }).then(() => mine.refetch()).catch((error) => toast.error(errText(error)))}>Withdraw</button> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
