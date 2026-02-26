import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Globe, Clock, CheckCircle2, AlertCircle,
  Loader2, Copy, ExternalLink, Sparkles, ArrowRight, ChevronDown, ChevronRight, Play,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getSchemas, groupSchemasByTLD, checkDomainHealthDirect, startSchemaRegistration } from '@/services/pageService';
import type { PageSchema, TLDGroup } from '@/types/pagebuilder';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const statusConfig: Record<string, { label: { en: string; de: string }; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: { en: 'Pending', de: 'Ausstehend' }, variant: 'secondary', icon: Clock },
  waiting: { label: { en: 'Waiting', de: 'Wartet' }, variant: 'outline', icon: Loader2 },
  registered: { label: { en: 'Active', de: 'Aktiv' }, variant: 'default', icon: CheckCircle2 },
  archived: { label: { en: 'Archived', de: 'Archiviert' }, variant: 'destructive', icon: AlertCircle },
};

// ─── Onboarding Empty State ─────────────────────────────────────────────────

interface OnboardingScreenProps {
  language: string;
  schemas: PageSchema[];
  onCreateSchema: () => void;
  onNavigateSchema: (slug: string) => void;
  onRefresh: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ language, schemas, onCreateSchema, onNavigateSchema, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [startingRegId, setStartingRegId] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(language === 'en' ? 'Copied!' : 'Kopiert!');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleStartRegistration = async (schemaId: string) => {
    setStartingRegId(schemaId);
    try {
      await startSchemaRegistration(schemaId);
      toast.success(language === 'en' ? 'Registration started — code generated' : 'Registrierung gestartet — Code generiert');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start registration');
    } finally {
      setStartingRegId(null);
    }
  };

  // Build dynamic prompt that includes registration codes for waiting schemas
  const waitingSchemas = schemas.filter(s => s.registration_status === 'waiting');
  const dynamicPrompt = (() => {
    let prompt = `Navigate to the CMS API to discover available schemas:
  ${API_URL}/api/schemas

Pick a schema, fetch its spec_url, then build a
Next.js (or SvelteKit) frontend that renders pages
matching that schema from Supabase.

After deploying, register your frontend by POSTing to
the schema's register_url with the registration code,
your domain URL, and revalidation endpoint.`;

    if (waitingSchemas.length > 0) {
      prompt += '\n\n--- ACTIVE REGISTRATION CODES ---';
      for (const s of waitingSchemas) {
        prompt += `\nSchema: ${s.name} (${s.slug})`;
        prompt += `\n  Code: ${s.registration_code}`;
        prompt += `\n  Spec: ${API_URL}/api/schemas/${s.slug}/spec.txt`;
        prompt += `\n  Register: POST ${API_URL}/api/schemas/${s.slug}/register`;
      }
    }

    prompt += `\n\nMCP endpoint for agent integration:
  ${API_URL}/mcp`;

    return prompt;
  })();

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          {language === 'en' ? 'Pages' : 'Seiten'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en'
            ? 'Manage page schemas and content across your frontends'
            : 'Verwalte Seitenschemas und Inhalte für deine Frontends'}
        </p>
      </div>

