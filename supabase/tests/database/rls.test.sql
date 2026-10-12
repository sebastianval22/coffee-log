-- RLS: a user only ever sees and changes their own rows and photos; anon sees nothing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Fixtures (as postgres, bypassing RLS) ---------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@example.com');

insert into public.roasters (id, user_id, name) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000', 'Roaster A'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000', 'Roaster B');
insert into public.cafes (id, user_id, name) values
  ('b0000000-0000-0000-0000-0000000000cb', 'bbbbbbbb-0000-0000-0000-000000000000', 'Café B');
insert into public.bags (id, user_id, name, photo_path, roaster_id) values
  ('a0000000-0000-0000-0000-0000000000ba', 'aaaaaaaa-0000-0000-0000-000000000000', 'Bag A',
   'aaaaaaaa-0000-0000-0000-000000000000/bags/x/full.jpg', 'a0000000-0000-0000-0000-00000000000a'),
  ('b0000000-0000-0000-0000-0000000000bb', 'bbbbbbbb-0000-0000-0000-000000000000', 'Bag B',
   'bbbbbbbb-0000-0000-0000-000000000000/bags/y/full.jpg', 'b0000000-0000-0000-0000-00000000000b');
insert into public.cups (user_id, bag_id, rating) values
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-0000000000bb', 4);
insert into public.cafe_visits (user_id, cafe_id, drink, photo_path) values
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-0000000000cb', 'flat_white',
   'bbbbbbbb-0000-0000-0000-000000000000/visits/z/full.jpg');
insert into storage.objects (bucket_id, name, owner) values
  ('photos', 'bbbbbbbb-0000-0000-0000-000000000000/bags/y/full.jpg', 'bbbbbbbb-0000-0000-0000-000000000000');

-- As user A --------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);

select is((select count(*)::int from public.roasters), 1, 'A sees only own roasters');
select is((select count(*)::int from public.cafes), 0, 'A does not see B''s cafés');
select is((select count(*)::int from public.bags), 1, 'A sees only own bags');
select is((select count(*)::int from public.cups), 0, 'A does not see B''s cups');
select is((select count(*)::int from public.cafe_visits), 0, 'A does not see B''s visits');
select is((select count(*)::int from public.bag_summary), 1, 'bag_summary respects RLS');
select is((select count(*)::int from public.cafe_visit_summary), 0, 'cafe_visit_summary respects RLS');
select is((select count(*)::int from public.history_feed
           where user_id <> 'aaaaaaaa-0000-0000-0000-000000000000'), 0, 'history_feed respects RLS');
select is((select count(*)::int from public.search_bags('')), 1, 'search_bags respects RLS');
select is((select count(*)::int from public.search_cafe_visits('')), 0, 'search_cafe_visits respects RLS');

update public.bags set name = 'hacked' where id = 'b0000000-0000-0000-0000-0000000000bb';
delete from public.bags where id = 'b0000000-0000-0000-0000-0000000000bb';
delete from public.cups where bag_id = 'b0000000-0000-0000-0000-0000000000bb';
delete from public.cafes where id = 'b0000000-0000-0000-0000-0000000000cb';

select throws_ok(
  $$ insert into public.bags (user_id, name, photo_path) values
       ('bbbbbbbb-0000-0000-0000-000000000000', 'x', 'p') $$,
  '42501', null, 'A cannot insert rows owned by B');
select throws_ok(
  $$ insert into public.bags (name, photo_path, roaster_id) values
       ('x', 'p', 'b0000000-0000-0000-0000-00000000000b') $$,
  '23503', null, 'A cannot reference B''s roaster');
select throws_ok(
  $$ insert into public.cups (bag_id) values ('b0000000-0000-0000-0000-0000000000bb') $$,
  '23503', null, 'A cannot add cups to B''s bag');
select throws_ok(
  $$ insert into public.cafe_visits (cafe_id, drink, photo_path) values
       ('b0000000-0000-0000-0000-0000000000cb', 'latte', 'p') $$,
  '23503', null, 'A cannot reference B''s café');
select lives_ok(
  $$ insert into public.bags (name, photo_path) values ('Bag A2', 'p') $$,
  'A can insert own bag (user_id defaults to auth.uid())');

-- Storage
select is((select count(*)::int from storage.objects where bucket_id = 'photos'), 0,
  'A does not see B''s photos');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values
       ('photos', 'aaaaaaaa-0000-0000-0000-000000000000/bags/x/full.jpg', 'aaaaaaaa-0000-0000-0000-000000000000') $$,
  'A can upload into own folder');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values
       ('photos', 'bbbbbbbb-0000-0000-0000-000000000000/bags/evil.jpg', 'aaaaaaaa-0000-0000-0000-000000000000') $$,
  '42501', null, 'A cannot upload into B''s folder');

-- B's data is untouched --------------------------------------------------------
reset role;
select is((select name from public.bags where id = 'b0000000-0000-0000-0000-0000000000bb'), 'Bag B',
  'A could not update or delete B''s bag');
select is((select count(*)::int from public.cups where user_id = 'bbbbbbbb-0000-0000-0000-000000000000'), 1,
  'A could not delete B''s cups');
select is((select count(*)::int from public.cafes where user_id = 'bbbbbbbb-0000-0000-0000-000000000000'), 1,
  'A could not delete B''s café');

-- As anon ------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$ select * from public.bags $$, '42501', null, 'anon cannot read bags');
select throws_ok($$ select * from public.history_feed $$, '42501', null, 'anon cannot read history_feed');
select throws_ok($$ select * from public.search_bags('') $$, '42501', null, 'anon cannot call search_bags');

select * from finish();
rollback;
