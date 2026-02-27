import type { AgentLog, AgentLogStats, AgentLogPagination } from '@/types/pagebuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// --- Fetch Logs (paginated, filterable) ---

export interface FetchLogsParams {
  page?: number;
  limit?: number;
  schema_slug?: string;
  method?: string;
  min_status?: number;
  from?: string;
  to?: string;
}

export interface FetchLogsResult {
  logs: AgentLog[];
  pagination: AgentLogPagination;
}

export const fetchLogs = async (params: FetchLogsParams = {}): Promise<FetchLogsResult> => {
  const url = new URL(`${API_URL}/api/schemas/logs`);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.schema_slug) url.searchParams.set('schema_slug', params.schema_slug);
  if (params.method) url.searchParams.set('method', params.method);
  if (params.min_status) url.searchParams.set('min_status', String(params.min_status));
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
};

// --- Fetch Stats ---

export const fetchLogStats = async (): Promise<AgentLogStats> => {
  const res = await fetch(`${API_URL}/api/schemas/logs/stats`);
  if (!res.ok) throw new Error('Failed to fetch log stats');
  return res.json();
};

// --- Download Logs ---

export const downloadLogs = async (params: { schema_slug?: string; from?: string; to?: string } = {}): Promise<void> => {
  const url = new URL(`${API_URL}/api/schemas/logs/download`);
  if (params.schema_slug) url.searchParams.set('schema_slug', params.schema_slug);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to download logs');

  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

// --- Delete Logs ---

export const deleteAllLogs = async (): Promise<void> => {
  const res = await fetch(`${API_URL}/api/schemas/logs?confirm=true`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete logs');
};

export const deleteLogsBySchema = async (schemaSlug: string): Promise<void> => {
  const res = await fetch(`${API_URL}/api/schemas/logs?schema_slug=${encodeURIComponent(schemaSlug)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete logs');
};

export const deleteLogEntry = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/api/schemas/logs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete log entry');
};
