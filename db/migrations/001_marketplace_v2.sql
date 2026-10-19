-- KalaGhar marketplace v2
-- Apply after db/schema.sql in Supabase. Safe to re-run.
-- This migration adds the remaining marketplace capabilities and closes the
-- most important RLS gaps in the original browser-prototype schema.

begin;

alter table products add column if not exists video_url text;
alter table products add column if not exists tags text[] not null default '{}';
alter table products add column if not exists search_document tsvector generated always as
  (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(name_ne,'') || ' ' || coalesce(sub,'') || ' ' || coalesce(description,'') || ' ' || coalesce(materials,''))) stored;
alter table orders add column if not exists idempotency_key text unique;
alter table orders add column if not exists currency text not null default 'NPR';
alter table orders add column if not exists exchange_rate numeric(18,8) not null default 1;
alter table orders add column if not exists source text not null default 'storefront';

create index if not exists products_search_idx on products using gin(search_document);
create index if not exists products_filter_idx on products(active, category, region, price);
create index if not exists orders_buyer_created_idx on orders(buyer_id, created_at desc);
create index if not exists orders_seller_created_idx on orders(seller_id, created_at desc);

-- SECURITY DEFINER avoids recursive profile RLS while checking an admin role.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "public shops" on sellers;
create policy "public approved shops" on sellers for select
  using (status = 'approved' or user_id = auth.uid() or is_admin());

-- Favorites and followed artisan storefronts.
create table if not exists product_favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, product_id)
);
create table if not exists shop_favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  seller_id text not null references sellers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, seller_id)
);

