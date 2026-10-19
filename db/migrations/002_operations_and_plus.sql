-- KalaGhar operations, support and 25-feature expansion.
-- Apply after db/schema.sql and 001_marketplace_v2.sql.
begin;

-- Granular administration ------------------------------------------------
create table if not exists admin_members (
  user_id uuid primary key references profiles(id) on delete cascade,
  admin_role text not null check(admin_role in ('super_admin','support','order_ops','trust','seller_ops','finance','marketing','content','analyst')),
  active boolean not null default true,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists admin_role_permissions (
  admin_role text not null,
  permission text not null,
  primary key(admin_role, permission)
);
-- Preserve existing administrators as super administrators during the
-- migration. New staff members receive a narrower role in admin_members.
insert into admin_members(user_id, admin_role)
select id, 'super_admin' from profiles where role='admin'
on conflict(user_id) do nothing;
insert into admin_role_permissions(admin_role, permission) values
  ('support','support.manage'),('support','orders.read'),('order_ops','orders.manage'),('order_ops','shipments.manage'),
  ('trust','moderation.manage'),('trust','support.manage'),('seller_ops','sellers.manage'),('seller_ops','features.manage'),
  ('finance','payouts.manage'),('finance','orders.read'),('marketing','campaigns.manage'),('marketing','features.manage'),
  ('content','content.manage'),('content','features.manage'),('analyst','analytics.read')
on conflict do nothing;

create or replace function public.has_admin_permission(required_permission text) returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from admin_members m
    where m.user_id=auth.uid() and m.active and m.admin_role='super_admin'
  ) or exists(
    select 1 from admin_members m join admin_role_permissions p on p.admin_role=m.admin_role
    where m.user_id=auth.uid() and m.active and p.permission=required_permission
  )
$$;
revoke all on function public.has_admin_permission(text) from public;
grant execute on function public.has_admin_permission(text) to authenticated;

alter table profiles add column if not exists account_status text not null default 'active'
  check(account_status in ('active','restricted','suspended','closed'));
alter table orders add column if not exists fulfillment jsonb not null default '{"type":"courier"}'::jsonb;
alter table orders add column if not exists shipment_status text;
alter table orders add column if not exists estimated_delivery date;
alter table reviews add column if not exists moderation_status text not null default 'visible'
  check(moderation_status in ('visible','hidden_pending_review','removed'));

