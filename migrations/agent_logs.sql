-- agent_logs: Stores all agent ↔ API communication logs for the pagebuilder system
-- Tracks requests and responses to/from the schema API and MCP endpoints

create table public.agent_logs (
  id uuid not null default gen_random_uuid(),
  schema_id uuid null references public.page_schemas(id) on delete set null,
  schema_slug character varying(255) null,
  method character varying(10) not null,
  path text not null,
  status_code integer null,
  request_body jsonb null,
  response_body jsonb null,
  duration_ms integer null,
  ip_address character varying(45) null,
  user_agent text null,
  error text null,
  created_at timestamp with time zone not null default now(),

  constraint agent_logs_pkey primary key (id)
) tablespace pg_default;

-- Index for fast querying by schema and time
create index idx_agent_logs_schema_id on public.agent_logs (schema_id);
create index idx_agent_logs_created_at on public.agent_logs (created_at desc);
create index idx_agent_logs_schema_slug on public.agent_logs (schema_slug);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Backend API uses anon key for INSERT (logging). Authenticated staff can read/delete.
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.agent_logs enable row level security;

drop policy if exists "staff_select_agent_logs"  on public.agent_logs;
drop policy if exists "anon_select_agent_logs"   on public.agent_logs;
drop policy if exists "anon_insert_agent_logs"   on public.agent_logs;
drop policy if exists "admin_delete_agent_logs"  on public.agent_logs;
drop policy if exists "anon_delete_agent_logs"   on public.agent_logs;

-- Read: staff or super-admin can view logs
create policy "staff_select_agent_logs"
  on public.agent_logs
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  );

-- Anon read (API logs endpoint uses anon key)
create policy "anon_select_agent_logs"
  on public.agent_logs
  for select
  to anon
  using (true);

-- Insert: anon (API logging middleware writes via anon key)
create policy "anon_insert_agent_logs"
  on public.agent_logs
  for insert
  to anon
  with check (true);

-- Delete: super-admin only can clear logs
create policy "admin_delete_agent_logs"
  on public.agent_logs
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );

-- Anon delete (API cleanup endpoint)
create policy "anon_delete_agent_logs"
  on public.agent_logs
  for delete
  to anon
  using (true);

-- Comment
comment on table public.agent_logs is 'Logs of agent/frontend communication with the CMS API (schema discovery, registration, MCP calls, revalidation).';
