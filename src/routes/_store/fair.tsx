import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createFairRequest, listMyFairRequests } from "@/lib/market/fair";
import { formatNaira } from "@/lib/market/money";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/_store/fair")({
  head: () => ({ meta: [{ title: "Fair Deal · SEEK" }, { name: "description", content: "Your budget. Your choice. The right deal." }] }),
  component: FairPage,
});

const categories = ["", "fashion", "beauty", "home", "groceries", "phones", "electronics", "baby", "sports"];

function FairPage() {
  const { user, isPending } = useCurrentUserState();
  const requests = useQuery({ queryKey: ["fair", user?.id], enabled: Boolean(user), queryFn: () => listMyFairRequests() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  if (isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await createFairRequest({
        data: {
          name: form.get("name"),
          description: form.get("description"),
          category: form.get("category"),
          brand: form.get("brand"),
          specs: form.get("specs"),
          condition: form.get("condition"),
          qty: Number(form.get("qty")),
          budgetNaira: form.get("budgetNaira"),
          state: form.get("state"),
          note: form.get("note"),
          days: Number(form.get("days")),
        },
      });
      toast.success("Request posted. Retailers can offer a real listing.");
      event.currentTarget.reset();
      await queryClient.invalidateQueries({ queryKey: ["fair"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Fair Deal</h1>
        <p className="mt-1 text-sm text-muted">Your budget. Your choice. The right deal. Retailers offer products they already list. Choosing an offer does not pay for it.</p>
      </div>
      <form className="space-y-2 rounded-2xl border border-border bg-surface p-4" onSubmit={(event) => void onSubmit(event)}>
        <h2 className="font-display text-2xl">Ask for a product</h2>
        <Field name="name" required placeholder="Product name" aria-label="Product name" />
        <TextArea name="description" required placeholder="What you need" aria-label="Description" />
        <div className="grid grid-cols-2 gap-2">
          <select name="category" aria-label="Category" className="h-11 rounded-xl border border-border bg-bg px-3">
            {categories.map((category) => <option key={category} value={category}>{category || "Any category"}</option>)}
          </select>
          <Field name="brand" placeholder="Preferred brand" aria-label="Preferred brand" />
        </div>
        <Field name="specs" placeholder="Storage, size, or other needs" aria-label="Specifications" />
        <div className="grid grid-cols-2 gap-2">
          <select name="condition" aria-label="Condition" className="h-11 rounded-xl border border-border bg-bg px-3" defaultValue="either">
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="either">Either</option>
          </select>
          <Field name="qty" type="number" min={1} max={10} defaultValue={1} required aria-label="Quantity" />
        </div>
        <Field name="budgetNaira" required inputMode="decimal" placeholder="Maximum budget in naira" aria-label="Budget" />
        <div className="grid grid-cols-2 gap-2">
          <select name="state" aria-label="State" className="h-11 rounded-xl border border-border bg-bg px-3" defaultValue="">
            <option value="">Any state</option>
            {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
          </select>
          <select name="days" aria-label="How long the request stays open" className="h-11 rounded-xl border border-border bg-bg px-3" defaultValue={7}>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </div>
        <Field name="note" placeholder="Anything else" aria-label="Note" />
        <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post request"}</Button>
      </form>
      <section>
        <h2 className="font-display text-2xl">My requests</h2>
        {requests.isLoading ? <p className="mt-2 text-sm text-muted">Loading requests…</p> : null}
        {requests.data?.length === 0 ? <p className="mt-2 text-sm text-muted">No requests yet. Post one and approved retailers can answer with a real product.</p> : null}
        <ul className="mt-3 space-y-2">
          {(requests.data ?? []).map((request) => (
            <li key={request.id} className="rounded-2xl border border-border bg-surface p-3">
              <Link to="/fair/$id" params={{ id: request.id }} className="font-semibold">{request.name}</Link>
              <p className="text-sm text-muted">{request.status} · {request.offer_count} offers · budget {formatNaira(Number(request.budget_kobo))} · qty {request.qty}</p>
              <p className="text-xs text-muted">{request.latest_offer ? `Latest offer ${new Date(request.latest_offer).toLocaleDateString("en-NG")}` : "No offers yet"}{request.state ? ` · ${request.state}` : ""}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
