create table public.user_roles (
  user_id uuid not null,
  role_id integer not null,
  dev_description text null,
  constraint user_roles_pkey primary key (user_id, role_id),
  constraint user_roles_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE,
  constraint user_roles_user_id_fkey foreign KEY (user_id) references user_profile (user_id) on delete CASCADE
) TABLESPACE pg_default;

-- ─── Row Level Security ──────────────────────────────────────────────
-- Read: any authenticated user (needed for permission checks).
-- Write: super-admin only (role assignment is privileged).
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.user_roles enable row level security;

drop policy if exists "authenticated_select_user_roles" on public.user_roles;
drop policy if exists "admin_insert_user_roles"          on public.user_roles;
drop policy if exists "admin_delete_user_roles"          on public.user_roles;

create policy "authenticated_select_user_roles"
  on public.user_roles
  for select
  to authenticated
  using (true);

create policy "admin_insert_user_roles"
  on public.user_roles
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

create policy "admin_delete_user_roles"
  on public.user_roles
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );