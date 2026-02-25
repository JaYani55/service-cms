import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, Eye, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  createSchema,
  updateSchema,
  getSchema,
  startSchemaRegistration,
} from '@/services/pageService';
import type { SchemaFieldDefinition, PageSchema } from '@/types/pagebuilder';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const FIELD_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'ContentBlock[]'] as const;

const emptyField = (): SchemaFieldDefinition => ({
  name: '',
  type: 'string',
  description: '',
  required: false,
});

const fieldsToJsonSchema = (fields: SchemaFieldDefinition[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (!field.name.trim()) continue;

    const entry: Record<string, unknown> = {
      type: field.type,
      description: field.description || undefined,
    };

    if (field.enum && field.enum.length > 0) {
      entry.enum = field.enum;
    }

    if (field.type === 'object' && field.properties && field.properties.length > 0) {
      entry.properties = fieldsToJsonSchema(field.properties);
    }

    if (field.type === 'array' && field.items) {
      entry.items = {
        type: field.items.type,
        description: field.items.description || undefined,
        ...(field.items.type === 'object' && field.items.properties
          ? { properties: fieldsToJsonSchema(field.items.properties) }
          : {}),
      };
    }

    result[field.name] = entry;
  }
  return result;
};

const jsonSchemaToFields = (schema: Record<string, unknown>): SchemaFieldDefinition[] => {
  const fields: SchemaFieldDefinition[] = [];
  for (const [name, value] of Object.entries(schema)) {
    const entry = value as Record<string, unknown>;
    const field: SchemaFieldDefinition = {
      name,
      type: (entry.type as SchemaFieldDefinition['type']) || 'string',
      description: (entry.description as string) || '',
      required: false,
    };

    if (entry.enum) {
      field.enum = entry.enum as string[];
    }

    if (entry.properties && typeof entry.properties === 'object') {
      field.properties = jsonSchemaToFields(entry.properties as Record<string, unknown>);
    }

    if (entry.items && typeof entry.items === 'object') {
      const items = entry.items as Record<string, unknown>;
      field.items = {
        name: 'item',
        type: (items.type as SchemaFieldDefinition['type']) || 'string',
        description: (items.description as string) || '',
        ...(items.properties
          ? { properties: jsonSchemaToFields(items.properties as Record<string, unknown>) }
          : {}),
      };
    }

    fields.push(field);
  }
  return fields;
};

interface FieldEditorProps {
  field: SchemaFieldDefinition;
  onChange: (field: SchemaFieldDefinition) => void;
  onRemove: () => void;
  depth?: number;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onChange, onRemove, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = field.type === 'object' || field.type === 'array';

