create table public.forms_answers (
  id uuid not null default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on update cascade on delete cascade,
  submitted_by uuid null references auth.users(id) on update cascade on delete set null,
  answers jsonb not null default '{}'::jsonb,
  source_slug text null,
  submitted_via character varying(50) not null default 'share'::character varying,
  ip_address text null,
  user_agent text null,
  created_at timestamp with time zone not null default now(),
  constraint forms_answers_pkey primary key (id),
  constraint forms_answers_submitted_via_check check (
    (submitted_via)::text = any (
      array['share'::text, 'api'::text, 'page'::text]
    )
  )
) tablespace pg_default;

create index idx_forms_answers_form_id_created_at
  on public.forms_answers using btree (form_id, created_at desc) tablespace pg_default;

create index idx_forms_answers_source_slug
  on public.forms_answers using btree (source_slug) tablespace pg_default;

alter table public.forms_answers enable row level security;

drop policy if exists "user_select_forms_answers" on public.forms_answers;
drop policy if exists "anon_insert_forms_answers" on public.forms_answers;
drop policy if exists "authenticated_insert_forms_answers" on public.forms_answers;
drop policy if exists "admin_delete_forms_answers" on public.forms_answers;

create policy "user_select_forms_answers"
  on public.forms_answers
  for select
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['user', 'staff', 'admin', 'super-admin']
  );

create policy "anon_insert_forms_answers"
  on public.forms_answers
  for insert
  to anon
  with check (
    submitted_by is null
    and exists (
      select 1
      from public.forms
      where forms.id = forms_answers.form_id
        and (forms.status)::text = 'published'::text
        and forms.requires_auth = false
        and (forms.share_enabled = true or forms.api_enabled = true)
    )
  );

create policy "authenticated_insert_forms_answers"
  on public.forms_answers
  for insert
  to authenticated
  with check (
    (submitted_by is null or submitted_by = auth.uid())
    and exists (
      select 1
      from public.forms
      where forms.id = forms_answers.form_id
        and (forms.status)::text = 'published'::text
        and (forms.share_enabled = true or forms.api_enabled = true)
    )
  );

create policy "admin_delete_forms_answers"
  on public.forms_answers
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );