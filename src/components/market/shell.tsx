import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, LayoutGrid, Package, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getServerCart, syncCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getStorefront } from "@/lib/market/catalog";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function StoreShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="shrink-0 leading-none">
            <span className="font-display text-xl font-semibold">BSN</span>
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Market</span>
          </Link>
          <p className="hidden text-xs text-muted sm:block">Nigeria · Naira</p>
          <div className="ml-auto hidden items-center gap-1 text-sm font-medium md:flex">
            <TopLink to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }} active={path.startsWith("/shop")}>
              Shop
            </TopLink>
            <TopLink to="/request" active={path.startsWith("/request")}>
              Request
            </TopLink>
            <TopLink to="/retailer" active={path.startsWith("/retailer")}>
              <Store className="size-4" /> Sell
            </TopLink>
            <TopLink to="/account" active={path.startsWith("/account")}>
              Account
            </TopLink>
          </div>
        </div>
        {path !== "/" ? (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <SearchForm />
          </div>
        ) : null}
      </header>
      <CartSync />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 md:pb-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((tab) => {
            const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-200 ${active ? "text-primary" : "text-muted"}`}
                >
                  <span className="relative">
                    <Icon className={`size-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                    {tab.to === "/cart" ? <CartBadge /> : null}
                  </span>
                  {tab.label}
                  <span className={`h-0.5 w-4 rounded-full bg-primary transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function CartBadge() {
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready || count < 1) return null;
  return (
    <span key={count} className="bsn-pop absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SearchForm({
  initial = "",
  hints = [],
}: {
  initial?: string;
  hints?: { label: string; category: string }[];
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  useEffect(() => setQ(initial), [initial]);
  const remote = useQuery({
    queryKey: ["search-categories"],
    queryFn: async () => (await getStorefront()).categories,
    enabled: open && hints.length === 0,
    staleTime: 5 * 60_000,
  });
  const pool = hints.length
    ? hints
    : (remote.data ?? []).map((category) => ({ label: category.name, category: category.slug }));
  const needle = q.trim().toLowerCase();
  const matches = needle.length < 1 ? pool.slice(0, 6) : pool.filter((hint) => hint.label.toLowerCase().includes(needle)).slice(0, 6);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    void navigate({ to: "/shop", search: { q, category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "relevance", page: 1 } });
  }
  function goCategory(category: string) {
    setOpen(false);
    void navigate({ to: "/shop", search: { q: "", category, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 } });
  }
  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        placeholder="Search products, brands, markets"
        aria-label="Search products"
        aria-expanded={open && matches.length > 0}
        className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none transition duration-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(12,107,77,0.12)]"
      />
      {open && matches.length > 0 ? (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {matches.map((hint) => (
            <li key={hint.category}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  goCategory(hint.category);
                }}
                className="flex min-h-11 w-full items-center px-4 text-left text-sm transition-colors hover:bg-bg"
              >
                {hint.label}
                <span className="ml-auto text-xs text-muted">Category</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function TopLink({
  to,
  search,
  active,
  children,
}: {
  to: string;
  search?: Record<string, string | number>;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search}
      className={`relative inline-flex items-center gap-1 rounded-full px-3 py-2 transition-colors ${active ? "text-primary" : "text-fg hover:bg-surface"}`}
    >
      {children}
      <span className={`absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-primary transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0"}`} />
    </Link>
  );
}

function CartSync() {
  const { user } = useCurrentUserState();
  const items = useCartStore((state) => state.items);
  const replace = useCartStore((state) => state.replace);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    getServerCart()
      .then((server) => {
        if (cancel) return;
        const local = useCartStore.getState().items;
        if (local.length === 0 && server.length) replace(server);
        else if (local.length) void syncCart({ data: { items: local } }).catch(() => undefined);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [replace, user]);
  useEffect(() => {
    if (!user || !ready) return;
    const timer = setTimeout(() => {
      void syncCart({ data: { items } }).catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [items, ready, user]);
  return null;
}

export function Desk({
  title,
  links,
  children,
}: {
  title: string;
  links: { to: string; label: string }[];
  children: ReactNode;
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-lg font-semibold">
            BSN Market
          </Link>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">{title}</span>
          <nav className="flex w-full gap-2 overflow-x-auto text-sm md:ml-auto md:w-auto">
            {links.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className={`shrink-0 rounded-full px-3 py-2 ${path === link.to ? "bg-fg text-surface" : "text-muted"}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
