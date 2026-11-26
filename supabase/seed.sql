-- Synthetic demo seed data (PROMPT 10) -- clearly labelled is_demo=true
-- Run only in demo/dev environments.

-- Wards
insert into public.wards (id, ward_name, city, boundary_data) values
  ('11111111-1111-1111-1111-111111111111', 'Northbridge', 'Demo City', '{"type":"Polygon","coordinates":[[[-74.02,40.70],[-74.00,40.70],[-74.00,40.72],[-74.02,40.72],[-74.02,40.70]]]}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'Riverside', 'Demo City', '{"type":"Polygon","coordinates":[[[-74.00,40.70],[-73.98,40.70],[-73.98,40.72],[-74.00,40.72],[-74.00,40.70]]]}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'Old Town', 'Demo City', null),
  ('44444444-4444-4444-4444-444444444444', 'Tech District', 'Demo City', null),
  ('55555555-5555-5555-5555-555555555555', 'Greenfield', 'Demo City', null)
on conflict (id) do nothing;

-- Demo auth users (password: demo1234) - synthetic
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'demo1@example.com', crypt('demo1234', gen_salt('bf')), now(), '{"full_name":"Demo Citizen 1","display_name":"Demo Citizen 1"}'::jsonb, '{"role":"citizen"}'::jsonb, now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'demo2@example.com', crypt('demo1234', gen_salt('bf')), now(), '{"full_name":"Demo Citizen 2"}'::jsonb, '{"role":"citizen"}'::jsonb, now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'admin@example.com', crypt('admin', gen_salt('bf')), now(), '{"full_name":"Demo Admin"}'::jsonb, '{"role":"admin"}'::jsonb, now(), now())
on conflict (id) do nothing;
-- Civic issues (synthetic demo)
insert into public.civic_issues (id, user_id, title, description, category, severity, priority_score, latitude, longitude, address, ward_id, status, image_url, ai_analysis, is_demo) values
  ('c0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '[DEMO] Large pothole near bus stop', 'Synthetic demo report for pothole.', 'pothole', 'high', 75, 40.7128, -74.0060, 'Demo St 1, Demo City', '11111111-1111-1111-1111-111111111111', 'open', null, '{"category":"pothole","confidence":0.8}'::jsonb, true),
  ('c0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '[DEMO] Streetlight out for 2 weeks', 'Synthetic demo report for streetlight.', 'streetlight', 'medium', 45, 40.7150, -74.0020, 'Demo St 2, Demo City', '22222222-2222-2222-2222-222222222222', 'in_progress', null, '{"category":"streetlight","confidence":0.75}'::jsonb, true),
  ('c0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '[DEMO] Water pooling on sidewalk', 'Synthetic demo report for water leak.', 'water_leak', 'critical', 90, 40.7100, -74.0100, 'Demo St 3, Demo City', '11111111-1111-1111-1111-111111111111', 'resolved', null, '{"category":"water_leak","confidence":0.9}'::jsonb, true)
on conflict (id) do nothing;

insert into public.issue_updates (issue_id, updated_by, old_status, new_status, remarks, evidence_url) values
  ('c0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'open', 'in_progress', 'Demo moderator assigned.', null),
  ('c0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'in_progress', 'resolved', 'Demo verification.', null);

insert into public.issue_duplicates (primary_issue_id, duplicate_issue_id, similarity_score) values
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 0.82);

insert into public.notifications (user_id, title, message, is_read) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Welcome to CityFixAI', 'Synthetic demo notification.', false);

insert into public.citizen_rewards (user_id, points, achievement) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 10, 'First report submitted (demo)');

