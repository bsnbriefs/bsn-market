import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Baby, CookingPot, Dumbbell, Headphones, Shirt, ShoppingBasket, Smartphone, Sparkles, Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { getStorefront } from "@/lib/market/catalog";
import type { ProductCard } from "@/lib/market/catalog";
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

const TABS = [
  ["for-you", "For you"],
  ["live", "Live deals"],
  ["new", "New arrivals"],
  ["drops", "Price drops"],
  ["flash", "Flash sales"],
  ["trending", "Trending"],
  ["categories", "Categories"],
] as const;

type TabId = (typeof TABS)[number][0];
type Storefront = Awaited<ReturnType<typeof getStorefront>>;
type Campaign = Storefront["campaigns"][number];

const FRESH_MS = 14 * 24 * 60 * 60 * 1000;

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

function stamp(data: Storefront) {
  return [
    data.campaigns.map((item) => `${item.id}:${item.ends_at ?? ""}:${item.starts_at ?? ""}`).join(","),
    data.newest.map((item) => item.id).join(","),
    data.offers.map((item) => `${item.id}:${item.priceKobo}`).join(","),
    data.trending.map((item) => item.id).join(","),
  ].join("|");
}

function phase(campaign: Campaign, now: number): "soon" | "live" | "ended" | "open" {
  const start = campaign.starts_at ? new Date(campaign.starts_at).getTime() : NaN;
  const end = campaign.ends_at ? new Date(campaign.ends_at).getTime() : NaN;
  if (!Number.isNaN(end) && end <= now) return "ended";
  if (!Number.isNaN(start) && start > now) return "soon";
  if (!Number.isNaN(end) && end > now) return "live";
  return "open";
}

