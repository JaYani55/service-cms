create table public.mentorbooking_products (
  id serial not null,
  description_effort text not null,
  description_de text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  icon_name text null default 'balloon'::text,
  assigned_groups bigint[] null,
  salary_type text null,
  salary numeric null,
  min_amount_mentors integer null,
  max_amount_mentors integer null,
  approved jsonb null,
  gradient text null,
  is_mentor_product boolean null default false,
  product_page_id uuid null,
  constraint mentorbooking_pillars_pkey primary key (id),
  constraint mentorbooking_products_product_page_id_fkey foreign KEY (product_page_id) references products (id) on update CASCADE on delete CASCADE,
  constraint mentorbooking_pillars_salary_type_check check (
    (
      salary_type = any (
        array[
          'Standard'::text,
          'Fixpreis'::text,
          'Stundensatz'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists mentorbooking_pillars_name_idx on public.mentorbooking_products using btree (name) TABLESPACE pg_default;