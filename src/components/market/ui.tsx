import { Link } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { formatNaira } from "@/lib/market/money";

export type CardLike = {
  id: string;
  name: string;
  priceKobo: number;
  compareAtKobo: number | null;
  stock: number;
  imageUrl: string;
  retailerCity: string;
};

export function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
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

export function ProductCardView({ product }: { product: CardLike }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.id }}
      className="group flex w-40 shrink-0 flex-col md:w-auto"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-border">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">No photo</div>
        )}
        {product.stock < 1 ? (
          <span className="absolute left-2 top-2 rounded-full bg-fg px-2 py-1 text-xs text-surface">Sold out</span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
      <p className="text-xs text-muted">{product.retailerCity}</p>
      <p className="mt-1 text-sm font-semibold">
        <Money kobo={product.priceKobo} />
        {product.compareAtKobo && product.compareAtKobo > product.priceKobo ? (
          <span className="ml-2 text-xs font-normal text-muted line-through">
            <Money kobo={product.compareAtKobo} />
          </span>
        ) : null}
      </p>
    </Link>
  );
}

export function ProductRail({ title, products }: { title: string; products: CardLike[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        <Link to="/shop" search={{ q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest", page: 1 }} className="text-sm font-semibold text-primary">
          See all
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {products.map((product) => (
          <ProductCardView key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function errText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
