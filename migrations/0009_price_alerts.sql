create table if not exists price_alerts (
  id text primary key,
  user_id text not null,
  product_id text not null references products (id),
  kind text not null check (kind in ('price', 'stock')),
  target_kobo integer,
  status text not null default 'active' check (status in ('active', 'triggered', 'cancelled')),
  notify_status text not null default '',
  created_at timestamptz not null default now(),
  triggered_at timestamptz
);

create unique index if not exists price_alerts_one_active
  on price_alerts (user_id, product_id, kind)
  where status = 'active';
