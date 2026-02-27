create table public.roles (
  id serial not null,
  name text not null,
  description text null,
  app app_enum[] null,
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_name_check check ((name <> ''::text))
) TABLESPACE pg_default;

-- ─── Row Level Security ──────────────────────────────────────────────
-- Read: any authenticated user (roles list is not secret).
-- Write: super-admin only (role CRUD is a privileged operation).
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.roles enable row level security;

drop policy if exists "authenticated_select_roles" on public.roles;
drop policy if exists "admin_insert_roles"          on public.roles;
drop policy if exists "admin_update_roles"          on public.roles;
drop policy if exists "admin_delete_roles"          on public.roles;

create policy "authenticated_select_roles"
  on public.roles
  for select
  to authenticated
  using (true);

create policy "admin_insert_roles"
  on public.roles
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

create policy "admin_update_roles"
  on public.roles
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

create policy "admin_delete_roles"
  on public.roles
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );