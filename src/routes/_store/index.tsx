import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getStorefront, searchProducts } from "@/lib/market/catalog";
import { EmptyState, ProductGrid } from "@/components/market/ui";

type Storefront = Awaited<ReturnType<typeof getStorefront>>;
type Campaign = Storefront["campaigns"][number];

const shopNewest = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest" as const, available: "", page: 1 };

export const Route = createFileRoute("/_store/")({
  loader: () => getStorefront(),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.storeName ?? "SEEK"} · Shop` },
      { name: "description", content: "Discover. Choose. Shop with Confidence." },
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
  const [category, setCategory] = useState("");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const changed = stamp(incoming) !== stamp(shown);
  const now = Date.now();
  const live = shown.campaigns.filter((item) => phase(item, now) !== "ended");
  const platform = live.filter((item) => !item.retailer_id);
  const sponsored = live.filter((item) => item.retailer_id);
  const hero = platform.length > 0 ? platform : sponsored;
  const sellerAds = platform.length > 0 ? sponsored : [];
  const parents = shown.categories.filter((item) => !item.parent_slug);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tabRefs.current[category]?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [category]);

  return (
    <div>
      <h1 className="sr-only">SEEK. Discover. Choose. Shop with Confidence.</h1>
      <section aria-label="Categories" className="bsn-rise">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          <button
            type="button"
            ref={(node) => { tabRefs.current[""] = node; }}
            aria-pressed={category === ""}
            onClick={() => setCategory("")}
            className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors duration-200 ${category === "" ? "bg-primary text-primary-fg" : "border border-border"}`}
          >
            All
          </button>
          {parents.map((item) => (
            <button
              key={item.slug}
              type="button"
              ref={(node) => { tabRefs.current[item.slug] = node; }}
              aria-pressed={category === item.slug}
              onClick={() => setCategory(item.slug)}
              className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-all duration-200 active:scale-95 ${category === item.slug ? "scale-105 bg-primary text-primary-fg" : "bg-cream text-fg"}`}
            >
              {item.name}
            </button>
          ))}
          <Link to="/categories" className="h-8 shrink-0 whitespace-nowrap rounded-full border border-border px-3 text-xs font-semibold leading-8">
            Browse all
          </Link>
        </div>
      </section>
      <PromoCarousel slides={buildSlides(shown, hero)} />
      <DiscoverStrip trending={shown.trending} newest={shown.newest} />
      <nav aria-label="Shopping" className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        <Link to="/categories" className="rounded-2xl bg-cream px-2 py-3 transition-transform active:scale-[0.98]">Categories</Link>
        {shown.offers.length > 0 ? <a href="#deals" className="rounded-2xl bg-cream px-2 py-3 transition-transform active:scale-[0.98]">Deals</a> : <Link to="/shop" search={shopNewest} className="rounded-2xl bg-cream px-2 py-3 transition-transform active:scale-[0.98]">Shop</Link>}
        <a href="#new" className="rounded-2xl bg-cream px-2 py-3 transition-transform active:scale-[0.98]">New</a>
        <Link to="/cart" className="rounded-2xl bg-cream px-2 py-3 transition-transform active:scale-[0.98]">Cart</Link>
      </nav>
      {category ? (
        <CategoryPick slug={category} name={parents.find((item) => item.slug === category)?.name ?? "Category"} onClear={() => setCategory("")} />
      ) : (
        <Feed data={shown} />
      )}
      <Sponsored campaigns={sellerAds} />
      <OftenOrdered products={shown.trending} seen={[...shown.offers, ...shown.newest, ...shown.featured].map((item) => item.id)} />
      <p className="mt-4 text-sm">
        <Link to="/shop" search={shopNewest} className="font-semibold text-primary">Browse the full shop</Link>
      </p>
      {changed ? (
        <button
          type="button"
          onClick={() => setShown(incoming)}
          className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg"
        >
          New deals available
        </button>
      ) : null}
    </div>
  );
}

function Feed({ data }: { data: Storefront }) {
  const dealIds = new Set(data.offers.map((item) => item.id));
  const arrivals = data.newest.filter((item) => !dealIds.has(item.id));
  const shownIds = new Set([...dealIds, ...arrivals.map((item) => item.id)]);
  const featured = data.featured.filter((item) => !shownIds.has(item.id));
  return (
    <>
      {data.offers.length > 0 ? (
        <section id="deals" className="mt-4 scroll-mt-24">
          <h2 className="text-sm font-semibold">Deals</h2>
          <ProductGrid products={data.offers} />
        </section>
      ) : null}
      <section id="new" className="mt-4 scroll-mt-24">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">New arrivals</h2>
          <Link to="/shop" search={shopNewest} className="text-xs font-semibold text-primary">See all</Link>
        </div>
        {arrivals.length > 0 ? (
          <ProductGrid products={arrivals} />
        ) : data.offers.length > 0 ? (
          <p className="mt-2 text-sm text-muted">The newest listings are already in Deals.</p>
        ) : (
          <ProductGrid products={data.newest} />
        )}
      </section>
      {featured.length > 0 ? (
        <section className="mt-4">
          <h2 className="text-sm font-semibold">Featured</h2>
          <ProductGrid products={featured} />
        </section>
      ) : null}
    </>
  );
}

function Sponsored({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) return null;
  return (
    <section className="mt-4" aria-label="Sponsored">
      <h2 className="text-sm font-semibold">From sellers</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {campaigns.map((campaign) => (
          <a key={campaign.id} href={campaign.link_path || "/shop"} className="overflow-hidden rounded-2xl bg-cream active:scale-[0.98]">
            {campaign.image_url ? <img src={campaign.image_url} alt="" className="aspect-[16/9] w-full object-cover" /> : null}
            <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-primary">Sponsored</p>
            <p className="line-clamp-2 px-2 pb-2 text-sm font-semibold">{campaign.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function OftenOrdered({ products, seen }: { products: Storefront["trending"]; seen: string[] }) {
  const skip = new Set(seen);
  const rest = products.filter((item) => !skip.has(item.id));
  if (rest.length === 0) return null;
  return (
    <section className="mt-4">
      <h2 className="text-sm font-semibold">Often ordered</h2>
      <p className="text-xs text-muted">From completed orders, not a guess.</p>
      <ProductGrid products={rest} />
    </section>
  );
}

type Slide = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  endsAt: string | null;
};

function buildSlides(data: Storefront, campaigns: Campaign[]): Slide[] {
  const slides: Slide[] = campaigns.map((campaign) => ({
    id: campaign.id,
    kicker: campaign.retailer_id ? "Sponsored" : "Promotion",
    title: campaign.title,
    subtitle: campaign.subtitle,
    image: campaign.image_url,
    href: campaign.link_path || "/shop",
    endsAt: campaign.ends_at,
  }));
  if (data.newest.length > 0) {
    slides.push({
      id: "discover-new",
      kicker: "Discover",
      title: "Discover something new",
      subtitle: "New listings from approved sellers.",
      image: data.newest[0]?.imageUrl ?? "",
      href: "/shop?sort=newest",
      endsAt: null,
    });
  }
  if (data.offers.length > 0) {
    slides.push({
      id: "discover-deals",
      kicker: "Discover",
      title: "Deals worth discovering",
      subtitle: "These products are priced below their compare-at price.",
      image: data.offers[0]?.imageUrl ?? "",
      href: "#deals",
      endsAt: null,
    });
  }
  if (data.categories.some((category) => !category.parent_slug)) {
    slides.push({
      id: "discover-local",
      kicker: "Discover",
      title: "Shop local. Discover more.",
      subtitle: "Browse categories stocked by Nigerian sellers.",
      image: "",
      href: "/categories",
      endsAt: null,
    });
  }
  return slides;
}

function PromoCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const count = slides.length;
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((current) => (current + 1) % count);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [count, paused]);
  if (count === 0) return null;
  const slide = slides[index] ?? slides[0];
  const showCountdown = Boolean(slide.endsAt && phase({ ends_at: slide.endsAt, starts_at: null } as Campaign, Date.now()) === "live");
  return (
    <div
      className="relative mt-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => {
        startX.current = event.changedTouches[0]?.clientX ?? 0;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        const delta = (event.changedTouches[0]?.clientX ?? 0) - startX.current;
        if (count > 1 && Math.abs(delta) > 40) setIndex((current) => (current + (delta < 0 ? 1 : count - 1)) % count);
        setPaused(false);
      }}
    >
      <div className="overflow-hidden rounded-2xl bg-ink">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((item) => (
            <a key={item.id} href={item.href} className="relative block h-32 w-full shrink-0 md:h-40">
              {item.image ? <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-primary" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-ink/10" />
              <div className="absolute inset-x-0 bottom-0 p-3 pr-24 text-on-ink">
                <p className="text-[11px] font-semibold uppercase tracking-wide">{item.kicker}</p>
                <h2 className="line-clamp-1 text-base font-bold">{item.title}</h2>
                {item.subtitle ? <p className="line-clamp-1 text-xs text-on-ink/80">{item.subtitle}</p> : null}
              </div>
            </a>
          ))}
        </div>
      </div>
      {showCountdown && slide.endsAt ? (
        <p className="mt-1 text-xs text-muted">Ends in <Countdown endsAt={slide.endsAt} /></p>
      ) : null}
      {count > 1 ? (
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <button type="button" aria-label="Previous slide" className="grid size-7 place-items-center rounded-full bg-surface/90 text-xs text-fg" onClick={() => setIndex((current) => (current + count - 1) % count)}>‹</button>
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.title}`}
              aria-current={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 ${itemIndex === index ? "w-4 bg-surface" : "w-1.5 bg-surface/50"}`}
            />
          ))}
          <button type="button" aria-label="Next slide" className="grid size-7 place-items-center rounded-full bg-surface/90 text-xs text-fg" onClick={() => setIndex((current) => (current + 1) % count)}>›</button>
        </div>
      ) : null}
    </div>
  );
}

function DiscoverStrip({ trending, newest }: { trending: Storefront["trending"]; newest: Storefront["newest"] }) {
  const items = (trending.length > 0 ? trending : newest).slice(0, 8);
  const [paused, setPaused] = useState(false);
  if (items.length === 0) return null;
  const title = trending.length > 0 ? "Trending on SEEK" : "Discover on SEEK";
  const loop = [...items, ...items];
  return (
    <section className="mt-3" aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {trending.length === 0 ? <p className="text-xs text-muted">Recent listings. Not a popularity ranking.</p> : null}
      <div
        className="bsn-marquee-clip mt-2"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div className={`bsn-marquee flex w-max gap-2 ${paused ? "is-paused" : ""}`}>
          {loop.map((product, index) => (
            <Link
              key={`${product.id}-${index}`}
              to="/product/$slug"
              params={{ slug: product.id }}
              className="flex h-10 w-44 shrink-0 items-center gap-2 rounded-full bg-cream px-2"
            >
              {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-7 rounded-full object-cover" /> : <span className="size-7 rounded-full bg-surface" />}
              <span className="truncate text-xs font-semibold">{product.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryPick({ slug, name, onClear }: { slug: string; name: string; onClear: () => void }) {
  const result = useQuery({
    queryKey: ["home-category", slug],
    queryFn: () =>
      searchProducts({
        data: { q: "", category: slug, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 },
      }),
  });
  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{name}</h2>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-primary">Show all</button>
      </div>
      {result.isLoading ? <p className="mt-2 text-sm text-muted">Loading products…</p> : null}
      {result.isError ? <p className="mt-2 text-sm text-danger">Could not load this category.</p> : null}
      {result.data && result.data.products.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No products in this category" body="Approved products will show here." />
        </div>
      ) : (
        <ProductGrid products={result.data?.products ?? []} />
      )}
      <Link to="/categories/$slug" params={{ slug }} search={{ sort: "newest" }} className="mt-2 inline-block text-xs font-semibold text-primary">
        Open {name}
      </Link>
    </section>
  );
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

