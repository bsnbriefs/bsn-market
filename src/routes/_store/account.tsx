import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimMarketplace, deleteAddress, getMe, markNotificationsRead, saveAddress, updateProfile } from "@/lib/market/account";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/_store/account")({
  head: () => ({ meta: [{ title: "Account · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({ queryKey: ["me", user?.id], enabled: Boolean(user), queryFn: () => getMe() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  if (isPending || me.isLoading) return <p className="text-sm text-muted">Loading account…</p>;
  if (!user) return <RedirectToSignIn />;
  if (!me.data) return <p>Could not load your account.</p>;
  const data = me.data;
  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await task();
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Account</h1>
          <p className="text-sm text-muted">{data.profile.email}</p>
        </div>
        <UserButton />
      </div>
      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <Link to="/orders" className="rounded-full bg-surface px-3 py-2">Orders</Link>
        <Link to="/retailer" className="rounded-full bg-surface px-3 py-2">Sell</Link>
        {data.roles.includes("admin") ? <Link to="/admin" className="rounded-full bg-primary px-3 py-2 text-primary-fg">Admin</Link> : null}
      </div>
      {!data.adminExists ? (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-display text-xl">No marketplace owner yet</h2>
          <p className="text-sm text-muted">The first person to claim this becomes the only bootstrap administrator. After that, only an admin can grant access.</p>
          <Button className="mt-3" type="button" disabled={busy} onClick={() => run(() => claimMarketplace(), "You are the marketplace administrator")}>Claim administrator role</Button>
        </div>
      ) : null}
      <form className="space-y-2" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => updateProfile({ data: { fullName: form.get("fullName"), phone: form.get("phone") } }), "Profile saved"); }}>
        <h2 className="font-display text-2xl">Profile</h2>
        <Field name="fullName" defaultValue={data.profile.fullName} placeholder="Full name" aria-label="Full name" />
        <Field name="phone" defaultValue={data.profile.phone} placeholder="Phone" aria-label="Phone" />
        <Button type="submit" disabled={busy}>Save profile</Button>
      </form>
      <section>
        <h2 className="font-display text-2xl">Addresses</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {data.addresses.map((address) => (
            <li key={address.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
              <p>{address.recipient}, {address.line}, {address.city}, {address.state}{address.is_default ? " · default" : ""}</p>
              <button type="button" className="text-danger" onClick={() => run(() => deleteAddress({ data: address.id }), "Address removed")}>Remove</button>
            </li>
          ))}
        </ul>
        <form className="mt-3 grid gap-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => saveAddress({ data: { recipient: form.get("recipient"), phone: form.get("phone"), line: form.get("line"), state: form.get("state"), city: form.get("city"), instructions: form.get("instructions"), isDefault: true } }), "Address saved"); }}>
          <Field name="recipient" required placeholder="Recipient" aria-label="Recipient" />
          <Field name="phone" required placeholder="Phone" aria-label="Address phone" />
          <Field name="line" required placeholder="Address" aria-label="Address line" />
          <div className="grid grid-cols-2 gap-2">
            <select name="state" aria-label="State" className="h-11 rounded-xl border border-border bg-surface px-3" defaultValue="Lagos">
              {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
            </select>
            <Field name="city" required placeholder="City or LGA" aria-label="City" />
          </div>
          <Field name="instructions" placeholder="Instructions" aria-label="Instructions" />
          <Button type="submit" variant="surface" disabled={busy}>Save address</Button>
        </form>
      </section>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Notifications</h2>
          {data.unread > 0 ? <button type="button" className="text-sm font-semibold text-primary" onClick={() => run(() => markNotificationsRead(), "Marked read")}>Mark read</button> : null}
        </div>
        {data.notifications.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing yet.</p> : (
          <ul className="mt-2 space-y-2">
            {data.notifications.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p>{item.body}</p>
                <p className="text-xs text-muted">Email: {item.email_status === "sent" ? "sent" : item.email_status === "failed" ? "the provider rejected it" : "not sent — email is not configured"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
