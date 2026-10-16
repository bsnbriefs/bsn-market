-- Optional window for a real flash sale. Null means the banner is a promotion, not a countdown.
alter table promotional_campaigns add column if not exists starts_at timestamptz;
alter table promotional_campaigns add column if not exists ends_at timestamptz;
