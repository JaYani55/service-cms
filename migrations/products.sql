create table public.products (
  id uuid not null default gen_random_uuid (),
  slug character varying(255) not null,
  name character varying(255) not null,
  status character varying(50) not null default 'draft'::character varying,
  is_draft boolean not null default true,
  content jsonb not null,
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone null,
  constraint products_pkey primary key (id),
  constraint products_slug_key unique (slug),
  constraint products_status_check check (
    (
      (status)::text = any (
        array[
          ('draft'::character varying)::text,
          ('published'::character varying)::text,
          ('archived'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_products_published on public.products using btree (is_draft) TABLESPACE pg_default
where
  (is_draft = false);

create trigger set_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION set_current_timestamp_updated_at ();

create trigger trg_sync_is_draft BEFORE INSERT
or
update OF status on products for EACH row
execute FUNCTION sync_is_draft_with_status ();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Note: This table is renamed to `pages` in the pages.sql migration.
-- RLS policies here apply to the original table name before migration.
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.products enable row level security;

drop policy if exists "authenticated_select_products" on public.products;
drop policy if exists "anon_select_products"           on public.products;
drop policy if exists "staff_insert_products"          on public.products;
drop policy if exists "staff_update_products"          on public.products;
drop policy if exists "admin_delete_products"          on public.products;

-- Read: any authenticated user
create policy "authenticated_select_products"
  on public.products
  for select
  to authenticated
  using (true);

create policy "anon_select_products"
  on public.products
  for select
  to anon
  using (true);

-- Insert: staff or super-admin
create policy "staff_insert_products"
  on public.products
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  );

-- Update: staff or super-admin
create policy "staff_update_products"
  on public.products
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  );

-- Delete: super-admin only
create policy "admin_delete_products"
  on public.products
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );