import { Hono } from 'hono';
import { createSupabaseAdminClient, createSupabaseClient, type Env } from '../lib/supabase';
import { parseBearerToken, getRolesFromToken, requireAppRole } from '../lib/auth';

const objects = new Hono<{ Bindings: Env }>();

interface ObjectRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  schema: Record<string, unknown>;
  data: Record<string, unknown>;
  status: 'published' | 'archived';
  requires_auth: boolean;
  api_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/objects
// List all published, api-enabled objects (public or authenticated depending on requires_auth).
// Admin/super-admin always see all non-archived objects.
objects.get('/', async (c) => {
  const token = parseBearerToken(c.req.header('Authorization'));
  const roles = token ? getRolesFromToken(token) : [];
  const isAdmin = roles.some((r) => r === 'admin' || r === 'super-admin');

  if (isAdmin) {
    // Verify token is valid for admin path
    const supabase = await createSupabaseClient(c.env, token!);
    const { data: user, error } = await supabase.auth.getUser(token!);
    if (error || !user.user) {
      return c.json({ error: 'Invalid or expired session.' }, 401);
    }

    const admin = await createSupabaseAdminClient(c.env);
    const { data, error: dbError } = await admin
      .from('objects')
      .select('id, name, slug, description, status, requires_auth, api_enabled, created_at, updated_at')
      .neq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (dbError) {
      return c.json({ error: 'Failed to load objects.' }, 500);
    }

    return c.json({ objects: data ?? [] });
  }

  // Public path: only published, api_enabled, non-auth objects
  const admin = await createSupabaseAdminClient(c.env);
  const { data, error: dbError } = await admin
    .from('objects')
    .select('id, name, slug, description, created_at, updated_at')
    .eq('status', 'published')
    .eq('api_enabled', true)
    .eq('requires_auth', false)
    .order('updated_at', { ascending: false });

  if (dbError) {
    return c.json({ error: 'Failed to load objects.' }, 500);
  }

  return c.json({ objects: data ?? [] });
});

// GET /api/objects/:idOrSlug
// Retrieve a single object by ID or slug. Enforces requires_auth if set.
// Returns the schema definition and full data payload.
objects.get('/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug');
  const admin = await createSupabaseAdminClient(c.env);

  // Resolve object regardless of auth first (to check requires_auth)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const query = admin
    .from('objects')
    .select('*')
    .eq('status', 'published')
    .eq('api_enabled', true);

  const { data: rows, error: dbError } = isUuid
    ? await query.eq('id', idOrSlug).limit(1)
    : await query.eq('slug', idOrSlug).limit(1);

  if (dbError) {
    return c.json({ error: 'Failed to load object.' }, 500);
  }

  const obj = rows?.[0] as ObjectRow | undefined;

  if (!obj) {
    return c.json({ error: 'Object not found.' }, 404);
  }

  // Check auth requirement
  if (obj.requires_auth) {
    const token = parseBearerToken(c.req.header('Authorization'));
    if (!token) {
      return c.json({ error: 'Authentication required.' }, 401);
    }
    const supabase = await createSupabaseClient(c.env, token);
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user.user) {
      return c.json({ error: 'Invalid or expired session.' }, 401);
    }
  }

  return c.json({
    id: obj.id,
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    schema: obj.schema,
    data: obj.data,
    updated_at: obj.updated_at,
  });
});

// POST /api/objects — create (admin/super-admin only)
objects.post('/', async (c) => {
  const auth = await requireAppRole(c, 'admin');
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json() as Record<string, unknown>;
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const { name, slug, description, schema, data, status, requires_auth, api_enabled } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return c.json({ error: 'name is required.' }, 400);
  }
  if (typeof slug !== 'string' || !slug.trim()) {
    return c.json({ error: 'slug is required.' }, 400);
  }

  const admin = await createSupabaseAdminClient(c.env);
  const { data: created, error } = await admin
    .from('objects')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: typeof description === 'string' ? description : null,
      schema: typeof schema === 'object' && schema !== null ? schema : {},
      data: typeof data === 'object' && data !== null ? data : {},
      status: status === 'archived' ? 'archived' : 'published',
      requires_auth: Boolean(requires_auth),
      api_enabled: api_enabled !== false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'An object with this slug already exists.' }, 409);
    }
    return c.json({ error: 'Failed to create object.' }, 500);
  }

  return c.json(created, 201);
});

// PUT /api/objects/:id — update (admin/super-admin only)
objects.put('/:id', async (c) => {
  const auth = await requireAppRole(c, 'admin');
  if (auth instanceof Response) return auth;

  const id = c.req.param('id');

  let body: Record<string, unknown>;
  try {
    body = await c.req.json() as Record<string, unknown>;
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const { name, slug, description, schema, data, status, requires_auth, api_enabled } = body;

  const patch: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) patch.name = name.trim();
  if (typeof slug === 'string' && slug.trim()) patch.slug = slug.trim();
  if (description !== undefined) patch.description = typeof description === 'string' ? description : null;
  if (typeof schema === 'object' && schema !== null) patch.schema = schema;
  if (typeof data === 'object' && data !== null) patch.data = data;
  if (status === 'published' || status === 'archived') patch.status = status;
  if (typeof requires_auth === 'boolean') patch.requires_auth = requires_auth;
  if (typeof api_enabled === 'boolean') patch.api_enabled = api_enabled;

  if (Object.keys(patch).length === 0) {
    return c.json({ error: 'No valid fields to update.' }, 400);
  }

  const admin = await createSupabaseAdminClient(c.env);
  const { data: updated, error } = await admin
    .from('objects')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'An object with this slug already exists.' }, 409);
    }
    return c.json({ error: 'Failed to update object.' }, 500);
  }

  if (!updated) {
    return c.json({ error: 'Object not found.' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/objects/:id — archive (super-admin only)
objects.delete('/:id', async (c) => {
  const auth = await requireAppRole(c, 'super-admin');
  if (auth instanceof Response) return auth;

  const id = c.req.param('id');
  const admin = await createSupabaseAdminClient(c.env);

  const { error } = await admin
    .from('objects')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    return c.json({ error: 'Failed to archive object.' }, 500);
  }

  return c.json({ success: true });
});

export default objects;
