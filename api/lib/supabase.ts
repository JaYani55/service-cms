import { createClient } from '@supabase/supabase-js';

/**
 * Cloudflare Secrets Store binding — the value is fetched asynchronously.
 * See: https://developers.cloudflare.com/secrets-store/
 */
export interface SecretsStoreBinding {
  get(): Promise<string>;
}

export interface Env {
  // ── Fallback vars for local `wrangler dev` (set in .dev.vars) ──────────────
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ENVIRONMENT: string;

  // ── Secrets Store bindings (production) ────────────────────────────────────
  // These override the plain vars when present (bound via wrangler.jsonc secrets_store_secrets)
  SS_SUPABASE_URL?: SecretsStoreBinding;
  SS_SUPABASE_ANON_KEY?: SecretsStoreBinding;

  // ── Cloudflare management credentials ──────────────────────────────────────
  // Used by the /api/secrets routes to call the CF REST API.
  // Set via: npx wrangler secret put CF_API_TOKEN
  CF_API_TOKEN?: string;
  // Set via vars in wrangler.jsonc (non-sensitive)
  CF_ACCOUNT_ID?: string;
  SECRETS_STORE_ID?: string;
}

/**
 * Resolve a secret: prefer Secrets Store binding (production), fall back to plain string var (local dev).
 */
export async function resolveSecret(binding: SecretsStoreBinding | undefined, fallback: string): Promise<string> {
  if (binding) {
    try {
      return await binding.get();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function createSupabaseClient(env: Env) {
  const url = await resolveSecret(env.SS_SUPABASE_URL, env.SUPABASE_URL);
  const key = await resolveSecret(env.SS_SUPABASE_ANON_KEY, env.SUPABASE_ANON_KEY);

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
