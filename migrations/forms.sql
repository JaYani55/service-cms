create table public.forms (
  id uuid not null default gen_random_uuid(),
  name character varying(255) not null,
  slug character varying(255) not null,
  description text null,
  schema jsonb not null default '{}'::jsonb,
  llm_instructions text null,
  status character varying(50) not null default 'published'::character varying,
  share_enabled boolean not null default false,
  share_slug character varying(255) null,
  requires_auth boolean not null default false,
  api_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone null,
  constraint forms_pkey primary key (id),
  constraint forms_slug_key unique (slug),
  constraint forms_share_slug_key unique (share_slug),
  constraint forms_status_check check (
    (status)::text = any (
      array[
        'published'::text,
        'archived'::text
      ]
    )
  ),
  constraint forms_share_slug_required_check check (
    (share_enabled = false)
    or (
      share_slug is not null
      and btrim((share_slug)::text) <> ''::text
    )
  )
) tablespace pg_default;

create index idx_forms_status on public.forms using btree (status) tablespace pg_default;

create index idx_forms_share_slug
  on public.forms using btree (share_slug) tablespace pg_default
  where share_slug is not null;

create trigger set_forms_updated_at
  before update on public.forms
  for each row
  execute function set_current_timestamp_updated_at();

alter table public.forms enable row level security;

drop policy if exists "authenticated_select_forms" on public.forms;
drop policy if exists "anon_select_forms" on public.forms;
drop policy if exists "user_insert_forms" on public.forms;
drop policy if exists "user_update_forms" on public.forms;
drop policy if exists "admin_delete_forms" on public.forms;

create policy "authenticated_select_forms"
  on public.forms
  for select
  to authenticated
  using (true);

create policy "anon_select_forms"
  on public.forms
  for select
  to anon
  using (
    (status)::text = 'published'::text
    and requires_auth = false
    and (share_enabled = true or api_enabled = true)
  );

create policy "user_insert_forms"
  on public.forms
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "user_update_forms"
  on public.forms
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "admin_delete_forms"
  on public.forms
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );