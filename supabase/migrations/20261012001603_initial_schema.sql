-- Phase 1 schema: bags, cups, café visits, roasters, cafés.
-- Spec: docs/specs/phase-1.md §2

-- ---------------------------------------------------------------------------
-- Extensions, text search, helpers
-- ---------------------------------------------------------------------------

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Spanish stemming that also ignores accents ("Etiopía" = "etiopia").
create text search configuration public.es_unaccent (copy = pg_catalog.spanish);
alter text search configuration public.es_unaccent
  alter mapping for hword, hword_part, word with extensions.unaccent, pg_catalog.spanish_stem;

-- Canonical form for de-duplicating and fuzzy-matching names:
-- lowercase, no accents, collapsed whitespace. Declared immutable so it can back indexes.
create function public.normalize_name(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary,
                                   btrim(regexp_replace(value, '\s+', ' ', 'g'))));
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.process_t as enum ('washed', 'natural', 'honey', 'anaerobic', 'wet_hulled', 'other');
create type public.roast_t as enum ('light', 'medium_light', 'medium', 'medium_dark', 'dark');
create type public.method_t as enum (
  'espresso', 'v60', 'chemex', 'aeropress', 'french_press', 'moka', 'cold_brew', 'filter_machine',
  'latte', 'cappuccino', 'flat_white', 'cortado', 'other'
);

-- 0 to 5 in 0.5 steps.
create domain public.rating_t as numeric(2, 1)
  check (value between 0 and 5 and value * 2 = floor(value * 2));

-- ---------------------------------------------------------------------------
-- Tables
--
-- Every foreign key includes user_id, so a row can only point at rows owned by
-- the same user (FK checks bypass RLS, so RLS alone wouldn't guarantee this).
-- ---------------------------------------------------------------------------

create table public.roasters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (btrim(name) <> ''),
  country    text,
  city       text,
  website    text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index roasters_user_name_key on public.roasters (user_id, public.normalize_name(name));

create table public.cafes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (btrim(name) <> ''),
  city       text,
  address    text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index cafes_user_name_city_key
  on public.cafes (user_id, public.normalize_name(name), public.normalize_name(coalesce(city, '')));

create table public.bags (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null default auth.uid() references auth.users on delete cascade,
  name                        text not null check (btrim(name) <> ''),
  photo_path                  text not null,
  roaster_id                  uuid,
  origin_country              text,
  origin_region               text,
  farm                        text,
  varieties                   text[] not null default '{}',
  process                     public.process_t,
  roast_level                 public.roast_t,
  altitude_m                  int check (altitude_m between 0 and 3500),
  label_notes                 text[] not null default '{}',
  opened_at                   timestamptz not null default now(),
  finished_at                 timestamptz,
  finish_prompt_snoozed_until timestamptz,
  rating                      public.rating_t,
  flavor_tags                 text[] not null default '{}',
  notes                       text,
  would_buy_again             boolean,
  search                      tsvector,
  search_text                 text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (id, user_id),
  check (finished_at >= opened_at),
  foreign key (roaster_id, user_id) references public.roasters (id, user_id) on delete set null (roaster_id)
);

create table public.cups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  bag_id      uuid not null,
  drunk_at    timestamptz not null default now(),
  method      public.method_t,
  rating      public.rating_t,
  flavor_tags text[] not null default '{}',
  notes       text,
  -- A cup with any detail is a tasting; otherwise it's a quick "+1" cup.
  is_tasting  boolean generated always as (
    method is not null
    or rating is not null
    or cardinality(flavor_tags) > 0
    or coalesce(btrim(notes), '') <> ''
  ) stored,
  created_at  timestamptz not null default now(),
  foreign key (bag_id, user_id) references public.bags (id, user_id) on delete cascade
);

create table public.cafe_visits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  cafe_id        uuid not null,
  drink          public.method_t not null,
  photo_path     text not null,
  visited_at     timestamptz not null default now(),
  rating         public.rating_t,
  flavor_tags    text[] not null default '{}',
  notes          text,
  coffee_name    text,
  roaster_id     uuid,
  origin_country text,
  process        public.process_t,
  search         tsvector,
  search_text    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  foreign key (cafe_id, user_id) references public.cafes (id, user_id) on delete restrict,
  foreign key (roaster_id, user_id) references public.roasters (id, user_id) on delete set null (roaster_id)
);

