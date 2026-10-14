import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { adminListRequests, adminUpdateRequest } from "@/lib/market/admin";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

const statuses = ["under_review", "retailer_contacted", "quotation_available", "customer_considering", "converted", "unavailable", "closed"];

export const Route = createFileRoute("/admin/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const requests = useQuery({ queryKey: ["admin-requests"], queryFn: () => adminListRequests() });
  const queryClient = useQueryClient();
  async function onSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminUpdateRequest({ data: { id, status: form.get("status"), adminNote: form.get("adminNote"), quotationNote: form.get("quotationNote"), quotationNaira: form.get("quotationNaira") } });
      toast.success("Request updated. The customer still has to accept a real product before it becomes an order.");
      await queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Product requests</h1>
      <ul className="mt-4 space-y-4">
        {(requests.data ?? []).map((request) => {
          const row = request as { id: string; reference: string; name: string; description: string; status: string; state: string; city: string };
          return (
            <li key={row.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <p className="font-semibold">{row.reference} · {row.name}</p>
              <p>{row.description}</p>
              <p className="text-muted">{row.state} {row.city} · {row.status.replaceAll("_", " ")}</p>
              <form className="mt-2 space-y-2" onSubmit={(event) => void onSubmit(event, row.id)}>
                <select name="status" defaultValue={row.status} aria-label="Status" className="h-11 w-full rounded-xl border border-border bg-bg px-3">
                  {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
                <TextArea name="adminNote" placeholder="Internal note" aria-label="Internal note" />
                <Field name="quotationNaira" placeholder="Quotation in naira" aria-label="Quotation" />
                <TextArea name="quotationNote" placeholder="What the customer should know" aria-label="Quotation note" />
                <Button type="submit">Update request</Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
