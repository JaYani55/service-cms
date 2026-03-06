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
      "meta_description": "The topmost visible section of the product page. Sets the visual and editorial tone. Contains the primary headline, featured image, introductory content, and metadata (stats). This is the most important block for first impressions and SEO — LLM agents should prioritise accuracy, clarity, and keyword relevance here.",
      "properties": {
        "title": { 
          "type": "string", 
          "description": "Main headline",
          "meta_description": "Primary H1 headline of the product page. Should be compelling, keyword-rich, and under 70 characters for SEO. This is the most prominent text on the page. LLM agents should ensure it matches the products core value proposition." 
        },
        "image": { 
          "type": "media", 
          "description": "Hero image",
          "meta_description": "Hero image for the product page. Should be a high-resolution, context-relevant photograph or illustration. Used as the Open Graph image for social sharing. Recommended aspect ratio: 16:9. Selected via the built-in media picker." 
        },
        "stats": {
          "type": "array",
          "description": "Key statistics displayed in the hero",
          "meta_description": "Product metadata displayed as small label/value pairs near the hero title. Typically used for reading time, pricing, requirements, or category. Rendered as a visual metadata strip.",
          "items": {
            "type": "object",
            "properties": {
              "label": { 
                "type": "string",
                "meta_description": "Descriptor for the stat. Short and readable. Examples: \"Duration\", \"Price\", \"Level\", \"Mentor\"." 
              },
              "value": { 
                "type": "string",
                "meta_description": "The displayed value for the stat. Examples: \"60 min\", \"Free\", \"Advanced\", \"Jay Rathjen\"." 
              }
            }
          }
        },
        "description": { 
          "type": "ContentBlock[]", 
          "description": "Rich content blocks for hero description",
          "meta_description": "Introductory lead content displayed beneath the hero title. Sets up the product value and should hook the reader within the first two sentences." 
        }
      }
    },
    "cta": {
      "type": "object",
      "description": "Call-to-action section",
      "meta_description": "Call-to-action section rendered at the bottom of the page. Intended to convert readers — e.g. \"Book a consultation\", \"Get started\". The primaryButton text should be short and action-oriented.",
      "properties": {
        "title": { 
          "type": "string",
          "meta_description": "Headline of the CTA block. Should create urgency or clearly state the benefit." 
        },
        "description": { 
          "type": "string",
          "meta_description": "Supporting copy beneath the CTA title. One to two sentences. Reinforces the value proposition and encourages the reader to click the button." 
        },
        "primaryButton": { 
          "type": "string", 
          "description": "Button label text",
          "meta_description": "Label text for the primary action button. Should be a short imperative verb phrase. Examples: \"Book now\", \"Get in touch\". Avoid generic labels like \"Click here\"." 
        }
      }
    },
    "cards": {
      "type": "array",
      "description": "Feature/info cards grid",
      "meta_description": "A grid of highlight cards summarising key takeaways, tips, or concept definitions. Visually prominent — suitable for skimmers. Each card maps to a discrete idea.",
      "items": {
        "type": "object",
        "properties": {
          "icon": { 
            "type": "string", 
            "description": "Lucide icon name",
            "meta_description": "Lucide icon name rendered as a visual accent on the card. Should semantically match the card topic." 
          },
          "color": { 
            "type": "string", 
            "description": "CSS color value",
            "meta_description": "CSS color value applied to the cards accent or icon. Used for visual differentiation across cards." 
          },
          "title": { 
            "type": "string",
            "meta_description": "Short heading for the card. 2–6 words. Should name the concept or takeaway directly." 
          },
          "description": { 
            "type": "string",
            "meta_description": "Plain-text summary of the card content. Should be a single sentence." 
          },
          "items": { 
            "type": "string[]", 
            "description": "Bullet point items",
            "meta_description": "Optional bullet list of sub-points or action items within the card. Use when the card concept benefits from enumeration." 
          },
          "content": { 
            "type": "ContentBlock[]", 
            "description": "Rich content blocks",
            "meta_description": "Rich content body of the card. Typically a short text block (1–3 sentences). May include a quote or image for emphasis." 
          }
        }
      }
    },
    "features": {
      "type": "array",
      "description": "Feature sections with alternating layout",
      "meta_description": "Structured product sections rendered as alternating content rows (text + optional visual). Each feature maps to a major functionality or benefit.",
      "items": {
        "type": "object",
        "properties": {
          "title": { 
            "type": "string",
            "meta_description": "Section heading rendered as an H2 or H3. Defines the topic of this content section." 
          },
          "description": { 
            "type": "ContentBlock[]",
            "meta_description": "The body content of this section. A sequence of ContentBlocks forming one coherent argument or explanation." 
          },
          "reverse": { 
            "type": "boolean", 
            "description": "Reverse layout direction",
            "meta_description": "Layout toggle. When true, the content and any associated visual are rendered in reverse order (visual left, text right)." 
          },
          "alignment": { 
            "type": "string", 
            "enum": ["left", "center", "right"],
            "meta_description": "Horizontal alignment of the section content. \"left\" is the default." 
          }
        }
      }
    },
    "faq": {
      "type": "array",
      "description": "Frequently asked questions",
      "meta_description": "A list of frequently asked questions relevant to the product. Intended to address reader objections, clarify concepts, and improve SEO.",
      "items": {
        "type": "object",
        "properties": {
          "question": { 
            "type": "string",
            "meta_description": "The FAQ question as a reader would naturally ask it." 
          },
          "answer": { 
            "type": "ContentBlock[]",
            "meta_description": "Rich content answer to the FAQ question. May contain text, lists, quotes, or images. Answers should be concise (2–5 sentences) but complete." 
          }
        }
      }
    },
    "subtitle": { 
      "type": "string", 
      "description": "Page subtitle or tagline",
      "meta_description": "Product subtitle or excerpt. Displayed beneath the main title in the hero or on listing pages. Also used as the HTML meta description." 
    },
    "trainer-module": { 
      "type": "boolean", 
      "description": "Enable trainer module integration",
      "meta_description": "Logic toggle to enable/disable technical trainer-specific integrations on the frontend." 
    }
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
    "author": {
      "type": "object",
      "meta_description": "Author attribution block for the blog post. Displayed in the byline and optionally in a dedicated author bio section. Used for editorial credibility and structured data (schema.org/Person). LLM agents should not fabricate author data — this must reflect a real person associated with the post.",
      "properties": {
        "author-name": {
          "type": "string",
          "meta_description": "Full display name of the post author. Used in byline, author schema markup, and any author bio component. Example: \"Dr. Anna Müller\" or \"Max Becker\"."
        },
        "author-picture": {
          "type": "media",
          "description": "Author profile photo",
          "meta_description": "Profile photo of the post author. Should be a square or portrait crop, preferably 200×200px or larger. Used in byline avatar and author bio card. Selected via the built-in media picker."
        }
      }
    },
    "hero": {
      "type": "object",
      "description": "Blog post header with title, featured image, and introduction",
      "meta_description": "The topmost visible section of the blog post. Sets the visual and editorial tone. Contains the primary headline, featured image, introductory content, and metadata (stats). This is the most important block for first impressions and SEO — LLM agents should prioritise accuracy, clarity, and keyword relevance here.",
      "properties": {
        "title": { 
          "type": "string", 
          "description": "Blog post title / headline",
          "meta_description": "Primary H1 headline of the blog post. Should be compelling, keyword-rich, and under 70 characters for SEO. This is the most prominent text on the page. LLM agents should ensure it matches the posts core topic and intended search query." 
        },
        "image": { 
          "type": "media", 
          "description": "Featured hero image",
          "meta_description": "Hero image for the blog post. Should be a high-resolution, topic-relevant photograph or illustration. Used as the Open Graph image for social sharing. Recommended aspect ratio: 16:9. Selected via the built-in media picker." 
        },
        "stats": {
          "type": "array",
          "description": "Post metadata (e.g. reading time, date, author)",
          "meta_description": "Post metadata displayed as small label/value pairs near the hero title. Typically used for reading time, publication date, author name, or category. Rendered as a visual metadata strip. LLM agents should derive these values from post content where possible.",
          "items": {
            "type": "object",
            "properties": {
              "label": { 
                "type": "string",
                "meta_description": "Descriptor for the stat. Short and readable. Examples: \"Reading time\", \"Published\", \"Category\", \"Author\"." 
              },
              "value": { 
                "type": "string",
                "meta_description": "The displayed value for the stat. Examples: \"5 min\", \"March 2026\", \"Product Design\", \"Jane Doe\"." 
              }
            }
          }
        },
        "description": { 
          "type": "ContentBlock[]", 
          "description": "Introduction / lead paragraph",
          "meta_description": "Introductory lead content displayed beneath the hero title. Sets up the post argument and should hook the reader within the first two sentences. Typically a short paragraph or text block. Feeds into meta description for SEO if no explicit excerpt is set." 
        }
      }
    },
    "Content": {
      "type": "ContentBlock[]",
      "required": true,
      "meta_description": "The primary body content of the blog post. This is the main editorial field — required for all posts. Contains an ordered sequence of ContentBlocks (text, headings, images, quotes, lists, videos). LLM agents should structure this as a coherent long-form article: introduction → main argument → supporting evidence → conclusion. Heading blocks define the document outline and anchor navigation."
    },
    "cta": {
      "type": "object",
      "description": "Call-to-action at the end of the post",
      "meta_description": "Call-to-action section rendered at the bottom of the post. Intended to convert readers — e.g. \"Book a consultation\", \"Download the guide\". The primaryButton text should be short and action-oriented. LLM agents should populate this based on the post topic and target audience.",
      "properties": {
        "title": { 
          "type": "string",
          "meta_description": "Headline of the CTA block. Should create urgency or clearly state the benefit. Example: \"Ready to get started?\" or \"Want to learn more?\"" 
        },
        "description": { 
          "type": "string",
          "meta_description": "Supporting copy beneath the CTA title. One to two sentences. Reinforces the value proposition and encourages the reader to click the button." 
        },
        "primaryButton": { 
          "type": "string",
          "meta_description": "Label text for the primary action button. Should be a short imperative verb phrase. Examples: \"Book now\", \"Get in touch\", \"Download free guide\". Avoid generic labels like \"Click here\"." 
        }
      }
    },
    "cards": {
      "type": "array",
      "description": "Key takeaways or highlight cards",
      "meta_description": "A grid of highlight cards summarising key takeaways, tips, or concept definitions from the post. Visually prominent — suitable for skimmers. Each card maps to a discrete idea. LLM agents should extract the 3–6 most actionable or memorable points from the post content.",
      "items": {
        "type": "object",
        "properties": {
          "icon": { 
            "type": "string", 
            "description": "Lucide icon name",
            "meta_description": "Lucide icon name rendered as a visual accent on the card. Should semantically match the card topic. Examples: \"lightbulb\" for ideas, \"clock\" for time-related points, \"shield\" for security. Full list at lucide.dev." 
          },
          "color": { 
            "type": "string", 
            "description": "CSS color value",
            "meta_description": "CSS color value applied to the cards accent or icon. Used for visual differentiation across cards. Should align with the brand palette or signal category/sentiment. Examples: \"#3B82F6\" (blue, informational), \"#10B981\" (green, positive)." 
          },
          "title": { 
            "type": "string",
            "meta_description": "Short heading for the card. 2–6 words. Should name the concept or takeaway directly. Avoid full sentences — this is a label, not a pitch." 
          },
          "description": { 
            "type": "string",
            "meta_description": "Plain-text summary of the card content. Used as a fallback or subtitle if the full ContentBlock[] body is not rendered. Should be a single sentence." 
          },
          "items": { 
            "type": "string[]",
            "meta_description": "Optional bullet list of sub-points or action items within the card. Use when the card concept benefits from enumeration. Keep each item to one line." 
          },
          "content": { 
            "type": "ContentBlock[]",
            "meta_description": "Rich content body of the card. Typically a short text block (1–3 sentences). May include a quote or image for emphasis. LLM agents should keep this concise — cards are scanned, not read in depth." 
          }
        }
      }
    },
    "features": {
      "type": "array",
      "description": "Content sections / article body sections",
      "meta_description": "Structured article body sections rendered as alternating content rows (text + optional visual). Each feature maps to a major section of the post. Suitable for how-to posts, product breakdowns, or multi-part arguments. LLM agents should map the H2-level sections of the post outline to individual feature entries.",
      "items": {
        "type": "object",
        "properties": {
          "title": { 
            "type": "string", 
            "description": "Section heading",
            "meta_description": "Section heading rendered as an H2 or H3. Defines the topic of this content section. Should be descriptive and scannable. Used for in-page navigation and SEO heading structure." 
          },
          "description": { 
            "type": "ContentBlock[]", 
            "description": "Section body content",
            "meta_description": "The body content of this section. A sequence of ContentBlocks forming one coherent argument or explanation. May mix text, images, lists, and quotes. LLM agents should treat each feature entry as an independent sub-article with a clear point, evidence, and transition." 
          },
          "reverse": { 
            "type": "boolean",
            "meta_description": "Layout toggle. When true, the content and any associated visual are rendered in reverse order (visual left, text right instead of text left, visual right). Use to create visual rhythm across multiple consecutive feature sections." 
          },
          "alignment": { 
            "type": "string", 
            "enum": ["left", "center", "right"],
            "meta_description": "Horizontal alignment of the section content. \"left\" is the default for body copy. \"center\" suits short statements or pull-quote style sections. \"right\" is rarely used — only for specific design layouts." 
          }
        }
      }
    },
    "faq": {
      "type": "array",
      "description": "Frequently asked questions related to the post",
      "meta_description": "A list of frequently asked questions relevant to the post topic. Intended to address reader objections, clarify concepts, and improve SEO via structured FAQ markup. LLM agents should generate questions based on common search intent around the post subject.",
      "items": {
        "type": "object",
        "properties": {
          "question": { 
            "type": "string",
            "meta_description": "The FAQ question as a reader would naturally ask it. Should be phrased in first or second person where appropriate. Example: \"How long does the process take?\" or \"What is included in the package?\"" 
          },
          "answer": { 
            "type": "ContentBlock[]",
            "meta_description": "Rich content answer to the FAQ question. May contain text, lists, quotes, or images. Answers should be concise (2–5 sentences) but complete. Structured for potential use in FAQ schema markup." 
          }
        }
      }
    },
    "subtitle": { 
      "type": "string", 
      "description": "Post subtitle or excerpt",
      "meta_description": "Post subtitle or excerpt. Displayed beneath the main title in the hero or on listing pages. Also used as the HTML meta description if no dedicated SEO field exists. Should be 1–2 sentences, under 160 characters, and summarise the posts core value or argument." 
    }
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
