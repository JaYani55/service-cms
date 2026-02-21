create table public.mentor_groups (
  id bigint generated always as identity not null,
  group_name text not null,
  description text null,
  user_in_group jsonb null,
  created_by uuid null,
  constraint mentor_groups_pkey primary key (id)
) TABLESPACE pg_default;