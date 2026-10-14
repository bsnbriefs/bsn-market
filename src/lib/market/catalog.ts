import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { nairaToKobo } from "./money.ts";

export type ProductCard = {
  id: string;
  name: string;
  priceKobo: number;
  compareAtKobo: number | null;
  brand: string;
  stock: number;
  imageUrl: string;
  retailerName: string;
  retailerCity: string;
  retailerState: string;
  categorySlug: string;
  categoryName: string;
  reviewCount: number;
};

const CARD_SQL = `
  select p.id, p.name, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
         coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
         r.business_name, r.city as retailer_city, r.state as retailer_state,
         coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
         coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
  from products p
  join retailer_profiles r on r.id = p.retailer_id
  left join product_categories c on c.id = p.category_id
  where p.status = 'approved' and r.status = 'approved'
`;

type CardRow = {
  id: string;
  name: string;
  price_kobo: number;
  compare_at_kobo: number | null;
  brand: string;
  stock: number;
  category_slug: string;
  category_name: string;
  business_name: string;
  retailer_city: string;
  retailer_state: string;
  image_url: string;
  review_count: number;
};

function toCard(row: CardRow): ProductCard {
  return {
    id: row.id,
    name: row.name,
    priceKobo: Number(row.price_kobo),
    compareAtKobo: row.compare_at_kobo === null ? null : Number(row.compare_at_kobo),
    brand: row.brand,
    stock: Number(row.stock),
    imageUrl: row.image_url,
    retailerName: row.business_name,
    retailerCity: row.retailer_city,
    retailerState: row.retailer_state,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    reviewCount: Number(row.review_count),
  };
}

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const settings = await sql<{ store_name: string; tagline: string; support_email: string; support_phone: string }>`
    select store_name, tagline, support_email, support_phone from site_settings where id = 'default'`;
  const categories = await sql<{ slug: string; name: string }>`
    select slug, name from product_categories order by sort_order, name`;
  const campaigns = await sql<{ title: string; subtitle: string; image_url: string; link_path: string }>`
    select title, subtitle, image_url, link_path from promotional_campaigns where active order by sort_order`;
  const featured = (await sql.query<CardRow>(`${CARD_SQL} and p.featured = true order by p.created_at desc limit 8`)).map(toCard);
  const newest = (await sql.query<CardRow>(`${CARD_SQL} order by p.created_at desc limit 8`)).map(toCard);
  const offers = (await sql.query<CardRow>(`${CARD_SQL} and p.compare_at_kobo is not null and p.compare_at_kobo > p.price_kobo order by p.created_at desc limit 8`)).map(toCard);
  const trendIds = await sql<{ product_id: string }>`
    select oi.product_id from order_items oi
    join orders o on o.id = oi.order_id
    where o.status in ('paid', 'partially_refunded', 'refunded') and oi.product_id is not null
    group by oi.product_id order by count(*) desc limit 8`;
  let trending: ProductCard[] = [];
  if (trendIds.length) {
    const ids = trendIds.map((row) => row.product_id);
    const rows = await sql.query<CardRow>(`${CARD_SQL} and p.id = any($1::text[])`, [ids]);
    const byId = new Map(rows.map((row) => [row.id, toCard(row)]));
    trending = ids.flatMap((id) => {
      const card = byId.get(id);
      return card ? [card] : [];
    });
  }
  return {
    storeName: settings[0]?.store_name ?? "BSN Market",
    tagline: settings[0]?.tagline ?? "Your Market. Your Choice. Delivered.",
    supportEmail: settings[0]?.support_email ?? "",
    supportPhone: settings[0]?.support_phone ?? "",
    categories,
    campaigns,
    featured,
    newest,
    offers,
    trending,
  };
});

export type ShopQuery = {
  q: string;
  category: string;
  retailer: string;
  brand: string;
  state: string;
  min: string;
  max: string;
  sort: string;
  page: number;
};

function readShop(input: unknown): ShopQuery {
  const raw = (input ?? {}) as Record<string, unknown>;
  const sort = typeof raw.sort === "string" ? raw.sort : "newest";
  const allowed = new Set(["newest", "price_asc", "price_desc", "relevance"]);
  const page = Number(raw.page);
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 80) : "",
    category: typeof raw.category === "string" ? raw.category.slice(0, 40) : "",
    retailer: typeof raw.retailer === "string" ? raw.retailer.slice(0, 40) : "",
    brand: typeof raw.brand === "string" ? raw.brand.slice(0, 60) : "",
    state: typeof raw.state === "string" ? raw.state.slice(0, 40) : "",
    min: typeof raw.min === "string" ? raw.min.slice(0, 12) : "",
    max: typeof raw.max === "string" ? raw.max.slice(0, 12) : "",
    sort: allowed.has(sort) ? sort : "newest",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 100) : 1,
  };
}

