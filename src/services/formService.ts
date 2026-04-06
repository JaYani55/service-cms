import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/apiUrl';
import type { FormAnswerRecord, FormRecord, FormSchemaDefinition, PublicFormDefinition } from '@/types/forms';
import { generateFormSlug, validateShareSlug } from '@/utils/forms';

const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const buildHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

export const getForms = async (): Promise<FormRecord[]> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .neq('status', 'archived')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FormRecord[];
};

export const getPublishedForms = async (): Promise<FormRecord[]> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as FormRecord[];
};

export const getForm = async (idOrSlug: string): Promise<FormRecord> => {
  const bySlug = await supabase
    .from('forms')
    .select('*')
    .eq('slug', idOrSlug)
    .maybeSingle();

  if (bySlug.data) return bySlug.data as FormRecord;

  const byId = await supabase
    .from('forms')
    .select('*')
    .eq('id', idOrSlug)
    .single();

  if (byId.error) throw new Error(byId.error.message);
  return byId.data as FormRecord;
};

interface SaveFormInput {
  name: string;
  description?: string;
  schema: FormSchemaDefinition;
  llm_instructions?: string;
  status: FormRecord['status'];
  share_enabled: boolean;
  share_slug?: string | null;
  requires_auth: boolean;
  api_enabled: boolean;
}

const normalizeInput = (input: SaveFormInput) => {
  const slug = generateFormSlug(input.name);
  const shareSlug = input.share_enabled ? generateFormSlug(input.share_slug || input.name) : null;

  if (input.share_enabled && shareSlug) {
    const shareSlugError = validateShareSlug(shareSlug);
    if (shareSlugError) throw new Error(shareSlugError);
  }

  return {
    name: input.name,
    slug,
    description: input.description || null,
    schema: input.schema,
    llm_instructions: input.llm_instructions || null,
    status: input.status,
    share_enabled: input.share_enabled,
    share_slug: shareSlug,
    requires_auth: input.requires_auth,
    api_enabled: input.api_enabled,
    published_at: input.status === 'published' ? new Date().toISOString() : null,
  };
};

export const createForm = async (input: SaveFormInput): Promise<FormRecord> => {
  const payload = normalizeInput(input);
  const { data, error } = await supabase
    .from('forms')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as FormRecord;
};

export const updateForm = async (id: string, input: SaveFormInput): Promise<FormRecord> => {
  const payload = normalizeInput(input);
  const { data, error } = await supabase
    .from('forms')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as FormRecord;
};

export const deleteForm = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('forms')
    .update({ status: 'archived', share_enabled: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const getFormAnswers = async (formId: string): Promise<FormAnswerRecord[]> => {
  const { data, error } = await supabase
    .from('forms_answers')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FormAnswerRecord[];
};

export const getPublicFormByShareSlug = async (shareSlug: string): Promise<PublicFormDefinition> => {
  const response = await fetch(`${API_URL}/api/forms/share/${encodeURIComponent(shareSlug)}`, {
    headers: await buildHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Failed to load form.');
  }

  return response.json();
};

export const getApiFormDefinition = async (identifier: string): Promise<PublicFormDefinition> => {
  const response = await fetch(`${API_URL}/api/forms/${encodeURIComponent(identifier)}`, {
    headers: await buildHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Failed to load form definition.');
  }

  return response.json();
};

export const submitFormAnswers = async (
  identifier: string,
  payload: {
    answers: Record<string, unknown>;
    source_slug?: string;
    submitted_via?: 'share' | 'api' | 'page';
  },
  mode: 'share' | 'api' = 'share',
): Promise<{ success: boolean; answer_id: string }> => {
  const url = mode === 'share'
    ? `${API_URL}/api/forms/share/${encodeURIComponent(identifier)}/answers`
    : `${API_URL}/api/forms/${encodeURIComponent(identifier)}/answers`;

  const response = await fetch(url, {
    method: 'POST',
    headers: await buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to submit form answers.');
  }

  return response.json();
};