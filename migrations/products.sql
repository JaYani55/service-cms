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