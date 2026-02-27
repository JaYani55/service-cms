-- page_schemas: Schema registry for the dynamic pagebuilder system
-- Must be created BEFORE the pages migration (pages references this table)

create table public.page_schemas (
  id uuid not null default gen_random_uuid(),
  name character varying(255) not null,
  slug character varying(255) not null,
  description text null,
  schema jsonb not null,
  llm_instructions text null,
  registration_code character varying(64) null,
  registration_status character varying(50) not null default 'pending'::character varying,
  frontend_url text null,
  revalidation_endpoint text null,
  revalidation_secret text null,
  slug_structure text not null default '/:slug'::text,
  is_default boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint page_schemas_pkey primary key (id),
  constraint page_schemas_slug_key unique (slug),
  constraint page_schemas_registration_code_key unique (registration_code),
  constraint page_schemas_registration_status_check check (
    (registration_status)::text = any (
      array[
        'pending'::text,
        'waiting'::text,
        'registered'::text,
        'archived'::text
      ]
    )
  )
) tablespace pg_default;

-- Auto-update updated_at on row change
create trigger set_page_schemas_updated_at
  before update on page_schemas
  for each row
  execute function set_current_timestamp_updated_at();

-- Seed: Service-Product schema (mirrors current PageBuilderData)
insert into public.page_schemas (name, slug, description, schema, llm_instructions, registration_status, is_default)
values (
  'Service-Product',
  'service-product',
  'Product landing pages for mentor booking services. Includes hero section, features, cards, FAQ, and CTA.',
  '{
    "hero": {
      "type": "object",
      "description": "Hero section at the top of the page",
      "properties": {
        "title": { "type": "string", "description": "Main headline" },
        "image": { "type": "string", "description": "Hero image URL" },
        "stats": {
          "type": "array",
          "description": "Key statistics displayed in the hero",
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string" },
              "value": { "type": "string" }
            }
          }
        },
        "description": { "type": "ContentBlock[]", "description": "Rich content blocks for hero description" }
      }
    },
    "cta": {
      "type": "object",
      "description": "Call-to-action section",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "primaryButton": { "type": "string", "description": "Button label text" }
      }
    },
    "cards": {
      "type": "array",
      "description": "Feature/info cards grid",
      "items": {
        "type": "object",
        "properties": {
          "icon": { "type": "string", "description": "Lucide icon name" },
          "color": { "type": "string", "description": "CSS color value" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "items": { "type": "string[]", "description": "Bullet point items" },
          "content": { "type": "ContentBlock[]", "description": "Rich content blocks" }
        }
      }
    },
    "features": {
      "type": "array",
      "description": "Feature sections with alternating layout",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "ContentBlock[]" },
          "reverse": { "type": "boolean", "description": "Reverse layout direction" },
          "alignment": { "type": "string", "enum": ["left", "center", "right"] }
        }
      }
    },
    "faq": {
      "type": "array",
      "description": "Frequently asked questions",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "answer": { "type": "ContentBlock[]" }
        }
      }
    },
    "subtitle": { "type": "string", "description": "Page subtitle or tagline" },
    "trainer-module": { "type": "boolean", "description": "Enable trainer module integration" }
  }'::jsonb,
  'Build a product landing page template. The page should render a hero section with title, image, stats, and rich text description. Below the hero, render feature sections with alternating layouts. Then a cards grid, FAQ accordion, and a call-to-action section. Use the ContentBlock[] type for rich content: each block has an id, type, and type-specific fields. Supported block types: text (content), heading (content, level), image (src, alt, caption, width, height), quote (text, author, source), list (style, items), video (src, provider, caption).',
  'pending',
  true
);

