import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ClipboardList, Home, LayoutGrid, MessageCircle, Package, Plus, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { getServerCart, syncCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getStorefront, searchProducts } from "@/lib/market/catalog";
import { getRetailerDashboard } from "@/lib/market/retailer";
import { createProductRequest } from "@/lib/market/account";
import { NIGERIAN_STATES } from "@/lib/market/states";
import { formatNaira } from "@/lib/market/money";
import { SeekLogo } from "@/components/market/brand";
import { ThemeToggle } from "@/components/market/theme";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

const shopSearch = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest" as const, available: "", page: 1 };

const bottom = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function StoreShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useCurrentUserState();
  const [actionsOpen, setActionsOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:h-16">
          <Link to="/" className="seek-logo-link flex h-10 shrink-0 items-center" aria-label="SEEK home">
            <SeekLogo className="h-9" />
          </Link>
          <p className="hidden text-xs text-muted lg:block">Nigeria · Naira</p>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <div className="hidden items-center gap-1 text-sm font-medium md:flex">
              <TopLink to="/shop" search={shopSearch} active={path.startsWith("/shop")}>Shop</TopLink>
              <TopLink to="/request" active={path.startsWith("/request")}>Request</TopLink>
              <TopLink to="/retailer" active={path.startsWith("/retailer")}>
                <Store className="size-4" /> Sell
              </TopLink>
            </div>
            <ThemeToggle />
            <Link to="/account" aria-label="Notifications" className="grid size-10 place-items-center text-fg">
              <Bell className="size-5" />
            </Link>
            <Link to="/cart" aria-label="Cart" className="grid size-10 place-items-center text-fg">
              <span className="relative">
                <ShoppingBag className="size-5" />
                <CartBadge />
              </span>
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <SearchForm />
        </div>
      </header>
      <CartSync />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-3 md:pb-12">{children}</main>
      {path.startsWith("/policies") || path.startsWith("/support") || path.startsWith("/account") || path.startsWith("/checkout") ? (
        <footer className="border-t border-border bg-cream">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-4 py-4 pb-24 text-sm font-semibold md:pb-8" aria-label="Policies">
            <a href="/policies/delivery" className="text-primary hover:underline focus-visible:underline">Delivery</a>
            <a href="/policies/returns" className="text-primary hover:underline focus-visible:underline">Returns</a>
            <a href="/policies/privacy" className="text-primary hover:underline focus-visible:underline">Privacy</a>
            <a href="/policies/terms" className="text-primary hover:underline focus-visible:underline">Terms</a>
            <a href="/policies/prohibited" className="text-primary hover:underline focus-visible:underline">Prohibited products</a>
            <a href="/policies/retailer-agreement" className="text-primary hover:underline focus-visible:underline">Retailer agreement</a>
            <a href="/support" className="text-primary hover:underline focus-visible:underline">Support</a>
          </nav>
        </footer>
      ) : null}
      <ActionMenu open={actionsOpen} onClose={() => setActionsOpen(false)} signedIn={Boolean(user)} />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {bottom.slice(0, 2).map((tab) => (
            <NavItem key={tab.to} tab={tab} path={path} />
          ))}
          <li aria-hidden className="h-14" />
          {bottom.slice(2).map((tab) => (
            <NavItem key={tab.to} tab={tab} path={path} />
          ))}
        </ul>
      </nav>
      <FloatingPlus open={actionsOpen} onToggle={() => setActionsOpen((open) => !open)} />
    </div>
  );
}

