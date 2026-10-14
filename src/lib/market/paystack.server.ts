export async function verifyPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await response.json()) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string; reference?: string };
  };
  if (!response.ok || !body.status || !body.data) return null;
  return body.data;
}
