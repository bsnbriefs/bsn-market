import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminCreateSettlement, adminListRetailers, adminSetRetailerStatus } from "@/lib/market/admin";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/admin/retailers")({
  component: RetailersPage,
});

function RetailersPage() {
  const retailers = useQuery({ queryKey: ["admin-retailers"], queryFn: () => adminListRetailers() });
  const queryClient = useQueryClient();
  async function setStatus(id: string, status: string) {
    const reason = window.prompt("Reason for the retailer") ?? "";
    try {
      await adminSetRetailerStatus({ data: { id, status, reason } });
      await queryClient.invalidateQueries({ queryKey: ["admin-retailers"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Retailers</h1>
      <ul className="mt-4 space-y-3">
        {(retailers.data ?? []).map((retailer) => {
          const row = retailer as {
            id: string;
            business_name: string;
            status: string;
            city: string;
            state: string;
            email: string;
            is_sample: boolean;
            review_reason: string;
            description: string;
          };
          return (
            <li key={row.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <p className="font-semibold">{row.business_name} {row.is_sample ? "· sample catalogue" : ""}</p>
              <p className="capitalize text-muted">{row.status} · {row.city}, {row.state}</p>
              <p>{row.description}</p>
              {row.review_reason ? <p>Last note: {row.review_reason}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {["approved", "rejected", "suspended", "pending"].map((status) => (
                  <button key={status} type="button" className="min-h-11 rounded-full border border-border px-3 capitalize" onClick={() => void setStatus(row.id, status)}>{status}</button>
                ))}
              </div>
              <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); const reference = String(new FormData(event.currentTarget).get("reference") ?? ""); void adminCreateSettlement({ data: { retailerId: row.id, reference, note: "Recorded by admin" } }).then((result) => toast.success(result.note)).catch((error) => toast.error(errText(error))); }}>
                <Field name="reference" placeholder="Settlement reference" aria-label="Settlement reference" />
                <Button type="submit" variant="surface">Record settlement</Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