      {/* Pending Onboarding Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 dark:border-amber-600/40">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative p-8 space-y-8">
          {/* Status indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-200/60 dark:bg-amber-800/40 border border-amber-300 dark:border-amber-700">
              <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {language === 'en' ? 'No frontends connected yet' : 'Noch keine Frontends verbunden'}
              </span>
            </div>
          </div>

          {/* Main instruction */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-200/50 dark:bg-amber-800/30 mb-2">
              <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {language === 'en' ? 'Connect a Frontend to Get Started' : 'Verbinde ein Frontend, um loszulegen'}
            </h2>
            <p className="text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
              {language === 'en'
                ? 'The CMS manages pages for your frontends. Each frontend runs on its own domain (TLD) and can serve multiple page schemas. Connect your first domain to start creating and publishing content.'
                : 'Das CMS verwaltet Seiten für deine Frontends. Jedes Frontend läuft auf einer eigenen Domain (TLD) und kann mehrere Seitenschemas bedienen. Verbinde deine erste Domain, um Inhalte zu erstellen und zu veröffentlichen.'}
            </p>
          </div>

          {/* What is a TLD section */}
          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-5 border border-amber-200/80 dark:border-amber-700/40 space-y-3">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'How Domains (TLDs) Work' : 'Wie Domains (TLDs) funktionieren'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
              <div className="space-y-2">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  {language === 'en' ? 'One domain = one frontend app' : 'Eine Domain = eine Frontend-App'}
                </p>
                <p>
                  {language === 'en'
                    ? 'Each TLD (e.g. example.com, blog.yoursite.de) represents one deployed frontend. The CMS sends content to it and monitors its health.'
                    : 'Jede TLD (z.B. example.com, blog.deinsite.de) repräsentiert ein deployed Frontend. Das CMS sendet Inhalte dorthin und überwacht die Erreichbarkeit.'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  {language === 'en' ? 'Multiple schemas per domain' : 'Mehrere Schemas pro Domain'}
                </p>
                <p>
                  {language === 'en'
                    ? 'A single domain can handle multiple schemas (e.g. product pages + blog posts). All schemas sharing a domain are grouped together and share one health ping.'
                    : 'Eine Domain kann mehrere Schemas bedienen (z.B. Produktseiten + Blogbeiträge). Alle Schemas einer Domain werden gruppiert und teilen sich einen Health-Ping.'}
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              {language === 'en' ? 'How to Connect' : 'So verbindest du ein Frontend'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-amber-200/80 dark:border-amber-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-amber-400 text-amber-700 dark:text-amber-400 text-xs font-bold">1</Badge>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  {language === 'en' ? 'Pick a Schema' : 'Schema wählen'}
                </h3>
              </div>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                {language === 'en'
                  ? 'Use a default schema below or create a custom one with your own fields and sections.'
                  : 'Nutze ein Standard-Schema unten oder erstelle ein eigenes mit deinen Feldern und Abschnitten.'}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-amber-200/80 dark:border-amber-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-amber-400 text-amber-700 dark:text-amber-400 text-xs font-bold">2</Badge>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  {language === 'en' ? 'Start Registration' : 'Registrierung starten'}
                </h3>
              </div>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                {language === 'en'
                  ? 'Open the schema and click "Start Registration". You\'ll get a spec URL and a registration code.'
                  : 'Öffne das Schema und klicke auf „Registrierung starten". Du erhältst eine Spec-URL und einen Registrierungscode.'}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-amber-200/80 dark:border-amber-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-amber-400 text-amber-700 dark:text-amber-400 text-xs font-bold">3</Badge>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  {language === 'en' ? 'Build & Deploy' : 'Bauen & Deployen'}
                </h3>
              </div>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                {language === 'en'
                  ? 'Give the spec URL to an AI agent or developer. They build a Next.js / SvelteKit frontend and deploy it to a domain.'
                  : 'Gib die Spec-URL an einen KI-Agenten oder Entwickler. Dieser baut ein Next.js / SvelteKit-Frontend und deployed es auf eine Domain.'}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-amber-200/80 dark:border-amber-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-amber-400 text-amber-700 dark:text-amber-400 text-xs font-bold">4</Badge>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  {language === 'en' ? 'Register Domain' : 'Domain registrieren'}
                </h3>
              </div>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                {language === 'en'
                  ? 'The frontend POSTs its domain URL + registration code to the API. The TLD appears here with a health ping.'
                  : 'Das Frontend sendet seine Domain-URL + Registrierungscode an die API. Die TLD erscheint hier mit Health-Ping.'}
              </p>
            </div>
            </div>
          </div>

          <Separator className="bg-amber-200/60 dark:bg-amber-700/30" />

          {/* API Endpoints */}
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'Your API Endpoints' : 'Deine API-Endpunkte'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 shrink-0">
                  REST
                </Badge>
                <code className="flex-1 bg-white/70 dark:bg-black/30 border border-amber-200 dark:border-amber-700/50 px-4 py-2 rounded-lg text-sm font-mono text-amber-900 dark:text-amber-200 select-all">
                  {API_URL}/api/schemas
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 h-8 w-8"
                  onClick={() => handleCopy(`${API_URL}/api/schemas`)}
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 shrink-0">
                  MCP
                </Badge>
                <code className="flex-1 bg-white/70 dark:bg-black/30 border border-amber-200 dark:border-amber-700/50 px-4 py-2 rounded-lg text-sm font-mono text-amber-900 dark:text-amber-200 select-all">
                  {API_URL}/mcp
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 h-8 w-8"
                  onClick={() => handleCopy(`${API_URL}/mcp`)}
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />}
                </Button>
              </div>
              <p className="text-xs text-amber-800/60 dark:text-amber-300/50 mt-1">
                {language === 'en'
                  ? 'The REST endpoint returns all schemas as JSON. The MCP endpoint exposes tools for agent integration (list_schemas, get_schema_spec, register_frontend, check_health).'
                  : 'Der REST-Endpunkt liefert alle Schemas als JSON. Der MCP-Endpunkt stellt Tools für Agent-Integration bereit (list_schemas, get_schema_spec, register_frontend, check_health).'}
              </p>
            </div>
          </div>

          {/* Example Prompt */}
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'en' ? 'Example Agent Prompt' : 'Beispiel-Prompt für den Agenten'}
            </h3>
            <div className="relative">
              <pre className="bg-white/70 dark:bg-black/30 border border-amber-200 dark:border-amber-700/50 p-4 rounded-lg text-xs font-mono text-amber-900/90 dark:text-amber-200/80 whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
{dynamicPrompt}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30"
                onClick={() => handleCopy(dynamicPrompt)}
              >
                <Copy className="h-3 w-3 mr-1" />
                {language === 'en' ? 'Copy' : 'Kopieren'}
              </Button>
            </div>
          </div>

          {/* Available Schemas */}
          {schemas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {language === 'en' ? 'Available Schemas' : 'Verfügbare Schemas'}
              </h3>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                {language === 'en'
                  ? 'These schemas are ready to use. Click one to view its spec or start the registration process.'
                  : 'Diese Schemas sind einsatzbereit. Klicke auf eines, um die Spec anzuzeigen oder die Registrierung zu starten.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schemas.map((schema) => {
                  const status = statusConfig[schema.registration_status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isPending = schema.registration_status === 'pending';
                  const isWaiting = schema.registration_status === 'waiting';
                  const isStarting = startingRegId === schema.id;
                  return (
                    <div
                      key={schema.id}
                      className="bg-white/70 dark:bg-black/30 rounded-xl p-4 border border-amber-200/80 dark:border-amber-700/40 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => onNavigateSchema(schema.slug)}>
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="font-medium text-sm text-amber-900 dark:text-amber-100 truncate">{schema.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {schema.is_default && (
                            <Badge variant="outline" className="text-[10px] h-5 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400">
                              {language === 'en' ? 'Default' : 'Standard'}
                            </Badge>
                          )}
                          <Badge variant={status.variant} className="flex items-center gap-1 text-[10px]">
                            <StatusIcon className={`h-2.5 w-2.5 ${isWaiting ? 'animate-spin' : ''}`} />
                            {status.label[language]}
                          </Badge>
                        </div>
                      </div>
                      {schema.description && (
                        <p className="text-xs text-amber-800/60 dark:text-amber-300/50 line-clamp-2">{schema.description}</p>
                      )}

                      {/* Registration Code display for waiting schemas */}
                      {isWaiting && schema.registration_code && (
                        <div className="bg-amber-100/60 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-300/50 dark:border-amber-700/30 space-y-1.5">
                          <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                            {language === 'en' ? 'Registration Code' : 'Registrierungscode'}
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white/80 dark:bg-black/30 px-3 py-1.5 rounded font-mono text-sm tracking-wider text-amber-900 dark:text-amber-200 select-all text-center">
                              {schema.registration_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-700 dark:text-amber-400 hover:bg-amber-200/50"
                              onClick={(e) => { e.stopPropagation(); handleCopy(schema.registration_code!); }}
                            >
                              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium cursor-pointer" onClick={() => onNavigateSchema(schema.slug)}>
                          {language === 'en' ? 'View schema' : 'Schema ansehen'}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                        {isPending && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isStarting}
                            onClick={(e) => { e.stopPropagation(); handleStartRegistration(schema.id); }}
                          >
                            {isStarting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                            {language === 'en' ? 'Start Registration' : 'Registrierung starten'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 min-w-[200px]"
              onClick={onCreateSchema}
            >
              <Plus className="h-5 w-5 mr-2" />
              {language === 'en' ? 'Create New Schema' : 'Neues Schema erstellen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TLD Domain Card ────────────────────────────────────────────────────────

interface TLDSectionProps {
  group: TLDGroup;
  language: string;
  onNavigate: (path: string) => void;
  defaultOpen?: boolean;
}

const TLDSection: React.FC<TLDSectionProps> = ({ group, language, onNavigate, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const schemaCount = group.schemas.length;
  const registeredCount = group.schemas.filter(s => s.registration_status === 'registered').length;

  const healthBadge = () => {
    if (!group.domain) return null;
    switch (group.health) {
      case 'online':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
            <Globe className="h-3 w-3" /> ONLINE
            {group.latency_ms !== undefined && <span className="text-[10px] opacity-80">({group.latency_ms}ms)</span>}
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Globe className="h-3 w-3" /> OFFLINE
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> ...
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`${!group.domain ? 'border-dashed border-amber-300 dark:border-amber-700' : ''}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                {group.domain ? (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{group.domain.replace(/^https?:\/\//, '')}</CardTitle>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg text-amber-700 dark:text-amber-400">
                      {language === 'en' ? 'Pending / Unassigned' : 'Ausstehend / Nicht zugeordnet'}
                    </CardTitle>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {healthBadge()}
                <Badge variant="outline" className="text-xs">
                  {schemaCount} {schemaCount === 1 ? 'Schema' : 'Schemas'}
                  {registeredCount > 0 && ` · ${registeredCount} ${language === 'en' ? 'active' : 'aktiv'}`}
                </Badge>
                {group.domain && (
                  <a
                    href={group.domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            {group.domain && (
              <CardDescription className="ml-11 text-xs">
                {group.domain}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.schemas.map((schema) => {
                const status = statusConfig[schema.registration_status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <Card
                    key={schema.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-muted"
                    onClick={() => onNavigate(`/pages/schema/${schema.slug}`)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{schema.name}</span>
                        </div>
                        <Badge variant={status.variant} className="flex items-center gap-1 text-[10px] shrink-0">
                          <StatusIcon className={`h-2.5 w-2.5 ${schema.registration_status === 'waiting' ? 'animate-spin' : ''}`} />
                          {status.label[language]}
                        </Badge>
                      </div>
                      {schema.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{schema.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {schema.is_default && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {language === 'en' ? 'Default' : 'Standard'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// ─── Main Pages Component ───────────────────────────────────────────────────

const Pages: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useTheme();
  const [schemas, setSchemas] = useState<PageSchema[]>([]);
  const [tldGroups, setTldGroups] = useState<TLDGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSchemas();
      setSchemas(data);

      const groups = groupSchemasByTLD(data);

      // Health check per unique domain
      for (const group of groups) {
        if (group.domain) {
          group.health = 'checking';
        }
      }
      setTldGroups([...groups]);

      // Fire health checks in parallel
      for (const group of groups) {
        if (group.domain) {
          checkDomainHealthDirect(group.domain).then(result => {
            setTldGroups(prev => prev.map(g =>
              g.domain === group.domain
                ? { ...g, health: result.status, latency_ms: result.latency_ms }
                : g
            ));
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schemas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndGroup();
  }, [fetchAndGroup]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // ── Empty state: no registered TLD → show onboarding (default schemas always exist)
  const hasRegisteredTLD = tldGroups.some(g => g.domain !== null);
  if (!hasRegisteredTLD) {
    return (
      <OnboardingScreen
        language={language}
        schemas={schemas}
        onCreateSchema={() => navigate('/pages/schema/new')}
        onNavigateSchema={(slug) => navigate(`/pages/schema/${slug}`)}
        onRefresh={fetchAndGroup}
      />
    );
  }

  // ── Populated state: TLD-grouped view
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'en' ? 'Pages' : 'Seiten'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'en'
              ? `${tldGroups.filter(g => g.domain).length} domain${tldGroups.filter(g => g.domain).length !== 1 ? 's' : ''} · ${schemas.length} schema${schemas.length !== 1 ? 's' : ''}`
              : `${tldGroups.filter(g => g.domain).length} Domain${tldGroups.filter(g => g.domain).length !== 1 ? 's' : ''} · ${schemas.length} Schema${schemas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => navigate('/pages/schema/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'en' ? 'New Schema' : 'Neues Schema'}
        </Button>
      </div>

      {/* TLD Groups */}
      <div className="space-y-4">
        {tldGroups.map((group, idx) => (
          <TLDSection
            key={group.domain || '__unassigned__'}
            group={group}
            language={language}
            onNavigate={navigate}
            defaultOpen={idx === 0 || tldGroups.length <= 3}
          />
        ))}
      </div>
    </div>
  );
};

export default Pages;
