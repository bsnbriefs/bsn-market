/** Permission decisions that must not trust the browser. */

export function isPublicListing(productStatus: string, retailerStatus: string): boolean {
  return productStatus === "approved" && retailerStatus === "approved";
}

export function roleGrantAllowed(args: {
  actorIsAdmin: boolean;
  requestedRole: string;
  noAdminYet: boolean;
}): boolean {
  if (args.requestedRole !== "admin") return false;
  if (args.actorIsAdmin) return true;
  return args.noAdminYet;
}

export type OrderAccess = "admin" | "customer" | "retailer" | false;

export function orderAccess(args: {
  userId: string;
  isAdmin: boolean;
  actorRetailerId: string | null;
  orderUserId: string;
  itemRetailerIds: string[];
}): OrderAccess {
  if (args.isAdmin) return "admin";
  if (args.userId === args.orderUserId) return "customer";
  if (args.actorRetailerId && args.itemRetailerIds.includes(args.actorRetailerId)) return "retailer";
  return false;
}

export function retailerCanMutateProduct(actorRetailerId: string | null, productRetailerId: string): boolean {
  return actorRetailerId !== null && actorRetailerId === productRetailerId;
}

/** Customer fields a retailer needs to fulfil. Email stays with the customer and admins. */
export function fulfilmentContact<T extends { email?: string }>(access: OrderAccess, contact: T): T {
  if (access === "retailer") {
    const copy = { ...contact };
    delete copy.email;
    return copy;
  }
  return contact;
}

export function canReview(args: {
  buyerId: string;
  userId: string;
  fulfilmentStatus: string;
  alreadyReviewed: boolean;
}): boolean {
  return args.buyerId === args.userId && args.fulfilmentStatus === "delivered" && !args.alreadyReviewed;
}

export function canCustomerCancel(fulfilmentStatuses: string[]): boolean {
  if (fulfilmentStatuses.length === 0) return false;
  return fulfilmentStatuses.every((status) => status === "pending" || status === "rejected" || status === "cancelled");
}

const ALLOWED_FULFILMENT = new Set([
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "dispatched",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
]);

const TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["dispatched", "cancelled"],
  dispatched: ["in_transit", "failed"],
  in_transit: ["delivered", "failed"],
};

export function fulfilmentTransitionAllowed(from: string, to: string): boolean {
  if (!ALLOWED_FULFILMENT.has(to)) return false;
  return (TRANSITIONS[from] ?? []).includes(to);
}
