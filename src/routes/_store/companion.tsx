import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct, searchProducts, type ProductCard } from "@/lib/market/catalog";
import { planCompanion, rankProducts, cartDecision, type CompanionMemory, type CompanionPlan } from "@/lib/market/companion";
import { useCartStore } from "@/lib/market/cart";
import { formatNaira } from "@/lib/market/money";
import { Button } from "@/components/market/ui";

export const Route = createFileRoute("/_store/companion")({
  head: () => ({
    meta: [
      { title: "SEEK Companion · Shop" },
      { name: "description", content: "Tell SEEK what you need. We'll help you find it." },
    ],
  }),
  component: CompanionPage,
});

const prompts = [
  "Find a smartphone under ₦250,000.",
  "Help me find a laptop for graphic design.",
  "Show me affordable office shoes.",
  "Find a birthday gift under ₦50,000.",
  "Help me compare products within my budget.",
];

type Turn = { role: "user" | "assistant"; text: string; products: ProductCard[] };

const shopSearch = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "newest" as const, available: "", page: 1 };

function explain(product: ProductCard, max: string): string {
  const cap = Number(max);
  const parts = [`${formatNaira(product.priceKobo)} from ${product.retailerName}.`];
  if (Number.isFinite(cap) && cap > 0 && product.priceKobo <= cap * 100) parts.push(`Inside ₦${cap.toLocaleString("en-NG")}.`);
  parts.push(product.stock > 0 ? `${product.stock} in stock.` : "Out of stock.");
  if (product.brand) parts.push(`Brand: ${product.brand}.`);
  if (product.reviewCount > 0) parts.push(`${product.rating}/5 from ${product.reviewCount} verified ${product.reviewCount === 1 ? "review" : "reviews"}.`);
  else parts.push("No verified reviews yet.");
  if (product.variantCount > 0) parts.push(`Options: ${product.variants.map((variant) => variant.label).join(", ")}.`);
  return parts.join(" ");
}

function compareText(products: ProductCard[], storage: boolean): string {
  if (products.length < 2) return "Show me at least two products first, then ask me to compare them.";
  const ranked = [...products].sort((a, b) => a.priceKobo - b.priceKobo);
  const cheapest = ranked[0];
  const lines = ranked.slice(0, 5).map((product) => {
    const options = product.variants.length ? ` Options: ${product.variants.map((variant) => variant.label).join(", ")}.` : "";
    return `${product.name}: ${formatNaira(product.priceKobo)}, ${product.stock > 0 ? `${product.stock} in stock` : "out of stock"}, sold by ${product.retailerName}.${options}`;
  });
  let storageLine = "";
  if (storage) {
    const sized = ranked.flatMap((product) =>
      product.variants.flatMap((variant) => {
        const match = variant.label.match(/(\d+)\s*gb/i);
        return match ? [{ name: product.name, label: variant.label, gb: Number(match[1]) }] : [];
      }),
    );
    storageLine = sized.length
      ? ` The largest storage written on a listing is ${sized.sort((a, b) => b.gb - a.gb)[0].label} on ${sized.sort((a, b) => b.gb - a.gb)[0].name}.`
      : " No listing here states a storage size.";
  }
  return `${cheapest.name} has the lowest listed price at ${formatNaira(cheapest.priceKobo)}. That is not a claim about quality.${storageLine}\n${lines.join("\n")}`;
}

