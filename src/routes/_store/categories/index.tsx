import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, CookingPot, Dumbbell, Headphones, Search, Shirt, ShoppingBasket, Smartphone, Sparkles, Wheat } from "lucide-react";
import { useState } from "react";
import { listCategoryTree } from "@/lib/market/catalog";
import { EmptyState } from "@/components/market/ui";

const icons: Record<string, typeof Shirt> = {
  fashion: Shirt,
  beauty: Sparkles,
  home: CookingPot,
  groceries: Wheat,
  phones: Smartphone,
  electronics: Headphones,
  baby: Baby,
  sports: Dumbbell,
};

export const Route = createFileRoute("/_store/categories/")({
  loader: () => listCategoryTree(),
  head: () => ({
    meta: [
      { title: "Categories · SEEK" },
      { name: "description", content: "Browse SEEK categories and the products inside them." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const parents = categories.filter((category) => !category.parent_slug);
  const shown = needle
    ? parents.filter((category) => {
        const children = categories.filter((child) => child.parent_slug === category.slug);
        return category.name.toLowerCase().includes(needle) || children.some((child) => child.name.toLowerCase().includes(needle));
      })
    : parents;
  return (
    <div>
      <h1 className="text-xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-muted">Choose a group, then a subcategory, then the products.</p>
      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search categories"
          aria-label="Search categories"
          className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none focus:border-primary"
        />
      </label>
      {shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No category matches" body="Try another word. Categories come from the catalogue, not from product names." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {shown.map((category) => {
            const Icon = icons[category.slug] ?? ShoppingBasket;
            const children = categories.filter((child) => child.parent_slug === category.slug);
            return (
              <Link
                key={category.slug}
                to="/categories/$slug"
                params={{ slug: category.slug }}
                search={{ sort: "newest" }}
                className="bsn-card flex min-h-28 flex-col justify-between rounded-2xl bg-cream p-3 active:scale-[0.98]"
              >
                <span className="grid size-9 place-items-center rounded-full bg-surface text-primary">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-5">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {children.length} {children.length === 1 ? "group" : "groups"} · {category.product_count} {category.product_count === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
