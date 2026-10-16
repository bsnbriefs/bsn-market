import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, CookingPot, Dumbbell, Headphones, Shirt, ShoppingBasket, Smartphone, Sparkles, Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { getStorefront } from "@/lib/market/catalog";
import { SearchForm } from "@/components/market/shell";
import { EmptyState, ProductRail, Reveal } from "@/components/market/ui";

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
  const hasProducts = data.featured.length + data.newest.length > 0;
  return (
    <div>
      <div className="bsn-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Barrister Street Network</p>
        <h1 className="mt-1 font-display text-4xl leading-tight md:text-5xl">{data.tagline}</h1>
      </div>
      <div className="bsn-rise mt-4" style={{ animationDelay: "60ms" }}>
        <SearchForm hints={data.categories.map((category) => ({ label: category.name, category: category.slug }))} />
      </div>
      <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
        {data.categories.map((category, index) => {
          const Icon = icons[category.slug] ?? ShoppingBasket;
          return (
            <Link
              key={category.slug}
              to="/shop"
              search={{ q: "", category: category.slug, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }}
              style={{ animationDelay: `${80 + index * 35}ms` }}
              className="bsn-rise group flex h-20 w-28 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-xs font-medium transition duration-200 hover:border-primary/50 hover:shadow-md active:scale-95"
            >
              <Icon className="size-5 text-primary transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
              {category.name}
            </Link>
          );
        })}
      </div>
      <CampaignStage campaigns={data.campaigns} />
      <p className="mt-3 text-sm text-muted">
        Starter listings are sample stock so you can try the shop. They are not retailer partnerships. Approve real retailers before taking live orders.
      </p>
      {hasProducts ? (
        <>
          <ProductRail title="Featured" products={data.featured} />
          <ProductRail title="Best sellers" note="Ranked from completed orders, not a paid placement." products={data.trending} />
          <ProductRail title="New arrivals" products={data.newest} />
          <ProductRail title="Deals" note="Marked down from the compare-at price. Not a timed countdown." products={data.offers} />
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
      <Reveal className="mt-10">
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["Checked at checkout", "The server prices the cart again before Paystack opens."],
            ["Many retailers", "Each seller ships their own goods. One cart can hold more than one."],
            ["Real stock only", "Sold-out options stay on the product. Nothing is reserved until you pay."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-4">
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </section>
      </Reveal>
      <section className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          ["Delivery", "Fees only where an administrator has set them.", "/policies/delivery"],
          ["Returns", "Eligibility is shown on each product.", "/policies/returns"],
          ["Support", "Send a message from your account.", "/support"],
        ].map(([title, body, href]) => (
          <a key={title} href={href} className="rounded-2xl border border-border bg-surface p-4 transition duration-200 hover:border-primary/40">
            <h3 className="font-display text-xl">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </a>
        ))}
      </section>
    </div>
  );
}

function CampaignStage({
  campaigns,
}: {
  campaigns: { title: string; subtitle: string; image_url: string; link_path: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = campaigns.length;
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);
  if (count === 0) return null;
  const campaign = campaigns[index] ?? campaigns[0];
  return (
    <div
      className="bsn-rise relative mt-5"
      style={{ animationDelay: "120ms" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        to="/shop"
        search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }}
        className="relative block overflow-hidden rounded-3xl border border-border bg-fg"
      >
        <div className="relative h-64 md:h-96">
          {campaigns.map((item, itemIndex) =>
            item.image_url ? (
              <img
                key={item.title}
                src={item.image_url}
                alt=""
                className={`bsn-drift absolute inset-0 h-full w-full object-cover bsn-slide ${itemIndex === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
              />
            ) : null,
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-fg via-fg/25 to-transparent" />
          <div key={campaign.title} className="bsn-fade absolute inset-x-0 bottom-0 p-5 text-surface md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-fg">This week</p>
            <h2 className="max-w-xl font-display text-3xl md:text-5xl">{campaign.title}</h2>
            <p className="mt-2 max-w-lg text-sm text-surface/85">{campaign.subtitle}</p>
          </div>
        </div>
      </Link>
      {count > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" role="tablist" aria-label="Promotions">
            {campaigns.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Show ${item.title}`}
                onClick={() => setIndex(itemIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${itemIndex === index ? "w-8 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="h-10 rounded-full border border-border bg-surface px-3 text-sm" onClick={() => setIndex((current) => (current - 1 + count) % count)}>
              Previous
            </button>
            <button type="button" className="h-10 rounded-full border border-border bg-surface px-3 text-sm" onClick={() => setIndex((current) => (current + 1) % count)}>
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
