-- AVN Sales OS — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run against an existing database: nothing here drops data,
-- every statement is IF NOT EXISTS / ON CONFLICT DO NOTHING / idempotent.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Workspaces — each one is a fully separate business (its own deals,
-- contacts, pipeline stages, and commission table). Everything below is
-- scoped to a workspace_id so the two never mix.
-- ─────────────────────────────────────────────────────────────

create table if not exists workspaces (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,
  name                    text not null,
  requires_organization   boolean not null default true, -- false = deals are just with a person, no company step
  tracks_sale_type        boolean not null default false, -- true = every deal/contact specifies Set vs Loose Clubs
  sort_order              int not null default 0,
  created_at              timestamptz not null default now()
);

insert into workspaces (slug, name, requires_organization, tracks_sale_type, sort_order) values
  ('xtemp', 'XTEMP', true, false, 1),
  ('we-buy-clubz', 'We Buy Clubz', false, true, 2)
on conflict (slug) do nothing;

-- Migrating a workspaces table that predates sale-type tracking. Safe to re-run.
alter table workspaces add column if not exists tracks_sale_type boolean not null default false;
update workspaces set tracks_sale_type = true where slug = 'we-buy-clubz';

-- ─────────────────────────────────────────────────────────────
-- Core tables
-- ─────────────────────────────────────────────────────────────

