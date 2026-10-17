import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/lib/market/admin";
import { formatNaira } from "@/lib/market/money";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: AdminHome,
});

function AdminHome() {
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview() });
  if (overview.isLoading) return <p className="text-sm">Loading figures…</p>;
  if (!overview.data) return <p>Could not load the overview.</p>;
  const data = overview.data;
  const rows = [
    ["Customers", String(data.customers)],
    ["Approved retailers", String(data.retailers.approved ?? 0)],
    ["Pending applications", String(data.retailers.pending ?? 0)],
    ["Products", String(Object.values(data.products).reduce((sum, n) => sum + Number(n), 0))],
    ["Awaiting product approval", String(data.products.pending ?? 0)],
    ["Orders", String(Object.values(data.orders).reduce((sum, n) => sum + Number(n), 0))],
    ["Fully delivered paid orders", String(data.fullyDelivered)],
    ["Gross merchandise value", formatNaira(data.gmvKobo)],
    ["Commission recorded (not profit)", formatNaira(data.commissionKobo)],
    ["Refunds recorded", formatNaira(data.refundsKobo)],
    ["Outstanding retailer settlements", formatNaira(data.outstandingKobo)],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl">Marketplace overview</h1>
      <p className="text-sm text-muted">Gross merchandise value is the value of paid goods. Commission is SEEK’s recorded fee, not profit. Paystack: {data.paystack ? "connected" : "not connected"}. Email: {data.emailConfigured ? "connected" : "not connected"}.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
