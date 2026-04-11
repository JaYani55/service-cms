create table public.llm_specs (
  id uuid not null default gen_random_uuid(),
  slug character varying(255) not null,
  name character varying(255) not null,
  description text null,
  definition jsonb not null default '{}'::jsonb,
  llm_instructions text null,
  status character varying(50) not null default 'draft'::character varying,
  is_public boolean not null default false,
  is_main_template boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint llm_specs_pkey primary key (id),
  constraint llm_specs_slug_key unique (slug),
  constraint llm_specs_status_check check (
    (status)::text = any (
      array[
        'draft'::text,
        'published'::text,
        'archived'::text
      ]
    )
  ),
  constraint llm_specs_tags_is_array_check check (jsonb_typeof(tags) = 'array'),
  constraint llm_specs_metadata_is_object_check check (jsonb_typeof(metadata) = 'object')
) tablespace pg_default;

create index idx_llm_specs_status on public.llm_specs using btree (status) tablespace pg_default;
create index idx_llm_specs_is_public on public.llm_specs using btree (is_public) tablespace pg_default;
create index idx_llm_specs_created_by on public.llm_specs using btree (created_by) tablespace pg_default;

create trigger set_llm_specs_updated_at
  before update on public.llm_specs
  for each row
  execute function set_current_timestamp_updated_at();

alter table public.llm_specs enable row level security;

drop policy if exists "authenticated_select_llm_specs" on public.llm_specs;
drop policy if exists "anon_select_llm_specs" on public.llm_specs;
drop policy if exists "authenticated_insert_llm_specs" on public.llm_specs;
drop policy if exists "authenticated_update_llm_specs" on public.llm_specs;
drop policy if exists "admin_delete_llm_specs" on public.llm_specs;

create policy "authenticated_select_llm_specs"
  on public.llm_specs
  for select
  to authenticated
  using (true);

create policy "anon_select_llm_specs"
  on public.llm_specs
  for select
  to anon
  using (
    (status)::text = 'published'::text
    and is_public = true
  );

create policy "authenticated_insert_llm_specs"
  on public.llm_specs
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "authenticated_update_llm_specs"
  on public.llm_specs
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "admin_delete_llm_specs"
  on public.llm_specs
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );