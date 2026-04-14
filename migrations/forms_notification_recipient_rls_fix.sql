alter table public.form_notification_recipients enable row level security;

drop policy if exists "authenticated_select_form_notification_recipients" on public.form_notification_recipients;
drop policy if exists "user_insert_form_notification_recipients" on public.form_notification_recipients;
drop policy if exists "user_update_form_notification_recipients" on public.form_notification_recipients;
drop policy if exists "user_delete_form_notification_recipients" on public.form_notification_recipients;

create policy "authenticated_select_form_notification_recipients"
  on public.form_notification_recipients
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_insert_form_notification_recipients"
  on public.form_notification_recipients
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_update_form_notification_recipients"
  on public.form_notification_recipients
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_delete_form_notification_recipients"
  on public.form_notification_recipients
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );