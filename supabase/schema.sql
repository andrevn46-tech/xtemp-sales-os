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
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  title            text,
  email            text,
  phone            text,
  linkedin_url     text,
  is_primary       boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now()
);

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
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists activities (
  id               uuid primary key default gen_random_uuid(),
  deal_id          uuid not null references deals(id) on delete cascade,
  type             text not null check (type in
                     ('call','email','meeting','demo','note','stage_change')),
  notes            text not null default '',
  technical_tags   text[] not null default '{}',
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_contacts_org on contacts(organization_id);
create index if not exists idx_deals_org on deals(organization_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_next_action_date on deals(next_action_date);
create index if not exists idx_activities_deal on activities(deal_id);
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
