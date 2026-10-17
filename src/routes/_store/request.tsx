import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createProductRequest, listMyRequests } from "@/lib/market/account";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { Button, errText, Field, TextArea } from "@/components/market/ui";
import { formatNaira } from "@/lib/market/money";

export const Route = createFileRoute("/_store/request")({
  head: () => ({
    meta: [
      { title: "Request a product · SEEK" },
      { name: "description", content: "Ask SEEK to source a product that is not listed. A request is not an order." },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const { user, isPending } = useCurrentUserState();
  const requests = useQuery({ queryKey: ["requests", user?.id], enabled: Boolean(user), queryFn: () => listMyRequests() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await createProductRequest({
        data: {
          name: form.get("name"),
          description: form.get("description"),
          category: form.get("category"),
          brand: form.get("brand"),
          budgetMin: form.get("budgetMin"),
          budgetMax: form.get("budgetMax"),
          state: form.get("state"),
          city: form.get("city"),
          contactPreference: form.get("contact"),
        },
      });
      toast.success(`Request ${result.reference} received. This is not an order.`);
      event.currentTarget.reset();
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl">Request a product</h1>
        <p className="mt-2 text-sm text-muted">If it is not in the shop, ask for it. An administrator can look for a retailer and send a quotation. You only buy if you later accept a real listing and pay.</p>
        {isPending ? <p className="mt-4 text-sm">Loading…</p> : null}
        {!isPending && !user ? <RedirectToSignIn /> : null}
        {user ? (
          <form onSubmit={onSubmit} className="mt-4 space-y-2">
            <Field name="name" required placeholder="Product name" aria-label="Product name" />
            <TextArea name="description" placeholder="Description" aria-label="Description" />
            <Field name="category" placeholder="Category" aria-label="Category" />
            <Field name="brand" placeholder="Preferred brand or model" aria-label="Brand" />
            <div className="grid grid-cols-2 gap-2">
              <Field name="budgetMin" inputMode="decimal" placeholder="Budget from ₦" aria-label="Minimum budget" />
              <Field name="budgetMax" inputMode="decimal" placeholder="Budget to ₦" aria-label="Maximum budget" />
            </div>
            <select name="state" aria-label="State" className="h-11 w-full rounded-xl border border-border bg-surface px-3" defaultValue="Lagos">
              {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
            </select>
            <Field name="city" placeholder="City" aria-label="City" />
            <select name="contact" aria-label="Contact preference" className="h-11 w-full rounded-xl border border-border bg-surface px-3" defaultValue="in_app">
              <option value="in_app">Contact me in the app</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
            </select>
            <Button type="submit" disabled={busy}>Submit request</Button>
          </form>
        ) : null}
      </div>
      <div>
        <h2 className="font-display text-2xl">Your requests</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(requests.data ?? []).map((request) => (
            <li key={request.reference} className="rounded-2xl border border-border bg-surface p-3">
              <p className="font-semibold">{request.reference}</p>
              <p>{request.name}</p>
              <p className="capitalize text-muted">{request.status.replaceAll("_", " ")}</p>
              {request.quotation_kobo ? <p>Quotation {formatNaira(Number(request.quotation_kobo))}. {request.quotation_note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
