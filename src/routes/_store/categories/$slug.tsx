import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Baby, CookingPot, Dumbbell, Headphones, Shirt, ShoppingBasket, Smartphone, Sparkles, Wheat } from "lucide-react";
import { listCategoryTree, searchProducts } from "@/lib/market/catalog";
import { EmptyState, ProductGrid } from "@/components/market/ui";

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

const sorts = [
  ["newest", "Newest"],
  ["price_asc", "Price: low"],
  ["price_desc", "Price: high"],
] as const;

export const Route = createFileRoute("/_store/categories/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    sort: search.sort === "price_asc" || search.sort === "price_desc" ? search.sort : "newest",
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const tree = await listCategoryTree();
    const current = tree.categories.find((category) => category.slug === params.slug);
    if (!current) throw notFound();
    const listing = await searchProducts({
      data: {
        q: "",
        category: params.slug,
        retailer: "",
        brand: "",
        state: "",
        min: "",
        max: "",
        sort: deps.sort,
        available: "",
        page: 1,
      },
    });
    return { tree, current, listing };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.current.name ?? "Category"} · SEEK` }],
  }),
  component: CategoryPage,
  notFoundComponent: () => (
    <EmptyState title="That category is not in the catalogue" body="Go back to the category list and choose one that exists." />
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { sort } = Route.useSearch();
  const { tree, current, listing } = Route.useLoaderData();
  const parent = current.parent_slug ? tree.categories.find((category) => category.slug === current.parent_slug) : undefined;
  const children = tree.categories.filter((category) => category.parent_slug === current.slug);
  const Icon = icons[current.slug] ?? icons[parent?.slug ?? ""] ?? ShoppingBasket;
  const shop = { q: "", category: current.slug, retailer: "", brand: "", state: "", min: "", max: "", sort, available: "", page: 1 };
  return (
    <div>
      <p className="text-xs font-semibold text-primary">
        <Link to="/categories" className="hover:underline">Categories</Link>
        {parent ? (
          <>
            {" / "}
            <Link to="/categories/$slug" params={{ slug: parent.slug }} search={{ sort: "newest" }} className="hover:underline">{parent.name}</Link>
          </>
        ) : null}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">{current.name}</h1>
          <p className="text-sm text-muted">{current.product_count} approved {current.product_count === 1 ? "product" : "products"}</p>
        </div>
      </div>
      {children.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {children.map((child) => (
            <Link
              key={child.slug}
              to="/categories/$slug"
              params={{ slug: child.slug }}
              search={{ sort: "newest" }}
              className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm font-semibold active:scale-[0.98]"
            >
              {child.name}
              <span className="mt-1 block text-xs font-normal text-muted">{child.product_count} {child.product_count === 1 ? "product" : "products"}</span>
            </Link>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {sorts.map(([id, label]) => (
          <Link
            key={id}
            to="/categories/$slug"
            params={{ slug }}
            search={{ sort: id }}
            className={`h-8 rounded-full px-3 text-xs font-semibold leading-8 ${sort === id ? "bg-primary text-primary-fg" : "bg-cream text-fg"}`}
          >
            {label}
          </Link>
        ))}
        <Link to="/shop" search={shop} className="h-8 rounded-full border border-border px-3 text-xs font-semibold leading-8">
          More filters
        </Link>
      </div>
      {listing.products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No products in this category" body="Approved products from active retailers will appear here. Drafts and paused stalls stay hidden." />
        </div>
      ) : (
        <>
          <ProductGrid products={listing.products} />
          {listing.total > listing.products.length ? (
            <Link to="/shop" search={shop} className="mt-4 inline-block text-sm font-semibold text-primary">
              See all {listing.total} in the shop
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
