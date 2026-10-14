import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Package, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getServerCart, syncCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

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
          <div className="ml-auto hidden items-center gap-4 text-sm font-medium md:flex">
            <Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }}>Shop</Link>
            <Link to="/request">Request</Link>
            <Link to="/retailer" className="inline-flex items-center gap-1">
              <Store className="size-4" /> Sell
            </Link>
            <Link to="/account">Account</Link>
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
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}
                >
                  <span className="relative">
                    <Icon className="size-5" />
                    {tab.to === "/cart" ? <CartBadge /> : null}
                  </span>
                  {tab.label}
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
    <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SearchForm({ initial = "" }: { initial?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/shop", search: { q, category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "relevance", page: 1 } });
  }
  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search products, brands, markets"
        aria-label="Search products"
        className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none"
      />
    </form>
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
