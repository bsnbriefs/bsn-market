import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cancelAlert, listMyAlerts, updatePriceAlert } from "@/lib/market/radar";
import { formatNaira } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/_store/radar")({
  head: () => ({ meta: [{ title: "Price Radar · SEEK" }, { name: "description", content: "Know when it's the right time to buy." }] }),
  component: RadarPage,
});

function RadarPage() {
  const { user, isPending } = useCurrentUserState();
  const alerts = useQuery({ queryKey: ["radar", user?.id], enabled: Boolean(user), queryFn: () => listMyAlerts() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState("");
  if (isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  async function run(id: string, task: () => Promise<unknown>, success: string) {
    setBusy(id);
    try {
      await task();
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: ["radar"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Price Radar</h1>
      <p className="mt-1 text-sm text-muted">Know when it's the right time to buy. Alerts use the live listing price and stock. SEEK does not keep a price history.</p>
      {alerts.isLoading ? <p className="mt-4 text-sm text-muted">Loading alerts…</p> : null}
      {alerts.data?.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No alerts yet. Open a product and set a target, or ask to be told when an unavailable product is back.</p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {(alerts.data ?? []).map((alert) => (
          <li key={alert.id} className="rounded-2xl border border-border bg-surface p-3">
            <div className="flex gap-3">
              {alert.image_url ? <img src={alert.image_url} alt="" className="size-16 rounded-xl object-cover" /> : <span className="size-16 rounded-xl bg-cream" />}
              <div className="min-w-0">
                <Link to="/product/$slug" params={{ slug: alert.slug }} className="font-semibold">{alert.name}</Link>
                <p className="text-sm text-muted">Current price {formatNaira(Number(alert.price_kobo))} · {Number(alert.stock) > 0 ? `${alert.stock} in stock` : "Out of stock"}</p>
                <p className="text-sm">{alert.kind === "price" ? `Target ${formatNaira(Number(alert.target_kobo ?? 0))} or less` : "Notify when it is available"}</p>
                <p className="text-xs font-semibold text-link">{alert.status === "triggered" ? "Notified" : alert.product_status === "approved" ? "Watching" : "Not currently listed"}</p>
              </div>
            </div>
            {alert.status === "active" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {alert.kind === "price" ? (
                  <form className="flex flex-1 gap-2" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(alert.id, () => updatePriceAlert({ data: { id: alert.id, targetNaira: form.get("targetNaira") } }), "Target updated"); }}>
                    <Field name="targetNaira" inputMode="decimal" placeholder="New target" aria-label={`New target for ${alert.name}`} />
                    <Button type="submit" disabled={busy === alert.id}>Save</Button>
                  </form>
                ) : null}
                <button type="button" className="text-sm font-semibold text-danger" disabled={busy === alert.id} onClick={() => void run(alert.id, () => cancelAlert({ data: alert.id }), "Alert removed")}>Remove</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
