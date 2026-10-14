import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListProducts, adminModerateProduct } from "@/lib/market/admin";
import { formatNaira } from "@/lib/market/money";
import { errText } from "@/components/market/ui";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const queryClient = useQueryClient();
  async function moderate(id: string, status: string, featured: boolean) {
    const reason = status === "rejected" ? window.prompt("Why is this rejected?") ?? "" : "";
    try {
      await adminModerateProduct({ data: { id, status, reason, featured } });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(errText(error));
    }
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Product moderation</h1>
      <ul className="mt-4 space-y-3 text-sm">
        {(products.data ?? []).map((product) => (
          <li key={product.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-semibold">{product.name}</p>
            <p className="text-muted">{product.business_name} · {product.status} · {formatNaira(Number(product.price_kobo))} · stock {product.stock}{product.featured ? " · featured" : ""}</p>
            {product.moderation_reason ? <p>{product.moderation_reason}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-full bg-primary px-3 text-primary-fg" onClick={() => void moderate(product.id, "approved", product.featured)}>Approve</button>
              <button type="button" className="min-h-11 rounded-full border border-border px-3" onClick={() => void moderate(product.id, "rejected", false)}>Reject</button>
              <button type="button" className="min-h-11 rounded-full border border-border px-3" onClick={() => void moderate(product.id, "archived", false)}>Remove</button>
              <button type="button" className="min-h-11 rounded-full border border-border px-3" onClick={() => void moderate(product.id, product.status, !product.featured)}>{product.featured ? "Unfeature" : "Feature"}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
