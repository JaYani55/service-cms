import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import NotFound from '@/pages/NotFound';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/contexts/ThemeContext';
import { getPublicFormByShareSlug, submitFormAnswers } from '@/services/formService';
import type { FormAnswerValue, PublicFormDefinition } from '@/types/forms';
import { buildInitialAnswers } from '@/utils/forms';

const FormSharePage = () => {
  const { formShareSlug } = useParams<{ formShareSlug: string }>();
  const { language } = useTheme();
  const [formDefinition, setFormDefinition] = useState<PublicFormDefinition | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswerValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!formShareSlug) {
      setError('not-found');
      setIsLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        setIsLoading(true);
        const definition = await getPublicFormByShareSlug(formShareSlug);
        setFormDefinition(definition);
        setAnswers(buildInitialAnswers(definition.fields));
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load form.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadForm();
  }, [formShareSlug]);

  const requiredFieldNames = useMemo(
    () => new Set(formDefinition?.fields.filter((field) => field.required).map((field) => field.name) ?? []),
    [formDefinition],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error === 'Form not found.' || error === 'not-found') {
    return <NotFound />;
  }

  if (error === 'Authentication required.') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {language === 'en' ? 'Login required' : 'Anmeldung erforderlich'}
            </CardTitle>
            <CardDescription>
              {language === 'en'
                ? 'This form is only available to authenticated users.'
                : 'Dieses Formular ist nur für angemeldete Nutzer verfügbar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">{language === 'en' ? 'Go to login' : 'Zum Login'}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formDefinition) {
    return null;
  }

  const handleSubmit = async () => {
    if (!formShareSlug) return;

    const missingRequiredField = formDefinition.fields.find((field) => {
      if (!requiredFieldNames.has(field.name)) return false;
      if (field.type === 'checkbox') return answers[field.name] !== true;
      return answers[field.name] === null || answers[field.name] === '';
    });

    if (missingRequiredField) {
      toast.error(language === 'en'
        ? `Please fill ${missingRequiredField.label}.`
        : `Bitte ${missingRequiredField.label} ausfüllen.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await submitFormAnswers(formShareSlug, {
        answers,
        source_slug: formDefinition.form.share_slug || formShareSlug,
      }, 'share');
      setSubmitted(true);
      toast.success(language === 'en' ? 'Form submitted.' : 'Formular gesendet.');
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Failed to submit form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{formDefinition.form.name}</CardTitle>
            {formDefinition.form.description && <CardDescription>{formDefinition.form.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {submitted ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{language === 'en' ? 'Submission received' : 'Antwort erhalten'}</AlertTitle>
                <AlertDescription>
                  {language === 'en'
                    ? 'Thank you. Your answer has been stored successfully.'
                    : 'Danke. Deine Antwort wurde erfolgreich gespeichert.'}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {formDefinition.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                    {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'date' || field.type === 'number') && (
                      <Input
                        id={field.name}
                        type={field.type === 'number' ? 'number' : field.type}
                        value={String(answers[field.name] ?? '')}
                        placeholder={field.placeholder}
                        onChange={(event) => setAnswers((current) => ({
                          ...current,
                          [field.name]: field.type === 'number' ? event.target.value : event.target.value,
                        }))}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        value={String(answers[field.name] ?? '')}
                        placeholder={field.placeholder}
                        rows={5}
                        onChange={(event) => setAnswers((current) => ({ ...current, [field.name]: event.target.value }))}
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-3 rounded-md border p-3">
                        <Checkbox
                          id={field.name}
                          checked={answers[field.name] === true}
                          onCheckedChange={(checked) => setAnswers((current) => ({ ...current, [field.name]: checked === true }))}
                        />
                        <Label htmlFor={field.name} className="mb-0">{field.placeholder || field.label}</Label>
                      </div>
                    )}

                    {(field.type === 'select' || field.type === 'radio') && field.options && (
                      <Select
                        value={String(answers[field.name] ?? '')}
                        onValueChange={(value) => setAnswers((current) => ({ ...current, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || field.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'single-select' && field.options && (
                      <Select
                        value={String(answers[field.name] ?? '')}
                        onValueChange={(value) => setAnswers((current) => ({ ...current, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || field.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'multi-select' && field.options && (
                      <div className="space-y-2 rounded-md border p-3">
                        {field.options.map((option) => {
                          const currentValues = Array.isArray(answers[field.name]) ? answers[field.name] as string[] : [];
                          const checked = currentValues.includes(option);
                          return (
                            <div key={option} className="flex items-center gap-3">
                              <Checkbox
                                id={`${field.name}-${option}`}
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  const updatedValues = nextChecked === true
                                    ? Array.from(new Set([...currentValues, option]))
                                    : currentValues.filter((entry) => entry !== option);
                                  setAnswers((current) => ({ ...current, [field.name]: updatedValues }));
                                }}
                              />
                              <Label htmlFor={`${field.name}-${option}`} className="mb-0">{option}</Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <Button onClick={() => void handleSubmit()} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {language === 'en' ? 'Submit' : 'Absenden'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormSharePage;