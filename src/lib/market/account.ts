import { createServerFn } from "@tanstack/react-start";
import { getSql, withTransaction } from "@/lib/db";
import { canReview } from "./authz.ts";
import { assertImageRef, clean, ensureProfile, ownRetailer, rateLimit, roleNames } from "./guard.ts";
import { notifyAdmins, notifyUser } from "./notify.ts";
import { claimAdmin, MarketError } from "./records.ts";
import { NIGERIAN_STATES } from "./states.ts";
import { sessionMiddleware, type SessionContext } from "./session.ts";

export const getMe = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const profile = await sql<{ full_name: string; phone: string; email: string }>`
      select full_name, phone, email from profiles where user_id = ${userId}`;
    const roles = await roleNames(sql, userId);
    const retailer = await ownRetailer(sql, userId);
    const addresses = await sql<{
      id: string;
      label: string;
      recipient: string;
      phone: string;
      line: string;
      state: string;
      city: string;
      instructions: string;
      is_default: boolean;
    }>`select id, label, recipient, phone, line, state, city, instructions, is_default
       from customer_addresses where user_id = ${userId} order by is_default desc`;
    const notifications = await sql<{ id: string; title: string; body: string; href: string; read_at: string | null; created_at: string; email_status: string }>`
      select id, title, body, href, read_at::text as read_at, created_at::text as created_at, email_status
      from notifications where user_id = ${userId} order by created_at desc limit 30`;
    const adminCount = await sql<{ n: number }>`select count(*)::int as n from user_roles where role = 'admin'`;
    return {
      profile: {
        fullName: profile[0]?.full_name ?? "",
        phone: profile[0]?.phone ?? "",
        email: profile[0]?.email || email,
      },
      roles,
      retailer,
      addresses,
      notifications,
      unread: notifications.filter((item) => !item.read_at).length,
      adminExists: Number(adminCount[0]?.n ?? 0) > 0,
      paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
      emailConfigured: Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS),
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const fullName = clean(raw.fullName, 80);
    const phone = clean(raw.phone, 20);
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    await sql`update profiles set full_name = ${fullName}, phone = ${phone}, updated_at = now() where user_id = ${userId}`;
    return { ok: true };
  });

export const saveAddress = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const recipient = clean(raw.recipient, 80);
    const phone = clean(raw.phone, 20);
    const line = clean(raw.line, 160);
    const state = clean(raw.state, 40);
    const city = clean(raw.city, 60);
    const instructions = clean(raw.instructions, 240);
    if (recipient.length < 2 || phone.length < 7 || line.length < 4 || !city) throw new MarketError("Complete the address");
    if (!(NIGERIAN_STATES as readonly string[]).includes(state)) throw new MarketError("Choose a Nigerian state");
    const sql = await getSql();
    const id = clean(raw.id, 80) || crypto.randomUUID();
    if (raw.isDefault === true) {
      await sql`update customer_addresses set is_default = false where user_id = ${userId}`;
    }
    await sql`insert into customer_addresses (id, user_id, label, recipient, phone, line, state, city, instructions, is_default)
      values (${id}, ${userId}, ${clean(raw.label, 40) || "Home"}, ${recipient}, ${phone}, ${line}, ${state}, ${city}, ${instructions}, ${raw.isDefault === true})
      on conflict (id) do update set recipient = excluded.recipient, phone = excluded.phone, line = excluded.line,
        state = excluded.state, city = excluded.city, instructions = excluded.instructions, is_default = excluded.is_default
        where customer_addresses.user_id = ${userId}`;
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id : ""))
  .handler(async ({ context, data: id }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    await sql`delete from customer_addresses where id = ${id} and user_id = ${userId}`;
    return { ok: true };
  });

export const claimMarketplace = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId, email } = context as SessionContext;
    const won = await withTransaction(async (sql) => {
      await ensureProfile(sql, userId, email);
      return claimAdmin(sql, userId);
    });
    if (!won) throw new MarketError("An administrator already exists. Ask them for access.");
    return { ok: true };
  });

export const applyRetailer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`apply:${userId}`, 5, 60 * 60 * 1000);
    const raw = (data ?? {}) as Record<string, unknown>;
    const businessName = clean(raw.businessName, 80);
    const contactName = clean(raw.contactName, 80);
    const phone = clean(raw.phone, 20);
    const businessEmail = clean(raw.email, 120) || email;
    const address = clean(raw.address, 160);
    const state = clean(raw.state, 40);
    const city = clean(raw.city, 60);
    const categories = clean(raw.categories, 160);
    const description = clean(raw.description, 800);
    const catalogueNote = clean(raw.catalogueNote, 800);
    const registration = clean(raw.registrationNumber, 40);
    if (raw.termsAccepted !== true) throw new MarketError("Accept the retailer agreement to apply");
    if (businessName.length < 2 || contactName.length < 2 || phone.length < 7 || address.length < 4 || !city) {
      throw new MarketError("Complete the business details");
    }
    if (!(NIGERIAN_STATES as readonly string[]).includes(state)) throw new MarketError("Choose a Nigerian state");
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const existing = await ownRetailer(sql, userId);
    if (existing && existing.status !== "rejected") throw new MarketError("You already have a retailer application");
    const id = existing?.id ?? crypto.randomUUID();
    if (existing) {
      await sql`update retailer_profiles set business_name = ${businessName}, contact_name = ${contactName}, phone = ${phone},
        email = ${businessEmail}, address = ${address}, state = ${state}, city = ${city}, categories = ${categories},
        description = ${description}, catalogue_note = ${catalogueNote}, registration_number = ${registration},
        terms_accepted = true, status = 'pending', review_reason = '', updated_at = now()
        where id = ${id} and user_id = ${userId}`;
    } else {
      await sql`insert into retailer_profiles (
        id, user_id, business_name, contact_name, phone, email, address, state, city, categories, description,
        catalogue_note, registration_number, terms_accepted, status
      ) values (
        ${id}, ${userId}, ${businessName}, ${contactName}, ${phone}, ${businessEmail}, ${address}, ${state}, ${city},
        ${categories}, ${description}, ${catalogueNote}, ${registration}, true, 'pending'
      )`;
    }
    await sql`insert into user_roles (user_id, role) values (${userId}, 'retailer') on conflict do nothing`;
    await sql`insert into retailer_verification_records (id, retailer_id, status, reason, actor_user_id)
      values (${crypto.randomUUID()}, ${id}, 'pending', 'Application submitted', ${userId})`;
    await notifyUser(sql, {
      userId,
      title: "Retailer application received",
      body: "An administrator will review your application before you can publish products.",
      href: "/retailer",
    });
    await notifyAdmins(sql, {
      title: "Retailer application",
      body: businessName,
      href: "/admin/retailers",
    });
    return { ok: true };
  });

