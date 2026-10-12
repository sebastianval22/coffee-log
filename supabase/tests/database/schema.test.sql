-- Search, de-duplication, constraints and the history feed.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000000', 'a@example.com');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);

insert into public.roasters (id, name) values ('a0000000-0000-0000-0000-00000000000a', 'Café Altura');
insert into public.cafes (id, name, city) values ('a0000000-0000-0000-0000-0000000000ca', 'La Ciudad', 'Santiago');
insert into public.bags (id, name, photo_path, roaster_id, origin_country, process, opened_at) values
  ('a0000000-0000-0000-0000-0000000000ba', 'Yirgacheffe Konga', 'p', 'a0000000-0000-0000-0000-00000000000a',
   'Etiopía', 'washed', '2026-10-01 08:00+00');
insert into public.cafe_visits (cafe_id, drink, photo_path, origin_country) values
  ('a0000000-0000-0000-0000-0000000000ca', 'flat_white', 'p', 'Etiopía');

-- De-duplication
select throws_ok($$ insert into public.roasters (name) values ('  cafe   altura ') $$, '23505', null,
  'roaster names are unique ignoring case, accents and spacing');
select throws_ok($$ insert into public.cafes (name, city) values ('la ciudad', 'santiago') $$, '23505', null,
  'café names are unique per city ignoring case');
select lives_ok($$ insert into public.cafes (name, city) values ('La Ciudad', 'Valparaíso') $$,
  'same café name is allowed in another city');

-- Search
select is((select count(*)::int from public.search_bags('etiopia')), 1, 'full-text ignores accents');
select is((select count(*)::int from public.search_bags('etiopa')), 1, 'trigram tolerates typos');
select is((select count(*)::int from public.search_bags('altura')), 1, 'bags are searchable by roaster');
select is((select count(*)::int from public.search_bags('kenia')), 0, 'unrelated query finds nothing');
select is((select count(*)::int from public.search_cafe_visits('etiopia')), 1, 'visits are searchable by origin');
select is((select count(*)::int from public.search_cafe_visits('ciudad')), 1, 'visits are searchable by café');

update public.roasters set name = 'Tostaduría Sur' where id = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*)::int from public.search_bags('tostaduria')), 1, 'renaming a roaster refreshes search');

-- Cups and the history feed
insert into public.cups (bag_id, drunk_at) values ('a0000000-0000-0000-0000-0000000000ba', '2026-10-02 08:00+00');
insert into public.cups (bag_id, drunk_at, method, rating)
  values ('a0000000-0000-0000-0000-0000000000ba', '2026-10-03 08:00+00', 'v60', 4.5);

select is((select cup_count from public.bag_summary), 2, 'bag_summary counts every cup');
select is((select tasting_count from public.bag_summary), 1, 'only cups with details are tastings');
select is((select count(*)::int from public.history_feed), 3,
  'history_feed has the opening, the tasting and the visit, but not the quick cup');

update public.bags set finished_at = '2026-10-10 08:00+00';
select is((select count(*)::int from public.history_feed where kind = 'bag_finished'), 1,
  'finishing a bag adds a history event');

-- Constraints
select throws_ok($$ update public.bags set rating = 4.3 $$, '23514', null, 'ratings go in 0.5 steps');
select throws_ok($$ update public.bags set finished_at = '2026-09-01 00:00+00' $$, '23514', null,
  'a bag cannot be finished before it was opened');
select throws_ok($$ insert into public.bags (name, photo_path) values ('  ', 'p') $$, '23514', null,
  'a bag needs a name');

select * from finish();
rollback;
