import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { archiveMyProduct, listMyProducts, saveMyProduct } from "@/lib/market/retailer";
import { formatNaira } from "@/lib/market/money";
import { Button, errText, Field, TextArea } from "@/components/market/ui";

export const Route = createFileRoute("/retailer/products")({
  head: () => ({ meta: [{ title: "Products · BSN Market" }, { name: "robots", content: "noindex" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const products = useQuery({ queryKey: ["my-products"], queryFn: () => listMyProducts() });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submit = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "submit";
    const file = form.get("photo");
    let images: string[] = [];
    if (file instanceof File && file.size > 0) {
      images = [await fileToJpeg(file)];
    }
    setBusy(true);
    try {
      await saveMyProduct({
        data: {
          name: form.get("name"),
          description: form.get("description"),
          brand: form.get("brand"),
          categoryId: form.get("categoryId"),
          priceNaira: form.get("priceNaira"),
          stock: Number(form.get("stock") ?? 0),
          returnEligible: form.get("returnEligible") === "on",
          submit,
          images,
          variants: String(form.get("variants") ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [label, stock, extra] = line.split(",").map((part) => part.trim());
              return { label, stock: Number(stock || 0), extraNaira: extra || "" };
            }),
        },
      });
      toast.success(submit ? "Submitted for approval" : "Draft saved");
      event.currentTarget.reset();
      await queryClient.invalidateQueries({ queryKey: ["my-products"] });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-2">
        <h1 className="font-display text-3xl">New product</h1>
        <p className="text-sm text-muted">Saving an approved product sends it back for review. You cannot approve your own listing.</p>
        <Field name="name" required placeholder="Name" aria-label="Product name" />
        <TextArea name="description" placeholder="Description" aria-label="Description" />
        <Field name="brand" placeholder="Brand" aria-label="Brand" />
        <select name="categoryId" aria-label="Category" className="h-11 w-full rounded-xl border border-border bg-surface px-3">
          <option value="">Category</option>
          {(products.data?.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <Field name="priceNaira" required inputMode="decimal" placeholder="Price in naira" aria-label="Price" />
        <Field name="stock" type="number" min={0} defaultValue={0} placeholder="Stock if there are no variants" aria-label="Stock" />
        <TextArea name="variants" placeholder={"Variants, one per line: label, stock, extra naira\nM, 4, 0\nL, 2, 500"} aria-label="Variants" />
        <label className="text-sm">Photo JPEG<input name="photo" type="file" accept="image/*" className="mt-1 block w-full text-sm" /></label>
        <label className="flex gap-2 text-sm"><input name="returnEligible" type="checkbox" defaultChecked /> Return eligible</label>
        <div className="flex gap-2">
          <Button type="submit" name="intent" value="draft" variant="surface" disabled={busy}>Save draft</Button>
          <Button type="submit" name="intent" value="submit" disabled={busy}>Submit for approval</Button>
        </div>
      </form>
      <div>
        <h2 className="font-display text-2xl">Your products</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(products.data?.products ?? []).map((product) => (
            <li key={product.id} className="rounded-2xl border border-border bg-surface p-3">
              <p className="font-semibold">{product.name}</p>
              <p className="capitalize text-muted">{product.status} · {formatNaira(Number(product.price_kobo))} · stock {product.stock}</p>
              {product.moderation_reason ? <p>{product.moderation_reason}</p> : null}
              {product.status !== "archived" ? <button type="button" className="text-danger" onClick={() => archiveMyProduct({ data: product.id }).then(() => queryClient.invalidateQueries({ queryKey: ["my-products"] })).catch((error) => toast.error(errText(error)))}>Archive</button> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

async function fileToJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read that image");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.72);
  if (url.length > 450000) throw new Error("That photo is too large");
  return url;
}