function CompanionPage() {
  const add = useCartStore((state) => state.add);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const blank: CompanionMemory = { text: "", q: "", category: "", max: "", brand: "" };
  const [memory, setMemory] = useState<CompanionMemory>(blank);
  const [last, setLast] = useState<ProductCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(message: string) {
    const text = message.trim().slice(0, 400);
    if (!text || busy) return;
    setDraft("");
    setError("");
    setTurns((current) => [...current, { role: "user", text, products: [] }]);
    const plan = planCompanion(text, memory);
    if (plan.kind === "clarify") {
      setMemory({ ...memory, text });
      setTurns((current) => [...current, { role: "assistant", text: plan.reply, products: [] }]);
      return;
    }
    if (plan.kind === "refuse") {
      setTurns((current) => [...current, { role: "assistant", text: plan.reply, products: [] }]);
      return;
    }
    if (plan.kind === "compare") {
      setTurns((current) => [...current, { role: "assistant", text: `${plan.reply} ${compareText(last, /storage/i.test(plan.reply))}`.trim(), products: last.slice(0, 5) }]);
      return;
    }
    if (plan.kind === "cheaper") {
      if (last.length === 0) {
        setTurns((current) => [...current, { role: "assistant", text: "Show me a product first, then ask for something cheaper.", products: [] }]);
        return;
      }
      const lowest = Math.min(...last.map((product) => product.priceKobo));
      const nextMax = Math.floor(lowest / 100) - 1;
      if (nextMax < 1) {
        setTurns((current) => [...current, { role: "assistant", text: "Nothing in the catalogue is cheaper than what is already shown.", products: [] }]);
        return;
      }
      await search({ ...plan, max: String(nextMax), sort: "price_asc" });
      return;
    }
    await search(plan);
  }

  async function search(plan: CompanionPlan) {
    setBusy(true);
    try {
      const query = { q: plan.q, category: plan.category, retailer: "", brand: plan.brand, state: "", min: "", max: plan.max, sort: plan.sort, available: "1" as const, page: 1 };
      const result = await searchProducts({ data: query });
      const products = rankProducts(result.products, plan).filter((product) => !plan.excludeBrand || product.brand !== plan.excludeBrand).slice(0, 5);
      let note = "";
      if (products.length === 0 && plan.max) {
        const wider = await searchProducts({ data: { ...query, max: "", sort: "price_asc" } });
        const closest = rankProducts(wider.products, { ...plan, max: "" }).slice(0, 3);
        note = closest.length
          ? `Nothing approved is within ₦${Number(plan.max).toLocaleString("en-NG")}. The closest listed prices start at ${formatNaira(closest[0].priceKobo)}. I have not included those as if they met the budget.`
          : "";
      }
      if (!note && products.length === 0) {
        const anyStock = await searchProducts({ data: { ...query, max: plan.max, available: "" } });
        const unavailable = anyStock.products.filter((product) => product.stock < 1);
        note = unavailable.length
          ? `${unavailable[0].name} is listed but out of stock, so it is not available to add.`
          : "Nothing in the current catalogue matches that. Try another word, or browse the shop.";
      } else if (!note) {
        note = plan.max
          ? `These approved products are within ₦${Number(plan.max).toLocaleString("en-NG")}. Prices are the current listing prices.`
          : "These are approved products from the catalogue. I am only using the details on each listing.";
      }
      setLast(products);
      setMemory({ text: "", q: plan.q, category: plan.category, max: plan.max, brand: products[0]?.brand ?? plan.brand });
      setTurns((current) => [...current, { role: "assistant", text: note, products }]);
    } catch {
      setError("Search is unavailable right now. The shop still works.");
      setTurns((current) => [...current, { role: "assistant", text: "I could not search the catalogue just now.", products: [] }]);
    } finally {
      setBusy(false);
    }
  }

  async function addProduct(product: ProductCard) {
    try {
      const live = await getProduct({ data: product.id });
      if (!live) {
        toast.error("That product is no longer available.");
        return;
      }
      const decision = cartDecision(product, live);
      if (!decision.ok) {
        toast.error(decision.reason === "choose-option" ? "Open the product and choose an option before adding it." : "That product is no longer available.");
        return;
      }
      if (decision.reason === "price-changed") toast.message(`The price is now ${formatNaira(live.priceKobo)}. Checkout checks it again.`);
      add({ productId: live.id, variantId: decision.variantId, qty: 1 });
      toast.success("Added to your cart. Checkout is a separate step.");
    } catch {
      toast.error("Could not confirm that product. It was not added.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col">
      <h1 className="font-display text-3xl">SEEK Companion</h1>
      <p className="mt-1 text-sm font-semibold text-link">Your personal shopping assistant</p>
      <p className="mt-2 text-sm text-muted">Tell SEEK what you need. We'll help you find it. I only show approved products, and nothing is added to your cart unless you tap Add to cart.</p>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        {turns.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-3 text-sm">
            <p>What are you looking for? A budget helps, for example a phone under ₦250,000.</p>
            <div className="mt-3 flex flex-col gap-2">
              {prompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => void run(prompt)} className="rounded-xl bg-cream px-3 py-2 text-left text-sm active:bg-bg">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {turns.map((turn, index) => (
          <article key={`${turn.role}-${index}`} className={turn.role === "user" ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-fg" : "rounded-2xl border border-border bg-surface p-3 text-sm"}>
            <p className="whitespace-pre-wrap">{turn.text}</p>
            {turn.products.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {turn.products.map((product) => (
                  <li key={product.id} className="rounded-xl border border-border bg-bg p-2">
                    <div className="flex gap-2">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : <span className="size-16 shrink-0 rounded-lg bg-cream" />}
                      <div className="min-w-0">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted">{explain(product, "")}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Link to="/product/$slug" params={{ slug: product.id }} className="grid h-11 place-items-center rounded-xl border border-border text-sm font-semibold">View product</Link>
                      <Button type="button" onClick={() => void addProduct(product)} disabled={product.stock < 1}>Add to cart</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {busy ? <p className="text-sm text-muted">Looking through approved products…</p> : null}
        {error ? (
          <p className="text-sm text-danger">
            {error} <Link to="/shop" search={shopSearch} className="font-semibold text-link">Open the shop</Link>
          </p>
        ) : null}
      </div>
      <form
        className="sticky bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-20 mt-3 flex gap-2 bg-bg py-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run(draft);
        }}
      >
        <label className="sr-only" htmlFor="companion-message">Message</label>
        <input
          id="companion-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={400}
          placeholder="Tell SEEK what you need"
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base outline-none focus:border-primary"
        />
        <Button type="submit" disabled={busy || draft.trim().length < 2}>Send</Button>
      </form>
    </div>
  );
}
