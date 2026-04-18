import type { Context } from 'hono';
import { createSupabaseClient, type Env } from './supabase';

export type AppRole = 'user' | 'admin' | 'super-admin';

interface JwtPayload {
  user_roles?: unknown;
}

const ROLE_ORDER: AppRole[] = ['user', 'admin', 'super-admin'];

export function parseBearerToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function getRolesFromToken(token: string): string[] {
  const payload = decodeJwtPayload(token);
  return normalizeRoles(payload?.user_roles);
}

function hasRequiredRole(userRoles: string[], requiredRole: AppRole): boolean {
  const normalizedRoles = new Set<string>(userRoles.map((role) => role === 'staff' ? 'user' : role));
  const minimumRank = ROLE_ORDER.indexOf(requiredRole);

  return ROLE_ORDER.some((role, index) => index >= minimumRank && normalizedRoles.has(role));
}

export async function requireAppRole(
  c: Context<{ Bindings: Env }>,
  requiredRole: AppRole,
): Promise<{ token: string; roles: string[] } | Response> {
  const token = parseBearerToken(c.req.header('Authorization'));
  if (!token) {
    return c.json({ error: 'Authentication required.' }, 401);
  }

  const supabase = await createSupabaseClient(c.env, token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: 'Invalid or expired session.' }, 401);
  }

  const roles = getRolesFromToken(token);

  if (!hasRequiredRole(roles, requiredRole)) {
    return c.json({ error: 'Insufficient permissions.' }, 403);
  }

  return { token, roles };
}

export async function getOptionalAuthSession(
  c: Context<{ Bindings: Env }>,
): Promise<{ token: string; roles: string[] } | null | Response> {
  const token = parseBearerToken(c.req.header('Authorization'));
  if (!token) {
    return null;
  }

  const supabase = await createSupabaseClient(c.env, token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: 'Invalid or expired session.' }, 401);
  }

  const roles = getRolesFromToken(token);

  return { token, roles };
}