import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { formatNaira } from "@/lib/market/money";

export type CardLike = {
  id: string;
  name: string;
  priceKobo: number;
  compareAtKobo: number | null;
  stock: number;
  imageUrl: string;
  retailerCity: string;
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
    primary: "bg-primary text-primary-fg",
    surface: "border border-border bg-surface text-fg",
    ghost: "text-fg",
    danger: "bg-danger text-danger-fg",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
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
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg outline-none",
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
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.id }}
      style={style}
      className={cn(
        "group flex w-full min-w-0 snap-start flex-col transition duration-300 ease-out active:scale-[0.98] md:hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-border ring-1 ring-transparent transition duration-300 group-hover:ring-primary/30 group-hover:shadow-lg">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">No photo</div>
        )}
        {product.stock < 1 ? (
          <span className="absolute left-2 top-2 rounded-full bg-fg px-2 py-1 text-xs text-surface">Sold out</span>
        ) : null}
        {percent > 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-accent-fg">
            −{percent}%
          </span>
        ) : null}
        {product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-1 text-[11px] font-semibold text-primary">New</span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
      <p className="text-xs text-muted">{product.retailerCity}</p>
      <p className="mt-1 text-sm font-semibold">
        <Money kobo={product.priceKobo} />
        {saving > 0 && product.compareAtKobo ? (
          <span className="ml-2 text-xs font-normal text-muted line-through">
            <Money kobo={product.compareAtKobo} />
          </span>
        ) : null}
      </p>
      {saving > 0 ? (
        <p className="text-xs font-semibold text-accent">
          Save <Money kobo={saving} />
        </p>
      ) : null}
    </Link>
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
        <Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }} className="text-sm font-semibold text-primary">
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
