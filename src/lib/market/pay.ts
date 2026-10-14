import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function signPaystack(raw: string, secret: string): string {
  return createHmac("sha512", secret).update(raw).digest("hex");
}

export function paystackSignatureValid(raw: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const digest = signPaystack(raw, secret);
  const a = Buffer.from(digest);
  const b = Buffer.from(header.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function eventKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function paymentAccepted(args: {
  orderKobo: number;
  paidKobo: number;
  currency: string;
  status: string;
}): boolean {
  return (
    args.status === "success" &&
    args.currency === "NGN" &&
    Number.isInteger(args.paidKobo) &&
    args.paidKobo === args.orderKobo &&
    args.orderKobo > 0
  );
}

/** Sandbox confirmation is allowed only when Paystack is not configured. */
export function sandboxConfirmAllowed(paystackConfigured: boolean, provider: string): boolean {
  return !paystackConfigured && provider === "sandbox";
}