  return (
    <div className={`border rounded-lg p-3 space-y-3 ${depth > 0 ? 'ml-6 border-dashed' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={field.name}
              onChange={(e) => onChange({ ...field, name: e.target.value })}
              placeholder="field_name"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Typ</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onChange({
                ...field,
                type: value as SchemaFieldDefinition['type'],
                properties: value === 'object' ? field.properties || [] : undefined,
                items: value === 'array' ? field.items || emptyField() : undefined,
              })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <Input
              value={field.description || ''}
              onChange={(e) => onChange({ ...field, description: e.target.value })}
              placeholder="Field description"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 pt-5">
          <div className="flex items-center gap-1">
            <Checkbox
              id={`req-${field.name}-${depth}`}
              checked={field.required || false}
              onCheckedChange={(checked) => onChange({ ...field, required: checked as boolean })}
            />
            <Label htmlFor={`req-${field.name}-${depth}`} className="text-xs cursor-pointer">Req</Label>
          </div>
          {hasChildren && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Nested properties for object type */}
      {hasChildren && expanded && field.type === 'object' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Properties</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onChange({
                ...field,
                properties: [...(field.properties || []), emptyField()],
              })}
            >
              <Plus className="h-3 w-3 mr-1" /> Feld
            </Button>
          </div>
          {(field.properties || []).map((prop, i) => (
            <FieldEditor
              key={i}
              field={prop}
              depth={depth + 1}
              onChange={(updated) => {
                const newProps = [...(field.properties || [])];
                newProps[i] = updated;
                onChange({ ...field, properties: newProps });
              }}
              onRemove={() => {
                const newProps = (field.properties || []).filter((_, idx) => idx !== i);
                onChange({ ...field, properties: newProps });
              }}
            />
          ))}
        </div>
      )}

      {/* Item definition for array type */}
      {hasChildren && expanded && field.type === 'array' && field.items && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Array Item Type</Label>
          <FieldEditor
            field={field.items}
            depth={depth + 1}
            onChange={(updated) => onChange({ ...field, items: updated })}
            onRemove={() => onChange({ ...field, items: emptyField() })}
          />
        </div>
      )}
    </div>
  );
};

const SchemaEditor: React.FC = () => {
  const { schemaSlug } = useParams<{ schemaSlug: string }>();
  const navigate = useNavigate();
  const { language } = useTheme();
  const isEditing = !!schemaSlug && schemaSlug !== 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [llmInstructions, setLlmInstructions] = useState('');
  const [fields, setFields] = useState<SchemaFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [existingSchema, setExistingSchema] = useState<PageSchema | null>(null);

  useEffect(() => {
    if (isEditing && schemaSlug) {
      setIsLoading(true);
      getSchema(schemaSlug)
        .then((data) => {
          setExistingSchema(data);
          setName(data.name);
          setDescription(data.description || '');
          setLlmInstructions(data.llm_instructions || '');
          setFields(jsonSchemaToFields(data.schema as Record<string, unknown>));
        })
        .catch((err) => {
          toast.error(err.message);
          navigate('/pages');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, schemaSlug, navigate]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'Name ist erforderlich');
      return;
    }

    if (fields.length === 0) {
      toast.error(language === 'en' ? 'At least one field is required' : 'Mindestens ein Feld ist erforderlich');
      return;
    }

    setIsSaving(true);
    try {
      const schemaJson = fieldsToJsonSchema(fields);

      if (isEditing && existingSchema) {
        await updateSchema(existingSchema.id, {
          name,
          description,
          schema: schemaJson,
          llm_instructions: llmInstructions,
        });
        toast.success(language === 'en' ? 'Schema updated' : 'Schema aktualisiert');
        navigate(`/pages/schema/${existingSchema.slug}`);
      } else {
        const newSchema = await createSchema({
          name,
          description,
          schema: schemaJson,
          llm_instructions: llmInstructions,
        });
        toast.success(language === 'en' ? 'Schema created' : 'Schema erstellt');
        navigate(`/pages/schema/${newSchema.slug}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save schema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartRegistration = async () => {
    if (!existingSchema) return;
    try {
      await startSchemaRegistration(existingSchema.id);
      toast.success(language === 'en' ? 'Registration started' : 'Registrierung gestartet');
      navigate(`/pages/schema/${existingSchema.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start registration');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const generatedSchema = fieldsToJsonSchema(fields);

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pages')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing
            ? (language === 'en' ? 'Edit Schema' : 'Schema bearbeiten')
            : (language === 'en' ? 'New Schema' : 'Neues Schema')}
        </h1>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            <span>{language === 'en' ? 'Schema Information' : 'Schema-Informationen'}</span>
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Basic details about this page schema'
              : 'Grundlegende Details zu diesem Seitenschema'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schema-name" className="text-base font-semibold">Name</Label>
              <Input
                id="schema-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Landing Page' : 'z.B. Landing Page'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schema-desc" className="text-base font-semibold">
                {language === 'en' ? 'Description' : 'Beschreibung'}
              </Label>
              <Textarea
                id="schema-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' ? 'What is this schema for?' : 'Wofür ist dieses Schema gedacht?'}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schema Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏗️</span>
            <span>{language === 'en' ? 'Schema Structure' : 'Schema-Struktur'}</span>
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Define the JSON fields that make up this page schema'
              : 'Definiere die JSON-Felder, die dieses Seitenschema ausmachen'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <FieldEditor
              key={index}
              field={field}
              onChange={(updated) => {
                const newFields = [...fields];
                newFields[index] = updated;
                setFields(newFields);
              }}
              onRemove={() => setFields(fields.filter((_, i) => i !== index))}
            />
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setFields([...fields, emptyField()])}
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Field' : 'Feld hinzufügen'}
          </Button>
        </CardContent>
      </Card>

      {/* LLM Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🤖</span>
            <span>{language === 'en' ? 'LLM Instructions' : 'LLM-Anweisungen'}</span>
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Custom instructions for the AI agent that builds the frontend template'
              : 'Individuelle Anweisungen für den KI-Agenten, der das Frontend-Template erstellt'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={llmInstructions}
            onChange={(e) => setLlmInstructions(e.target.value)}
            placeholder={language === 'en'
              ? 'Describe how the frontend should render this page structure...'
              : 'Beschreibe, wie das Frontend diese Seitenstruktur rendern soll...'}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>👁️</span>
              <span>{language === 'en' ? 'Schema Preview' : 'Schema-Vorschau'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview
                ? (language === 'en' ? 'Hide' : 'Ausblenden')
                : (language === 'en' ? 'Show' : 'Anzeigen')}
            </Button>
          </CardTitle>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
              {JSON.stringify(generatedSchema, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {isEditing && existingSchema && existingSchema.registration_status === 'pending' && (
            <Button variant="outline" onClick={handleStartRegistration}>
              {language === 'en' ? 'Start Registration' : 'Registrierung starten'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/pages')}>
            {language === 'en' ? 'Cancel' : 'Abbrechen'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-[150px]">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'en' ? 'Saving...' : 'Speichern...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Save Schema' : 'Schema speichern'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchemaEditor;