function Home() {
  const loaded = Route.useLoaderData();
  const feed = useQuery({
    queryKey: ["storefront"],
    queryFn: () => getStorefront(),
    initialData: loaded,
    refetchInterval: 90_000,
    refetchOnWindowFocus: true,
  });
  const incoming = feed.data ?? loaded;
  const [shown, setShown] = useState(loaded);
  const [tab, setTab] = useState<TabId>("for-you");
  const [status, setStatus] = useState("");
  const changed = stamp(incoming) !== stamp(shown);
  const stories = dealStories(shown);

  async function refreshNow() {
    const result = await feed.refetch();
    if (result.data) {
      const next = stamp(result.data) !== stamp(shown);
      setShown(result.data);
      setStatus(next ? "Feed updated." : "No new deals since you last looked.");
    }
  }

  return (
    <div>
      <div className="bsn-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Barrister Street Network</p>
        <h1 className="mt-1 font-display text-4xl leading-tight md:text-5xl">{shown.tagline}</h1>
      </div>
      <div className="bsn-rise mt-4" style={{ animationDelay: "60ms" }}>
        <SearchForm hints={shown.categories.map((category) => ({ label: category.name, category: category.slug }))} />
      </div>
      <section className="mt-4 rounded-3xl bg-fg p-3 text-surface" aria-label="Live deals">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">Live deals</h2>
          <button type="button" onClick={() => void refreshNow()} className="text-xs font-semibold text-surface/80">
            {feed.isFetching ? "Checking…" : "Refresh"}
          </button>
        </div>
        {feed.isFetching ? <div className="bsn-pulse mb-2 h-0.5 rounded-full bg-accent" aria-hidden /> : null}
        {stories.length === 0 ? (
          <p className="px-1 pb-2 text-sm text-surface/70">Nothing is published yet.</p>
        ) : (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
            {stories.map((story) => (
              <a
                key={story.key}
                href={story.href}
                className="group w-[4.75rem] shrink-0 snap-start text-center"
              >
                <span className={`relative mx-auto grid size-16 place-items-center overflow-hidden rounded-full bg-surface/10 ring-2 transition duration-200 group-hover:scale-105 group-active:scale-95 ${story.status === "LIVE" ? "ring-accent" : "ring-surface/30"}`}>
                  {story.image ? <img src={story.image} alt="" className="size-full object-cover" /> : <span className="text-[10px]">{story.status}</span>}
                  {story.status === "LIVE" ? <span className="bsn-live absolute right-1 top-1 size-2 rounded-full bg-accent" /> : null}
                </span>
                <span className="mt-1 block truncate text-[11px] font-medium">{story.title}</span>
                <span className="text-[10px] uppercase tracking-wide text-surface/60">{story.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>
      {changed ? (
        <button
          type="button"
          onClick={() => {
            setShown(incoming);
            setStatus("");
          }}
          className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg"
        >
          New deals available
        </button>
      ) : null}
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
      <div className="sticky top-14 z-20 -mx-4 mt-4 border-b border-border bg-bg/95 px-4 backdrop-blur">
        <div className="flex snap-x gap-2 overflow-x-auto py-2" role="tablist" aria-label="Market feed">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`h-10 shrink-0 snap-start rounded-full px-3 text-sm font-semibold transition-colors ${tab === id ? "bg-fg text-surface" : "text-muted hover:bg-surface"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div key={tab} className="bsn-fade">
        <Feed tab={tab} data={shown} />
      </div>
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
    </div>
  );
}

function Feed({ tab, data }: { tab: TabId; data: Storefront }) {
  const now = Date.now();
  const flash = data.campaigns.filter((item) => phase(item, now) === "live");
  if (tab === "categories") {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {data.categories.map((category) => {
          const Icon = icons[category.slug] ?? ShoppingBasket;
          return (
            <Link
              key={category.slug}
              to="/shop"
              search={{ q: "", category: category.slug, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }}
              className="group flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-xs font-medium transition duration-200 hover:border-primary/50 active:scale-95"
            >
              <Icon className="size-5 text-primary transition duration-200 group-hover:-translate-y-0.5" />
              {category.name}
            </Link>
          );
        })}
      </div>
    );
  }
  if (tab === "flash") {
    if (flash.length === 0) {
      return (
        <div className="mt-4">
          <EmptyState title="No flash sale is running" body="A countdown appears only after an administrator sets a real end time on a promotion. Marked-down prices stay on Price drops." />
        </div>
      );
    }
    return (
      <div className="mt-4 space-y-4">
        {flash.map((campaign) => (
          <a key={campaign.id} href={campaign.link_path || "/shop"} className="block overflow-hidden rounded-3xl border border-border bg-fg text-surface">
            {campaign.image_url ? <img src={campaign.image_url} alt="" className="h-44 w-full object-cover" /> : null}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-fg">Flash sale</p>
              <h2 className="font-display text-3xl">{campaign.title}</h2>
              <p className="mt-1 text-sm text-surface/80">{campaign.subtitle}</p>
              {campaign.ends_at ? <p className="mt-2 text-sm font-semibold">Ends in <Countdown endsAt={campaign.ends_at} /></p> : null}
            </div>
          </a>
        ))}
      </div>
    );
  }
  if (tab === "trending") {
    return data.trending.length === 0 ? (
      <div className="mt-4">
        <EmptyState title="Nothing is trending yet" body="This list is ranked from paid orders. It stays empty until customers actually buy." />
      </div>
    ) : (
      <ProductRail title="Trending" note="Ranked from completed orders, not a paid placement." products={data.trending} />
    );
  }
  if (tab === "drops") {
    return data.offers.length === 0 ? (
      <div className="mt-4">
        <EmptyState title="No price drops" body="A drop is a product whose current price is below its compare-at price." />
      </div>
    ) : (
      <ProductRail title="Price drops" note="Compare-at price is higher. This is not a timed countdown." products={data.offers} />
    );
  }
  if (tab === "new") {
    return <ProductRail title="New arrivals" note="Newest approved listings." products={data.newest} />;
  }
  if (tab === "live") {
    const running = data.campaigns.filter((item) => phase(item, now) !== "ended");
    return (
      <div>
        {running.map((campaign) => (
          <p key={campaign.id} className="mt-4 text-sm text-muted">
            {campaign.title}
            {phase(campaign, now) === "live" ? " is a timed sale." : " is a published promotion with no end time, so it is not a countdown."}
          </p>
        ))}
        <ProductRail title="Available offers" products={data.offers.length ? data.offers : data.newest} />
      </div>
    );
  }
  return (
    <div>
      <CampaignStage campaigns={data.campaigns.filter((item) => phase(item, now) !== "ended")} />
      <ProductRail title="For you" products={data.featured.length ? data.featured : data.newest} />
    </div>
  );
}

type Story = { key: string; href: string; image: string; title: string; status: string };

function dealStories(data: Storefront): Story[] {
  const now = Date.now();
  const stories: Story[] = [];
  const seen = new Set<string>();
  for (const campaign of data.campaigns) {
    const state = phase(campaign, now);
    stories.push({
      key: `c-${campaign.id}`,
      href: campaign.link_path || "/shop",
      image: campaign.image_url,
      title: campaign.title,
      status: state === "live" ? "LIVE" : state === "soon" ? "SOON" : state === "ended" ? "ENDED" : "PROMO",
    });
  }
  const pushProduct = (product: ProductCard, status: string) => {
    if (seen.has(product.id) || stories.length >= 14) return;
    seen.add(product.id);
    stories.push({
      key: `${status}-${product.id}`,
      href: `/product/${product.id}`,
      image: product.imageUrl,
      title: product.name,
      status,
    });
  };
  for (const product of data.newest) {
    if (product.createdAt && now - new Date(product.createdAt).getTime() < FRESH_MS) pushProduct(product, "NEW");
  }
  for (const product of data.offers) pushProduct(product, "DROP");
  for (const product of data.trending) pushProduct(product, "TRENDING");
  return stories;
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return <span>time unavailable</span>;
  const left = end - now;
  if (left <= 0) return <span>Ended</span>;
  const total = Math.floor(left / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return (
    <span className="tabular-nums">
      {hours}h {minutes}m {seconds}s
    </span>
  );
}

function CampaignStage({ campaigns }: { campaigns: Campaign[] }) {
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
  const state = phase(campaign, Date.now());
  return (
    <div className="relative mt-5" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <a href={campaign.link_path || "/shop"} className="relative block overflow-hidden rounded-3xl border border-border bg-fg">
        <div className="relative h-56 md:h-80">
          {campaigns.map((item, itemIndex) =>
            item.image_url ? (
              <img
                key={item.id}
                src={item.image_url}
                alt=""
                className={`bsn-drift absolute inset-0 h-full w-full object-cover bsn-slide ${itemIndex === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
              />
            ) : null,
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-fg via-fg/25 to-transparent" />
          <div key={campaign.id} className="bsn-fade absolute inset-x-0 bottom-0 p-5 text-surface md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-fg">
              {state === "live" ? "Live" : "Promotion"}
            </p>
            <h2 className="max-w-xl font-display text-3xl md:text-5xl">{campaign.title}</h2>
            <p className="mt-2 max-w-lg text-sm text-surface/85">{campaign.subtitle}</p>
            {state === "live" && campaign.ends_at ? (
              <p className="mt-2 text-sm font-semibold">Ends in <Countdown endsAt={campaign.ends_at} /></p>
            ) : null}
          </div>
        </div>
      </a>
      {count > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {campaigns.map((item, itemIndex) => (
              <button
                key={item.id}
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