create index bags_user_opened_idx on public.bags (user_id, opened_at desc);
create index bags_open_idx on public.bags (user_id) where finished_at is null;
create index bags_roaster_idx on public.bags (roaster_id);
create index bags_search_idx on public.bags using gin (search);
create index bags_search_text_idx on public.bags using gin (search_text extensions.gin_trgm_ops);
create index cups_bag_drunk_idx on public.cups (bag_id, drunk_at desc);
create index cups_user_drunk_idx on public.cups (user_id, drunk_at desc);
create index cafe_visits_user_visited_idx on public.cafe_visits (user_id, visited_at desc);
create index cafe_visits_cafe_idx on public.cafe_visits (cafe_id);
create index cafe_visits_roaster_idx on public.cafe_visits (roaster_id);
create index cafe_visits_search_idx on public.cafe_visits using gin (search);
create index cafe_visits_search_text_idx on public.cafe_visits using gin (search_text extensions.gin_trgm_ops);

create trigger bags_set_updated_at before update on public.bags
  for each row execute function public.set_updated_at();
create trigger cafe_visits_set_updated_at before update on public.cafe_visits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Search documents
--
-- `search` is weighted full-text (A: names, B: origin, C: notes/tags).
-- `search_text` is a normalized string for trigram matching of typos.
-- ---------------------------------------------------------------------------

create function public.bags_set_search()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  roaster_name text;
begin
  select r.name into roaster_name from public.roasters r where r.id = new.roaster_id;

  new.search :=
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ', new.name, roaster_name)), 'A') ||
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ',
      new.origin_country, new.origin_region, new.farm, array_to_string(new.varieties, ' '))), 'B') ||
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ',
      array_to_string(new.label_notes, ' '), array_to_string(new.flavor_tags, ' '), new.notes)), 'C');
  new.search_text := public.normalize_name(concat_ws(' ',
    new.name, roaster_name, new.origin_country, new.origin_region, new.farm,
    array_to_string(new.varieties, ' ')));
  return new;
end;
$$;

create trigger bags_set_search before insert or update on public.bags
  for each row execute function public.bags_set_search();

create function public.cafe_visits_set_search()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cafe_name text;
  roaster_name text;
begin
  select c.name into cafe_name from public.cafes c where c.id = new.cafe_id;
  select r.name into roaster_name from public.roasters r where r.id = new.roaster_id;

  new.search :=
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ', cafe_name, new.coffee_name, roaster_name)), 'A') ||
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ',
      new.origin_country, replace(new.drink::text, '_', ' '))), 'B') ||
    setweight(to_tsvector('public.es_unaccent', concat_ws(' ',
      array_to_string(new.flavor_tags, ' '), new.notes)), 'C');
  new.search_text := public.normalize_name(concat_ws(' ',
    cafe_name, new.coffee_name, roaster_name, new.origin_country));
  return new;
end;
$$;

create trigger cafe_visits_set_search before insert or update on public.cafe_visits
  for each row execute function public.cafe_visits_set_search();

-- Renaming a roaster or café refreshes the search documents that embed its name.
create function public.refresh_search_on_rename()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'roasters' then
    update public.bags set roaster_id = roaster_id where roaster_id = new.id;
    update public.cafe_visits set roaster_id = roaster_id where roaster_id = new.id;
  else
    update public.cafe_visits set cafe_id = cafe_id where cafe_id = new.id;
  end if;
  return null;
end;
$$;

create trigger roasters_refresh_search after update of name on public.roasters
  for each row execute function public.refresh_search_on_rename();
create trigger cafes_refresh_search after update of name on public.cafes
  for each row execute function public.refresh_search_on_rename();

