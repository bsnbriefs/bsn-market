import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe } from "@/lib/market/account";
import { Desk } from "@/components/market/shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/retailers", label: "Retailers" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/commission", label: "Commission" },
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/fair", label: "Fair Deal" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/support", label: "Support" },
  { to: "/admin/settings", label: "Settings" },
];

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({ queryKey: ["me", user?.id], enabled: Boolean(user), queryFn: () => getMe() });
  if (isPending || me.isLoading) return <p className="p-6 text-sm">Loading…</p>;
  if (!user) return <RedirectToSignIn />;
  if (!me.data?.roles.includes("admin")) {
    return <p className="p-6">This desk is only for marketplace administrators. If nobody has claimed it yet, do that from Account.</p>;
  }
  return (
    <Desk title="Admin" links={links}>
      <Outlet />
    </Desk>
  );
}