function FloatingPlus({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <button
      type="button"
      className="fixed bottom-[calc(0.35rem+env(safe-area-inset-bottom))] left-1/2 z-[80] grid size-16 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-fg shadow-lg md:hidden"
      aria-label={open ? "Close actions" : "Open actions"}
      aria-expanded={open}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      <Plus className={`size-7 transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
    </button>,
    document.body,
  );
}

function NavItem({ tab, path }: { tab: (typeof bottom)[number]; path: string }) {
  const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
  const Icon = tab.icon;
  return (
    <li>
      <Link
        to={tab.to}
        className={`flex h-14 flex-col items-center justify-center text-[10px] font-medium ${active ? "text-link" : "text-icon"}`}
      >
        <Icon className="size-5" />
        {tab.label}
      </Link>
    </li>
  );
}

function ActionMenu({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);
  const close = useRef(onClose);
  close.current = onClose;
  const [requesting, setRequesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const vendor = useQuery({
    queryKey: ["retailer-desk-gate"],
    queryFn: () => getRetailerDashboard(),
    enabled: open && signedIn,
    retry: false,
    staleTime: 60_000,
  });
  const isVendor = Boolean(vendor.data?.retailer);
  useEffect(() => {
    if (!open) setRequesting(false);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    openedAt.current = Date.now();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  const sellTo = isVendor ? "/retailer" : "/retailer/apply";
  const cards = [
    { title: "SEEK Companion", body: "Tell SEEK what you need", icon: MessageCircle, to: "/companion" },
    { title: "Bundle Builder", body: "Build a basket within your budget", icon: ClipboardList, to: "/bundle" },
    { title: "Fair Deal", body: "Ask retailers to offer within your budget", icon: Store, to: "/fair" },
    { title: "List a product", body: "Add a product to your store", icon: Plus, to: isVendor ? "/retailer/products" : "/retailer/apply" },
    { title: "Explore categories", body: "Find products you need", icon: LayoutGrid, to: "/categories" },
    { title: "View cart", body: "Review items before checkout", icon: ShoppingBag, to: "/cart" },
    { title: "View orders", body: "Track your purchases", icon: Package, to: "/orders" },
    ...(isVendor ? [{ title: "Manage my store", body: "Manage products and sales", icon: Store, to: "/retailer" }] : []),
  ];
  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await createProductRequest({
        data: {
          name: form.get("name"),
          description: form.get("description"),
          brand: form.get("brand"),
          budgetMax: form.get("budgetMax"),
          state: form.get("state"),
          city: form.get("city"),
          contactPreference: "in_app",
        },
      });
      toast.success(`Request ${result.reference} received. This is not an order.`);
      onClose();
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close actions"
        className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm"
        onClick={() => {
          if (Date.now() - openedAt.current < 400) return;
          onClose();
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seek-actions-title"
        tabIndex={-1}
        className="bsn-fade fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[80] max-h-[min(70dvh,34rem)] overflow-x-hidden overflow-y-auto rounded-2xl bg-surface p-4 shadow-xl outline-none md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[28rem] md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">SEEK</p>
            <h2 id="seek-actions-title" className="text-lg font-bold">{requesting ? "Request a product" : "What would you like to do?"}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full text-fg">
            <X className="size-5" />
          </button>
        </div>
        {requesting ? (
          signedIn ? (
            <form onSubmit={onRequest} className="mt-3 space-y-2">
              <p className="text-xs text-muted">Ask for a product that is not listed. An administrator can look for a retailer. This is not an order and nothing is charged.</p>
              <Field name="name" required placeholder="Product name" aria-label="Product name" />
              <TextArea name="description" placeholder="Size, colour, or other details" aria-label="Description" />
              <Field name="brand" placeholder="Preferred brand or model" aria-label="Brand" />
              <Field name="budgetMax" inputMode="decimal" placeholder="Budget up to ₦" aria-label="Budget" />
              <select name="state" aria-label="State" className="h-11 w-full rounded-xl border border-border bg-surface px-3" defaultValue="Lagos">
                {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
              </select>
              <Field name="city" placeholder="City" aria-label="City" />
              <div className="flex gap-2">
                <Button type="button" variant="surface" onClick={() => setRequesting(false)}>Back</Button>
                <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Submit request"}</Button>
              </div>
            </form>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted">Sign in to request a product that is not listed. A request is not an order.</p>
              <Link to="/login" onClick={onClose} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">Sign in</Link>
            </div>
          )
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 [grid-auto-rows:7.5rem]">
              <button
                type="button"
                onClick={() => setRequesting(true)}
                className="flex h-full min-w-0 flex-col justify-between rounded-xl border border-border bg-bg p-3 text-left active:bg-cream"
              >
                <ClipboardList className="size-5 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">Request a product</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-muted">Ask for something that is not in the shop</span>
                </span>
              </button>
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.to}
                    onClick={onClose}
                    className="flex h-full min-w-0 flex-col justify-between rounded-xl border border-border bg-bg p-3 text-left active:bg-cream"
                  >
                    <Icon className="size-5 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{card.title}</span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-muted">{card.body}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
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
  const matches = needle.length < 1 ? [] : pool.filter((hint) => hint.label.toLowerCase().includes(needle)).slice(0, 4);
  const products = useQuery({
    queryKey: ["search-suggest", needle],
    queryFn: () =>
      searchProducts({
        data: { q: needle, category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "relevance", available: "", page: 1 },
      }),
    enabled: needle.length >= 2,
    staleTime: 30_000,
  });
  const hits = (products.data?.products ?? []).slice(0, 5);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    void navigate({ to: "/shop", search: { q, category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "relevance", available: "", page: 1 } });
  }
  function goCategory(category: string) {
    setOpen(false);
    void navigate({ to: "/shop", search: { q: "", category, retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 } });
  }
  return (
    <form onSubmit={onSubmit} className="relative z-50" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        placeholder="Search products, brands and stores"
        aria-label="Search products"
        aria-expanded={open && (matches.length > 0 || hits.length > 0)}
        className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none focus:border-primary"
      />
      {open && (matches.length > 0 || hits.length > 0) ? (
        <ul className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-surface shadow-xl">
          {hits.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setOpen(false);
                  void navigate({ to: "/product/$slug", params: { slug: product.id } });
                }}
                className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-cream"
              >
                <span className="min-w-0 flex-1 truncate">{product.name}</span>
                <span className="shrink-0 text-xs font-semibold">{formatNaira(product.priceKobo)}</span>
              </button>
            </li>
          ))}
          {matches.map((hint) => (
            <li key={hint.category}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  goCategory(hint.category);
                }}
                className="flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-cream"
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
  to: "/shop" | "/request" | "/retailer";
  search?: typeof shopSearch;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={to} search={search} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 ${active ? "text-primary" : ""}`}>
      {children}
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
          <Link to="/" className="seek-logo-link flex h-10 shrink-0 items-center" aria-label="SEEK home">
            <SeekLogo className="h-9" />
          </Link>
          <ThemeToggle />
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">{title}</span>
          <nav className="flex w-full gap-2 overflow-x-auto text-sm md:ml-auto md:w-auto">
            {links.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className={`shrink-0 rounded-full px-3 py-2 ${path === link.to ? "bg-ink text-on-ink" : "text-muted"}`}
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
