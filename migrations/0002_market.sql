-- BSN Market schema. Money columns are integer kobo (100 kobo = 1 naira).
-- Timestamps are timestamptz (UTC). Display them in Africa/Lagos.

create table if not exists profiles (
  user_id text primary key,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id text not null,
  role text not null check (role in ('customer', 'retailer', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists retailer_profiles (
  id text primary key,
  user_id text not null unique,
  business_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  state text not null,
  city text not null,
  categories text not null default '',
  description text not null default '',
  catalogue_note text not null default '',
  registration_number text not null default '',
  terms_accepted boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  review_reason text not null default '',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists retailer_verification_records (
  id text primary key,
  retailer_id text not null references retailer_profiles (id),
  status text not null,
  reason text not null default '',
  actor_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists product_categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists products (
  id text primary key,
  slug text not null unique,
  retailer_id text not null references retailer_profiles (id),
  category_id text references product_categories (id),
  name text not null,
  description text not null default '',
  brand text not null default '',
  price_kobo integer not null check (price_kobo >= 0),
  compare_at_kobo integer,
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  featured boolean not null default false,
  return_eligible boolean not null default true,
  delivery_days_min integer,
  delivery_days_max integer,
  moderation_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_public_idx on products (status, retailer_id);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_created_idx on products (created_at desc);

create table if not exists product_images (
  id text primary key,
  product_id text not null references products (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create table if not exists product_variants (
  id text primary key,
  product_id text not null references products (id) on delete cascade,
  label text not null,
  sku text not null,
  price_delta_kobo integer not null default 0,
  stock integer not null default 0 check (stock >= 0)
);

create table if not exists carts (
  user_id text primary key,
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id text primary key,
  user_id text not null references carts (user_id) on delete cascade,
  product_id text not null,
  variant_id text not null default '',
  qty integer not null check (qty > 0 and qty <= 10),
  unique (user_id, product_id, variant_id)
);

create table if not exists customer_addresses (
  id text primary key,
  user_id text not null,
  label text not null default 'Home',
  recipient text not null,
  phone text not null,
  line text not null,
  state text not null,
  city text not null,
  instructions text not null default '',
  is_default boolean not null default false
);
create index if not exists addresses_user_idx on customer_addresses (user_id);

create table if not exists orders (
  id text primary key,
  reference text not null unique,
  user_id text not null,
  idempotency_key text not null,
  status text not null check (status in (
    'awaiting_quote', 'pending_payment', 'paid', 'payment_failed',
    'cancelled', 'partially_refunded', 'refunded'
  )),
  customer_name text not null,
  email text not null,
  phone text not null,
  address_line text not null,
  state text not null,
  city text not null,
  instructions text not null default '',
  subtotal_kobo integer not null,
  discount_kobo integer not null default 0,
  delivery_kobo integer,
  total_kobo integer,
  promo_code text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders (id),
  retailer_id text not null,
  product_id text references products (id) on delete set null,
  variant_id text,
  name_snapshot text not null,
  variant_snapshot text not null default '',
  retailer_name_snapshot text not null,
  unit_price_kobo integer not null,
  qty integer not null,
  line_kobo integer not null,
  commission_bps integer not null,
  commission_kobo integer not null,
  return_eligible boolean not null default true
);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_retailer_idx on order_items (retailer_id);

create table if not exists retailer_orders (
  id text primary key,
  order_id text not null references orders (id),
  retailer_id text not null,
  status text not null check (status in (
    'pending', 'accepted', 'rejected', 'preparing', 'ready',
    'dispatched', 'in_transit', 'delivered', 'failed', 'cancelled'
  )),
  delivery_kobo integer,
  note text not null default '',
  unique (order_id, retailer_id)
);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders (id),
  reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  status text not null check (status in ('pending', 'success', 'failed', 'abandoned')),
  provider text not null check (provider in ('paystack', 'sandbox')),
  verified_at timestamptz,
  failure_reason text not null default ''
);

create table if not exists payment_events (
  id text primary key,
  reference text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists refunds (
  id text primary key,
  order_id text not null references orders (id),
  order_item_id text references order_items (id),
  amount_kobo integer not null check (amount_kobo > 0),
  reason text not null,
  status text not null check (status in ('requested', 'recorded', 'rejected')),
  provider_reference text not null default '',
  actor_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists commission_rules (
  id text primary key,
  scope text not null check (scope in ('default', 'category', 'retailer')),
  category_id text,
  retailer_id text,
  bps integer not null check (bps >= 0 and bps <= 10000),
  effective_from date not null default current_date,
  active boolean not null default true
);

create table if not exists commission_ledger (
  id text primary key,
  order_item_id text not null unique references order_items (id),
  retailer_id text not null,
  order_reference text not null,
  product_value_kobo integer not null,
  commission_bps integer not null,
  commission_kobo integer not null,
  refund_adjustment_kobo integer not null default 0,
  other_adjustment_kobo integer not null default 0,
  settlement_kobo integer not null,
  settlement_status text not null default 'pending' check (settlement_status in ('pending', 'included', 'paid')),
  settlement_id text
);

create table if not exists retailer_settlements (
  id text primary key,
  retailer_id text not null,
  amount_kobo integer not null,
  status text not null check (status in ('pending', 'paid')),
  reference text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists delivery_records (
  id text primary key,
  retailer_order_id text not null references retailer_orders (id),
  status text not null,
  proof_ref text not null default '',
  note text not null default '',
  actor_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists delivery_zones (
  id text primary key,
  state text not null,
  city text not null default '',
  fee_kobo integer not null check (fee_kobo >= 0),
  unique (state, city)
);

create table if not exists product_reviews (
  id text primary key,
  product_id text not null references products (id),
  user_id text not null,
  order_item_id text not null unique,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  href text not null default '',
  read_at timestamptz,
  email_status text not null default 'not_configured',
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists support_tickets (
  id text primary key,
  user_id text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists support_messages (
  id text primary key,
  ticket_id text not null references support_tickets (id),
  author_user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  actor_user_id text not null,
  action text not null,
  entity text not null,
  entity_id text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists product_requests (
  id text primary key,
  reference text not null unique,
  user_id text not null,
  name text not null,
  description text not null default '',
  category text not null default '',
  brand text not null default '',
  budget_min_kobo integer,
  budget_max_kobo integer,
  state text not null default '',
  city text not null default '',
  image_url text not null default '',
  contact_preference text not null default 'in_app',
  status text not null default 'submitted' check (status in (
    'submitted', 'under_review', 'retailer_contacted', 'quotation_available',
    'customer_considering', 'converted', 'unavailable', 'closed'
  )),
  admin_note text not null default '',
  quotation_kobo integer,
  quotation_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists promotional_campaigns (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  image_url text not null default '',
  link_path text not null default '/shop',
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists promo_codes (
  code text primary key,
  bps_off integer not null check (bps_off >= 0 and bps_off <= 10000),
  min_subtotal_kobo integer not null default 0,
  active boolean not null default true
);

create table if not exists site_settings (
  id text primary key,
  store_name text not null,
  tagline text not null,
  support_email text not null default '',
  support_phone text not null default '',
  contact_address text not null default ''
);

create table if not exists policies (
  slug text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);
