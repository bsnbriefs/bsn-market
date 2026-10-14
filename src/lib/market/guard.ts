import type { Sql } from "@/lib/db";
import { MarketError } from "./records.ts";

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) throw new MarketError("Please wait a moment and try again");
  recent.push(now);
  buckets.set(key, recent);
}

export async function ensureProfile(sql: Sql, userId: string, email: string): Promise<void> {
  await sql`insert into profiles (user_id, email) values (${userId}, ${email})
    on conflict (user_id) do update set email = case when profiles.email = '' then excluded.email else profiles.email end`;
  await sql`insert into user_roles (user_id, role) values (${userId}, 'customer') on conflict do nothing`;
}

export async function roleNames(sql: Sql, userId: string): Promise<string[]> {
  const rows = await sql<{ role: string }>`select role from user_roles where user_id = ${userId}`;
  return rows.map((row) => row.role);
}

export async function requireAdmin(sql: Sql, userId: string): Promise<void> {
  const roles = await roleNames(sql, userId);
  if (!roles.includes("admin")) throw new MarketError("You do not have administrator access");
}

export async function ownRetailer(sql: Sql, userId: string) {
  const rows = await sql<{
    id: string;
    status: string;
    business_name: string;
    user_id: string;
  }>`select id, status, business_name, user_id from retailer_profiles where user_id = ${userId}`;
  return rows[0] ?? null;
}

export function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function assertImageRef(url: string): void {
  if (url.startsWith("/") && url.length < 400 && !url.includes("..")) return;
  if (url.startsWith("https://") && url.length < 2000) return;
  if (url.startsWith("data:image/jpeg;base64,") && url.length < 450000) return;
  throw new MarketError("Use a JPEG photo or an https image link");
}

export async function audit(
  sql: Sql,
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  detail: string,
): Promise<void> {
  await sql`insert into audit_logs (id, actor_user_id, action, entity, entity_id, detail)
    values (${crypto.randomUUID()}, ${actor}, ${action}, ${entity}, ${entityId}, ${detail.slice(0, 500)})`;
}
