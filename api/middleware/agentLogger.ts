import type { MiddlewareHandler } from 'hono';
import { createSupabaseClient, type Env } from '../lib/supabase';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function extractErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return null;
  }

  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : null;
}

const SENSITIVE_KEY_PATTERN = /(password|secret|token|authorization|api[-_]?key|access[-_]?token|refresh[-_]?token)/i;
const MAX_LOG_STRING_LENGTH = 512;
const MAX_LOG_ARRAY_ITEMS = 50;
const MAX_LOG_DEPTH = 4;

function shouldSkipBodyLogging(pathname: string): boolean {
  return /^\/api\/forms\/(share\/[^/]+\/answers|[^/]+\/answers)$/.test(pathname)
    || pathname === '/api/media/upload';
}

function sanitizeLogValue(value: unknown, depth = 0): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > MAX_LOG_STRING_LENGTH
      ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}...[truncated]`
      : value;
  }

  if (depth >= MAX_LOG_DEPTH) {
    return '[truncated]';
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_LOG_ARRAY_ITEMS).map((entry) => sanitizeLogValue(entry, depth + 1));
  }

  if (!value || typeof value !== 'object') {
    return String(value);
  }

  const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return [key, '[redacted]'] as const;
    }

    return [key, sanitizeLogValue(entryValue, depth + 1)] as const;
  });

  return Object.fromEntries(sanitizedEntries);
}

/**
 * Hono middleware that logs every request/response to the agent_logs table.
 * Captures method, path, status, duration, request/response bodies, IP, and user-agent.
 */
export const agentLogger: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const url = new URL(c.req.url);
  const path = url.pathname + url.search;

  // Skip logging for the logs management endpoints themselves (avoid recursion)
  // and for sensitive secrets/connections management to prevent token leaks.
  if (url.pathname.startsWith('/api/schemas/logs') || url.pathname.startsWith('/api/secrets')) {
    return next();
  }

  const start = Date.now();
  const method = c.req.method;
  const skipBodyLogging = shouldSkipBodyLogging(url.pathname);

  // Extract IP and user-agent
  const ip = c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const userAgent = c.req.header('user-agent') || null;

  // Capture request body for POST/PUT/PATCH (JSON only — skip multipart/binary uploads
  // to avoid interfering with the body stream in Cloudflare Workers).
  let requestBody: unknown = null;
  const contentType = c.req.header('content-type') || '';
  if (!skipBodyLogging && ['POST', 'PUT', 'PATCH'].includes(method) && !contentType.includes('multipart/form-data')) {
    try {
      requestBody = sanitizeLogValue(await c.req.raw.clone().json());
    } catch {
      // Not JSON or empty body — that's fine
    }
  }

  // Extract schema slug from path if present  (e.g. /api/schemas/:slug/...)
  let schemaSlug: string | null = null;
  const slugMatch = path.match(/^\/api\/schemas\/([^/]+)/);
  if (slugMatch && slugMatch[1] !== '' && !['logs'].includes(slugMatch[1])) {
    schemaSlug = slugMatch[1];
  }

  // Run the actual handler
  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Capture response body (clone to avoid consuming)
  let responseBody: unknown = null;
  try {
    const ct = c.res.headers.get('content-type') || '';
    if (!skipBodyLogging && ct.includes('application/json')) {
      responseBody = sanitizeLogValue(await c.res.clone().json());
    }
  } catch {
    // Skip non-JSON responses
  }

  // Resolve schema_id from slug if we have one
  let schemaId: string | null = null;

  // Fire-and-forget: write the log entry
  try {
    const supabase = await createSupabaseClient(c.env);

    if (schemaSlug) {
      const { data } = await supabase
        .from('page_schemas')
        .select('id')
        .eq('slug', schemaSlug)
        .single();
      if (data) schemaId = data.id;
    }

    await supabase.from('agent_logs').insert({
      schema_id: schemaId,
      schema_slug: schemaSlug,
      method,
      path,
      status_code: status,
      request_body: requestBody as JsonValue,
      response_body: responseBody as JsonValue,
      duration_ms: duration,
      ip_address: ip,
      user_agent: userAgent,
      error: status >= 400 ? extractErrorMessage(responseBody) : null,
    });
  } catch (err) {
    // Never let logging break a real request
    console.error('[agent-logger] Failed to write log:', err);
  }
};
