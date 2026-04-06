export type FormStatus = 'published' | 'archived';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'checkbox'
  | 'single-select'
  | 'multi-select'
  | 'select'
  | 'radio'
  | 'date';

export type FormAnswerValue = string | number | boolean | string[] | null;

export interface FormFieldDefinition {
  editorId?: string;
  name: string;
  type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  meta_description?: string;
  required?: boolean;
  options?: string[];
}

export type FormSchemaDefinition = Record<string, Omit<FormFieldDefinition, 'name'>>;

export interface FormRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  schema: FormSchemaDefinition;
  llm_instructions: string | null;
  status: FormStatus;
  share_enabled: boolean;
  share_slug: string | null;
  requires_auth: boolean;
  api_enabled: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface FormAnswerRecord {
  id: string;
  form_id: string;
  submitted_by: string | null;
  answers: Record<string, FormAnswerValue>;
  source_slug: string | null;
  submitted_via: 'share' | 'api' | 'page';
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PublicFormDefinition {
  form: Pick<FormRecord, 'id' | 'name' | 'slug' | 'description' | 'status' | 'share_enabled' | 'share_slug' | 'requires_auth' | 'api_enabled'>;
  fields: FormFieldDefinition[];
  llm_instructions: string | null;
}

export interface ParsedFormSchemaResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fields: FormFieldDefinition[];
  normalizedSchema: FormSchemaDefinition | null;
}