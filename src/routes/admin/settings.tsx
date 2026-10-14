import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { adminGetSettings, adminSaveSettings } from "@/lib/market/admin";
import { formatNaira } from "@/lib/market/money";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => adminGetSettings() });
  const queryClient = useQueryClient();
  const current = settings.data?.settings as { store_name?: string; tagline?: string; support_email?: string; support_phone?: string; contact_address?: string } | undefined;
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminSaveSettings({
        data: Object.fromEntries(form.entries()),
      });
      toast.success("Settings saved");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-3">
      <h1 className="font-display text-3xl">Site settings</h1>
      <Field name="storeName" defaultValue={current?.store_name ?? ""} placeholder="Store name" aria-label="Store name" />
      <Field name="tagline" defaultValue={current?.tagline ?? ""} placeholder="Tagline" aria-label="Tagline" />
      <Field name="supportEmail" defaultValue={current?.support_email ?? ""} placeholder="Support email" aria-label="Support email" />
      <Field name="supportPhone" defaultValue={current?.support_phone ?? ""} placeholder="Support phone" aria-label="Support phone" />
      <Field name="contactAddress" defaultValue={current?.contact_address ?? ""} placeholder="Contact address" aria-label="Contact address" />
      <h2 className="font-display text-2xl">Policy text</h2>
      <select name="policySlug" aria-label="Policy" className="h-11 w-full rounded-xl border border-border bg-surface px-3">
        {(settings.data?.policies ?? []).map((policy) => {
          const row = policy as { slug: string; title: string };
          return <option key={row.slug} value={row.slug}>{row.title}</option>;
        })}
      </select>
      <Field name="policyTitle" placeholder="Policy title to save" aria-label="Policy title" />
      <TextArea name="policyBody" placeholder="Paste the full policy to replace the selected one" aria-label="Policy body" />
      <h2 className="font-display text-2xl">Delivery fee</h2>
      <p className="text-sm text-muted">Only states you configure can be paid immediately. Others become quote requests. Current: {(settings.data?.zones ?? []).map((zone) => {
        const row = zone as { state: string; city: string; fee_kobo: number };
        return `${row.state}${row.city ? ` ${row.city}` : ""} ${formatNaira(Number(row.fee_kobo))}`;
      }).join(" · ")}</p>
      <select name="zoneState" aria-label="State fee" className="h-11 w-full rounded-xl border border-border bg-surface px-3">
        <option value="">State</option>
        {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
      </select>
      <Field name="zoneCity" placeholder="City, or leave blank for the whole state" aria-label="City fee" />
      <Field name="zoneFee" placeholder="Fee in naira" aria-label="Fee" />
      <h2 className="font-display text-2xl">Category and banner</h2>
      <Field name="categoryName" placeholder="New category name" aria-label="Category" />
      <Field name="campaignTitle" placeholder="Banner title" aria-label="Banner title" />
      <Field name="campaignSubtitle" placeholder="Banner subtitle" aria-label="Banner subtitle" />
      <Field name="campaignLink" placeholder="/shop" aria-label="Banner link" />
      <Button type="submit">Save settings</Button>
    </form>
  );
}
