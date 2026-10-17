import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { searchProducts, type ProductCard } from "@/lib/market/catalog";
import { quoteCart } from "@/lib/market/commerce";
import { useCartStore } from "@/lib/market/cart";
import { formatNaira, nairaToKobo } from "@/lib/market/money";
import { basketSubtotal, bundleGoals, canSwap, planCustom, proposeBundle, quantityWithinBudget, remainingBudget, trimToBudget } from "@/lib/market/bundle";
import { Button, errText, Field } from "@/components/market/ui";

export const Route = createFileRoute("/_store/bundle")({
  head: () => ({
    meta: [
      { title: "Bundle Builder · SEEK" },
      { name: "description", content: "Tell us what you're shopping for, set your budget, and build your ideal basket." },
    ],
  }),
  component: BundlePage,
});

const emptySearch = { q: "", category: "", retailer: "", brand: "", state: "", min: "", max: "", sort: "price_asc" as const, available: "1" as const, page: 1 };

type Pick = { productId: string; variantId: string | null; qty: number };
type Group = { category: string; products: ProductCard[] };

function cheapest(product: ProductCard): { unit: number; variantId: string | null; stock: number } | null {
  if (product.variants.length === 0) {
    if (product.stock < 1) return null;
    return { unit: product.priceKobo, variantId: null, stock: product.stock };
  }
  const variant = product.variants.filter((item) => item.stock > 0).sort((a, b) => a.delta - b.delta)[0];
  if (!variant) return null;
  return { unit: product.priceKobo + variant.delta, variantId: variant.id, stock: variant.stock };
}

function chosenUnit(product: ProductCard, variantId: string | null) {
  if (product.variants.length === 0) return { unit: product.priceKobo, stock: product.stock, variantId: null as string | null };
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return null;
  return { unit: product.priceKobo + variant.delta, stock: variant.stock, variantId: variant.id };
}

