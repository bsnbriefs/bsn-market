import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminCloseFair, adminListFair } from "@/lib/market/fair";
import { formatNaira } from "@/lib/market/money";
import { errText } from "@/components/market/ui";

export const Route = createFileRoute("/admin/fair")({
  head: () => ({ meta: [{ title: "Fair Deal · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminFair,
});

function AdminFair() {
  const rows = useQuery({ queryKey: ["admin-fair"], queryFn: () => adminListFair() });
  const queryClient = useQueryClient();
  return (
    <div>
      <h1 className="font-display text-3xl">Fair Deal</h1>
      <p className="text-sm text-muted">Requests and offer counts. Customer contact details are not listed here.</p>
      {rows.isLoading ? <p className="mt-3 text-sm text-muted">Loading…</p> : null}
      {rows.error ? <p className="mt-3 text-sm">{errText(rows.error)}</p> : null}
      <ul className="mt-4 space-y-2 text-sm">
        {(rows.data ?? []).map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3">
            <span>{row.name} · {row.status} · {formatNaira(Number(row.budget_kobo))} · {row.offer_count} offers</span>
            {row.status === "open" ? (
              <button type="button" className="font-semibold text-danger" onClick={() => void adminCloseFair({ data: row.id }).then(() => queryClient.invalidateQueries({ queryKey: ["admin-fair"] })).catch((error) => toast.error(errText(error)))}>Close</button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