-- ---------------------------------------------------------------------------
-- Views (security_invoker: the caller's RLS applies)
-- ---------------------------------------------------------------------------

create view public.bag_summary
with (security_invoker = true)
as
select
  b.id, b.user_id, b.name, b.photo_path, b.roaster_id, r.name as roaster_name,
  b.origin_country, b.origin_region, b.farm, b.varieties, b.process, b.roast_level, b.altitude_m,
  b.label_notes, b.opened_at, b.finished_at, b.finish_prompt_snoozed_until,
  b.rating, b.flavor_tags, b.notes, b.would_buy_again, b.created_at, b.updated_at,
  coalesce(c.cup_count, 0) as cup_count,
  coalesce(c.tasting_count, 0) as tasting_count,
  c.last_cup_at
from public.bags b
left join public.roasters r on r.id = b.roaster_id
left join lateral (
  select count(*)::int as cup_count,
         (count(*) filter (where cu.is_tasting))::int as tasting_count,
         max(cu.drunk_at) as last_cup_at
  from public.cups cu
  where cu.bag_id = b.id
) c on true;

create view public.cafe_visit_summary
with (security_invoker = true)
as
select
  v.id, v.user_id, v.cafe_id, ca.name as cafe_name, ca.city as cafe_city, v.drink, v.photo_path,
  v.visited_at, v.rating, v.flavor_tags, v.notes, v.coffee_name, v.roaster_id, r.name as roaster_name,
  v.origin_country, v.process, v.created_at, v.updated_at
from public.cafe_visits v
join public.cafes ca on ca.id = v.cafe_id
left join public.roasters r on r.id = v.roaster_id;

-- Home timeline. Quick cups are intentionally excluded (they only count toward their bag).
create view public.history_feed
with (security_invoker = true)
as
select 'bag_opened'::text as kind, b.opened_at as occurred_at, b.user_id,
       b.id as bag_id, null::uuid as cup_id, null::uuid as visit_id,
       b.name as title, r.name as subtitle, b.photo_path, b.rating
from public.bags b
left join public.roasters r on r.id = b.roaster_id
union all
select 'bag_finished', b.finished_at, b.user_id,
       b.id, null, null,
       b.name, r.name, b.photo_path, b.rating
from public.bags b
left join public.roasters r on r.id = b.roaster_id
where b.finished_at is not null
union all
select 'tasting', cu.drunk_at, cu.user_id,
       b.id, cu.id, null,
       b.name, cu.method::text, b.photo_path, cu.rating
from public.cups cu
join public.bags b on b.id = cu.bag_id
where cu.is_tasting
union all
select 'cafe_visit', v.visited_at, v.user_id,
       null, null, v.id,
       ca.name, v.drink::text, v.photo_path, v.rating
from public.cafe_visits v
join public.cafes ca on ca.id = v.cafe_id;

-- ---------------------------------------------------------------------------
-- Search RPCs. They return the summary views so PostgREST filters, ordering and
-- pagination can be chained on top: rpc('search_bags', { q }).eq('process', ...).
-- An empty query returns everything.
-- ---------------------------------------------------------------------------

create function public.search_bags(q text)
returns setof public.bag_summary
language sql
stable
security invoker
set search_path = ''
as $$
  select s.*
  from public.bag_summary s
  join public.bags b on b.id = s.id
  where coalesce(btrim(q), '') = ''
     or b.search @@ websearch_to_tsquery('public.es_unaccent', q)
     or public.normalize_name(q) operator(extensions.<%) b.search_text;
$$;

create function public.search_cafe_visits(q text)
returns setof public.cafe_visit_summary
language sql
stable
security invoker
set search_path = ''
as $$
  select s.*
  from public.cafe_visit_summary s
  join public.cafe_visits v on v.id = s.id
  where coalesce(btrim(q), '') = ''
     or v.search @@ websearch_to_tsquery('public.es_unaccent', q)
     or public.normalize_name(q) operator(extensions.<%) v.search_text;
$$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
--
-- The cloud project doesn't auto-expose new tables, so grants are explicit here
-- (and revoked from anon locally, where the defaults are more permissive).
-- ---------------------------------------------------------------------------

alter table public.roasters enable row level security;
alter table public.cafes enable row level security;
alter table public.bags enable row level security;
alter table public.cups enable row level security;
alter table public.cafe_visits enable row level security;

create policy "Owners manage their roasters" on public.roasters for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage their cafes" on public.cafes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage their bags" on public.bags for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage their cups" on public.cups for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage their cafe visits" on public.cafe_visits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.roasters, public.cafes, public.bags, public.cups, public.cafe_visits,
              public.bag_summary, public.cafe_visit_summary, public.history_feed
  from anon, authenticated;
grant select, insert, update, delete
  on public.roasters, public.cafes, public.bags, public.cups, public.cafe_visits
  to authenticated;
grant select on public.bag_summary, public.cafe_visit_summary, public.history_feed to authenticated;

revoke execute on function public.search_bags(text), public.search_cafe_visits(text) from public, anon;
grant execute on function public.search_bags(text), public.search_cafe_visits(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket, one folder per user: photos/{user_id}/...
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5 * 1024 * 1024, array['image/jpeg']);

create policy "Owners read their photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners upload their photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners update their photos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners delete their photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
