import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cancelMyOrder, confirmSandboxPayment, getMyOrder, refreshPayment, requestReturn } from "@/lib/market/commerce";
import { createReview } from "@/lib/market/account";
import { formatLagos, formatNaira } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/_store/orders/$id")({
  head: () => ({ meta: [{ title: "Order · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const order = useQuery({ queryKey: ["order", id, user?.id], enabled: Boolean(user), queryFn: () => getMyOrder({ data: id }) });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!order.data || order.data.payment?.provider !== "paystack" || order.data.status !== "pending_payment") return;
    refreshPayment({ data: id })
      .then(() => queryClient.invalidateQueries({ queryKey: ["order", id] }))
      .catch(() => undefined);
  }, [id, order.data, queryClient]);
  if (isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  if (order.isLoading) return <p className="text-sm text-muted">Loading order…</p>;
  if (!order.data) return <p>This order is not available on your account.</p>;
  const data = order.data;
  async function act(task: () => Promise<unknown>, success: string) {
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
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{data.reference}</p>
        <h1 className="font-display text-3xl capitalize">{data.status.replaceAll("_", " ")}</h1>
        <p className="text-sm text-muted">{formatLagos(data.createdAt)}</p>
      </div>
      {data.payment?.provider === "sandbox" && data.status === "pending_payment" ? (
        <div className="rounded-2xl border border-accent bg-surface p-4">
          <h2 className="font-display text-xl">Test payment</h2>
          <p className="mt-1 text-sm text-muted">Paystack is not connected, so this cannot take a real card payment. Confirming here only marks a sandbox payment. It is not a Paystack success.</p>
          <Button className="mt-3" type="button" disabled={busy} onClick={() => act(() => confirmSandboxPayment({ data: id }), "Sandbox payment recorded")}>Record test payment</Button>
        </div>
      ) : null}
      {data.status === "awaiting_quote" ? <p className="rounded-2xl bg-surface p-4 text-sm">We do not have a delivery fee for this address yet. An administrator must set one before you can pay. Nothing has been charged.</p> : null}
      <section className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <h2 className="font-semibold">Delivery</h2>
        <p>{data.contact.name}</p>
        {"email" in data.contact && data.contact.email ? <p>{data.contact.email}</p> : null}
        <p>{data.contact.phone}</p>
        <p>{data.contact.line}, {data.contact.city}, {data.contact.state}</p>
        {data.contact.instructions ? <p className="text-muted">{data.contact.instructions}</p> : null}
      </section>
      <ul className="space-y-3">
        {data.items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-medium">{item.qty} × {item.name}{item.variant ? ` · ${item.variant}` : ""}</p>
            <p className="text-sm text-muted">Sold by {item.retailerName}</p>
            <p className="text-sm">{formatNaira(item.lineKobo)}</p>
            {data.access === "customer" && data.fulfilments.some((row) => row.retailerId === item.retailerId && row.status === "delivered") && item.returnEligible ? (
              <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); const reason = String(new FormData(event.currentTarget).get("reason") ?? ""); void act(() => requestReturn({ data: { orderItemId: item.id, reason } }), "Return requested. It is not a completed refund."); }}>
                <Field name="reason" placeholder="Reason for return" aria-label="Return reason" />
                <Button type="submit" variant="surface" disabled={busy}>Request return</Button>
              </form>
            ) : null}
            {data.access === "customer" && data.fulfilments.some((row) => row.retailerId === item.retailerId && row.status === "delivered") ? (
              <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void act(() => createReview({ data: { orderItemId: item.id, rating: Number(form.get("rating")), body: String(form.get("body") ?? "") } }), "Review saved"); }}>
                <select name="rating" aria-label="Rating" className="h-11 rounded-xl border border-border bg-bg px-2" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                </select>
                <Field name="body" placeholder="Review (optional)" aria-label="Review" />
                <Button type="submit" variant="surface" disabled={busy}>Review</Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="flex justify-between"><span>Items</span><span>{formatNaira(data.subtotalKobo)}</span></p>
        <p className="flex justify-between"><span>Discount</span><span>{formatNaira(data.discountKobo)}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{data.deliveryKobo === null ? "Not quoted" : formatNaira(data.deliveryKobo)}</span></p>
        <p className="mt-1 flex justify-between font-semibold"><span>Total</span><span>{data.totalKobo === null ? "—" : formatNaira(data.totalKobo)}</span></p>
        {data.payment ? <p className="mt-2 text-muted">Payment {data.payment.reference} · {data.payment.provider} · {data.payment.status}</p> : <p className="mt-2 text-muted">No payment record yet.</p>}
      </section>
      <section>
        <h2 className="font-display text-xl">Fulfilment</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {data.fulfilments.map((row) => (
            <li key={row.id} className="rounded-xl border border-border bg-surface px-3 py-2 capitalize">{row.status.replaceAll("_", " ")}{row.note ? ` · ${row.note}` : ""}</li>
          ))}
        </ul>
      </section>
      {data.canCancel ? <Button type="button" variant="danger" disabled={busy} onClick={() => act(() => cancelMyOrder({ data: id }), "Order cancelled and stock released")}>Cancel order</Button> : null}
    </div>
  );
}
