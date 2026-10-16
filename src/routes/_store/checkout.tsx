import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { checkout, quoteCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { getMe } from "@/lib/market/account";
import { Button, errText, Field, Money } from "@/components/market/ui";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <p className="text-sm text-muted">Checking your account…</p>;
  if (!user) return <RedirectToSignIn />;
  return <CheckoutForm />;
}

function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const [stateName, setStateName] = useState("Lagos");
  const [city, setCity] = useState("");
  const [promo, setPromo] = useState("");
  const [busy, setBusy] = useState(false);
  const quote = useQuery({
    queryKey: ["quote", items, stateName, city, promo],
    queryFn: () => quoteCart({ data: { items, state: stateName, city, promoCode: promo } }),
  });
  const address = me.data?.addresses.find((item) => item.is_default) ?? me.data?.addresses[0];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const key = sessionStorage.getItem("bsn-checkout-key") ?? crypto.randomUUID();
      sessionStorage.setItem("bsn-checkout-key", key);
      const result = await checkout({
        data: {
          idempotencyKey: key,
          items,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          line: String(form.get("line") ?? ""),
          state: String(form.get("state") ?? ""),
          city: String(form.get("city") ?? ""),
          instructions: String(form.get("instructions") ?? ""),
          promoCode: promo,
        },
      });
      sessionStorage.removeItem("bsn-checkout-key");
      clear();
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }
      toast.success(result.paymentNote || "Order created");
      void navigate({ to: "/orders/$id", params: { id: result.orderId } });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Checkout</h1>
        <ol className="flex items-center gap-2 text-xs font-semibold">
          <li className="rounded-full bg-primary px-3 py-1 text-primary-fg">1 · Details</li>
          <li className="text-muted" aria-hidden>→</li>
          <li className={`rounded-full px-3 py-1 transition-colors ${busy ? "bg-primary text-primary-fg" : "bg-surface text-muted"}`}>2 · Paystack</li>
        </ol>
        <p className="text-sm text-muted">The server recalculates every price. Reaching this page does not mean you have paid.</p>
        <Field name="name" required placeholder="Recipient name" defaultValue={address?.recipient || me.data?.profile.fullName || ""} aria-label="Recipient name" />
        <Field name="email" type="email" required placeholder="Email" defaultValue={me.data?.profile.email || ""} aria-label="Email" />
        <Field name="phone" required placeholder="Phone" defaultValue={address?.phone || me.data?.profile.phone || ""} aria-label="Phone" />
        <Field name="line" required placeholder="Delivery address" defaultValue={address?.line || ""} aria-label="Delivery address" />
        <div className="grid grid-cols-2 gap-2">
          <select name="state" value={stateName} onChange={(event) => setStateName(event.target.value)} aria-label="State" className="h-11 rounded-xl border border-border bg-surface px-3 text-base">
            {NIGERIAN_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
          <Field name="city" required placeholder="City or LGA" value={city} onChange={(event) => setCity(event.target.value)} aria-label="City" />
        </div>
        <Field name="instructions" placeholder="Delivery instructions (optional)" aria-label="Delivery instructions" />
        <Field value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Discount code (optional)" aria-label="Discount code" />
      </div>
      <aside className="h-fit rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl">Order</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(quote.data?.lines ?? []).map((line) => (
            <li key={`${line.productId}-${line.variantId}`} className="flex justify-between gap-2">
              <span>{line.qty} × {line.name}{line.variantLabel ? ` (${line.variantLabel})` : ""}<br /><span className="text-xs text-muted">{line.retailerName}</span></span>
              <Money kobo={line.lineKobo} />
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between text-sm"><span>Items</span><Money kobo={quote.data?.subtotalKobo ?? 0} /></p>
        <p className="flex justify-between text-sm"><span>Discount</span><Money kobo={quote.data?.discountKobo ?? 0} /></p>
        <p className="flex justify-between text-sm"><span>Delivery</span>{quote.data?.deliveryKobo === null || quote.data?.deliveryKobo === undefined ? <span>Quote needed</span> : <Money kobo={quote.data.deliveryKobo} />}</p>
        <p className="mt-2 flex justify-between font-semibold"><span>Total</span>{quote.data?.totalKobo === null || quote.data?.totalKobo === undefined ? <span>Pending quote</span> : <Money kobo={quote.data.totalKobo} />}</p>
        {(quote.data?.retailerIds.length ?? 0) > 1 ? <p className="mt-2 text-xs text-muted">This cart has {quote.data?.retailerIds.length} retailers. Each one fulfils separately, and delivery is charged per retailer where a fee exists.</p> : null}
        {quote.data?.issues.map((issue) => <p key={issue} className="mt-2 text-sm text-danger">{issue}</p>)}
        <Button className="mt-4 w-full" type="submit" disabled={busy || items.length === 0}>{busy ? "Sending order…" : "Place order"}</Button>
      </aside>
    </form>
  );
}
