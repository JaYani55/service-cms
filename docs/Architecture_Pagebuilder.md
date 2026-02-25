# Architecture — Dynamic Schema-Driven PageBuilder

## Overview

The service-CMS pagebuilder is a **decoupled, backend-first pagebuilder**. The CMS (backend) defines page schemas which any frontend must comply with. Schemas are saved as LLM-ready `.txt` specifications served via a public Hono API on Cloudflare Workers. An LLM Agent building/editing the frontend can ingest the schema via HTTP to build compliant templates that consume page content via the JSONB structure defined in the CMS.

This architecture enables:
- **Multi-frontend support**: One CMS powering multiple frontends (Next.js, SvelteKit, etc.)
- **Schema-driven content**: Content editors work within the constraints of a registered schema
- **LLM-assisted frontend generation**: Schemas include machine-readable specs and custom instructions
- **ISR-ready communication**: On-demand revalidation webhooks notify frontends of content changes

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service-CMS (React SPA)                  │
│                                                                 │
│  /pages                    Schema Hub (list all schemas)        │
│  /pages/schema/new         Schema Editor (create new)           │
│  /pages/schema/:slug       Page list for schema                 │
│  /pages/schema/:slug/edit/:id   PageBuilder (edit page)         │
│  /pages/schema/:slug/new        PageBuilder (new page)          │
└────────────────┬────────────────────────────────────────────────┘
                 │ Direct Supabase client calls
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL)                        │
│                                                                 │
│  page_schemas    Schema definitions, registration, LLM config   │
│  pages           Page content (JSONB), linked to schema         │
│  mentorbooking_products   Legacy FK to pages via product_page_id│
└────────────────┬────────────────────────────────────────────────┘
                 │ Service role key (server-side only)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Hono API (Cloudflare Workers)                       │
│                                                                 │
│  GET  /api/schemas/:slug/spec.txt     LLM-ready schema spec     │
│  POST /api/schemas/:slug/register     Frontend registration      │
│  GET  /api/schemas/:slug/health       Domain ONLINE/OFFLINE      │
│  POST /api/schemas/:slug/revalidate   Trigger ISR on frontend    │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP (public)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend (Next.js / SvelteKit / etc.)              │
│                                                                 │
│  Consumes page content from Supabase                            │
│  Implements ISR revalidation endpoint                           │
│  Registers with CMS via registration callback                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `page_schemas` (NEW)

| Column | Type | Details |
|--------|------|---------|
| `id` | `uuid` PK | `DEFAULT gen_random_uuid()` |
| `name` | `varchar(255)` | NOT NULL — e.g., "Service-Product", "Blog" |
| `slug` | `varchar(255)` | UNIQUE NOT NULL — URL-friendly identifier |
| `description` | `text` | Human-readable description |
| `schema` | `jsonb` | NOT NULL — JSON schema definition (keys, types, nesting) |
| `llm_instructions` | `text` | Custom instructions for the LLM agent |
| `registration_code` | `varchar(64)` | UNIQUE — one-time code for frontend callback |
| `registration_status` | `varchar(50)` | `'pending'` \| `'waiting'` \| `'registered'` \| `'archived'` |
| `frontend_url` | `text` | Base URL of the frontend consuming this schema |
| `revalidation_endpoint` | `text` | ISR webhook path (e.g., `/api/revalidate`) |
| `revalidation_secret` | `text` | Shared secret for webhook auth |
| `slug_structure` | `text` | URL pattern for pages, default `'/:slug'` |
| `is_default` | `boolean` | `DEFAULT false` — marks built-in schemas |
| `created_at` | `timestamptz` | `DEFAULT now()` |
| `updated_at` | `timestamptz` | `DEFAULT now()` (auto-updated via trigger) |

### `pages` (RENAMED from `products`)

| Column | Type | Details |
|--------|------|---------|
| `id` | `uuid` PK | `DEFAULT gen_random_uuid()` |
| `slug` | `varchar(255)` | UNIQUE NOT NULL |
| `name` | `varchar(255)` | NOT NULL |
| `status` | `varchar(50)` | `'draft'` \| `'published'` \| `'archived'` |
| `is_draft` | `boolean` | `DEFAULT true`, auto-synced with status |
| `content` | `jsonb` | NOT NULL — the full page content matching schema |
| `schema_id` | `uuid` FK | REFERENCES `page_schemas(id)` — nullable for legacy |
| `domain_url` | `text` | The frontend domain this page belongs to |
| `updated_at` | `timestamptz` | Auto-updated via trigger |
| `published_at` | `timestamptz` | Nullable |

### Relationship Diagram

```
mentorbooking_products.product_page_id ──FK──► pages.id
pages.schema_id ──FK──► page_schemas.id
```

---

## Hono API Endpoints

All endpoints are served from `api/` directory, deployed as a Cloudflare Worker.

### `GET /api/schemas/:slug/spec.txt`
Returns the LLM-ready plaintext specification for a schema. Content-Type: `text/plain`.

### `POST /api/schemas/:slug/register`
Completes frontend registration. Validates the one-time `registration_code`. Returns `403` on invalid/expired code.

### `GET /api/schemas/:slug/health`
Server-side domain health check. Returns `{ status: 'online' | 'offline', latency_ms }`.

### `POST /api/schemas/:slug/revalidate`
Triggers ISR revalidation on the registered frontend via its webhook endpoint.

---

## Schema Registration Flow

```
1. Staff creates schema in CMS → status='waiting', generates registration_code
2. CMS shows "Waiting for Frontend" screen, polls every 10s
3. LLM Agent / Developer fetches spec.txt, builds frontend template
4. POSTs to /register with code + frontend URLs → status='registered'
5. CMS detects change → shows success + domain info
6. Abort: Sets code=null, status='pending' → old code invalidated
```

---

## Content Block Types (shared primitives)

| Type | Fields |
|------|--------|
| `text` | `content: string` |
| `heading` | `content: string`, `level: 'heading1'...'heading6'` |
| `image` | `src, alt, caption?, width?, height?` |
| `quote` | `text, author?, source?` |
| `list` | `style: 'ordered' \| 'unordered'`, `items: string[]` |
| `video` | `src, provider: 'youtube' \| 'vimeo' \| 'other'`, `caption?` |

All blocks extend `BaseBlock: { id: string, type: string }`

---

## Environment Variables

### CMS (Vite)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `VITE_API_URL` | Hono Worker URL |

### Hono Worker (Cloudflare)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key |

---

## Key Decisions

1. **Rename `products` → `pages`**: Single source of truth, avoids ambiguity with `mentorbooking_products`
2. **Hono on Cloudflare Workers**: Co-located in repo, server-side fetch for domain pings
3. **DB polling over Realtime**: Simpler for one-time registration events
4. **Keep existing form components**: Known sections use concrete components, custom sections use generic editor
5. **Blog schema mirrors Service-Product**: Same blocks, differentiated by labels and defaults
6. **Schema .txt via Hono API**: Dynamically generated from DB, always current