export const createTicket = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`ticket:${userId}`, 8, 60 * 60 * 1000);
    const raw = (data ?? {}) as Record<string, unknown>;
    const subject = clean(raw.subject, 120);
    const body = clean(raw.body, 2000);
    if (subject.length < 3 || body.length < 8) throw new MarketError("Describe what you need help with");
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const id = crypto.randomUUID();
    await sql`insert into support_tickets (id, user_id, subject) values (${id}, ${userId}, ${subject})`;
    await sql`insert into support_messages (id, ticket_id, author_user_id, body) values (${crypto.randomUUID()}, ${id}, ${userId}, ${body})`;
    await notifyAdmins(sql, { title: "Support ticket", body: subject, href: "/admin/support" });
    return { id };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    return sql<{ id: string; subject: string; status: string; created_at: string }>`
      select id, subject, status, created_at::text as created_at from support_tickets
      where user_id = ${userId} order by created_at desc limit 30`;
  });

export const createProductRequest = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId, email } = context as SessionContext;
    rateLimit(`request:${userId}`, 8, 60 * 60 * 1000);
    const raw = (data ?? {}) as Record<string, unknown>;
    const name = clean(raw.name, 120);
    const description = clean(raw.description, 1000);
    if (name.length < 2) throw new MarketError("Name the product you want");
    const image = clean(raw.imageUrl, 450000);
    if (image) assertImageRef(image);
    const sql = await getSql();
    await ensureProfile(sql, userId, email);
    const id = crypto.randomUUID();
    const reference = `PR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const min = clean(raw.budgetMin, 12);
    const max = clean(raw.budgetMax, 12);
    const { nairaToKobo } = await import("./money.ts");
    await sql`insert into product_requests (
      id, reference, user_id, name, description, category, brand, budget_min_kobo, budget_max_kobo,
      state, city, image_url, contact_preference
    ) values (
      ${id}, ${reference}, ${userId}, ${name}, ${description}, ${clean(raw.category, 60)}, ${clean(raw.brand, 60)},
      ${min ? nairaToKobo(min) : null}, ${max ? nairaToKobo(max) : null},
      ${clean(raw.state, 40)}, ${clean(raw.city, 60)}, ${image}, ${clean(raw.contactPreference, 40) || "in_app"}
    )`;
    await notifyUser(sql, {
      userId,
      title: "Product request received",
      body: `Your reference is ${reference}. This is not an order.`,
      href: "/request",
    });
    await notifyAdmins(sql, { title: "Product request", body: `${reference}: ${name}`, href: "/admin/requests" });
    return { reference };
  });

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    return sql<{ reference: string; name: string; status: string; quotation_note: string; quotation_kobo: number | null; created_at: string }>`
      select reference, name, status, quotation_note, quotation_kobo, created_at::text as created_at
      from product_requests where user_id = ${userId} order by created_at desc limit 30`;
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as SessionContext;
    const sql = await getSql();
    await sql`update notifications set read_at = now() where user_id = ${userId} and read_at is null`;
    return { ok: true };
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    const { userId } = context as SessionContext;
    const raw = (data ?? {}) as Record<string, unknown>;
    const orderItemId = clean(raw.orderItemId, 80);
    const body = clean(raw.body, 800);
    const rating = Number(raw.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new MarketError("Choose a rating from 1 to 5");
    const sql = await getSql();
    const rows = await sql<{
      product_id: string | null;
      user_id: string;
      fulfilment: string;
    }>`select oi.product_id, o.user_id, ro.status as fulfilment
       from order_items oi
       join orders o on o.id = oi.order_id
       join retailer_orders ro on ro.order_id = oi.order_id and ro.retailer_id = oi.retailer_id
       where oi.id = ${orderItemId}`;
    const row = rows[0];
    const existing = await sql<{ id: string }>`select id from product_reviews where order_item_id = ${orderItemId}`;
    if (!row?.product_id || !canReview({ buyerId: row.user_id, userId, fulfilmentStatus: row.fulfilment, alreadyReviewed: existing.length > 0 })) {
      throw new MarketError("You can review this product after it is delivered");
    }
    await sql`insert into product_reviews (id, product_id, user_id, order_item_id, rating, body)
      values (${crypto.randomUUID()}, ${row.product_id}, ${userId}, ${orderItemId}, ${rating}, ${body})`;
    return { ok: true };
  });
