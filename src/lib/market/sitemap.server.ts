import { getSql } from "@/lib/db";

export async function listSitemapPaths(): Promise<string[]> {
  const sql = await getSql();
  const products = await sql<{ slug: string }>`
    select p.slug from products p
    join retailer_profiles r on r.id = p.retailer_id
    where p.status = 'approved' and r.status = 'approved'`;
  const policies = await sql<{ slug: string }>`select slug from policies`;
  return ["/", "/shop", "/request", "/support", ...products.map((row) => `/product/${row.slug}`), ...policies.map((row) => `/policies/${row.slug}`)];
}
