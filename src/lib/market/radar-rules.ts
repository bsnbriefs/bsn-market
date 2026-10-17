export function priceAlertDecision(input: { status: string; retailerStatus: string; stock: number; priceKobo: number; targetKobo: number }): "wait" | "fire" {
  if (input.status !== "approved" || input.retailerStatus !== "approved") return "wait";
  if (input.stock < 1) return "wait";
  if (!Number.isInteger(input.targetKobo) || input.targetKobo < 1) return "wait";
  if (input.priceKobo > input.targetKobo) return "wait";
  return "fire";
}

export function stockAlertDecision(input: { status: string; retailerStatus: string; stock: number }): "wait" | "fire" {
  if (input.status !== "approved" || input.retailerStatus !== "approved") return "wait";
  if (input.stock < 1) return "wait";
  return "fire";
}

export function ownsAlert(ownerId: string, viewerId: string): boolean {
  return ownerId !== "" && ownerId === viewerId;
}
