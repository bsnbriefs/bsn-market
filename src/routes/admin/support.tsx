import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { adminListTickets, adminReplyTicket } from "@/lib/market/admin";
import { Button, errText, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/admin/support")({
  component: SupportAdmin,
});

function SupportAdmin() {
  const data = useQuery({ queryKey: ["admin-tickets"], queryFn: () => adminListTickets() });
  const queryClient = useQueryClient();
  async function reply(event: FormEvent<HTMLFormElement>, ticketId: string) {
    event.preventDefault();
    const body = String(new FormData(event.currentTarget).get("body") ?? "");
    try {
      await adminReplyTicket({ data: { ticketId, body } });
      toast.success("Reply saved");
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Support</h1>
      <ul className="mt-4 space-y-4">
        {(data.data?.tickets ?? []).map((ticket) => {
          const row = ticket as { id: string; subject: string; status: string };
          const messages = ((data.data?.messages ?? []) as { ticket_id: string; body: string }[]).filter((message) => message.ticket_id === row.id);
          return (
            <li key={row.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <p className="font-semibold">{row.subject}</p>
              <p className="capitalize text-muted">{row.status}</p>
              <ul className="mt-2 space-y-1">{messages.map((message) => <li key={message.body}>{message.body}</li>)}</ul>
              <form className="mt-2 space-y-2" onSubmit={(event) => void reply(event, row.id)}>
                <TextArea name="body" placeholder="Reply" aria-label="Reply" />
                <Button type="submit">Send reply</Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
