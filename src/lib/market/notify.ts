import type { Query } from "./records.ts";

export async function notifyUser(
  sql: Query,
  input: { userId: string; title: string; body: string; href?: string },
): Promise<void> {
  const profiles = await sql.query<{ email: string }>("select email from profiles where user_id = $1", [input.userId]);
  const email = profiles[0]?.email ?? "";
  let emailStatus = "not_configured";
  const key = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (key && from && email) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: email, subject: input.title, text: input.body }),
      });
      emailStatus = response.ok ? "sent" : "failed";
    } catch {
      emailStatus = "failed";
    }
  } else if (!email) {
    emailStatus = "skipped";
  }
  await sql.query(
    `insert into notifications (id, user_id, title, body, href, email_status) values ($1,$2,$3,$4,$5,$6)`,
    [crypto.randomUUID(), input.userId, input.title, input.body, input.href ?? "", emailStatus],
  );
}

export async function notifyAdmins(
  sql: Query,
  input: { title: string; body: string; href?: string },
): Promise<void> {
  const admins = await sql.query<{ user_id: string }>("select user_id from user_roles where role = 'admin'", []);
  for (const admin of admins) {
    await notifyUser(sql, { ...input, userId: admin.user_id });
  }
}
