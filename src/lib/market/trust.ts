export const reportCategories = ["misleading", "counterfeit", "incorrect", "suspicious", "fraud", "other"] as const;

export type ReportCategory = (typeof reportCategories)[number];

export function retailerBadge(profileStatus: string, latestVerification: string | null): string | null {
  if (profileStatus === "approved" && latestVerification === "approved") return "Approved retailer";
  return null;
}

export function reportCategory(value: string): ReportCategory | null {
  return reportCategories.includes(value as ReportCategory) ? (value as ReportCategory) : null;
}

export function canReadReport(viewerId: string, reporterId: string, isAdmin: boolean): boolean {
  return isAdmin || viewerId === reporterId;
}
