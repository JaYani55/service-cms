import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { Env } from './lib/supabase';
import schemas from './routes/schemas';
import health from './routes/health';
import mcpRoute from './routes/mcp';

const app = new Hono<{ Bindings: Env }>();

// CORS — allow CMS and any frontend to call the API
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root — single entry point for agents, links to discovery + MCP
app.get('/', (c) => {
  const baseUrl = new URL(c.req.url).origin;
  return c.json({
    service: 'service-cms-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      schemas: `${baseUrl}/api/schemas`,
      mcp: `${baseUrl}/mcp`,
    },
    description: 'Start at /api/schemas to discover available page schemas, or connect via /mcp for MCP tool integration.',
  });
});

// Mount routes
app.route('/api/schemas', schemas);
app.route('/api/schemas', health);
app.route('/mcp', mcpRoute);

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
