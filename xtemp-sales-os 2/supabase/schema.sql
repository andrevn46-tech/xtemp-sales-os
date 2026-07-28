-- XTEMP Sales OS — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: drops nothing, uses IF NOT EXISTS / OR REPLACE throughout.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  industry     text not null check (industry in (
                 'defence','automotive','mining_heavy_industry','academia',
                 'energy','aerospace','general_industrial'
               )),
  website      text,
  city         text,
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists contacts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references organizations(id) on delete set null,
  name             text not null,
  title            text,
  email            text,
  phone            text,
  linkedin_url     text,
  is_primary       boolean not null default false,
  notes            text,
  status           text not null default 'new' check (status in
                     ('new','contacted','qualifying','promoted','not_a_fit')),
  industry         text check (industry in (
                     'defence','automotive','mining_heavy_industry','academia',
                     'energy','aerospace','general_industrial'
                   )),
  source           text,
  next_action_type text check (next_action_type in
                     ('call','email','meeting','demo','quote_followup','other')),
  next_action_date date,
  next_action_note text,
  created_at       timestamptz not null default now()
);

-- Migrating an existing database that predates the standalone contacts
-- pipeline (organization was required, and there was no status/next-action
-- tracking on a contact yet). Safe to re-run: every statement below is a
-- no-op if already applied.
alter table contacts alter column organization_id drop not null;
alter table contacts drop constraint if exists contacts_organization_id_fkey;
alter table contacts add constraint contacts_organization_id_fkey
  foreign key (organization_id) references organizations(id) on delete set null;
alter table contacts add column if not exists status text not null default 'new';
alter table contacts drop constraint if exists contacts_status_check;
alter table contacts add constraint contacts_status_check
  check (status in ('new','contacted','qualifying','promoted','not_a_fit'));
alter table contacts add column if not exists industry text;
alter table contacts drop constraint if exists contacts_industry_check;
alter table contacts add constraint contacts_industry_check
  check (industry is null or industry in (
    'defence','automotive','mining_heavy_industry','academia',
    'energy','aerospace','general_industrial'
  ));
alter table contacts add column if not exists source text;
alter table contacts add column if not exists next_action_type text;
alter table contacts drop constraint if exists contacts_next_action_type_check;
alter table contacts add constraint contacts_next_action_type_check
  check (next_action_type is null or next_action_type in
    ('call','email','meeting','demo','quote_followup','other'));
alter table contacts add column if not exists next_action_date date;
alter table contacts add column if not exists next_action_note text;

create table if not exists deals (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  primary_contact_id    uuid references contacts(id) on delete set null,
  title                 text not null,
  stage                 text not null default 'new' check (stage in (
                          'new','contacted','meeting','demo','quotation','won','lost'
                        )),
  source                text,
  product_lines         text[] not null default '{}',
  estimated_value_zar   numeric(12,2),
  probability           int not null default 20 check (probability between 0 and 100),
  next_action_type      text check (next_action_type in
                          ('call','email','meeting','demo','quote_followup','other')),
  next_action_date      date,
  next_action_note      text,
  stage_entered_at      timestamptz not null default now(),
  lost_reason           text,
  actual_value_zar      numeric(12,2),
  commission_rate_percent numeric(5,2),
  commission_amount_zar numeric(12,2),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Migrating an existing database that predates commission tracking. Safe to re-run.
alter table deals add column if not exists actual_value_zar numeric(12,2);
alter table deals add column if not exists commission_rate_percent numeric(5,2);
alter table deals add column if not exists commission_amount_zar numeric(12,2);

create table if not exists commission_tiers (
  id            uuid primary key default gen_random_uuid(),
  min_value     numeric(12,2) not null,
  max_value     numeric(12,2), -- null means "and above", no upper bound
  rate_percent  numeric(5,2) not null,
  sort_order    int not null
);

-- Seed with the tier structure supplied when this feature was built. Edit
-- these anytime from the app's Commission → Rate table screen — no SQL
-- needed after this one-time seed. Safe to re-run: skipped if already seeded.
insert into commission_tiers (min_value, max_value, rate_percent, sort_order)
select * from (values
  (0::numeric,       500000::numeric,   2.00::numeric, 1),
  (500001::numeric,  1500000::numeric,  1.80::numeric, 2),
  (1500001::numeric, 2500000::numeric,  1.60::numeric, 3),
  (2500001::numeric, 3500000::numeric,  1.40::numeric, 4),
  (3500001::numeric, 5000000::numeric,  1.20::numeric, 5),
  (5000001::numeric, null::numeric,     1.00::numeric, 6)
) as seed(min_value, max_value, rate_percent, sort_order)
where not exists (select 1 from commission_tiers);

create table if not exists activities (
  id               uuid primary key default gen_random_uuid(),
  deal_id          uuid references deals(id) on delete cascade,
  contact_id       uuid references contacts(id) on delete cascade,
  type             text not null check (type in
                     ('call','email','meeting','demo','note','stage_change')),
  notes            text not null default '',
  technical_tags   text[] not null default '{}',
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint activities_one_parent check (
    (deal_id is not null and contact_id is null) or
    (deal_id is null and contact_id is not null)
  )
);

-- Migrating an existing database where activities.deal_id was required and
-- contact_id didn't exist yet. Safe to re-run.
alter table activities alter column deal_id drop not null;
alter table activities add column if not exists contact_id uuid references contacts(id) on delete cascade;
alter table activities drop constraint if exists activities_one_parent;
alter table activities add constraint activities_one_parent check (
  (deal_id is not null and contact_id is null) or
  (deal_id is null and contact_id is not null)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_contacts_org on contacts(organization_id);
create index if not exists idx_contacts_status on contacts(status);
create index if not exists idx_contacts_next_action_date on contacts(next_action_date);
create index if not exists idx_deals_org on deals(organization_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_next_action_date on deals(next_action_date);
create index if not exists idx_deals_stage_entered_at on deals(stage_entered_at);
create index if not exists idx_activities_deal on activities(deal_id);
create index if not exists idx_activities_contact on activities(contact_id);
create index if not exists idx_activities_occurred_at on activities(occurred_at desc);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger for deals
-- ─────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_deals_updated_at on deals;
create trigger trg_deals_updated_at
  before update on deals
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
--
-- This is a small internal tool for one company's sales team, not a
-- multi-tenant SaaS product. Every authenticated user can read and write
-- every row — the boundary that matters is "logged in vs not logged in",
-- not per-rep ownership. If you later add reps who should only see their
-- own book, add an owner_id uuid references auth.users(id) column to
-- deals and tighten these policies to check auth.uid() = owner_id.
-- ─────────────────────────────────────────────────────────────

alter table organizations enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table commission_tiers enable row level security;

drop policy if exists "authenticated_full_access" on organizations;
create policy "authenticated_full_access" on organizations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on contacts;
create policy "authenticated_full_access" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on deals;
create policy "authenticated_full_access" on deals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on activities;
create policy "authenticated_full_access" on activities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on commission_tiers;
create policy "authenticated_full_access" on commission_tiers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
