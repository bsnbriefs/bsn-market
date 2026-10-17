create table if not exists fair_requests (
  id text primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  category text not null default '',
  brand text not null default '',
  specs text not null default '',
  condition text not null default 'either' check (condition in ('new', 'used', 'either')),
  qty integer not null check (qty >= 1 and qty <= 10),
  budget_kobo integer not null check (budget_kobo >= 100 and budget_kobo <= 2000000000),
  state text not null default '',
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'fulfilled', 'closed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists fair_offers (
  id text primary key,
  request_id text not null references fair_requests (id),
  retailer_id text not null references retailer_profiles (id),
  product_id text not null references products (id),
  variant_id text not null default '',
  price_kobo integer not null check (price_kobo >= 100 and price_kobo <= 2000000000),
  condition text not null default 'new' check (condition in ('new', 'used')),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'selected', 'declined', 'withdrawn', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  selected_at timestamptz
);

create unique index if not exists fair_offers_one_live
  on fair_offers (request_id, retailer_id, product_id, variant_id)
  where status in ('pending', 'selected');

create unique index if not exists fair_offers_one_selected
  on fair_offers (request_id)
  where status = 'selected';

alter table cart_items add column if not exists offer_id text not null default '';
alter table cart_items drop constraint if exists cart_items_user_id_product_id_variant_id_key;
create unique index if not exists cart_items_user_product_variant_offer
  on cart_items (user_id, product_id, variant_id, offer_id);
