update public.forms
set status = 'published',
    published_at = coalesce(published_at, now())
where status = 'draft';

alter table public.forms
  alter column status set default 'published'::character varying;

alter table public.forms
  drop constraint if exists forms_status_check;

alter table public.forms
  add constraint forms_status_check check (
    (status)::text = any (
      array[
        'published'::text,
        'archived'::text
      ]
    )
  );