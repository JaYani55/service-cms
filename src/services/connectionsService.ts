/**
 * connectionsService.ts
 *
 * Client-side service for the /api/secrets proxy routes.
 * These routes live on the Hono Worker and proxied to CF Secrets Store.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface CfSecret {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  comment?: string;
}

export interface CfStore {
  id: string;
  name: string;
  created_at?: string;
}

// ── Known secrets manifest ──────────────────────────────────────────────────
// Defines every secret the application knows about, grouped by category.

export type SecretCategory = 'Database' | 'Worker' | 'Custom';

export interface SecretDefinition {
  name: string;
  category: SecretCategory;
  description: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Whether this secret is required for the app to work */
  required: boolean;
  /** Example / placeholder to show in the form */
  placeholder?: string;
  /** The wrangler.jsonc binding name for this secret */
  binding?: string;
}

export const SECRETS_MANIFEST: SecretDefinition[] = [
  {
    name: 'SUPABASE_URL',
    category: 'Database',
    label: 'Supabase URL',
    description: 'Your Supabase project URL. Found in your Supabase dashboard under Settings → API.',
    required: true,
    placeholder: 'https://<project-ref>.supabase.co',
    binding: 'SS_SUPABASE_URL',
  },
  {
    name: 'SUPABASE_ANON_KEY',
    category: 'Database',
    label: 'Supabase Anon Key',
    description: 'Your Supabase public anon key. Row-level security enforces access control — safe to expose to the Worker.',
    required: true,
    placeholder: 'eyJ...',
    binding: 'SS_SUPABASE_ANON_KEY',
  },
];

// ── API calls ────────────────────────────────────────────────────────────────

export async function listSecrets(): Promise<CfSecret[]> {
  const res = await fetch(`${API_URL}/api/secrets`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json() as { secrets: CfSecret[] };
  return data.secrets;
}

export async function listStores(): Promise<CfStore[]> {
  const res = await fetch(`${API_URL}/api/secrets/stores`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json() as { stores: CfStore[] };
  return data.stores;
}

export async function upsertSecret(name: string, value: string, comment?: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/secrets/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value, comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}

export async function deleteSecret(name: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/secrets/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}