create table if not exists organizations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  industry     text check (industry in (
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
  workspace_id     uuid not null references workspaces(id) on delete cascade,
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
  sale_type        text check (sale_type is null or sale_type in ('set','loose_clubs')),
  created_at       timestamptz not null default now()
);

create table if not exists deals (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  organization_id       uuid references organizations(id) on delete cascade, -- nullable: "We Buy Clubz" deals are just with a person
  primary_contact_id    uuid references contacts(id) on delete set null,
  title                 text not null,
  stage                 text not null default 'new', -- open stages are workspace-defined via pipeline_stages; 'won'/'lost' are universal
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
  sale_type             text check (sale_type is null or sale_type in ('set','loose_clubs')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Each workspace defines its own working (open) pipeline stages — e.g.
-- XTEMP has Meeting/Demo/Quotation, We Buy Clubz just has Pending. 'won' and
-- 'lost' are universal across every workspace and are not stored here.
create table if not exists pipeline_stages (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces(id) on delete cascade,
  key                    text not null,
  label                  text not null,
  color                  text not null default 'wire' check (color in ('wire','amber','signal')),
  sort_order             int not null,
  default_followup_days  int not null default 3,
  default_followup_type  text not null default 'call' check (default_followup_type in
                            ('call','email','meeting','demo','quote_followup','other')),
  unique (workspace_id, key)
);

insert into pipeline_stages (workspace_id, key, label, color, sort_order, default_followup_days, default_followup_type)
select w.id, s.key, s.label, s.color, s.sort_order, s.days, s.ftype
from workspaces w
join (values
  ('xtemp', 'new',        'New',        'wire',   1, 2, 'call'),
  ('xtemp', 'contacted',  'Contacted',  'wire',   2, 3, 'call'),
  ('xtemp', 'meeting',    'Meeting',    'amber',  3, 5, 'email'),
  ('xtemp', 'demo',       'Demo',       'amber',  4, 4, 'quote_followup'),
  ('xtemp', 'quotation',  'Quotation',  'signal', 5, 7, 'quote_followup'),
  ('we-buy-clubz', 'new',       'New',       'wire',  1, 2, 'call'),
  ('we-buy-clubz', 'contacted', 'Contacted', 'wire',  2, 3, 'call'),
  ('we-buy-clubz', 'pending',   'Pending',   'amber', 3, 4, 'call')
) as s(workspace_slug, key, label, color, sort_order, days, ftype) on s.workspace_slug = w.slug
on conflict (workspace_id, key) do nothing;

create table if not exists commission_tiers (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  sale_type     text check (sale_type is null or sale_type in ('set','loose_clubs')), -- null = applies to every sale (e.g. XTEMP)
  min_value     numeric(12,2) not null,
  max_value     numeric(12,2), -- null means "and above", no upper bound
  rate_percent  numeric(5,2), -- percentage-based tier (e.g. loose clubs at a flat 7%)
  flat_amount   numeric(12,2), -- flat-rand tier (e.g. sets: R350/R450/R550 by band) — takes priority over rate_percent when set
  sort_order    int not null,
  constraint commission_tiers_rate_or_flat check (rate_percent is not null or flat_amount is not null)
);

-- Migrating a commission_tiers table that predates sale-type/flat-amount
-- support, or predates workspaces entirely. Safe to re-run.
alter table commission_tiers add column if not exists workspace_id uuid references workspaces(id);
update commission_tiers set workspace_id = (select id from workspaces where slug = 'xtemp') where workspace_id is null;
alter table commission_tiers alter column workspace_id set not null;
alter table commission_tiers add column if not exists sale_type text;
alter table commission_tiers drop constraint if exists commission_tiers_sale_type_check;
alter table commission_tiers add constraint commission_tiers_sale_type_check
  check (sale_type is null or sale_type in ('set','loose_clubs'));
alter table commission_tiers add column if not exists flat_amount numeric(12,2);
alter table commission_tiers alter column rate_percent drop not null;
alter table commission_tiers drop constraint if exists commission_tiers_rate_or_flat;
alter table commission_tiers add constraint commission_tiers_rate_or_flat
  check (rate_percent is not null or flat_amount is not null);

-- Seed XTEMP with the tier structure supplied when this feature was built.
-- Edit tiers anytime from Commission → Rate table — no SQL needed after this.
insert into commission_tiers (workspace_id, min_value, max_value, rate_percent, sort_order)
select w.id, s.min_value, s.max_value, s.rate_percent, s.sort_order
from workspaces w
join (values
  (0::numeric,       500000::numeric,   2.00::numeric, 1),
  (500001::numeric,  1500000::numeric,  1.80::numeric, 2),
  (1500001::numeric, 2500000::numeric,  1.60::numeric, 3),
  (2500001::numeric, 3500000::numeric,  1.40::numeric, 4),
  (3500001::numeric, 5000000::numeric,  1.20::numeric, 5),
  (5000001::numeric, null::numeric,     1.00::numeric, 6)
) as s(min_value, max_value, rate_percent, sort_order) on true
where w.slug = 'xtemp'
and not exists (select 1 from commission_tiers ct where ct.workspace_id = w.id);

-- We Buy Clubz: sets earn a flat rand amount per price band; loose clubs
-- earn a flat 7% of selling price, no bands. Sourced from the commission
-- structure document.
insert into commission_tiers (workspace_id, sale_type, min_value, max_value, rate_percent, flat_amount, sort_order)
select w.id, s.sale_type, s.min_value, s.max_value, s.rate_percent, s.flat_amount, s.sort_order
from workspaces w
join (values
  ('set',         0::numeric,     7499::numeric,  null::numeric, 350::numeric, 1),
  ('set',         7500::numeric,  12500::numeric, null::numeric, 450::numeric, 2),
  ('set',         12501::numeric, null::numeric,  null::numeric, 550::numeric, 3),
  ('loose_clubs', 0::numeric,     null::numeric,  7.00::numeric, null::numeric, 4)
) as s(sale_type, min_value, max_value, rate_percent, flat_amount, sort_order) on true
where w.slug = 'we-buy-clubz'
and not exists (select 1 from commission_tiers ct where ct.workspace_id = w.id);

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

-- ─────────────────────────────────────────────────────────────
-- Migrating an existing database (predates workspaces, or predates any of
-- the earlier features). Every statement here is safe to re-run: it either
-- checks IF NOT EXISTS first, or only touches rows that still need it.
-- ─────────────────────────────────────────────────────────────

-- contacts: standalone-contact pipeline (predates workspaces entirely)
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

-- deals: commission tracking (predates workspaces entirely)
alter table deals add column if not exists actual_value_zar numeric(12,2);
alter table deals add column if not exists commission_rate_percent numeric(5,2);
alter table deals add column if not exists commission_amount_zar numeric(12,2);

-- activities: standalone-contact activity log (predates workspaces entirely)
alter table activities alter column deal_id drop not null;
alter table activities add column if not exists contact_id uuid references contacts(id) on delete cascade;
alter table activities drop constraint if exists activities_one_parent;
alter table activities add constraint activities_one_parent check (
  (deal_id is not null and contact_id is null) or
  (deal_id is null and contact_id is not null)
);

-- workspaces: backfill every existing row into the XTEMP workspace, then
-- require workspace_id going forward. Anything created before today only
-- ever belonged to XTEMP, so this is a safe, accurate backfill.
alter table organizations add column if not exists workspace_id uuid references workspaces(id);
update organizations set workspace_id = (select id from workspaces where slug = 'xtemp') where workspace_id is null;
alter table organizations alter column workspace_id set not null;

alter table contacts add column if not exists workspace_id uuid references workspaces(id);
update contacts set workspace_id = (select id from workspaces where slug = 'xtemp') where workspace_id is null;
alter table contacts alter column workspace_id set not null;

alter table deals add column if not exists workspace_id uuid references workspaces(id);
update deals set workspace_id = (select id from workspaces where slug = 'xtemp') where workspace_id is null;
alter table deals alter column workspace_id set not null;

-- deals.organization_id used to be required — "We Buy Clubz" deals have no
-- company, so it's now optional. Also drop the old fixed stage list, since
-- stages are workspace-defined now (see pipeline_stages above).
alter table deals alter column organization_id drop not null;
alter table deals drop constraint if exists deals_stage_check;

-- organizations.industry used to be required — not meaningful for every
-- workspace, so it's now optional.
alter table organizations alter column industry drop not null;

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_organizations_workspace on organizations(workspace_id);
create index if not exists idx_contacts_workspace on contacts(workspace_id);
create index if not exists idx_contacts_org on contacts(organization_id);
create index if not exists idx_contacts_status on contacts(status);
create index if not exists idx_contacts_next_action_date on contacts(next_action_date);
create index if not exists idx_deals_workspace on deals(workspace_id);
create index if not exists idx_deals_org on deals(organization_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_next_action_date on deals(next_action_date);
create index if not exists idx_deals_stage_entered_at on deals(stage_entered_at);
create index if not exists idx_pipeline_stages_workspace on pipeline_stages(workspace_id);
create index if not exists idx_commission_tiers_workspace on commission_tiers(workspace_id);
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
-- This is a small internal tool for one person running two businesses, not
-- a multi-tenant SaaS product. Every authenticated user (you) can read and
-- write every row across both workspaces — the separation between XTEMP and
-- We Buy Clubz is enforced by the app always filtering by workspace_id, not
-- by a security boundary here. If you ever add a teammate who should only
-- see one workspace, that's the place to tighten this.
-- ─────────────────────────────────────────────────────────────

alter table workspaces enable row level security;
alter table organizations enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table pipeline_stages enable row level security;
alter table activities enable row level security;
alter table commission_tiers enable row level security;

drop policy if exists "authenticated_full_access" on workspaces;
create policy "authenticated_full_access" on workspaces
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on organizations;
create policy "authenticated_full_access" on organizations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on contacts;
create policy "authenticated_full_access" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on deals;
create policy "authenticated_full_access" on deals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on pipeline_stages;
create policy "authenticated_full_access" on pipeline_stages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on activities;
create policy "authenticated_full_access" on activities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on commission_tiers;
create policy "authenticated_full_access" on commission_tiers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
