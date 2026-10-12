# Spec — Phase 1: manual MVP

> Status: approved (grilling session, 2026-10-11). Source of truth for the Phase 1 issues (label `phase-1`).
> Goal: **use the app daily** from the iPhone (PWA) and browse it comfortably on a computer. No AI yet.
> UI copy is in Spanish (quoted below as it appears in the app); code, docs and commits are in English.

## 1. Domain concepts

| Concept | What it is | Created by |
|---|---|---|
| **Bag** (`bags`) | A bag of coffee I open at home. One photo (of the package) and my verdict. | Opening a new bag |
| **Cup** (`cups`) | A cup brewed from a bag. Either *quick* (timestamp only, "+1" button) or a *tasting* (method, rating, tags or notes). | "+1" or "Agregar cata" |
| **Café visit** (`cafe_visits`) | A coffee I had at a café. Its own photo (of the cup), no bag. | Logging a visit |
| **Roaster** (`roasters`) | Who roasted the coffee. Shared by bags and visits. | Autocomplete / create inline |
| **Café** (`cafes`) | A place where I had coffee. | Autocomplete / create inline |

A cup is a **tasting** if it has at least one of: method, rating, tags, notes. Otherwise it is a **quick cup**.

## 2. Data model

```sql
create type process_t as enum ('washed','natural','honey','anaerobic','wet_hulled','other');
create type roast_t   as enum ('light','medium_light','medium','medium_dark','dark');
create type method_t  as enum ('espresso','v60','chemex','aeropress','french_press','moka',
                               'cold_brew','filter_machine',
                               'latte','cappuccino','flat_white','cortado','other');

roasters    (id, user_id, name, country, city, website, created_at)   unique (user_id, lower(name))
cafes       (id, user_id, name, city, address, created_at)            unique (user_id, lower(name), coalesce(city,''))

bags (
  id, user_id,
  name            text not null,
  photo_path      text not null,          -- {user_id}/bags/{id}/full.jpg (thumb.jpg next to it)
  roaster_id      → roasters on delete set null,
  origin_country, origin_region, farm, varieties text[], process process_t, roast_level roast_t,
  altitude_m      int check 0..3500,
  label_notes     text[],                  -- tasting notes printed on the package
  opened_at       timestamptz not null default now(),
  finished_at     timestamptz check (finished_at >= opened_at),
  finish_prompt_snoozed_until timestamptz,
  rating          numeric(2,1) check (rating between 0 and 5 and rating*2 = floor(rating*2)),
  flavor_tags     text[], notes text, would_buy_again boolean,
  search          tsvector,                -- trigger
  created_at, updated_at
)

cups (
  id, user_id,
  bag_id          → bags on delete cascade, not null,
  drunk_at        timestamptz not null default now(),
  method method_t, rating numeric(2,1), flavor_tags text[], notes text,
  created_at
)

cafe_visits (
  id, user_id,
  cafe_id         → cafes on delete restrict, not null,
  drink           method_t not null,
  photo_path      text not null,           -- {user_id}/visits/{id}/full.jpg
  visited_at      timestamptz not null default now(),
  rating numeric(2,1), flavor_tags text[], notes text,
  coffee_name text, roaster_id → roasters on delete set null, origin_country text, process process_t,
  search          tsvector,
  created_at, updated_at
)
```

- **RLS** on every table: `user_id = auth.uid()` for select/insert/update/delete; `user_id default auth.uid()`. The cloud project has "auto-expose" off, so the migration has explicit `GRANT`s to `authenticated` (local and cloud behave the same).
- **Storage:** private `photos` bucket, policies scoped to the `{auth.uid()}/` prefix. Two files per photo: `full.jpg` (~1600px long edge, JPEG ~0.8) and `thumb.jpg` (~400px). Read through signed URLs.
- **Search:** `unaccent` + `spanish` config. Bags: name and roaster (A), origin/region/farm/varieties (B), notes/tags (C). Visits: café, coffee name, roaster (A), origin, drink (B), notes/tags (C). GIN index + `pg_trgm` on names for typos.
- **Views** (with `security_invoker = true`):
  - `bag_summary`: bag + roaster + cup count + tasting count + last cup.
  - `history_feed`: union of `bag_opened` (bags.opened_at), `bag_finished` (bags.finished_at), `tasting` (cups that are tastings) and `cafe_visit` events. Common columns: `kind, occurred_at, bag_id, cup_id, visit_id, title, subtitle, photo_path, rating`.
