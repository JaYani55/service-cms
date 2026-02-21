create table public.roles (
  id serial not null,
  name text not null,
  description text null,
  app app_enum[] null,
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_name_check check ((name <> ''::text))
) TABLESPACE pg_default;