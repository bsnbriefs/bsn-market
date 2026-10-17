import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { useCartStore } from "@/lib/market/cart";
import { formatNaira } from "@/lib/market/money";

export type CardLike = {
  id: string;
  name: string;
  priceKobo: number;
  compareAtKobo: number | null;
  stock: number;
  imageUrl: string;
  retailerCity: string;
  retailerName?: string;
  brand?: string;
  categoryName?: string;
  reviewCount?: number;
  rating?: number;
  variantCount?: number;
  variants?: { id: string; label: string; stock: number; delta: number }[];
  createdAt?: string;
};

export function cn(...parts: Array<string | false | undefined>) {
  return twMerge(parts.filter(Boolean).join(" "));
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          setPending(true);
          return;
        }
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={cn("bsn-reveal", pending && "is-pending", shown && "is-shown", className)}
    >
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "surface" | "ghost" | "danger" }) {
  const look = {
    primary: "seek-cta text-white",
    surface: "border border-border bg-surface text-fg hover:border-primary/40 hover:bg-cream",
    ghost: "text-fg hover:bg-cream",
    danger: "bg-danger text-danger-fg hover:opacity-90",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg outline-none transition-colors focus:border-primary",
        props.className,
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-fg outline-none",
        props.className,
      )}
    />
  );
}

export function Money({ kobo }: { kobo: number }) {
  return <span className="tabular-nums">{formatNaira(kobo)}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
      <h2 className="font-display text-2xl text-fg">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProductCardView({
  product,
  className,
  style,
}: {
  product: CardLike;
  className?: string;
  style?: CSSProperties;
}) {
  const saving =
    product.compareAtKobo && product.compareAtKobo > product.priceKobo
      ? product.compareAtKobo - product.priceKobo
      : 0;
  const percent = saving && product.compareAtKobo ? Math.round((saving / product.compareAtKobo) * 100) : 0;
  const low = product.stock > 0 && product.stock <= 3;
  const isNew = Boolean(product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000);
  const reviews = product.reviewCount ?? 0;
  const [broken, setBroken] = useState(false);
  const [variantId, setVariantId] = useState("");
  const variants = product.variants ?? [];
  const chosen = variants.find((item) => item.id === variantId);
  const price = product.priceKobo + (chosen?.delta ?? 0);
  const seller = [product.brand, product.retailerName].filter((part, index, list) => part && list.indexOf(part) === index).join(" · ");
  return (
    <article style={style} className={cn("group flex h-full w-full min-w-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-surface", className)}>
      <Link to="/product/$slug" params={{ slug: product.id }} className="block active:scale-[0.98]">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          {product.imageUrl && !broken ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center px-3 text-center text-sm text-muted">No photo</div>
          )}
          {product.stock < 1 ? (
            <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-1 text-[11px] font-semibold text-on-ink">Sold out</span>
          ) : isNew ? (
            <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2 py-1 text-[11px] font-semibold text-primary">New</span>
          ) : null}
          {percent > 0 ? (
            <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-accent-fg">−{percent}%</span>
          ) : null}
          {low ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-1 text-[11px] font-semibold text-fg">Only {product.stock} left</span>
          ) : null}
        </div>
        <div className="px-2.5 pt-2">
          {product.categoryName ? <p className="truncate text-[11px] font-medium text-primary">{product.categoryName}</p> : null}
          <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</p>
          <p className="truncate text-xs text-muted">{seller || product.retailerCity}</p>
          {reviews > 0 ? (
            <p className="text-xs text-muted">{product.rating} out of 5 · {reviews} {reviews === 1 ? "review" : "reviews"}</p>
          ) : null}
          <p className="mt-1 text-base font-bold text-fg">
            <Money kobo={price} />
            {saving > 0 && product.compareAtKobo && !chosen?.delta ? (
              <span className="ml-2 text-xs font-normal text-muted line-through">
                <Money kobo={product.compareAtKobo} />
              </span>
            ) : null}
          </p>
        </div>
      </Link>
      <div className="mt-auto px-2.5 pb-2.5 pt-2">
        <CardCart product={product} variantId={variantId} onPick={setVariantId} />
      </div>
    </article>
  );
}

function CardCart({
  product,
  variantId,
  onPick,
}: {
  product: CardLike;
  variantId: string;
  onPick: (id: string) => void;
}) {
  const add = useCartStore((state) => state.add);
  const inCart = useCartStore((state) => state.items.find((item) => item.productId === product.id && item.variantId === (variantId || null) && !item.offerId)?.qty ?? 0);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const variants = product.variants ?? [];
  const chosen = variants.find((item) => item.id === variantId);
  const stock = chosen ? chosen.stock : product.stock;
  if (product.stock < 1 && variants.every((item) => item.stock < 1)) return <p className="text-xs font-semibold text-muted">Unavailable</p>;
  return (
    <div>
      {variants.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {variants.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.stock < 1}
              aria-pressed={item.id === variantId}
              onClick={() => onPick(item.id)}
              className={`h-7 rounded-full px-2 text-[11px] font-semibold active:scale-95 disabled:opacity-40 ${item.id === variantId ? "bg-primary text-primary-fg" : "bg-cream text-fg"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        disabled={stock < 1}
        className={`h-9 w-full rounded-full bg-primary text-xs font-semibold text-primary-fg active:scale-[0.98] disabled:opacity-40 ${added ? "bsn-pop" : ""}`}
        onClick={() => {
          if (variants.length > 0 && !chosen) {
            toast.error("Choose an option");
            return;
          }
          if (inCart >= stock) {
            toast.error("That's all that's in stock");
            return;
          }
          add({ productId: product.id, variantId: chosen?.id ?? null, qty: 1 });
          setAdded(true);
          toast.success("Added to cart");
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setAdded(false), 900);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </button>
    </div>
  );
}

export function ProductGrid({ products }: { products: CardLike[] }) {
  if (products.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <Reveal key={product.id} className="min-w-0" delay={Math.min(index, 6) * 40}>
          <ProductCardView product={product} />
        </Reveal>
      ))}
    </div>
  );
}

export function ProductRail({ title, note, products }: { title: string; note?: string; products: CardLike[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          {note ? <p className="text-xs text-muted">{note}</p> : null}
        </div>
        <Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", available: "", page: 1 }} className="text-sm font-semibold text-primary">
          See all
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {products.map((product, index) => (
          <Reveal key={product.id} className="w-40 shrink-0 snap-start md:w-auto" delay={Math.min(index, 7) * 50}>
            <ProductCardView product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function errText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
