import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { adminFulfil, adminListOrders, adminRecordRefund, adminSetQuote } from "@/lib/market/admin";
import { getMyOrder } from "@/lib/market/commerce";
import { formatNaira } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders() });
  const [open, setOpen] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ["order", open], enabled: Boolean(open), queryFn: () => getMyOrder({ data: open ?? "" }) });
  const queryClient = useQueryClient();
  async function run(task: () => Promise<unknown>) {
    try {
      await task();
      toast.success("Saved");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["order", open] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {(orders.data?.orders ?? []).map((order) => (
          <li key={order.id}>
            <button type="button" className="w-full rounded-2xl border border-border bg-surface p-3 text-left" onClick={() => setOpen(order.id)}>
              <span className="font-semibold">{order.reference}</span> · {order.status.replaceAll("_", " ")} · {order.customer_name} · {order.total_kobo === null ? "no total yet" : formatNaira(Number(order.total_kobo))}
            </button>
          </li>
        ))}
      </ul>
      {detail.data ? (
        <section className="mt-4 rounded-2xl border border-border bg-surface p-4 text-sm">
          <h2 className="font-display text-2xl">{detail.data.reference}</h2>
          {detail.data.status === "awaiting_quote" ? (
            <form className="mt-2 flex gap-2" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const feeNaira = String(new FormData(event.currentTarget).get("fee") ?? ""); void run(() => adminSetQuote({ data: { orderId: detail.data?.id, feeNaira } })); }}>
              <Field name="fee" required placeholder="Delivery fee per retailer, naira" aria-label="Delivery fee" />
              <Button type="submit">Set quote</Button>
            </form>
          ) : null}
          <ul className="mt-3 space-y-2">
            {detail.data.items.map((item) => (
              <li key={item.id}>
                {item.name} · {formatNaira(item.lineKobo)}
                <form className="mt-1 flex gap-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => adminRecordRefund({ data: { orderItemId: item.id, amountNaira: form.get("amount"), reason: form.get("reason") } })); }}>
                  <Field name="amount" placeholder="Refund naira" aria-label="Refund amount" />
                  <Field name="reason" placeholder="Reason" aria-label="Refund reason" />
                  <Button type="submit" variant="surface">Record refund</Button>
                </form>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-2">
            {detail.data.fulfilments.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2">
                <span className="capitalize">{row.status.replaceAll("_", " ")}</span>
                {["accepted", "preparing", "ready", "dispatched", "in_transit", "delivered", "failed", "cancelled"].map((status) => (
                  <button key={status} type="button" className="rounded-full border border-border px-2 py-1" onClick={() => void run(() => adminFulfil({ data: { id: row.id, status, note: "Admin update", proof: "" } }))}>{status}</button>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
