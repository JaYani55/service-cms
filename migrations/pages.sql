-- Migration: Rename products → pages and add schema support
-- Run AFTER page_schemas.sql migration

-- 1. Rename the table
alter table public.products rename to pages;

-- 2. Rename constraints
alter table public.pages rename constraint products_pkey to pages_pkey;
alter table public.pages rename constraint products_slug_key to pages_slug_key;
alter table public.pages rename constraint products_status_check to pages_status_check;

-- 3. Rename index
alter index idx_products_published rename to idx_pages_published;

-- 4. Add new columns
alter table public.pages
  add column schema_id uuid null references public.page_schemas(id) on update cascade on delete set null,
  add column domain_url text null;

-- 5. Update the FK on mentorbooking_products to reference the renamed table
-- (PostgreSQL automatically tracks the table rename for existing FKs,
--  but we rename the constraint for clarity)
alter table public.mentorbooking_products
  rename constraint mentorbooking_products_product_page_id_fkey to mentorbooking_products_page_id_fkey;

-- 6. Create index for schema lookups
create index idx_pages_schema_id on public.pages using btree (schema_id) tablespace pg_default;

-- 7. Backfill existing pages: assign them the Service-Product schema
update public.pages
  set schema_id = (select id from public.page_schemas where slug = 'service-product' limit 1)
  where schema_id is null;