- Deleting a bag deletes its cups and its photos in Storage. Deleting a visit deletes its photo.

## 3. Screens and flows

Navigation: bottom bar (mobile) / top or side nav (desktop) with **Inicio · Cafés · Cafeterías** plus a primary **Registrar** button (choose "Abrí una bolsa" or "Estoy en una cafetería").

### 3.1 Login
Email → 6-digit OTP code → persisted session. No magic link (on iOS it opens in Safari, which doesn't share the session with the installed PWA).

### 3.2 Home (history)
- **"Abiertas ahora"** strip at the top: bags with `finished_at is null`, thumbnail + cup count + **+1** button. Tapping +1 creates a quick cup and shows a "Taza registrada · Deshacer" toast (~5 s).
- **"¿Ya terminaste?"** prompt on an open bag's card when (`now - opened_at ≥ 14 days` **or** `now - last cup ≥ 7 days`, counting from `opened_at` if there are no cups) **and** `now ≥ finish_prompt_snoozed_until`. Buttons: "Sí, terminé" → finish sheet; "Todavía no" → `snoozed_until = now + 7 days`. Constants live in one module.
- Below: paginated `history_feed`, newest first. Quick cups don't appear.

### 3.3 Log a bag
Photo (required; `capture="environment"`, file picker on desktop) → form: name (required), roaster (combobox with create), origin, region, farm, varieties, process, roast level, altitude, label notes, opened date (defaults to now). Optional on the same screen, collapsed: rating/tags/notes. Save → detail.

### 3.4 Bag detail
Large photo, data, verdict, list of cups (tastings in full; quick cups grouped as a counter), buttons **+1**, **Agregar cata**, **Terminé esta bolsa** (or "Reabrir" when finished), Edit, Delete (with confirmation).

### 3.5 Finish sheet
Finish date (defaults to today, ≥ opened date), final rating, "would you buy it again?" — all optional, prefilled with existing values.

### 3.6 Log / view a café visit
Photo (required), café (combobox with create: name, city, address), drink (required), date (defaults to now), rating, tags, notes, and a collapsed "Sé qué café era" section: coffee name, roaster, origin, process. Detail page with Edit and Delete.

### 3.7 Cafés (catalog) and Cafeterías
- **Cafés:** grid of bags (`bag_summary`), Open / All tabs.
- **Cafeterías:** grid of visits, optionally grouped by café.
- Both with text search and filters: process, roast level (bags only), minimum rating, date range (opened / visited). Sort by date or rating. Filters live in the URL (shareable, survive reloads).

### 3.8 Shared details
- Responsive grid: 1 column on mobile, 2 on tablet, 3–4 on desktop; `thumb.jpg` in grids, `full.jpg` in details.
- Rating: 0–5 stars in 0.5 steps. Tags: free text, suggesting previously used ones.
- Timestamps stored in UTC, shown in the device's time zone.
- Respect `safe-area-inset`.

## 4. Stack

React Router (library mode) · TanStack Query · shadcn/ui · react-hook-form + Zod · `@supabase/supabase-js`. Image compression via `<canvas>` (normalizes HEIC and EXIF orientation).

## 5. Quality

- **pgTAP** (`supabase test db`): RLS on every table, view and the bucket — user A can't read, update or delete user B's data; `anon` sees nothing.
- `pnpm build` (tsc) and lint green before every merge.

## 6. Operations (run by the owner)

- `supabase link --project-ref <ref>` (once) and `supabase db push` for each new migration.
- Supabase cloud → Authentication: email template with `{{ .Token }}` (OTP); after creating the owner's user, disable "Allow new users to sign up".

## 7. Out of scope (Phase 1)

AI extraction (Phase 2) · calendar view and insights (Phase 4) · offline queue · export · linking a visit to a bag · creating a bag from a visit · GPS/map · photo per cup · i18n.
