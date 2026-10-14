import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRetailerOrders, updateMyFulfilment } from "@/lib/market/retailer";
import { formatNaira } from "@/lib/market/money";
import { errText } from "@/components/market/ui";

const next: Record<string, string[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["dispatched", "cancelled"],
  dispatched: ["in_transit", "failed"],
  in_transit: ["delivered", "failed"],
};

export const Route = createFileRoute("/retailer/orders")({
  head: () => ({ meta: [{ title: "Fulfilment · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: RetailerOrders,
});

function RetailerOrders() {
  const orders = useQuery({ queryKey: ["retailer-orders"], queryFn: () => listRetailerOrders() });
  const queryClient = useQueryClient();
  async function move(id: string, status: string) {
    try {
      await updateMyFulfilment({ data: { id, status, note: "", proof: "" } });
      await queryClient.invalidateQueries({ queryKey: ["retailer-orders"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Orders to fulfil</h1>
      <p className="text-sm text-muted">You see the name, phone, and address needed to deliver. Customer email stays hidden.</p>
      <ul className="mt-4 space-y-3">
        {(orders.data ?? []).map((order) => (
          <li key={order.fulfilment_id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-semibold">{order.reference} · {order.status.replaceAll("_", " ")}</p>
            <p>{order.customer_name} · {order.phone}</p>
            <p>{order.address_line}, {order.city}, {order.state}</p>
            {order.instructions ? <p className="text-muted">{order.instructions}</p> : null}
            <ul className="mt-2">
              {order.items.map((item) => (
                <li key={item.name_snapshot}>{item.qty} × {item.name_snapshot}{item.variant_snapshot ? ` (${item.variant_snapshot})` : ""} · {formatNaira(Number(item.line_kobo))}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {(next[order.status] ?? []).map((status) => (
                <button key={status} type="button" className="min-h-11 rounded-full border border-border px-3 capitalize" onClick={() => void move(order.fulfilment_id, status)}>{status.replaceAll("_", " ")}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