-- Product media supports ordered photos and one or more short videos.
create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references products(id) on delete cascade,
  kind text not null check(kind in ('image','video')),
  url text not null check(url ~ '^https://'),
  alt_text text,
  sort_order integer not null default 0,
  status text not null default 'ready' check(status in ('processing','ready','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists product_media_product_idx on product_media(product_id, sort_order);

-- Made-to-order request -> versioned quote -> accepted order. Quotes are
-- immutable rows so both parties retain the exact offer they accepted.
create table if not exists custom_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  seller_id text not null references sellers(id),
  product_id bigint references products(id),
  title text not null check(length(title) between 3 and 100),
  details text not null check(length(details) between 20 and 2000),
  budget integer check(budget >= 0),
  quantity integer not null default 1 check(quantity between 1 and 10000),
  needed_by date,
  reference_urls text[] not null default '{}',
  status text not null default 'requested' check(status in ('requested','quoted','revision_requested','accepted','declined','expired','converted','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists custom_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references custom_requests(id) on delete cascade,
  version integer not null,
  amount integer not null check(amount > 0),
  currency text not null default 'NPR',
  production_days integer not null check(production_days between 1 and 365),
  terms text not null check(length(terms) between 1 and 2000),
  status text not null default 'sent' check(status in ('draft','sent','accepted','declined','superseded','expired')),
  expires_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique(request_id, version)
);

-- Rewards use a ledger, not a mutable balance. Idempotency prevents payment
-- webhooks or review retries from awarding points twice.
create table if not exists loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points integer not null check(points <> 0),
  kind text not null check(kind in ('order','review','referral','redemption','adjustment','expiry')),
  source_id text not null,
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, kind, source_id)
);
create table if not exists referral_codes (
  user_id uuid primary key references profiles(id) on delete cascade,
  code text not null unique check(code ~ '^[A-Z0-9]{6,16}$'),
  created_at timestamptz not null default now()
);
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  code text not null references referral_codes(code),
  referrer_id uuid not null references profiles(id),
  referred_id uuid not null unique references profiles(id),
  qualifying_order_id text references orders(id),
  status text not null default 'pending' check(status in ('pending','qualified','rejected','reversed')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  check(referrer_id <> referred_id)
);

-- Provider-facing records. Only the service role writes these tables.
create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  provider text not null check(provider in ('khalti','esewa','stripe','cod')),
  provider_reference text,
  amount_npr integer not null check(amount_npr > 0),
  status text not null default 'created' check(status in ('created','pending','paid','failed','cancelled','refunded')),
  idempotency_key text not null unique,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists payout_batches (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null references sellers(id),
  provider text not null,
  amount integer not null check(amount > 0),
  currency text not null default 'NPR',
  status text not null default 'pending' check(status in ('pending','submitted','paid','failed','reversed')),
  provider_reference text,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check(period_end >= period_start)
);
create table if not exists payout_items (
  payout_batch_id uuid not null references payout_batches(id) on delete cascade,
  order_id text not null references orders(id),
  amount integer not null check(amount > 0),
  primary key(payout_batch_id, order_id),
  unique(order_id)
);
create table if not exists shipment_events (
  id bigserial primary key,
  order_id text not null references orders(id) on delete cascade,
  provider text,
  provider_event_id text,
  status text not null,
  location text,
  message text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

-- Verification evidence, festival merchandising and AI auditability.
create table if not exists seller_verifications (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null references sellers(id) on delete cascade,
  kind text not null check(kind in ('identity','business','cooperative','workshop','chyangra','bank')),
  status text not null default 'submitted' check(status in ('submitted','in_review','verified','rejected','expired')),
  evidence_urls text[] not null default '{}',
  reviewed_by uuid references profiles(id),
  review_note text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create table if not exists festival_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  category_ids text[] not null default '{}',
  product_ids bigint[] not null default '{}',
  hero jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create table if not exists listing_assistant_runs (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null references sellers(id),
  user_id uuid not null references profiles(id),
  input_hash text not null,
  model text not null,
  output jsonb,
  status text not null check(status in ('succeeded','failed','blocked')),
  created_at timestamptz not null default now()
);
create table if not exists audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- Analytics events become attributable and privacy-conscious. session_hash
-- should be a rotating server-side hash; never store raw IP addresses here.
alter table events add column if not exists seller_id text references sellers(id);
alter table events add column if not exists user_id uuid references profiles(id);
alter table events add column if not exists session_hash text;
alter table events add column if not exists metadata jsonb not null default '{}';
create index if not exists events_seller_created_idx on events(seller_id, created_at desc);

-- RLS -----------------------------------------------------------------
alter table product_favorites enable row level security;
alter table shop_favorites enable row level security;
alter table product_media enable row level security;
alter table custom_requests enable row level security;
alter table custom_quotes enable row level security;
alter table loyalty_ledger enable row level security;
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table payment_attempts enable row level security;
alter table payout_batches enable row level security;
alter table payout_items enable row level security;
alter table shipment_events enable row level security;
alter table seller_verifications enable row level security;
alter table festival_campaigns enable row level security;
alter table listing_assistant_runs enable row level security;
alter table audit_log enable row level security;

drop policy if exists "users manage product favorites" on product_favorites;
drop policy if exists "users manage shop favorites" on shop_favorites;
drop policy if exists "public reads ready media" on product_media;
drop policy if exists "sellers manage product media" on product_media;
drop policy if exists "request parties read" on custom_requests;
drop policy if exists "buyers create requests" on custom_requests;
drop policy if exists "buyers update open requests" on custom_requests;
drop policy if exists "request parties read quotes" on custom_quotes;
drop policy if exists "seller creates quotes" on custom_quotes;
drop policy if exists "users read loyalty" on loyalty_ledger;
drop policy if exists "users read own referral code" on referral_codes;
drop policy if exists "users read own referrals" on referrals;
drop policy if exists "order parties track shipments" on shipment_events;
drop policy if exists "seller reads payouts" on payout_batches;
drop policy if exists "seller reads payout items" on payout_items;
drop policy if exists "seller reads own verification" on seller_verifications;
drop policy if exists "seller submits verification" on seller_verifications;
drop policy if exists "public reads active festivals" on festival_campaigns;
drop policy if exists "admins manage festivals" on festival_campaigns;
drop policy if exists "seller reads assistant history" on listing_assistant_runs;
drop policy if exists "admins read audit" on audit_log;

create policy "users manage product favorites" on product_favorites for all to authenticated using(user_id = auth.uid()) with check(user_id = auth.uid());
create policy "users manage shop favorites" on shop_favorites for all to authenticated using(user_id = auth.uid()) with check(user_id = auth.uid());
create policy "public reads ready media" on product_media for select using(status = 'ready');
create policy "sellers manage product media" on product_media for all to authenticated
  using(exists(select 1 from products p join sellers s on s.id=p.seller_id where p.id=product_id and (s.user_id=auth.uid() or is_admin())))
  with check(exists(select 1 from products p join sellers s on s.id=p.seller_id where p.id=product_id and (s.user_id=auth.uid() or is_admin())));
create policy "request parties read" on custom_requests for select to authenticated
  using(buyer_id=auth.uid() or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()) or is_admin());
create policy "buyers create requests" on custom_requests for insert to authenticated with check(buyer_id=auth.uid());
create policy "buyers update open requests" on custom_requests for update to authenticated
  using(buyer_id=auth.uid() and status in ('requested','revision_requested')) with check(buyer_id=auth.uid());
create policy "request parties read quotes" on custom_quotes for select to authenticated
  using(exists(select 1 from custom_requests r join sellers s on s.id=r.seller_id where r.id=request_id and (r.buyer_id=auth.uid() or s.user_id=auth.uid() or is_admin())));
create policy "seller creates quotes" on custom_quotes for insert to authenticated
  with check(created_by=auth.uid() and exists(select 1 from custom_requests r join sellers s on s.id=r.seller_id where r.id=request_id and s.user_id=auth.uid()));
create policy "users read loyalty" on loyalty_ledger for select to authenticated using(user_id=auth.uid() or is_admin());
create policy "users read own referral code" on referral_codes for select to authenticated using(user_id=auth.uid() or is_admin());
create policy "users read own referrals" on referrals for select to authenticated using(referrer_id=auth.uid() or referred_id=auth.uid() or is_admin());
create policy "order parties track shipments" on shipment_events for select to authenticated
  using(exists(select 1 from orders o join sellers s on s.id=o.seller_id where o.id=order_id and (o.buyer_id=auth.uid() or s.user_id=auth.uid() or is_admin())));
create policy "seller reads payouts" on payout_batches for select to authenticated using(exists(select 1 from sellers s where s.id=seller_id and (s.user_id=auth.uid() or is_admin())));
create policy "seller reads payout items" on payout_items for select to authenticated using(exists(select 1 from payout_batches b join sellers s on s.id=b.seller_id where b.id=payout_batch_id and (s.user_id=auth.uid() or is_admin())));
create policy "seller reads own verification" on seller_verifications for select to authenticated using(exists(select 1 from sellers s where s.id=seller_id and (s.user_id=auth.uid() or is_admin())));
create policy "seller submits verification" on seller_verifications for insert to authenticated with check(exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()));
create policy "public reads active festivals" on festival_campaigns for select using(active and now() between starts_at and ends_at);
create policy "admins manage festivals" on festival_campaigns for all to authenticated using(is_admin()) with check(is_admin());
create policy "seller reads assistant history" on listing_assistant_runs for select to authenticated using(user_id=auth.uid() or is_admin());
create policy "admins read audit" on audit_log for select to authenticated using(is_admin());

-- Deliberately no client write policies for payment attempts, payouts,
-- loyalty ledger, assistant runs or audit log. Only trusted server/service-role
-- code may mutate financial, reward or audit records.

commit;
