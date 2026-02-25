import { Hono } from 'hono';
import { createSupabaseClient, type Env } from '../lib/supabase';

const health = new Hono<{ Bindings: Env }>();

// GET /api/schemas/:slug/health — Server-side domain health check
health.get('/:slug/health', async (c) => {
  const slug = c.req.param('slug');
  const supabase = createSupabaseClient(c.env);

  const { data: schema, error } = await supabase
    .from('page_schemas')
    .select('frontend_url, registration_status')
    .eq('slug', slug)
    .single();

  if (error || !schema) {
    return c.json({ error: `Schema "${slug}" not found` }, 404);
  }

  if (schema.registration_status !== 'registered' || !schema.frontend_url) {
    return c.json({
      status: 'offline' as const,
      latency_ms: 0,
      reason: 'No frontend registered',
    });
  }

  const start = Date.now();

  try {
    const response = await fetch(schema.frontend_url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - start;

    return c.json({
      status: response.ok ? ('online' as const) : ('offline' as const),
      latency_ms: latency,
      http_status: response.status,
    });
  } catch {
    const latency = Date.now() - start;

    return c.json({
      status: 'offline' as const,
      latency_ms: latency,
      reason: 'Connection failed or timed out',
    });
  }
});

// POST /api/schemas/health/domain — Direct domain health check by URL
// Body: { url: string }
health.post('/health/domain', async (c) => {
  const body = await c.req.json<{ url?: string }>();
  const url = body.url;

  if (!url) {
    return c.json({ error: 'url is required' }, 400);
  }

  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - start;

    return c.json({
      status: response.ok ? ('online' as const) : ('offline' as const),
      latency_ms: latency,
      http_status: response.status,
      url,
    });
  } catch {
    const latency = Date.now() - start;

    return c.json({
      status: 'offline' as const,
      latency_ms: latency,
      reason: 'Connection failed or timed out',
      url,
    });
  }
});

export default health;
