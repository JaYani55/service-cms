create table public.user_profile (
  user_id uuid not null,
  created_at timestamp without time zone null default now(),
  "Username" text null,
  api_key text null,
  pfp_url text null,
  selected_animal_icon text null,
  "SmartSync_Key" text null,
  "SmartSync_Active" boolean null default false,
  constraint user_profile_pkey primary key (user_id),
  constraint user_profile_username_key unique ("Username"),
  constraint user_profile_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- ─── Row Level Security ──────────────────────────────────────────────
-- Read: any authenticated user (needed for user lists, profile display).
-- Users can update their own profile. Super-admin can update/create/delete any.
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.user_profile enable row level security;

drop policy if exists "authenticated_select_user_profile" on public.user_profile;
drop policy if exists "self_update_user_profile"           on public.user_profile;
drop policy if exists "admin_update_user_profile"          on public.user_profile;
drop policy if exists "admin_insert_user_profile"          on public.user_profile;
drop policy if exists "admin_delete_user_profile"          on public.user_profile;

create policy "authenticated_select_user_profile"
  on public.user_profile
  for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "self_update_user_profile"
  on public.user_profile
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Super-admin can update any profile
create policy "admin_update_user_profile"
  on public.user_profile
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

-- Super-admin can insert profiles (account creation)
create policy "admin_insert_user_profile"
  on public.user_profile
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

-- Super-admin can delete profiles
create policy "admin_delete_user_profile"
  on public.user_profile
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );