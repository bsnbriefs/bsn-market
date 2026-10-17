import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { applyRetailer } from "@/lib/market/account";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/retailer/apply")({
  head: () => ({ meta: [{ title: "Apply to sell · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: ApplyPage,
});

function ApplyPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await applyRetailer({
        data: {
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          state: form.get("state"),
          city: form.get("city"),
          categories: form.get("categories"),
          description: form.get("description"),
          catalogueNote: form.get("catalogueNote"),
          registrationNumber: form.get("registrationNumber"),
          termsAccepted: form.get("terms") === "on",
        },
      });
      setDone(true);
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  if (done) {
    return (
      <div>
        <h1 className="font-display text-3xl">Application received</h1>
        <p className="mt-2 text-sm">An administrator reviews new retailers. You cannot publish products or receive live orders until you are approved.</p>
        <Link to="/retailer" className="mt-3 inline-block font-semibold text-primary">Go to the desk</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-2">
      <h1 className="font-display text-3xl">Retailer application</h1>
      <p className="text-sm text-muted">Signing in is not the same as being approved. Read the <Link to="/policies/$slug" params={{ slug: "retailer-agreement" }} className="text-primary">retailer agreement</Link>.</p>
      <Field name="businessName" required placeholder="Business name" aria-label="Business name" />
      <Field name="contactName" required placeholder="Contact person" aria-label="Contact person" />
      <Field name="email" type="email" placeholder="Business email" aria-label="Business email" />
      <Field name="phone" required placeholder="Phone" aria-label="Phone" />
      <Field name="address" required placeholder="Business address" aria-label="Address" />
      <select name="state" aria-label="State" className="h-11 w-full rounded-xl border border-border bg-surface px-3" defaultValue="Lagos">
        {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
      </select>
      <Field name="city" required placeholder="City" aria-label="City" />
      <Field name="categories" placeholder="Product categories you sell" aria-label="Categories" />
      <TextArea name="description" placeholder="About the business" aria-label="Description" />
      <TextArea name="catalogueNote" placeholder="What you plan to list" aria-label="Catalogue" />
      <Field name="registrationNumber" placeholder="Registration number (optional)" aria-label="Registration number" />
      <label className="flex items-start gap-2 text-sm"><input name="terms" type="checkbox" required className="mt-1" /> I agree to the marketplace terms and retailer agreement.</label>
      <Button type="submit" disabled={busy}>Submit application</Button>
    </form>
  );
}
