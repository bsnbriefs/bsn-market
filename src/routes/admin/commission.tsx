import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { adminListRules, adminSavePromo, adminSaveRule } from "@/lib/market/admin";
import { bpsToPercent } from "@/lib/market/money";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/admin/commission")({
  component: CommissionPage,
});

function CommissionPage() {
  const data = useQuery({ queryKey: ["rules"], queryFn: () => adminListRules() });
  const queryClient = useQueryClient();
  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminSaveRule({ data: { scope: form.get("scope"), percent: form.get("percent"), categoryId: form.get("categoryId"), retailerId: form.get("retailerId"), effectiveFrom: form.get("effectiveFrom") } });
      toast.success("Rule saved. Old orders keep their original rate.");
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Commission</h1>
        <p className="text-sm text-muted">Default starter rate is 10%. Retailers cannot change this. A new rule applies only to orders placed after its effective date.</p>
        <ul className="mt-3 text-sm">
          {(data.data?.rules ?? []).map((rule) => {
            const row = rule as { id: string; scope: string; bps: number; effective_from: string; active: boolean };
            return <li key={row.id}>{row.scope} · {bpsToPercent(Number(row.bps))}% from {String(row.effective_from).slice(0, 10)}</li>;
          })}
        </ul>
        <form onSubmit={saveRule} className="mt-3 grid gap-2 md:grid-cols-2">
          <select name="scope" aria-label="Scope" className="h-11 rounded-xl border border-border bg-surface px-3">
            <option value="default">Default</option>
            <option value="category">Category</option>
            <option value="retailer">Retailer</option>
          </select>
          <Field name="percent" required placeholder="Percent, e.g. 10" aria-label="Percent" />
          <select name="categoryId" aria-label="Category" className="h-11 rounded-xl border border-border bg-surface px-3">
            <option value="">Category if needed</option>
            {(data.data?.categories ?? []).map((category) => {
              const row = category as { id: string; name: string };
              return <option key={row.id} value={row.id}>{row.name}</option>;
            })}
          </select>
          <select name="retailerId" aria-label="Retailer" className="h-11 rounded-xl border border-border bg-surface px-3">
            <option value="">Retailer if needed</option>
            {(data.data?.retailers ?? []).map((retailer) => {
              const row = retailer as { id: string; business_name: string };
              return <option key={row.id} value={row.id}>{row.business_name}</option>;
            })}
          </select>
          <Field name="effectiveFrom" type="date" aria-label="Effective date" />
          <Button type="submit">Add rule</Button>
        </form>
      </div>
      <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void adminSavePromo({ data: { code: form.get("code"), percent: form.get("percent"), minNaira: form.get("minNaira") } }).then(() => toast.success("Code saved")).catch((error) => toast.error(errText(error))); }}>
        <h2 className="font-display text-2xl">Discount code</h2>
        <Field name="code" placeholder="CODE" aria-label="Code" />
        <Field name="percent" placeholder="Percent off" aria-label="Percent off" />
        <Field name="minNaira" placeholder="Minimum subtotal in naira" aria-label="Minimum" />
        <Button type="submit" variant="surface">Save code</Button>
      </form>
    </div>
  );
}
