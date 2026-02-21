create table public.employers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  user_id uuid null,
  logo_url text null,
  fh boolean null default false,
  created_by uuid null,
  alt_name text null,
  jobscount integer null default 0,
  jobs_limit_bool boolean null default false,
  jobs_limit integer null,
  jobscount_online integer null default 0,
  smartsync_enabled boolean not null default false,
  "Provisionsvereinbarung" boolean null default false,
  constraint employers_pkey primary key (id),
  constraint fk_employers_created_by foreign KEY (created_by) references auth.users (id),
  constraint fk_employers_user foreign KEY (user_id) references user_profile (user_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_employers_created_by on public.employers using btree (created_by) TABLESPACE pg_default;