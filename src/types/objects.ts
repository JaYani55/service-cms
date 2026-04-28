export type ObjectStatus = 'published' | 'archived';

export type ObjectFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'url'
  | 'email'
  | 'date'
  | 'price';

export interface ObjectFieldDefinition {
  editorId?: string;
  name: string;
  type: ObjectFieldType;
  description?: string;
  placeholder?: string;
  meta_description?: string;
  required?: boolean;
  currency?: string;
  multiple?: boolean;
  enum?: string[];
  properties?: ObjectFieldDefinition[];
  items?: ObjectFieldDefinition;
}

export type ObjectSchemaDefinition = Record<string, Omit<ObjectFieldDefinition, 'name'>>;

export interface ObjectRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  schema: ObjectSchemaDefinition;
  data: Record<string, unknown> | unknown[];
  status: ObjectStatus;
  requires_auth: boolean;
  api_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicObjectDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  schema: ObjectSchemaDefinition;
  data: Record<string, unknown> | unknown[];
  updated_at: string;
}