-- Support, customer care and operations ---------------------------------
create table if not exists support_tickets (
  id text primary key default 'SUP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  requester_id uuid references profiles(id),
  tracking_secret_hash text,
  name text not null,
  email text not null,
  phone text,
  order_id text references orders(id),
  channel text not null check(channel in ('web','email','chat','phone','whatsapp','complaint','admin')),
  category text not null,
  subject text not null check(length(subject) between 4 and 120),
  message text not null check(length(message) between 10 and 5000),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  status text not null default 'new' check(status in ('new','open','waiting_customer','waiting_seller','escalated','resolved','closed')),
  assigned_to uuid references profiles(id),
  tags text[] not null default '{}',
  first_response_due_at timestamptz,
  resolution_due_at timestamptz,
  first_responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_queue_idx on support_tickets(status, priority, resolution_due_at);
create index if not exists support_tickets_requester_idx on support_tickets(requester_id, created_at desc);
create table if not exists support_messages (
  id bigserial primary key,
  ticket_id text not null references support_tickets(id) on delete cascade,
  author_id uuid references profiles(id),
  author_type text not null check(author_type in ('customer','seller','admin','system')),
  body text not null check(length(body) between 1 and 5000),
  internal boolean not null default false,
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create table if not exists support_events (
  id bigserial primary key,
  ticket_id text not null references support_tickets(id) on delete cascade,
  actor_id uuid references profiles(id),
  event_type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists customer_admin_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  note text not null check(length(note) between 1 and 2000),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists moderation_cases (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  entity_type text not null check(entity_type in ('product','review','seller','message','order','craft_passport')),
  entity_id text not null,
  reason text not null,
  details text,
  evidence_urls text[] not null default '{}',
  status text not null default 'open' check(status in ('open','investigating','actioned','dismissed','appealed','closed')),
  assigned_to uuid references profiles(id),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists moderation_cases_queue_idx on moderation_cases(status, created_at);
create table if not exists platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- Feature control for every public capability ---------------------------
create table if not exists feature_catalog (
  feature_id smallint primary key check(feature_id between 1 and 25),
  slug text not null unique,
  name text not null,
  state text not null default 'enabled' check(state in ('enabled','coming_soon','hidden')),
  featured boolean not null default false,
  custom_description text,
  provider_ready boolean not null default false,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);
insert into feature_catalog(feature_id,slug,name,featured) values
 (1,'buyer-protection','Buyer Protection',true),(2,'craft-passport','Digital Craft Passport',true),(3,'artisan-experiences','Artisan Experiences',true),
 (4,'live-shopping','Live Workshop Shopping',false),(5,'gift-registries','Gift Registries',false),(6,'group-gifting','Group Gifting',false),
 (7,'corporate-gifting','Corporate Gifting',true),(8,'craft-box','Monthly Craft Box',false),(9,'drops-preorders','Limited Drops & Preorders',false),
 (10,'repair-resale','Repair, Restoration & Resale',false),(11,'visual-preview','Room Preview & Try-On',false),(12,'measurement-profiles','Measurement Profiles',false),
 (13,'language-access','Language & Voice Access',false),(14,'low-internet-app','Low-Internet App',false),(15,'local-payments','Local QR & Pay on Delivery',false),
 (16,'pickup-hotel','Pickup & Hotel Delivery',false),(17,'affiliates','Creator Affiliates',false),(18,'craft-encyclopedia','Craft Encyclopedia',true),
 (19,'community-collections','Community Collections',false),(20,'impact-dashboard','Impact Dashboard',false),(21,'seller-teams','Seller Team Accounts',false),
 (22,'trust-center','Marketplace Trust Center',true),(23,'landed-cost','Landed-Cost Calculator',false),(24,'wholesale-export','Wholesale Export Workspace',false),
 (25,'studio-services','KalaGhar Studio Services',false)
on conflict(feature_id) do nothing;
create table if not exists feature_requests (
  id text primary key default 'REQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  feature_id smallint not null references feature_catalog(feature_id),
  requester_id uuid references profiles(id),
  customer_name text,
  customer_email text,
  request_type text not null,
  data jsonb not null default '{}',
  status text not null default 'new' check(status in ('new','reviewing','approved','scheduled','completed','declined','cancelled')),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  assigned_to uuid references profiles(id),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists feature_requests_queue_idx on feature_requests(feature_id, status, created_at desc);

-- Product provenance and cultural content -------------------------------
create table if not exists craft_passports (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null unique references products(id) on delete cascade,
  public_code text not null unique,
  maker_id text not null references sellers(id),
  origin jsonb not null default '{}',
  materials jsonb not null default '[]',
  process jsonb not null default '[]',
  care jsonb not null default '{}',
  authenticity_status text not null default 'draft' check(authenticity_status in ('draft','submitted','verified','rejected','revoked')),
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists craft_articles (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, summary text, body jsonb not null default '{}',
  region text, category text, status text not null default 'draft' check(status in ('draft','review','published','archived')),
  reviewed_by uuid references profiles(id), published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Experiences, live commerce, gifting and subscriptions ----------------
create table if not exists artisan_experiences (
  id uuid primary key default gen_random_uuid(), seller_id text not null references sellers(id), title text not null, description text,
  location jsonb not null default '{}', duration_minutes integer check(duration_minutes > 0), capacity integer check(capacity > 0), price_npr integer check(price_npr >= 0),
  status text not null default 'draft' check(status in ('draft','review','published','paused','archived')), created_at timestamptz not null default now()
);
create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(), seller_id text not null references sellers(id), title text not null, starts_at timestamptz,
  provider text, provider_reference text, status text not null default 'planned' check(status in ('draft','planned','live','ended','cancelled')),
  product_ids bigint[] not null default '{}', moderation_delay_seconds integer not null default 5, created_at timestamptz not null default now()
);
create table if not exists gift_registries (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), name text not null, occasion text, event_date date,
  share_code text not null unique, public boolean not null default true, group_gifting boolean not null default false,
  status text not null default 'active' check(status in ('draft','active','closed','archived')), created_at timestamptz not null default now()
);
create table if not exists registry_items (
  registry_id uuid not null references gift_registries(id) on delete cascade, product_id bigint not null references products(id),
  quantity integer not null default 1 check(quantity > 0), purchased_quantity integer not null default 0 check(purchased_quantity >= 0),
  target_amount_npr integer check(target_amount_npr > 0), primary key(registry_id, product_id)
);
create table if not exists gift_contributions (
  id uuid primary key default gen_random_uuid(), registry_id uuid not null references gift_registries(id), contributor_id uuid references profiles(id),
  amount_npr integer not null check(amount_npr > 0), payment_attempt_id uuid references payment_attempts(id), status text not null default 'pending' check(status in ('pending','paid','refunded','failed')),
  message text, anonymous boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description text, interval_months integer not null check(interval_months > 0),
  price_npr integer not null check(price_npr > 0), active boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), plan_id uuid not null references subscription_plans(id),
  status text not null default 'pending' check(status in ('pending','active','paused','cancelled','past_due')), provider_reference text,
  next_charge_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists product_drops (
  id uuid primary key default gen_random_uuid(), seller_id text not null references sellers(id), title text not null, starts_at timestamptz, ends_at timestamptz,
  inventory integer not null check(inventory > 0), max_per_buyer integer not null default 1 check(max_per_buyer > 0), deposit_npr integer not null default 0 check(deposit_npr >= 0),
  status text not null default 'draft' check(status in ('draft','scheduled','live','sold_out','closed','cancelled')), product_ids bigint[] not null default '{}', created_at timestamptz not null default now()
);
create table if not exists preorder_reservations (
  id uuid primary key default gen_random_uuid(), drop_id uuid not null references product_drops(id), user_id uuid not null references profiles(id), quantity integer not null default 1 check(quantity > 0),
  status text not null default 'waitlist' check(status in ('waitlist','reserved','deposit_paid','converted','cancelled','expired')), payment_attempt_id uuid references payment_attempts(id), created_at timestamptz not null default now(), unique(drop_id,user_id)
);

-- Circular care, delivery, affiliates and business services ------------
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(), requester_id uuid references profiles(id), seller_id text references sellers(id), order_id text references orders(id),
  service_type text not null check(service_type in ('repair','restoration','cleaning','resale','photography','translation','packaging','listing','export','catalog')),
  details jsonb not null default '{}', status text not null default 'new' check(status in ('new','reviewing','quoted','approved','in_progress','completed','declined','cancelled')),
  quote_npr integer check(quote_npr >= 0), assigned_to uuid references profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists size_profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, name text not null default 'My measurements',
  measurements jsonb not null default '{}', fit_notes text, encrypted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists pickup_locations (
  id uuid primary key default gen_random_uuid(), name text not null, kind text not null check(kind in ('partner','hotel_desk','kalaghar')), address jsonb not null,
  contact jsonb not null default '{}', hours jsonb not null default '{}', active boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists affiliate_accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references profiles(id), code text not null unique, channel_url text,
  status text not null default 'applied' check(status in ('applied','reviewing','approved','paused','rejected','closed')), commission_rate numeric(5,4) check(commission_rate between 0 and 1),
  approved_by uuid references profiles(id), created_at timestamptz not null default now()
);
create table if not exists affiliate_attributions (
  id uuid primary key default gen_random_uuid(), affiliate_id uuid not null references affiliate_accounts(id), session_hash text not null, order_id text references orders(id),
  status text not null default 'clicked' check(status in ('clicked','ordered','qualified','reversed','paid')), commission_npr integer check(commission_npr >= 0),
  created_at timestamptz not null default now(), unique(affiliate_id, session_hash, order_id)
);
create table if not exists community_collections (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), title text not null, description text,
  public boolean not null default true, status text not null default 'published' check(status in ('draft','review','published','hidden','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists community_collection_items (
  collection_id uuid not null references community_collections(id) on delete cascade, product_id bigint not null references products(id), sort_order integer not null default 0,
  primary key(collection_id, product_id)
);
create table if not exists seller_team_members (
  id uuid primary key default gen_random_uuid(), seller_id text not null references sellers(id) on delete cascade, user_id uuid references profiles(id), invited_email text not null,
  team_role text not null check(team_role in ('owner','manager','catalog','orders','support','finance_view')), permissions text[] not null default '{}',
  status text not null default 'invited' check(status in ('invited','active','suspended','removed')), invited_by uuid not null references profiles(id), created_at timestamptz not null default now(), unique(seller_id,invited_email)
);
create table if not exists landed_cost_quotes (
  id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), destination_country text not null, product_category text,
  item_value_npr integer not null check(item_value_npr > 0), shipping_npr integer not null check(shipping_npr >= 0), duty_low_npr integer not null check(duty_low_npr >= 0), duty_high_npr integer not null check(duty_high_npr >= duty_low_npr),
  source text not null, expires_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists wholesale_milestones (
  id uuid primary key default gen_random_uuid(), inquiry_id bigint not null references wholesale_inquiries(id) on delete cascade, title text not null,
  status text not null default 'pending' check(status in ('pending','in_progress','submitted','approved','rejected','waived')), due_at timestamptz,
  evidence_urls text[] not null default '{}', completed_at timestamptz, created_at timestamptz not null default now()
);

-- RLS -------------------------------------------------------------------
alter table admin_members enable row level security;
alter table admin_role_permissions enable row level security;
alter table support_tickets enable row level security;
alter table support_messages enable row level security;
alter table support_events enable row level security;
alter table customer_admin_notes enable row level security;
alter table moderation_cases enable row level security;
alter table platform_settings enable row level security;
alter table feature_catalog enable row level security;
alter table feature_requests enable row level security;
alter table craft_passports enable row level security;
alter table craft_articles enable row level security;
alter table artisan_experiences enable row level security;
alter table live_sessions enable row level security;
alter table gift_registries enable row level security;
alter table registry_items enable row level security;
alter table gift_contributions enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table product_drops enable row level security;
alter table preorder_reservations enable row level security;
alter table service_requests enable row level security;
alter table size_profiles enable row level security;
alter table pickup_locations enable row level security;
alter table affiliate_accounts enable row level security;
alter table affiliate_attributions enable row level security;
alter table community_collections enable row level security;
alter table community_collection_items enable row level security;
alter table seller_team_members enable row level security;
alter table landed_cost_quotes enable row level security;
alter table wholesale_milestones enable row level security;

create policy "admin members managed by super admins" on admin_members for all to authenticated using(has_admin_permission('staff.manage')) with check(has_admin_permission('staff.manage'));
create policy "admins read permissions" on admin_role_permissions for select to authenticated using(has_admin_permission('analytics.read') or is_admin());
create policy "requesters read tickets" on support_tickets for select to authenticated using(requester_id=auth.uid() or has_admin_permission('support.manage'));
create policy "requesters create tickets" on support_tickets for insert to authenticated with check(requester_id=auth.uid() and status='new' and assigned_to is null and first_responded_at is null and resolved_at is null);
create policy "support manages tickets" on support_tickets for all to authenticated using(has_admin_permission('support.manage')) with check(has_admin_permission('support.manage'));
create policy "ticket parties read public messages" on support_messages for select to authenticated using((not internal and exists(select 1 from support_tickets t where t.id=ticket_id and t.requester_id=auth.uid())) or has_admin_permission('support.manage'));
create policy "requesters reply" on support_messages for insert to authenticated with check(author_id=auth.uid() and author_type='customer' and not internal and exists(select 1 from support_tickets t where t.id=ticket_id and t.requester_id=auth.uid()));
create policy "support manages messages" on support_messages for all to authenticated using(has_admin_permission('support.manage')) with check(has_admin_permission('support.manage'));
create policy "support reads events" on support_events for select to authenticated using(has_admin_permission('support.manage'));
create policy "admins manage notes" on customer_admin_notes for all to authenticated using(has_admin_permission('support.manage')) with check(has_admin_permission('support.manage'));
create policy "users file trust reports" on moderation_cases for insert to authenticated with check(reporter_id=auth.uid() and status='open' and assigned_to is null and resolution is null and resolved_at is null);
create policy "trust manages cases" on moderation_cases for all to authenticated using(has_admin_permission('moderation.manage')) with check(has_admin_permission('moderation.manage'));
create policy "admins manage platform settings" on platform_settings for all to authenticated using(is_admin()) with check(is_admin());
create policy "public reads feature catalog" on feature_catalog for select using(state <> 'hidden');
create policy "admins manage feature catalog" on feature_catalog for all to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage'));
create policy "users read own feature requests" on feature_requests for select to authenticated using(requester_id=auth.uid() or has_admin_permission('features.manage'));
create policy "users create own feature requests" on feature_requests for insert to authenticated with check(requester_id=auth.uid() and status='new' and assigned_to is null and admin_note is null);
create policy "admins manage feature requests" on feature_requests for all to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage'));
create policy "public reads verified passports" on craft_passports for select using(authenticity_status='verified');
create policy "seller ops manage passports" on craft_passports for all to authenticated using(has_admin_permission('sellers.manage') or exists(select 1 from sellers s where s.id=maker_id and s.user_id=auth.uid())) with check(has_admin_permission('sellers.manage') or exists(select 1 from sellers s where s.id=maker_id and s.user_id=auth.uid()));
create policy "public reads published articles" on craft_articles for select using(status='published');
create policy "content manages articles" on craft_articles for all to authenticated using(has_admin_permission('content.manage')) with check(has_admin_permission('content.manage'));
create policy "public reads published experiences" on artisan_experiences for select using(status='published');
create policy "seller manages experiences" on artisan_experiences for all to authenticated using(has_admin_permission('sellers.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid())) with check(has_admin_permission('sellers.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()));
create policy "public reads planned live sessions" on live_sessions for select using(status in ('planned','live','ended'));
create policy "seller manages live sessions" on live_sessions for all to authenticated using(has_admin_permission('features.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid())) with check(has_admin_permission('features.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()));
create policy "owners manage registries" on gift_registries for all to authenticated using(owner_id=auth.uid() or has_admin_permission('features.manage')) with check(owner_id=auth.uid() or has_admin_permission('features.manage'));
create policy "public reads public registries" on gift_registries for select using(public and status='active');
create policy "registry items follow registry" on registry_items for select using(exists(select 1 from gift_registries g where g.id=registry_id and (g.public or g.owner_id=auth.uid())) or has_admin_permission('features.manage'));
create policy "owners manage registry items" on registry_items for all to authenticated using(exists(select 1 from gift_registries g where g.id=registry_id and g.owner_id=auth.uid()) or has_admin_permission('features.manage')) with check(exists(select 1 from gift_registries g where g.id=registry_id and g.owner_id=auth.uid()) or has_admin_permission('features.manage'));
create policy "contributors read own contributions" on gift_contributions for select to authenticated using(contributor_id=auth.uid() or has_admin_permission('features.manage'));
create policy "public reads active plans" on subscription_plans for select using(active);
create policy "feature admins manage plans" on subscription_plans for all to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage'));
create policy "users read own subscriptions" on subscriptions for select to authenticated using(user_id=auth.uid() or has_admin_permission('features.manage'));
create policy "public reads active drops" on product_drops for select using(status in ('scheduled','live','sold_out','closed'));
create policy "sellers manage product drops" on product_drops for all to authenticated using(has_admin_permission('features.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid())) with check(has_admin_permission('features.manage') or exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()));
create policy "users read own reservations" on preorder_reservations for select to authenticated using(user_id=auth.uid() or has_admin_permission('features.manage'));
create policy "users join drop waitlists" on preorder_reservations for insert to authenticated with check(user_id=auth.uid() and status='waitlist' and payment_attempt_id is null);
create policy "feature admins manage unpaid reservations" on preorder_reservations for update to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage') and status in ('waitlist','reserved','cancelled','expired') and payment_attempt_id is null);
create policy "users read own service requests" on service_requests for select to authenticated using(requester_id=auth.uid() or has_admin_permission('features.manage'));
create policy "users create service requests" on service_requests for insert to authenticated with check(requester_id=auth.uid() and status='new' and quote_npr is null and assigned_to is null);
create policy "feature admins manage service requests" on service_requests for all to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage'));
create policy "users manage size profiles" on size_profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "public reads active pickup locations" on pickup_locations for select using(active);
create policy "admins manage pickup locations" on pickup_locations for all to authenticated using(has_admin_permission('orders.manage')) with check(has_admin_permission('orders.manage'));
create policy "users read affiliate application" on affiliate_accounts for select to authenticated using(user_id=auth.uid() or has_admin_permission('features.manage'));
create policy "users create affiliate application" on affiliate_accounts for insert to authenticated with check(user_id=auth.uid() and status='applied' and commission_rate is null and approved_by is null);
create policy "feature admins manage affiliate applications" on affiliate_accounts for all to authenticated using(has_admin_permission('features.manage')) with check(has_admin_permission('features.manage'));
create policy "affiliates read own attribution" on affiliate_attributions for select to authenticated using(exists(select 1 from affiliate_accounts a where a.id=affiliate_id and a.user_id=auth.uid()) or has_admin_permission('features.manage'));
create policy "public reads public collections" on community_collections for select using(public and status='published');
create policy "owners manage collections" on community_collections for all to authenticated using(owner_id=auth.uid() or has_admin_permission('moderation.manage')) with check(owner_id=auth.uid() or has_admin_permission('moderation.manage'));
create policy "collection items follow collection" on community_collection_items for select using(exists(select 1 from community_collections c where c.id=collection_id and (c.public or c.owner_id=auth.uid())) or has_admin_permission('moderation.manage'));
create policy "owners manage collection items" on community_collection_items for all to authenticated using(exists(select 1 from community_collections c where c.id=collection_id and c.owner_id=auth.uid()) or has_admin_permission('moderation.manage')) with check(exists(select 1 from community_collections c where c.id=collection_id and c.owner_id=auth.uid()) or has_admin_permission('moderation.manage'));
create policy "seller owners manage teams" on seller_team_members for all to authenticated using(exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()) or has_admin_permission('sellers.manage')) with check(exists(select 1 from sellers s where s.id=seller_id and s.user_id=auth.uid()) or has_admin_permission('sellers.manage'));
create policy "users read own cost quotes" on landed_cost_quotes for select to authenticated using(user_id=auth.uid() or has_admin_permission('orders.read'));
create policy "seller ops manage wholesale milestones" on wholesale_milestones for all to authenticated using(has_admin_permission('sellers.manage')) with check(has_admin_permission('sellers.manage'));

-- Payment-linked and attribution tables intentionally have no browser
-- insert/update policy. Service-role code verifies money and writes them.
commit;
