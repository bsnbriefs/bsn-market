# BSN Market setup notes

This build runs on the platform database (Neon Postgres when deployed, a local Postgres-compatible database in preview) and Better Auth. It does not use Supabase. Authorization is enforced in server functions: customers, retailers, and administrators only receive the rows their role allows. Prices, stock, commission, and payment status are calculated on the server.

Money is stored as integer kobo (100 kobo = 1 naira).

## What works before external accounts exist

- Shop, search, cart, checkout, orders, retailer application, product moderation, admin overview, product requests, support, and policies.
- If Paystack is not configured, checkout creates an unpaid order and offers a labelled **test payment**. That is not a real charge and is refused once Paystack is configured.
- Email notifications are stored in the app. They are only handed to Resend when email credentials exist. The screen says when email was not sent.

## Secrets the deployed app can use

Set these in the host’s server environment, never in frontend code and never with a `VITE_` prefix:

- `PAYSTACK_SECRET_KEY` — initialises and verifies payments
- `PAYSTACK_WEBHOOK_SECRET` — optional; otherwise the secret key checks the webhook signature
- `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM_ADDRESS` — Resend
- `APP_BASE_URL` — public site URL used as the Paystack callback

Paystack webhook path: `/api/paystack/webhook`.

The first signed-in person can claim the administrator role once, from Account, and only while no administrator exists. After that, users cannot grant themselves admin.

Starter products are sample catalogue rows. Archive or suspend them before accepting real orders. Delivery fees exist only for Lagos, FCT, and Rivers until an administrator adds more. Other states create a quote instead of a guessed fee.

This is not production-ready for live card payments until you verify Paystack signatures, amounts, webhook retries, stock, refunds, and settlements with test keys, and you review Nigerian legal, tax, and consumer obligations.