function BundlePage() {
  const add = useCartStore((state) => state.add);
  const cartItems = useCartStore((state) => state.items);
  const [goalId, setGoalId] = useState("home");
  const [custom, setCustom] = useState("");
  const [budget, setBudget] = useState("150000");
  const [groups, setGroups] = useState<Group[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [note, setNote] = useState("");
  const [gaps, setGaps] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [built, setBuilt] = useState(false);
  const products = groups.flatMap((group) => group.products);
  const byId = new Map(products.map((product) => [product.id, product]));

  function lines() {
    return picks.flatMap((pick) => {
      const product = byId.get(pick.productId);
      const priced = product ? chosenUnit(product, pick.variantId) : null;
      if (!product || !priced) return [];
      return [{ id: pick.productId, unitKobo: priced.unit, qty: pick.qty, stock: priced.stock, name: product.name }];
    });
  }

  const current = lines();
  const subtotal = basketSubtotal(current);
  let budgetKobo = 0;
  try {
    budgetKobo = nairaToKobo(budget);
  } catch {
    budgetKobo = 0;
  }
  const left = remainingBudget(budgetKobo, subtotal);

  async function build(nextBudget = budget) {
    setBusy(true);
    setNotice("");
    try {
      const amount = nairaToKobo(nextBudget);
      if (amount < 100) throw new Error("Enter a budget of at least ₦1");
      const goal = bundleGoals.find((item) => item.id === goalId);
      const planned = goalId === "custom" ? planCustom(custom) : { categories: goal?.categories ?? [], query: "", note: goal?.note ?? "" };
      const categories = planned.categories.length ? planned.categories : ["*"];
      const loaded = await Promise.all(categories.map(async (category) => {
        const result = await searchProducts({
          data: { ...emptySearch, category: category === "*" ? "" : category, q: planned.query, max: String(amount / 100), sort: "price_asc", available: "1" },
        });
        return { category, products: result.products.filter((product) => product.stock > 0 || product.variants.some((variant) => variant.stock > 0)) };
      }));
      const seen = new Set<string>();
      const unique = loaded.map((group) => ({
        category: group.category,
        products: group.products.filter((product) => (seen.has(product.id) ? false : (seen.add(product.id), true))),
      }));
      const proposal = proposeBundle(
        unique.map((group) => ({
          category: group.category,
          offers: group.products.flatMap((product) => {
            const price = cheapest(product);
            return price ? [{ id: product.id, priceKobo: price.unit, stock: price.stock }] : [];
          }),
        })),
        amount,
      );
      const nextPicks = proposal.ids.flatMap((id) => {
        const product = unique.flatMap((group) => group.products).find((item) => item.id === id);
        const price = product ? cheapest(product) : null;
        return price ? [{ productId: id, variantId: price.variantId, qty: 1 }] : [];
      });
      setGroups(unique);
      setPicks(nextPicks);
      setGaps(proposal.gaps.filter((gap) => gap !== "*"));
      setNote(planned.note);
      setBuilt(true);
      if (nextPicks.length === 0) setNotice("Nothing in the approved catalogue fits this budget. Raise it, or choose fewer kinds of items.");
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }

  function applyBudget(value: string) {
    setBudget(value);
    if (!built) return;
    try {
      const amount = nairaToKobo(value);
      const trimmed = trimToBudget(lines(), amount);
      if (trimmed.dropped.length) {
        setPicks((currentPicks) => currentPicks.filter((pick) => !trimmed.dropped.includes(pick.productId)));
        const names = trimmed.dropped.map((id) => byId.get(id)?.name ?? "An item").join(", ");
        setNotice(`${names} no longer fit the new budget, so they were removed.`);
      }
    } catch {
      setNotice("Enter the budget in naira.");
    }
  }

  function setQuantity(productId: string, next: number) {
    const line = current.find((item) => item.id === productId);
    if (!line) return;
    const decision = quantityWithinBudget({ next, current: line.qty, unitKobo: line.unitKobo, otherKobo: subtotal - line.unitKobo * line.qty, budgetKobo, stock: line.stock });
    if (decision.message) {
      setNotice(decision.message);
      return;
    }
    setNotice("");
    setPicks((rows) => rows.map((row) => (row.productId === productId ? { ...row, qty: decision.qty } : row)));
  }

  function chooseVariant(product: ProductCard, variantId: string) {
    const priced = chosenUnit(product, variantId);
    const line = current.find((item) => item.id === product.id);
    if (!priced || !line) return;
    const other = subtotal - line.unitKobo * line.qty;
    if (!canSwap({ nextUnit: priced.unit * line.qty, otherKobo: other, budgetKobo })) {
      setNotice("That option would pass your budget.");
      return;
    }
    setNotice("");
    setPicks((rows) => rows.map((row) => (row.productId === product.id ? { ...row, variantId } : row)));
  }

  function replace(productId: string, nextId: string) {
    const next = byId.get(nextId);
    const price = next ? cheapest(next) : null;
    const line = current.find((item) => item.id === productId);
    if (!next || !price || !line) return;
    const other = subtotal - line.unitKobo * line.qty;
    if (!canSwap({ nextUnit: price.unit, otherKobo: other, budgetKobo })) {
      setNotice("That replacement would pass your budget.");
      return;
    }
    setNotice(`${next.name} replaced the previous item. Nothing was swapped without this choice.`);
    setPicks((rows) => rows.map((row) => (row.productId === productId ? { productId: nextId, variantId: price.variantId, qty: 1 } : row)));
  }

  async function addSelected() {
    if (current.length === 0) return;
    if (left < 0) {
      setNotice("The basket is over the budget. Remove something first.");
      return;
    }
    setBusy(true);
    try {
      const quote = await quoteCart({ data: { items: current.map((line) => ({ productId: line.id, variantId: picks.find((pick) => pick.productId === line.id)?.variantId ?? null, qty: line.qty })) } });
      const accepted = new Set(quote.lines.map((line) => `${line.productId}:${line.variantId ?? ""}`));
      let added = 0;
      for (const line of quote.lines) {
        const already = cartItems.some((item) => item.productId === line.productId && item.variantId === line.variantId);
        if (already) continue;
        add({ productId: line.productId, variantId: line.variantId, qty: line.qty });
        added += 1;
      }
      const skipped = current.filter((line) => !accepted.has(`${line.id}:${picks.find((pick) => pick.productId === line.id)?.variantId ?? ""}`));
      if (quote.issues.length) setNotice(quote.issues.join(" "));
      else if (added === 0) setNotice("Those items are already in your cart. Nothing was added twice.");
      else setNotice(skipped.length ? "Some items could not be added. The rest are in your cart." : "Selected items are in your cart. Delivery is still calculated at checkout.");
      if (added) toast.success("Added to your cart");
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Bundle Builder</h1>
        <p className="mt-1 text-sm text-muted">Tell us what you're shopping for, set your budget, and build your ideal basket. This basket is not your cart until you add the items.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {bundleGoals.map((goal) => (
          <button key={goal.id} type="button" onClick={() => { setGoalId(goal.id); setBudget(goal.budget); }} className={`min-h-20 rounded-2xl border p-3 text-left ${goalId === goal.id ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface"}`}>
            <span className="block text-sm font-semibold">{goal.title}</span>
            <span className={`mt-1 block text-xs ${goalId === goal.id ? "text-primary-fg/80" : "text-muted"}`}>{goal.body}</span>
          </button>
        ))}
        <button type="button" onClick={() => setGoalId("custom")} className={`min-h-20 rounded-2xl border p-3 text-left ${goalId === "custom" ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface"}`}>
          <span className="block text-sm font-semibold">Custom bundle</span>
          <span className={`mt-1 block text-xs ${goalId === "custom" ? "text-primary-fg/80" : "text-muted"}`}>Describe what you need.</span>
        </button>
      </div>
      {goalId === "custom" ? <Field value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="What are you shopping for?" aria-label="What you need" /> : null}
      <Field value={budget} onChange={(event) => applyBudget(event.target.value)} inputMode="decimal" aria-label="Budget in naira" placeholder="Budget in naira" />
      <Button type="button" onClick={() => void build()} disabled={busy}>{busy ? "Looking…" : built ? "Refresh prices" : "Build basket"}</Button>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
      {built ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-display text-2xl">Budget</h2>
          <p className="mt-2 text-sm">Budget {budgetKobo ? formatNaira(budgetKobo) : "not set"}</p>
          <p className="text-sm">Product subtotal {formatNaira(subtotal)} · {current.length} selected</p>
          <p className={`text-sm font-semibold ${left < 0 ? "text-danger" : "text-link"}`}>Remaining {budgetKobo ? formatNaira(left) : "—"}</p>
          <p className="mt-2 text-xs text-muted">This is the product subtotal only. Delivery depends on your state and is charged per retailer at checkout. It is not included here.</p>
          {gaps.length ? <p className="mt-2 text-sm">Nothing listed in {gaps.join(", ")} fits this budget.</p> : null}
        </section>
      ) : null}
      <ul className="space-y-3">
        {picks.map((pick) => {
          const product = byId.get(pick.productId);
          const priced = product ? chosenUnit(product, pick.variantId) : null;
          if (!product || !priced) return null;
          const alternatives = products.filter((item) => item.id !== product.id && cheapest(item) && canSwap({ nextUnit: cheapest(item)?.unit ?? 0, otherKobo: subtotal - priced.unit * pick.qty, budgetKobo }));
          return (
            <li key={pick.productId} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex gap-3">
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-16 rounded-xl object-cover" /> : <span className="size-16 rounded-xl bg-cream" />}
                <div className="min-w-0">
                  <Link to="/product/$slug" params={{ slug: product.id }} className="font-semibold">{product.name}</Link>
                  <p className="text-sm">{formatNaira(priced.unit)} · {product.retailerName}</p>
                  <p className="text-xs text-muted">{priced.stock} in stock{product.brand ? ` · ${product.brand}` : ""}</p>
                </div>
              </div>
              {product.variants.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button key={variant.id} type="button" disabled={variant.stock < 1} onClick={() => chooseVariant(product, variant.id)} className={`min-h-10 rounded-full border px-3 text-xs ${variant.id === priced.variantId ? "border-primary bg-primary text-primary-fg" : "border-border"}`}>
                      {variant.label}{variant.stock < 1 ? " · sold out" : ""}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className="size-10 rounded-xl border border-border" aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(product.id, pick.qty - 1)}>−</button>
                <span className="w-6 text-center text-sm font-semibold">{pick.qty}</span>
                <button type="button" className="size-10 rounded-xl border border-border" aria-label={`Increase ${product.name}`} onClick={() => setQuantity(product.id, pick.qty + 1)}>+</button>
                <button type="button" className="text-sm font-semibold text-danger" onClick={() => setPicks((rows) => rows.filter((row) => row.productId !== product.id))}>Remove</button>
              </div>
              {alternatives.length > 0 ? (
                <label className="mt-3 block text-xs text-muted">
                  Replace with
                  <select className="mt-1 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg" defaultValue="" aria-label={`Replace ${product.name}`} onChange={(event) => { if (event.target.value) replace(product.id, event.target.value); }}>
                    <option value="">Choose an alternative</option>
                    {alternatives.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatNaira(cheapest(item)?.unit ?? item.priceKobo)}</option>)}
                  </select>
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>
      {built && picks.length === 0 ? <p className="text-sm text-muted">No basket yet. Change the budget or the goal. The shop will not invent products.</p> : null}
      {picks.length > 0 ? (
        <div className="flex flex-wrap gap-2 pb-16">
          <Button type="button" onClick={() => void addSelected()} disabled={busy || left < 0}>Add selected items to cart</Button>
          <Link to="/cart" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">View cart</Link>
          <Link to="/checkout" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Checkout</Link>
        </div>
      ) : null}
    </div>
  );
}
