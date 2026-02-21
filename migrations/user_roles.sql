create table public.user_roles (
  user_id uuid not null,
  role_id integer not null,
  dev_description text null,
  constraint user_roles_pkey primary key (user_id, role_id),
  constraint user_roles_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE,
  constraint user_roles_user_id_fkey foreign KEY (user_id) references user_profile (user_id) on delete CASCADE
) TABLESPACE pg_default;