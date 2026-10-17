import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { getRetailerDashboard, submitAdCampaign } from "@/lib/market/retailer";
import { formatNaira } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/retailer/")({
  head: () => ({ meta: [{ title: "Retailer · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: RetailerHome,
});

function RetailerHome() {
  const dash = useQuery({ queryKey: ["retailer-dash"], queryFn: () => getRetailerDashboard() });
  if (dash.isLoading) return <p className="text-sm text-muted">Loading your desk…</p>;
  if (dash.error) {
    return (
      <div>
        <h1 className="font-display text-3xl">Sell on SEEK</h1>
        <p className="mt-2 text-sm">{errText(dash.error)}</p>
        <Link to="/retailer/apply" className="mt-3 inline-block font-semibold text-primary">Start an application</Link>
      </div>
    );
  }
  const data = dash.data;
  if (!data) return null;
  const cards = [
    ["Orders", String(data.totalOrders)],
    ["Still to fulfil", String(data.pending)],
    ["Delivered", String(data.delivered)],
    ["Cancelled or rejected", String(data.cancelled)],
    ["Gross sales", formatNaira(data.grossKobo)],
    ["Commission", formatNaira(data.commissionKobo)],
    ["Refund adjustments", formatNaira(data.refundKobo)],
    ["Net settlement", formatNaira(data.settlementKobo)],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl">{data.retailer.business_name}</h1>
      <p className="text-sm capitalize text-muted">Status: {data.retailer.status}. Figures come from your orders only.</p>
      {data.retailer.status !== "approved" ? <p className="mt-2 text-sm">You cannot publish live products until an administrator approves the business.</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-display text-2xl">Low stock</h2>
      {data.lowStock.length === 0 ? <p className="text-sm text-muted">No products at 5 or below.</p> : (
        <ul className="mt-2 text-sm">{data.lowStock.map((item) => <li key={item.id}>{item.name} · {item.stock} left</li>)}</ul>
      )}
      <h2 className="mt-6 font-display text-2xl">Recent orders</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {data.recent.map((row) => <li key={row.reference}>{row.reference} · {row.status}</li>)}
      </ul>
      {data.retailer.status === "approved" ? <AdRequest /> : null}
    </div>
  );
}

function AdRequest() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await submitAdCampaign({ data: { title: form.get("title"), subtitle: form.get("subtitle"), productId: form.get("productId") } });
      toast.success("Banner request sent for approval. It is not live yet.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-2">
      <h2 className="font-display text-2xl">Request a homepage banner</h2>
      <p className="text-sm text-muted">An administrator must approve it. There is no charge yet. Approved banners are labelled Sponsored.</p>
      <Field name="title" required placeholder="Headline" aria-label="Headline" />
      <Field name="subtitle" placeholder="Supporting text" aria-label="Supporting text" />
      <Field name="productId" placeholder="Approved product id, optional" aria-label="Product id" />
      <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Submit for approval"}</Button>
    </form>
  );
}
