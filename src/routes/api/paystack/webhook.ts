import { createFileRoute } from "@tanstack/react-router";
import { getSql, withTransaction } from "@/lib/db";
import { notifyUser } from "@/lib/market/notify";
import { eventKey, paystackSignatureValid } from "@/lib/market/pay";
import { markPaidRecord, releaseOrderStock } from "@/lib/market/records";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "";
  const raw = await request.text();
  if (!paystackSignatureValid(raw, request.headers.get("x-paystack-signature"), secret)) {
    return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }
  const id = eventKey(raw);
  const sql = await getSql();
  try {
    await sql`insert into payment_events (id) values (${id})`;
  } catch {
    return Response.json({ ok: true, duplicate: true });
  }
  let payload: { event?: string; data?: { reference?: string; status?: string } } = {};
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const reference = payload.data?.reference;
  if (!reference) return Response.json({ ok: true, ignored: true });
  const { verifyPaystack } = await import("@/lib/market/paystack.server");
  const verified = await verifyPaystack(reference);
  if (!verified) return Response.json({ ok: false, error: "Could not verify with Paystack" }, { status: 400 });
  if (verified.status === "success") {
    try {
      const result = await withTransaction((tx) =>
        markPaidRecord(tx, {
          reference,
          paidKobo: Number(verified.amount),
          currency: verified.currency ?? "",
          providerStatus: "success",
        }),
      );
      if (!result.duplicate) {
        const buyers = await sql<{ user_id: string }>`select user_id from orders where id = ${result.orderId}`;
        if (buyers[0]) {
          await notifyUser(sql, {
            userId: buyers[0].user_id,
            title: "Payment confirmed",
            body: `${reference} was verified with Paystack.`,
            href: `/orders/${result.orderId}`,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment was not applied";
      return Response.json({ ok: false, error: message }, { status: 400 });
    }
    return Response.json({ ok: true });
  }
  if (verified.status === "failed" || payload.event === "charge.failed") {
    await withTransaction(async (tx) => {
      const rows = await tx<{ order_id: string; status: string }>`
        select order_id, status from payments where reference = ${reference} for update`;
      const payment = rows[0];
      if (!payment || payment.status === "success") return;
      await tx`update payments set status = 'failed', failure_reason = ${verified.status ?? "failed"} where reference = ${reference}`;
      const orders = await tx<{ status: string }>`select status from orders where id = ${payment.order_id} for update`;
      if (orders[0]?.status === "pending_payment") {
        await releaseOrderStock(tx, payment.order_id);
        await tx`update orders set status = 'payment_failed' where id = ${payment.order_id}`;
      }
    });
  }
  return Response.json({ ok: true });
}
