import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Desk } from "@/components/market/shell";

export const Route = createFileRoute("/retailer")({
  component: RetailerLayout,
});

const links = [
  { to: "/retailer", label: "Overview" },
  { to: "/retailer/products", label: "Products" },
  { to: "/retailer/orders", label: "Orders" },
  { to: "/retailer/earnings", label: "Earnings" },
  { to: "/retailer/apply", label: "Application" },
];

function RetailerLayout() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <p className="p-6 text-sm">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  return (
    <Desk title="Retailer" links={links}>
      <Outlet />
    </Desk>
  );
}