export const searchProducts = createServerFn({ method: "GET" })
  .validator((input: unknown) => readShop(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const where = ["p.status = 'approved'", "r.status = 'approved'"];
    const params: unknown[] = [];
    const add = (sqlText: string, value: unknown) => {
      params.push(value);
      where.push(sqlText.replace("$#", `$${params.length}`));
    };
    if (data.q.trim()) add(`(p.name ilike $# or p.brand ilike $# or p.description ilike $#) `, `%${data.q.trim()}%`);
    // The helper above only replaces the first $#. Do q with three params instead.
    if (data.q.trim()) {
      where.pop();
      params.pop();
      const like = `%${data.q.trim()}%`;
      params.push(like, like, like);
      const a = params.length - 2;
      const b = params.length - 1;
      const c = params.length;
      where.push(`(p.name ilike $${a} or p.brand ilike $${b} or p.description ilike $${c})`);
    }
    if (data.category) add("c.slug = $#", data.category);
    if (data.retailer) add("r.id = $#", data.retailer);
    if (data.brand) add("p.brand = $#", data.brand);
    if (data.state) add("r.state = $#", data.state);
    if (data.min.trim()) {
      try {
        add("p.price_kobo >= $#", nairaToKobo(data.min));
      } catch {
        /* ignore an incomplete price while typing */
      }
    }
    if (data.max.trim()) {
      try {
        add("p.price_kobo <= $#", nairaToKobo(data.max));
      } catch {
        /* ignore */
      }
    }
    const order =
      data.sort === "price_asc"
        ? "p.price_kobo asc"
        : data.sort === "price_desc"
          ? "p.price_kobo desc"
          : data.sort === "relevance" && data.q.trim()
            ? "case when p.name ilike $" + String(params.findIndex((value) => value === `%${data.q.trim()}%`) + 1) + " then 0 else 1 end, p.created_at desc"
            : "p.created_at desc";
    const whereSql = where.join(" and ");
    const countRows = await sql.query<{ n: number }>(
      `select count(*)::int as n from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where ${whereSql}`,
      params,
    );
    const pageSize = 12;
    const offset = (data.page - 1) * pageSize;
    const rows = await sql.query<CardRow>(
      `select p.id, p.name, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
              coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
              r.business_name, r.city as retailer_city, r.state as retailer_state,
              coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
              coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
       from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where ${whereSql}
       order by ${order}
       limit ${pageSize} offset ${offset}`,
      params,
    );
    const facets = await sql.query<{ brand: string; retailer_id: string; business_name: string; state: string }>(
      `select distinct p.brand, r.id as retailer_id, r.business_name, r.state
       from products p join retailer_profiles r on r.id = p.retailer_id
       where p.status = 'approved' and r.status = 'approved'`,
    );
    const categories = await sql<{ slug: string; name: string }>`select slug, name from product_categories order by sort_order`;
    return {
      products: rows.map(toCard),
      total: Number(countRows[0]?.n ?? 0),
      page: data.page,
      pageSize,
      categories,
      brands: [...new Set(facets.map((row) => row.brand).filter(Boolean))].sort(),
      retailers: [...new Map(facets.map((row) => [row.retailer_id, row.business_name])).entries()].map(
        ([id, name]) => ({ id, name }),
      ),
      states: [...new Set(facets.map((row) => row.state))].sort(),
    };
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator((slug: unknown) => (typeof slug === "string" ? slug.slice(0, 80) : ""))
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    const rows = await sql.query<CardRow & { description: string; return_eligible: boolean; delivery_days_min: number | null; delivery_days_max: number | null; retailer_id: string }>(
      `select p.id, p.name, p.description, p.price_kobo, p.compare_at_kobo, p.brand, p.stock,
              p.return_eligible, p.delivery_days_min, p.delivery_days_max, p.retailer_id,
              coalesce(c.slug, '') as category_slug, coalesce(c.name, '') as category_name,
              r.business_name, r.city as retailer_city, r.state as retailer_state, r.description as retailer_description,
              coalesce((select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1), '') as image_url,
              coalesce((select count(*)::int from product_reviews rv where rv.product_id = p.id), 0) as review_count
       from products p
       join retailer_profiles r on r.id = p.retailer_id
       left join product_categories c on c.id = p.category_id
       where p.slug = $1 and p.status = 'approved' and r.status = 'approved'`,
      [slug],
    );
    const product = rows[0];
    if (!product) return null;
    const images = await sql<{ url: string }>`select url from product_images where product_id = ${product.id} order by sort_order`;
    const variants = await sql<{ id: string; label: string; price_delta_kobo: number; stock: number }>`
      select id, label, price_delta_kobo, stock from product_variants where product_id = ${product.id} order by label`;
    const reviews = await sql<{ rating: number; body: string; created_at: string; full_name: string }>`
      select rv.rating, rv.body, rv.created_at::text as created_at, coalesce(pr.full_name, 'Customer') as full_name
      from product_reviews rv
      left join profiles pr on pr.user_id = rv.user_id
      where rv.product_id = ${product.id}
      order by rv.created_at desc limit 20`;
    const related = (
      await sql.query<CardRow>(`${CARD_SQL} and c.slug = $1 and p.id <> $2 order by p.created_at desc limit 4`, [
        product.category_slug,
        product.id,
      ])
    ).map(toCard);
    const rating =
      reviews.length === 0 ? null : Math.round(reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length);
    return {
      ...toCard(product),
      description: product.description,
      returnEligible: Boolean(product.return_eligible),
      deliveryDaysMin: product.delivery_days_min,
      deliveryDaysMax: product.delivery_days_max,
      retailerId: product.retailer_id,
      retailerDescription: (product as { retailer_description?: string }).retailer_description ?? "",
      images: images.map((image) => image.url),
      variants: variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        priceDeltaKobo: Number(variant.price_delta_kobo),
        stock: Number(variant.stock),
      })),
      reviews: reviews.map((review) => ({
        rating: Number(review.rating),
        body: review.body,
        createdAt: review.created_at,
        name: review.full_name || "Customer",
      })),
      rating,
      related,
    };
  });

export const getPolicy = createServerFn({ method: "GET" })
  .validator((slug: unknown) => (typeof slug === "string" ? slug.slice(0, 40) : ""))
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    const rows = await sql<{ title: string; body: string; updated_at: string }>`
      select title, body, updated_at::text as updated_at from policies where slug = ${slug}`;
    return rows[0] ? { slug, title: rows[0].title, body: rows[0].body, updatedAt: rows[0].updated_at } : null;
  });

export const listPolicyLinks = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{ slug: string; title: string }>`select slug, title from policies order by title`;
});
