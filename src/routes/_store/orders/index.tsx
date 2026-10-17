import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/market/commerce";
import { formatLagos, formatNaira } from "@/lib/market/money";
import { EmptyState } from "@/components/market/ui";

export const Route = createFileRoute("/_store/orders/")({
  head: () => ({ meta: [{ title: "Orders · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, isPending } = useCurrentUserState();
  const orders = useQuery({ queryKey: ["orders", user?.id], enabled: Boolean(user), queryFn: () => listMyOrders() });
  if (isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  return (
    <div>
      <h1 className="font-display text-3xl">Your orders</h1>
      {orders.isLoading ? <p className="mt-3 text-sm text-muted">Loading orders…</p> : null}
      {orders.data && orders.data.length === 0 ? (
        <div className="mt-4"><EmptyState title="No orders yet" body="When you check out, the order will show here with its real payment status." /></div>
      ) : null}
      <ul className="mt-4 space-y-3">
        {(orders.data ?? []).map((order) => (
          <li key={order.id}>
            <Link to="/orders/$id" params={{ id: order.id }} className="block rounded-2xl border border-border bg-surface p-4 transition duration-200 hover:border-primary/40">
              <p className="font-semibold">{order.reference}</p>
              <p className="text-sm capitalize text-muted">{order.status.replaceAll("_", " ")}</p>
              <p className="text-sm">{order.total_kobo === null ? "Delivery quote pending" : formatNaira(Number(order.total_kobo))}</p>
              <p className="text-xs text-muted">{formatLagos(order.created_at)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
