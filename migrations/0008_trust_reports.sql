create table if not exists trust_reports (
  id text primary key,
  user_id text not null,
  product_id text not null references products (id),
  retailer_id text not null references retailer_profiles (id),
  category text not null check (category in ('misleading', 'counterfeit', 'incorrect', 'suspicious', 'fraud', 'other')),
  body text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists trust_reports_status_idx on trust_reports (status, created_at desc);
create index if not exists trust_reports_user_idx on trust_reports (user_id, created_at desc);
