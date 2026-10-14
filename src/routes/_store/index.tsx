import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, CookingPot, Dumbbell, Headphones, Shirt, ShoppingBasket, Smartphone, Sparkles, Wheat } from "lucide-react";
import { getStorefront } from "@/lib/market/catalog";
import { SearchForm } from "@/components/market/shell";
import { EmptyState, ProductRail } from "@/components/market/ui";

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

export const Route = createFileRoute("/_store/")({
  loader: () => getStorefront(),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.storeName ?? "BSN Market"} · Shop` },
      { name: "description", content: loaderData?.tagline ?? "Your Market. Your Choice. Delivered." },
    ],
  }),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const campaign = data.campaigns[0];
  const hasProducts = data.featured.length + data.newest.length > 0;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Barrister Street Network</p>
      <h1 className="mt-1 font-display text-4xl leading-tight md:text-5xl">{data.tagline}</h1>
      <div className="mt-4">
        <SearchForm />
      </div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {data.categories.map((category) => {
          const Icon = icons[category.slug] ?? ShoppingBasket;
          return (
            <Link
              key={category.slug}
              to="/shop"
              search={{ q: "", category: category.slug, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }}
              className="flex h-16 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-xs font-medium"
            >
              <Icon className="size-4 text-primary" />
              {category.name}
            </Link>
          );
        })}
      </div>
      {campaign ? (
        <Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }} className="mt-5 block overflow-hidden rounded-3xl border border-border bg-surface">
          {campaign.image_url ? (
            <img src={campaign.image_url} alt="" className="h-48 w-full object-cover md:h-72" />
          ) : null}
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">This week</p>
            <h2 className="font-display text-3xl">{campaign.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">{campaign.subtitle}</p>
          </div>
        </Link>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        Starter listings are sample stock so you can try the shop. They are not retailer partnerships. Approve real retailers before taking live orders.
      </p>
      {hasProducts ? (
        <>
          <ProductRail title="Featured" products={data.featured} />
          <ProductRail title="Popular right now" products={data.trending} />
          <ProductRail title="New arrivals" products={data.newest} />
          <ProductRail title="Special offers" products={data.offers} />
        </>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="The market is quiet"
            body="No approved products are live yet. Retailers can apply, and an administrator publishes listings."
            action={
              <Link to="/retailer/apply" className="font-semibold text-primary">
                Apply to sell
              </Link>
            }
          />
        </div>
      )}
      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          ["Delivery", "Fees only where an administrator has set them.", "/policies/delivery"],
          ["Returns", "Eligibility is shown on each product.", "/policies/returns"],
          ["Support", "Send a message from your account.", "/support"],
        ].map(([title, body, href]) => (
          <a key={title} href={href} className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="font-display text-xl">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