-- Seed: Blog schema (mirrors Service-Product structure, re-labeled for blogs)
insert into public.page_schemas (name, slug, description, schema, llm_instructions, registration_status, is_default)
values (
  'Blog',
  'blog',
  'Blog post pages. Same content block system as Service-Product but structured for long-form articles with header, content sections, highlights, FAQ, and CTA.',
  '{
    "hero": {
      "type": "object",
      "description": "Blog post header with title, featured image, and introduction",
      "properties": {
        "title": { "type": "string", "description": "Blog post title / headline" },
        "image": { "type": "string", "description": "Featured image URL" },
        "stats": {
          "type": "array",
          "description": "Post metadata (e.g. reading time, date, author)",
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string" },
              "value": { "type": "string" }
            }
          }
        },
        "description": { "type": "ContentBlock[]", "description": "Introduction / lead paragraph" }
      }
    },
    "cta": {
      "type": "object",
      "description": "Call-to-action at the end of the post",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "primaryButton": { "type": "string" }
      }
    },
    "cards": {
      "type": "array",
      "description": "Key takeaways or highlight cards",
      "items": {
        "type": "object",
        "properties": {
          "icon": { "type": "string", "description": "Lucide icon name" },
          "color": { "type": "string", "description": "CSS color value" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "items": { "type": "string[]" },
          "content": { "type": "ContentBlock[]" }
        }
      }
    },
    "features": {
      "type": "array",
      "description": "Content sections / article body sections",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "description": "Section heading" },
          "description": { "type": "ContentBlock[]", "description": "Section body content" },
          "reverse": { "type": "boolean" },
          "alignment": { "type": "string", "enum": ["left", "center", "right"] }
        }
      }
    },
    "faq": {
      "type": "array",
      "description": "Frequently asked questions related to the post",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "answer": { "type": "ContentBlock[]" }
        }
      }
    },
    "subtitle": { "type": "string", "description": "Post subtitle or excerpt" },
    "trainer-module": { "type": "boolean", "description": "Enable trainer module integration" }
  }'::jsonb,
  'Build a blog post template. The page should render a header section with title, featured image, metadata stats (reading time, date, author), and an introduction. Below, render content sections as the article body with rich text blocks. Then key takeaway cards, an optional FAQ accordion, and a call-to-action. Use the same ContentBlock[] system: text, heading, image, quote, list, video blocks.',
  'pending',
  true
);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Uses custom JWT claims from access hook: (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles'
-- Read: all authenticated users.  Write: staff / super-admin only.
-- DROP IF EXISTS makes this section safe to re-run (idempotent).

alter table public.page_schemas enable row level security;

drop policy if exists "authenticated_select_page_schemas" on public.page_schemas;
drop policy if exists "anon_select_page_schemas"           on public.page_schemas;
drop policy if exists "staff_insert_page_schemas"          on public.page_schemas;
drop policy if exists "anon_insert_page_schemas"           on public.page_schemas;
drop policy if exists "staff_update_page_schemas"          on public.page_schemas;
drop policy if exists "anon_update_page_schemas"           on public.page_schemas;
drop policy if exists "admin_delete_page_schemas"          on public.page_schemas;

-- Read: any authenticated user
create policy "authenticated_select_page_schemas"
  on public.page_schemas
  for select
  to authenticated
  using (true);

-- Anon read (API uses anon key for public spec endpoints)
create policy "anon_select_page_schemas"
  on public.page_schemas
  for select
  to anon
  using (true);

-- Insert: staff or super-admin (via JWT custom claims)
create policy "staff_insert_page_schemas"
  on public.page_schemas
  for insert
  to authenticated
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  );

-- Anon insert (API writes via anon key — registration flow)
create policy "anon_insert_page_schemas"
  on public.page_schemas
  for insert
  to anon
  with check (true);

-- Update: staff or super-admin
create policy "staff_update_page_schemas"
  on public.page_schemas
  for update
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  )
  with check (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['staff', 'super-admin']
  );

-- Anon update (API writes via anon key — registration flow)
create policy "anon_update_page_schemas"
  on public.page_schemas
  for update
  to anon
  using (true)
  with check (true);

-- Delete: super-admin only
create policy "admin_delete_page_schemas"
  on public.page_schemas
  for delete
  to authenticated
  using (
    (current_setting('request.jwt.claims', true))::jsonb -> 'user_roles' ?| array['super-admin']
  );
