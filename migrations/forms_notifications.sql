alter table public.forms
  add column if not exists owner_user_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'forms_owner_user_id_fkey'
  ) then
    alter table public.forms
      add constraint forms_owner_user_id_fkey
      foreign key (owner_user_id)
      references auth.users(id)
      on update cascade
      on delete set null;
  end if;
end $$;

create index if not exists idx_forms_owner_user_id on public.forms using btree (owner_user_id) tablespace pg_default;

create table if not exists public.form_notification_settings (
  form_id uuid not null,
  notify_owner boolean not null default false,
  notify_staff boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint form_notification_settings_pkey primary key (form_id),
  constraint form_notification_settings_form_id_fkey foreign key (form_id) references public.forms(id) on delete cascade
) tablespace pg_default;

insert into public.form_notification_settings (form_id)
select id
from public.forms
on conflict (form_id) do nothing;

alter table public.form_notification_settings enable row level security;

drop trigger if exists set_form_notification_settings_updated_at on public.form_notification_settings;
create trigger set_form_notification_settings_updated_at
  before update on public.form_notification_settings
  for each row
  execute function set_current_timestamp_updated_at();

drop policy if exists "authenticated_select_form_notification_settings" on public.form_notification_settings;
drop policy if exists "user_insert_form_notification_settings" on public.form_notification_settings;
drop policy if exists "user_update_form_notification_settings" on public.form_notification_settings;
drop policy if exists "admin_delete_form_notification_settings" on public.form_notification_settings;

create policy "authenticated_select_form_notification_settings"
  on public.form_notification_settings
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_insert_form_notification_settings"
  on public.form_notification_settings
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_update_form_notification_settings"
  on public.form_notification_settings
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "admin_delete_form_notification_settings"
  on public.form_notification_settings
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );

create table if not exists public.form_notification_recipients (
  id uuid not null default gen_random_uuid(),
  form_id uuid not null,
  staff_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint form_notification_recipients_pkey primary key (id),
  constraint form_notification_recipients_form_staff_key unique (form_id, staff_id),
  constraint form_notification_recipients_form_id_fkey foreign key (form_id) references public.forms(id) on delete cascade,
  constraint form_notification_recipients_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete cascade
) tablespace pg_default;

create index if not exists idx_form_notification_recipients_form_id on public.form_notification_recipients using btree (form_id) tablespace pg_default;
create index if not exists idx_form_notification_recipients_staff_id on public.form_notification_recipients using btree (staff_id) tablespace pg_default;

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
