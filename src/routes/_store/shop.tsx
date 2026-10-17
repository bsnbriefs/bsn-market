import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { searchProducts } from "@/lib/market/catalog";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { EmptyState, ProductCardView, Reveal } from "@/components/market/ui";

const empty = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 };

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
    available: search.available === "1" ? "1" : "",
    page: Number(search.page) > 0 ? Number(search.page) : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => searchProducts({ data: deps }),
  head: ({ match }) => ({
    meta: [
      { title: match.search.q ? `Search “${match.search.q}” · SEEK` : "Shop · SEEK" },
      { name: "description", content: "Browse approved products from active retailers on SEEK." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold">{search.category ? data.categories.find((c) => c.slug === search.category)?.name ?? "Shop" : "Shop"}</h1>
        <Link to="/shop" search={empty} className="text-sm font-semibold text-primary">Clear</Link>
      </div>
      <p className="text-sm text-muted">{data.total} approved {data.total === 1 ? "product" : "products"}</p>
      {(() => {
        const current = data.categories.find((category) => category.slug === search.category);
        const parentSlug = current?.parent_slug || (current ? current.slug : "");
        const chips = parentSlug ? data.categories.filter((category) => category.parent_slug === parentSlug) : [];
        if (!search.category || chips.length === 0) return null;
        return (
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {current?.parent_slug ? (
              <Link to="/shop" search={{ ...search, category: current.parent_slug, page: 1 }} className="grid h-9 shrink-0 place-items-center rounded-full border border-border px-3 text-sm font-semibold">
                {data.categories.find((category) => category.slug === current.parent_slug)?.name ?? "Back"}
              </Link>
            ) : null}
            {chips.map((category) => (
              <Link
                key={category.slug}
                to="/shop"
                search={{ ...search, category: category.slug, page: 1 }}
                className={`grid h-9 shrink-0 place-items-center rounded-full px-3 text-sm font-semibold ${category.slug === search.category ? "bg-primary text-primary-fg" : "bg-cream text-fg"}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        );
      })()}
      <button
        type="button"
        className="mt-3 h-11 rounded-full border border-border bg-surface px-4 text-sm font-semibold md:hidden"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen(true)}
      >
        Filters and sort
      </button>
      {filtersOpen ? (
        <button type="button" aria-label="Close filters" className="fixed inset-0 z-[85] bg-ink/40 md:hidden" onClick={() => setFiltersOpen(false)} />
      ) : null}
      <div className={filtersOpen ? "bsn-fade fixed inset-x-0 bottom-0 z-[90] max-h-[80dvh] overflow-auto rounded-t-2xl bg-surface p-4 pb-8 md:static md:z-auto md:max-h-none md:overflow-visible md:rounded-none md:bg-transparent md:p-0" : "hidden md:block"}>
        <form className="grid gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4" action="/shop">
          <input type="hidden" name="page" value="1" />
          <input name="q" defaultValue={search.q} placeholder="Search" aria-label="Search" className="h-11 rounded-xl border border-border bg-bg px-3 text-base" />
          <select name="category" defaultValue={search.category} aria-label="Category" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
            <option value="">All categories</option>
            {data.categories.filter((category) => !category.parent_slug).map((parent) => (
              <optgroup key={parent.slug} label={parent.name}>
                <option value={parent.slug}>{parent.name}</option>
                {data.categories.filter((child) => child.parent_slug === parent.slug).map((child) => (
                  <option key={child.slug} value={child.slug}>{child.name}</option>
                ))}
              </optgroup>
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
          <select name="available" defaultValue={search.available} aria-label="Availability" className="h-11 rounded-xl border border-border bg-bg px-3 text-base">
            <option value="">Any stock</option>
            <option value="1">In stock</option>
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
          <Link to="/shop" search={empty} className="grid h-11 place-items-center text-sm font-semibold text-primary">Clear all</Link>
        </form>
      </div>
      <ActiveFilters search={search} categories={data.categories} retailers={data.retailers} />
      {data.products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matches" body="Try another word, or clear the filters. Only approved products from active retailers are shown." action={<Link to="/shop" search={empty} className="font-semibold text-primary">Clear filters</Link>} />
        </div>
      ) : (
        <div key={`${search.q}|${search.category}|${search.sort}|${search.page}|${search.available}`} className="bsn-fade mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.products.map((product, index) => (
            <Reveal key={product.id} className="min-w-0" delay={Math.min(index, 6) * 40}>
              <ProductCardView product={product} />
            </Reveal>
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

function ActiveFilters({
  search,
  categories,
  retailers,
}: {
  search: typeof empty;
  categories: { slug: string; name: string }[];
  retailers: { id: string; name: string }[];
}) {
  const clear = (patch: Partial<typeof empty>) => ({ ...search, ...patch, page: 1 });
  const chips: { label: string; next: typeof empty }[] = [];
  if (search.q) chips.push({ label: `“${search.q}”`, next: clear({ q: "" }) });
  if (search.category) chips.push({ label: categories.find((category) => category.slug === search.category)?.name ?? search.category, next: clear({ category: "" }) });
  if (search.brand) chips.push({ label: search.brand, next: clear({ brand: "" }) });
  if (search.retailer) chips.push({ label: retailers.find((retailer) => retailer.id === search.retailer)?.name ?? "Seller", next: clear({ retailer: "" }) });
  if (search.state) chips.push({ label: search.state, next: clear({ state: "" }) });
  if (search.available === "1") chips.push({ label: "In stock", next: clear({ available: "" }) });
  if (search.min) chips.push({ label: `From ₦${search.min}`, next: clear({ min: "" }) });
  if (search.max) chips.push({ label: `Up to ₦${search.max}`, next: clear({ max: "" }) });
  if (search.sort !== "newest") chips.push({ label: search.sort === "price_asc" ? "Price: low" : search.sort === "price_desc" ? "Price: high" : "Relevance", next: clear({ sort: "newest" }) });
  if (chips.length === 0) return null;
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto">
      {chips.map((chip) => (
        <Link key={chip.label} to="/shop" search={chip.next} className="h-8 shrink-0 rounded-full bg-cream px-3 text-xs font-semibold leading-8">
          {chip.label} ×
        </Link>
      ))}
    </div>
  );
}
