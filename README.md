# XTEMP Sales OS

A purpose-built sales operating system for a technical sales engineer — not a
generic CRM. Built with Next.js 16, TypeScript, Tailwind v4, and Supabase.
Deploys to Vercel.

The whole system is built around one rule: **an open deal is never allowed to
have no next action.** That's the actual fix for "I lose track of leads and
forget follow-ups" — not a nicer list view.

## What's inside

- **Dashboard** — calls due today, follow-ups due (with overdue called out in
  red), meetings in the next 7 days, open pipeline value, and a standing alert
  for any deal with no next action set.
- **Leads** — organizations, contacts (multiple people per company), and
  deals, filterable by stage/industry/search.
- **Pipeline** — a kanban board (drag and drop) covering the working stages:
  New → Contacted → Meeting → Demo → Quotation. Won/Lost are closed
  explicitly from the deal page, not dragged into a column.
- **Deal detail** — contact info, a running activity timeline (calls, emails,
  meetings, demos, notes), technical tags per activity, and the next-action
  field that every activity log updates.
- **Auth** — Supabase magic-link sign-in. Single shared workspace for your
  team (see the RLS note in `supabase/schema.sql` if you later want
  per-rep-only visibility).

## Setup

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a new project. Then open the
SQL editor and run everything in `supabase/schema.sql`. That creates the four
tables (`organizations`, `contacts`, `deals`, `activities`), indexes, an
`updated_at` trigger, and row-level security policies.

Under **Authentication → Providers**, make sure Email is enabled. Under
**Authentication → URL Configuration**, add your local and production URLs
(e.g. `http://localhost:3000` and `https://your-app.vercel.app`) to the
redirect allow-list, since the magic link redirects to `/auth/callback`.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your project's URL and
anon key (Project Settings → API in Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. You'll be redirected to `/login` — enter your
email, then open the magic link Supabase sends you.

### 4. Deploy to Vercel

Push this repo to GitHub, then import it in Vercel. Add the same two
environment variables in the Vercel project settings, and add your
`https://your-app.vercel.app/auth/callback` URL to Supabase's redirect
allow-list. Deploy.

## Contacts — everyone you speak to, before it's a real deal

A Contact needs no company and no deal — just a name and a follow-up date.
Each one has its own status (New → Contacted → Qualifying) and its own
next-action reminder, shown on the Dashboard right alongside your deal
follow-ups. When something real comes of it, click **Promote to deal** on the
contact — it asks for the company, product, and value, creates the deal, and
marks the contact as promoted so it drops off your active list. Dead ends can
be marked **Not a fit** to archive them without deleting anything.

## Commission

Commission is calculated per deal, from a tiered rate table applied to that
deal's own actual value (flat rate on the whole amount, not stacked like a
tax bracket — whichever tier the value falls into, that tier's rate applies
to the full amount). When you mark a deal **Won**, you enter the actual sale
value and the app looks up the matching tier and calculates the commission
automatically — you can override either the rate or the final amount if a
particular deal is a manual exception.

- **Commission → Rate table** lets you edit the tiers yourself whenever your
  commission plan changes — no code change or redeploy needed.
- **Commission** (main page) shows a yearly overview: total sales and
  commission per month, with a chart, and links into each month.
- Click into any month for a clean, printable report (Company / Deal / Value
  / Rate / Commission, with totals) — the **Print / Save as PDF** button uses
  your browser's built-in print-to-PDF, so there's nothing extra to install.

## Adding a teammate

Since this is a shared workspace, anyone with a login can see and edit
everything. To add someone, just have them sign in with their email at
`/login` — no invite flow needed, since Supabase magic-link auth will create
their account on first sign-in. If you want to restrict who can sign in at
all, disable "Allow new users to sign up" in Supabase and add users manually
from the dashboard instead.

## Design notes

The visual language is "instrument bezel + chart paper" — a dark panel
sidebar (like the anodized front panel on the DAQ hardware XTEMP sells) next
to a pale, warm content area (like a measurement printout). All numeric
values render in a monospace face, like a digital readout. Stage badges are
small LED-style indicator pills rather than generic colored chips.

## Extending it

A few things that are deliberately left out of v1, in rough order of
likely usefulness:

- **Email/calendar sync** — auto-logging emails and pulling meeting dates
  from Google/Outlook instead of typing them in.
- **Per-rep ownership** — if you hire a second sales engineer, add an
  `owner_id` column to `deals` and tighten the RLS policy in
  `supabase/schema.sql` so each rep only sees their own book (or everyone's,
  with an "assigned to" filter — your call).
- **Quote attachments** — a `documents` table + Supabase Storage bucket to
  attach the actual PDF quote to a deal at the Quotation stage.
- **Win/loss analytics** — a report view over `lost_reason` and time-in-stage
  once you have a few dozen closed deals to learn from.
