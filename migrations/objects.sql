-- objects: Arbitrarily-definable JSONB data objects with a schema definition
-- Each row is a named, schema-validated data object (e.g. "Service Prices", "FAQ Items")
-- Schema field types are a simplified set: string, number, boolean, array, object, url, email, date, price
-- Access is controlled per-object: api_enabled + requires_auth (same pattern as forms)

create table public.objects (
  id uuid not null default gen_random_uuid(),
  name character varying(255) not null,
  slug character varying(255) not null,
  description text null,
  schema jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  status character varying(50) not null default 'published'::character varying,
  requires_auth boolean not null default false,
  api_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint objects_pkey primary key (id),
  constraint objects_slug_key unique (slug),
  constraint objects_status_check check (
    (status)::text = any (
      array[
        'published'::text,
        'archived'::text
      ]
    )
  )
) tablespace pg_default;

create index idx_objects_status on public.objects using btree (status) tablespace pg_default;
create index idx_objects_slug on public.objects using btree (slug) tablespace pg_default;

create trigger set_objects_updated_at
  before update on public.objects
  for each row
  execute function set_current_timestamp_updated_at();

alter table public.objects enable row level security;

-- Only admin and super-admin can see all objects in the CMS
drop policy if exists "admin_select_objects" on public.objects;
drop policy if exists "anon_select_objects" on public.objects;
drop policy if exists "admin_insert_objects" on public.objects;
drop policy if exists "admin_update_objects" on public.objects;
drop policy if exists "admin_delete_objects" on public.objects;

create policy "admin_select_objects"
  on public.objects
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );

-- Public anon read: only when api_enabled=true, requires_auth=false, status=published
create policy "anon_select_objects"
  on public.objects
  for select
  to anon
  using (
    (status)::text = 'published'::text
    and requires_auth = false
    and api_enabled = true
  );

create policy "admin_insert_objects"
  on public.objects
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );

create policy "admin_update_objects"
  on public.objects
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );

create policy "admin_delete_objects"
  on public.objects
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );
