import { createFileRoute, Link } from "@tanstack/react-router";
import { searchProducts } from "@/lib/market/catalog";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { EmptyState, ProductCardView } from "@/components/market/ui";

const empty = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 };

export const Route = createFileRoute("/_store/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
    retailer: typeof search.retailer === "string" ? search.retailer : "",
    brand: typeof search.brand === "string" ? search.brand : "",
    state: typeof search.state === "string" ? search.state : "",
    min: typeof search.min === "string" ? search.min : "",
    max: typeof search.max === "string" ? search.max : "",
    sort: typeof search.sort === "string" ? search.sort : "newest",
    page: Number(search.page) > 0 ? Number(search.page) : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => searchProducts({ data: deps }),
  head: ({ match }) => ({
    meta: [
      { title: match.search.q ? `Search “${match.search.q}” · BSN Market` : "Shop · BSN Market" },
      { name: "description", content: "Browse approved products from active retailers on BSN Market." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <div>
      <h1 className="font-display text-3xl">{search.category ? data.categories.find((c) => c.slug === search.category)?.name ?? "Shop" : "Shop"}</h1>
      <p className="text-sm text-muted">{data.total} approved {data.total === 1 ? "product" : "products"}</p>
      <form className="mt-4 grid gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4" action="/shop">
        <input name="q" defaultValue={search.q} placeholder="Search" aria-label="Search" className="h-11 rounded-xl border border-border bg-bg px-3 text-base" />
        <select name="category" defaultValue={search.category} aria-label="Category" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
          <option value="">All categories</option>
          {data.categories.map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}</option>
          ))}
        </select>
        <select name="retailer" defaultValue={search.retailer} aria-label="Retailer" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
          <option value="">All retailers</option>
          {data.retailers.map((retailer) => (
            <option key={retailer.id} value={retailer.id}>{retailer.name}</option>
          ))}
        </select>
        <select name="brand" defaultValue={search.brand} aria-label="Brand" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
          <option value="">All brands</option>
          {data.brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select name="state" defaultValue={search.state} aria-label="Fulfilled from" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
          <option value="">Fulfilled from anywhere</option>
          {NIGERIAN_STATES.filter((state) => data.states.includes(state)).map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        <input name="min" defaultValue={search.min} inputMode="decimal" placeholder="Min ₦" aria-label="Minimum price in naira" className="h-11 rounded-xl border border-border bg-bg px-3 text-base" />
        <input name="max" defaultValue={search.max} inputMode="decimal" placeholder="Max ₦" aria-label="Maximum price in naira" className="h-11 rounded-xl border border-border bg-bg px-3 text-base" />
        <select name="sort" defaultValue={search.sort} aria-label="Sort" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
          <option value="newest">Newest</option>
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg sm:col-span-2 lg:col-span-1" type="submit">
          Apply filters
        </button>
      </form>
      {data.products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matches" body="Try another word, or clear the filters. Only approved products from active retailers are shown." action={<Link to="/shop" search={empty} className="font-semibold text-primary">Clear filters</Link>} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.products.map((product, index) => (
            <ProductCardView key={product.id} product={product} className="bsn-rise" style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }} />
          ))}
        </div>
      )}
      {pages > 1 ? (
        <div className="mt-6 flex gap-2">
          {search.page > 1 ? <Link to="/shop" search={{ ...search, page: search.page - 1 }} className="rounded-full border border-border bg-surface px-4 py-2 text-sm">Previous</Link> : null}
          <span className="px-2 py-2 text-sm text-muted">Page {search.page} of {pages}</span>
          {search.page < pages ? <Link to="/shop" search={{ ...search, page: search.page + 1 }} className="rounded-full border border-border bg-surface px-4 py-2 text-sm">Next</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
