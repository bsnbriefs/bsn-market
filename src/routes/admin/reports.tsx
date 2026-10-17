import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { adminListReports, adminResolveReport } from "@/lib/market/admin";
import { Button, errText, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: () => adminListReports() });
  const queryClient = useQueryClient();
  async function onSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminResolveReport({ data: { id, status: form.get("status"), adminNote: form.get("adminNote") } });
      toast.success("Report updated. The listing was not changed.");
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Listing reports</h1>
      <p className="mt-2 text-sm text-muted">A report does not hide a product or suspend a retailer. Resolve it here, then use the retailer or product desk if you decide to act.</p>
      <ul className="mt-4 space-y-4">
        {(reports.data ?? []).map((report) => (
          <li key={report.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-semibold">{report.category} · {report.business_name}</p>
            <p className="text-muted">Product {report.product_id} · {report.status}</p>
            <p className="mt-2">{report.body}</p>
            <form className="mt-2 space-y-2" onSubmit={(event) => void onSubmit(event, report.id)}>
              <select name="status" defaultValue={report.status} aria-label="Report status" className="h-11 w-full rounded-xl border border-border bg-bg px-3">
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
              </select>
              <TextArea name="adminNote" placeholder="Internal note" defaultValue={report.admin_note} aria-label="Internal note" />
              <Button type="submit">Save</Button>
            </form>
          </li>
        ))}
      </ul>
      {reports.data?.length === 0 ? <p className="mt-4 text-sm text-muted">No reports yet.</p> : null}
    </div>
  );
}
