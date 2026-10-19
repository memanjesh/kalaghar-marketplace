-- =====================================================================
-- KalaGhar shared database (Supabase / PostgreSQL)
-- Run this in Supabase → SQL Editor. It mirrors the data the site
-- currently keeps in each browser, so the features can switch over.
-- =====================================================================

create extension if not exists "pgcrypto";

-- Accounts (Supabase Auth handles passwords; this holds profile data)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  created_at timestamptz default now()
);

create table if not exists sellers (
  id text primary key default 's-' || substr(gen_random_uuid()::text, 1, 8),
  user_id uuid references profiles(id),
  shop_name text not null,
  owner text,
  email text,
  phone text,
  region text,
  craft text,
  type text default 'individual' check (type in ('individual','cooperative')),
  members jsonb default '[]',              -- [{name, share}]
  story text,
  photo_url text,
  video_url text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  verified boolean default false,
  chyangra_cert jsonb,                      -- {file_url, status, reviewed_at}
  payout jsonb,                             -- {method, id}
  created_at timestamptz default now()
);

create table if not exists products (
  id bigserial primary key,
  seller_id text references sellers(id),
  name text not null,
  name_ne text,
  sub text,
  description text,
  desc_ne text,
  category text not null,
  price integer not null check (price > 0),  -- NPR, VAT inclusive
  stock integer default 1,
  materials text, size text, weight_g integer default 500,
  region text, care text, expiry text,
  personalizable boolean default false,
  images text[] default '{}',
  tag text, tag_class text,
  active boolean default true,
  needs_translation boolean default false,
  promoted_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,                      -- KG-1001
  group_id text not null,
  seller_id text references sellers(id),
  buyer_id uuid references profiles(id),
  buyer jsonb not null,                     -- {name, email, phone}
  address jsonb not null,
  gift jsonb,
  goods integer, discount integer, coupon text, shipping integer, insurance integer, total integer, vat integer,
  zone text, courier text, tracking text,
  payment jsonb,                            -- {method, status, ref}
  status text not null,
  escrow text not null,                     -- none | held | frozen | released | refunded | cod
  payout integer,
  invoice_no text unique,
  timeline jsonb default '[]',
  created_at timestamptz default now(),
  shipped_at timestamptz, delivered_at timestamptz, completed_at timestamptz, released_at timestamptz, transferred_at timestamptz
);

create table if not exists order_items (
  id bigserial primary key,
  order_id text references orders(id) on delete cascade,
  product_id bigint references products(id),
  name text, price integer, qty integer, personalization text
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint references products(id),
  order_id text references orders(id),
  user_id uuid references profiles(id),
  name text, rating int check (rating between 1 and 5), text text, photo_url text,
  created_at timestamptz default now(),
  unique (order_id, product_id)             -- one review per purchased item
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id),
  seller_id text references sellers(id),
  product_id bigint, order_id text,
  unread_buyer boolean default false, unread_seller boolean default false,
  updated_at timestamptz default now()
);
create table if not exists messages (
  id bigserial primary key,
  thread_id uuid references threads(id) on delete cascade,
  sender text check (sender in ('buyer','seller','system','admin')),
  text text not null,
  created_at timestamptz default now()
);

create table if not exists complaints (
  id text primary key,
  kind text default 'general',              -- general | protection
  type text, reason text, order_id text,
  name text, email text, phone text, text text, photo_url text,
  status text default 'open', resolution text,
  created_at timestamptz default now(), resolved_at timestamptz
);

create table if not exists coupons (
  code text primary key,
  type text check (type in ('percent','fixed','freeship')),
  value numeric default 0, min_order integer default 0, expires date,
  seller_id text references sellers(id), note text, active boolean default true
);

create table if not exists promos (id bigserial primary key, seller_id text, product_id bigint, days int, cost int, settled boolean default false, created_at timestamptz default now());
create table if not exists bookings (id bigserial primary key, workshop_id text, name text, email text, date date, people int, note text, total int, status text default 'requested', created_at timestamptz default now());
create table if not exists wholesale_inquiries (id bigserial primary key, name text, company text, email text, country text, category text, qty int, message text, status text default 'new', created_at timestamptz default now());
create table if not exists events (id bigserial primary key, type text, product_id bigint, created_at timestamptz default now());

-- ---------------------------------------------------------------------
-- Row-level security: buyers see their own orders, sellers see theirs,
-- everyone can read active products, approved shops and reviews.
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table sellers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table threads enable row level security;
alter table messages enable row level security;
alter table complaints enable row level security;

create or replace function is_admin() returns boolean language sql stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create policy "own profile" on profiles for all using (id = auth.uid() or is_admin());
create policy "public shops" on sellers for select using (true);
create policy "seller edits own shop" on sellers for update using (user_id = auth.uid() or is_admin());
create policy "public products" on products for select using (active or is_admin() or seller_id in (select id from sellers where user_id = auth.uid()));
create policy "seller manages products" on products for all using (seller_id in (select id from sellers where user_id = auth.uid()) or is_admin());
create policy "buyer or seller reads orders" on orders for select using (buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid()) or is_admin());
create policy "items follow orders" on order_items for select using (order_id in (select id from orders));
create policy "public reviews" on reviews for select using (true);
create policy "verified buyers review" on reviews for insert with check (
  user_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid() and o.status in ('delivered','completed'))
);
create policy "thread parties" on threads for all using (buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid()) or is_admin());
create policy "message parties" on messages for all using (thread_id in (select id from threads));
create policy "anyone files complaints" on complaints for insert with check (true);
create policy "admin reads complaints" on complaints for select using (is_admin());
-- Orders, payment status and payouts should only be written by the payment
-- server using the service-role key, never directly from the browser.
