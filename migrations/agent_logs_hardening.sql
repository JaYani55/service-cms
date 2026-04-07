-- agent_logs_hardening: remove anonymous read/delete access to operational logs
-- Existing deployments should run this migration after agent_logs.sql.

alter table public.agent_logs enable row level security;

drop policy if exists "anon_select_agent_logs" on public.agent_logs;
drop policy if exists "anon_delete_agent_logs" on public.agent_logs;

drop policy if exists "staff_select_agent_logs" on public.agent_logs;
create policy "super_admin_select_agent_logs"
  on public.agent_logs
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ? 'super-admin'
  );

drop policy if exists "admin_delete_agent_logs" on public.agent_logs;
create policy "super_admin_delete_agent_logs"
  on public.agent_logs
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ? 'super-admin'
  );

comment on table public.agent_logs is 'Operational logs for API and MCP requests. Anonymous read/delete access removed by agent_logs_hardening.sql.';