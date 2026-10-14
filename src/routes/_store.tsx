import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreShell } from "@/components/market/shell";

export const Route = createFileRoute("/_store")({
  component: () => (
    <StoreShell>
      <Outlet />
    </StoreShell>
  ),
});
