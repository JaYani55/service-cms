create table public.mentorbooking_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  event_id text not null,
  notification_type text not null,
  content jsonb null default '{}'::jsonb,
  is_read boolean null default false,
  is_dismissed boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  archived boolean null default false,
  archived_at timestamp with time zone null,
  "User_E-Mail" character varying null,
  constraint mentorbooking_notifications_pkey primary key (id),
  constraint mentorbooking_notifications_user_id_event_id_notification_t_key unique (user_id, event_id, notification_type),
  constraint mentorbooking_notifications_user_id_fkey1 foreign KEY (user_id) references user_profile (user_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.mentorbooking_notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_event_type on public.mentorbooking_notifications using btree (notification_type, is_dismissed) TABLESPACE pg_default;

create index IF not exists idx_notifications_archived on public.mentorbooking_notifications using btree (archived, created_at) TABLESPACE pg_default;