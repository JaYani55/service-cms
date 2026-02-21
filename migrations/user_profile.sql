create table public.user_profile (
  user_id uuid not null,
  created_at timestamp without time zone null default now(),
  "Username" text null,
  api_key text null,
  pfp_url text null,
  selected_animal_icon text null,
  "SmartSync_Key" text null,
  "SmartSync_Active" boolean null default false,
  constraint user_profile_pkey primary key (user_id),
  constraint user_profile_username_key unique ("Username"),
  constraint user_profile_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;