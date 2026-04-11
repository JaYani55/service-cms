create table public.page_schema_specs (
  id uuid not null default gen_random_uuid(),
  schema_id uuid not null references public.page_schemas(id) on delete cascade,
  spec_id uuid not null references public.llm_specs(id) on delete cascade,
  enabled boolean not null default true,
  is_main boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint page_schema_specs_pkey primary key (id),
  constraint page_schema_specs_schema_id_spec_id_key unique (schema_id, spec_id)
) tablespace pg_default;

create index idx_page_schema_specs_schema_id on public.page_schema_specs using btree (schema_id) tablespace pg_default;
create index idx_page_schema_specs_spec_id on public.page_schema_specs using btree (spec_id) tablespace pg_default;
create unique index idx_page_schema_specs_main_per_schema
  on public.page_schema_specs using btree (schema_id)
  where (is_main = true and enabled = true);

create trigger set_page_schema_specs_updated_at
  before update on public.page_schema_specs
  for each row
  execute function set_current_timestamp_updated_at();

alter table public.page_schema_specs enable row level security;

drop policy if exists "authenticated_select_page_schema_specs" on public.page_schema_specs;
drop policy if exists "anon_select_page_schema_specs" on public.page_schema_specs;
drop policy if exists "authenticated_insert_page_schema_specs" on public.page_schema_specs;
drop policy if exists "authenticated_update_page_schema_specs" on public.page_schema_specs;
drop policy if exists "admin_delete_page_schema_specs" on public.page_schema_specs;

create policy "authenticated_select_page_schema_specs"
  on public.page_schema_specs
  for select
  to authenticated
  using (true);

create policy "anon_select_page_schema_specs"
  on public.page_schema_specs
  for select
  to anon
  using (
    enabled = true
    and exists (
      select 1
      from public.llm_specs specs
      where specs.id = page_schema_specs.spec_id
        and specs.status = 'published'
        and specs.is_public = true
    )
    and exists (
      select 1
      from public.page_schemas schemas
      where schemas.id = page_schema_specs.schema_id
        and schemas.registration_status = 'registered'
    )
  );

create policy "authenticated_insert_page_schema_specs"
  on public.page_schema_specs
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "authenticated_update_page_schema_specs"
  on public.page_schema_specs
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "admin_delete_page_schema_specs"
  on public.page_schema_specs
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['admin', 'super-admin']
  );