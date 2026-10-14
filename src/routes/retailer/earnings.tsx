import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEarnings } from "@/lib/market/retailer";
import { bpsToPercent, formatNaira } from "@/lib/market/money";

export const Route = createFileRoute("/retailer/earnings")({
  head: () => ({ meta: [{ title: "Earnings · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const earnings = useQuery({ queryKey: ["earnings"], queryFn: () => getEarnings() });
  return (
    <div>
      <h1 className="font-display text-3xl">Earnings ledger</h1>
      <p className="text-sm text-muted">Commission was copied onto each item when the order was paid. Later rate changes do not rewrite these rows. Settlement here is a record, not a bank transfer.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted"><tr><th>Order</th><th>Value</th><th>Rate</th><th>Commission</th><th>Refunds</th><th>Settlement</th><th>Status</th></tr></thead>
          <tbody>
            {(earnings.data?.rows ?? []).map((row) => (
              <tr key={`${row.order_reference}-${row.product_value_kobo}`} className="border-t border-border">
                <td className="py-2">{row.order_reference}</td>
                <td>{formatNaira(Number(row.product_value_kobo))}</td>
                <td>{bpsToPercent(Number(row.commission_bps))}%</td>
                <td>{formatNaira(Number(row.commission_kobo))}</td>
                <td>{formatNaira(Number(row.refund_adjustment_kobo))}</td>
                <td>{formatNaira(Number(row.settlement_kobo))}</td>
                <td className="capitalize">{row.settlement_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-6 font-display text-2xl">Settlement batches</h2>
      <ul className="mt-2 text-sm">
        {(earnings.data?.settlements ?? []).map((row) => (
          <li key={row.id}>{formatNaira(Number(row.amount_kobo))} · {row.status} · {row.reference || "no reference"}</li>
        ))}
      </ul>
    </div>
  );
}
