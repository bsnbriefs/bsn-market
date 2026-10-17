import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createTicket, listMyTickets } from "@/lib/market/account";
import { getStorefront } from "@/lib/market/catalog";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/_store/support")({
  loader: () => getStorefront(),
  head: () => ({ meta: [{ title: "Support · SEEK" }, { name: "description", content: "Contact SEEK support." }] }),
  component: SupportPage,
});

function SupportPage() {
  const store = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const tickets = useQuery({ queryKey: ["tickets", user?.id], enabled: Boolean(user), queryFn: () => listMyTickets() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await createTicket({ data: { subject: form.get("subject"), body: form.get("body") } });
      toast.success("Message sent to the marketplace team");
      event.currentTarget.reset();
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Customer support</h1>
      <p className="mt-2 text-sm text-muted">SEEK connects you with retailers. The retailer supplies the product. Use this form for marketplace help.</p>
      <dl className="mt-4 space-y-1 text-sm">
        <div><dt className="text-muted">Email</dt><dd>{store.supportEmail || "Not set yet. An administrator can add it."}</dd></div>
        <div><dt className="text-muted">Phone</dt><dd>{store.supportPhone || "Not set yet."}</dd></div>
      </dl>
      <ul className="mt-4 space-y-1 text-sm font-semibold text-primary">
        <li><Link to="/policies/$slug" params={{ slug: "terms" }}>Terms</Link></li>
        <li><Link to="/policies/$slug" params={{ slug: "privacy" }}>Privacy</Link></li>
        <li><Link to="/policies/$slug" params={{ slug: "returns" }}>Returns</Link></li>
        <li><Link to="/policies/$slug" params={{ slug: "delivery" }}>Delivery</Link></li>
        <li><Link to="/policies/$slug" params={{ slug: "prohibited" }}>Prohibited products</Link></li>
        <li><Link to="/policies/$slug" params={{ slug: "retailer-agreement" }}>Retailer agreement</Link></li>
      </ul>
      {isPending ? <p className="mt-4 text-sm">Loading…</p> : null}
      {!isPending && !user ? <p className="mt-4 text-sm"><Link to="/login" className="font-semibold text-primary">Sign in</Link> to send a message.</p> : null}
      {user ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <Field name="subject" required placeholder="Subject" aria-label="Subject" />
          <TextArea name="body" required placeholder="How can we help?" aria-label="Message" />
          <Button type="submit" disabled={busy}>Send</Button>
        </form>
      ) : null}
      <ul className="mt-4 space-y-2 text-sm">
        {(tickets.data ?? []).map((ticket) => (
          <li key={ticket.id} className="rounded-2xl border border-border bg-surface p-3">
            <p className="font-semibold">{ticket.subject}</p>
            <p className="capitalize text-muted">{ticket.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
