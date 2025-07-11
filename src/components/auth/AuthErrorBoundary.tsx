import React from 'react';
import { Button } from "@/components/ui/button";
import { useTheme } from "../../contexts/ThemeContext";
import { resetAuthState, logAuthError } from '../../utils/authUtils';

interface Props {
  children: React.ReactNode;
  language: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const translations = {
  en: {
    title: "Authentication Error",
    message: "We encountered an error with the authentication system. Please try logging in again.",
    button: "Return to Login"
  },
  de: {
    title: "Authentifizierungsfehler",
    message: "Bei der Authentifizierung ist ein Fehler aufgetreten. Bitte versuchen Sie erneut sich anzumelden.",
    button: "Zurück zum Login"
  }
} as const;

class AuthErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logAuthError(error, errorInfo.componentStack);
  }

  private handleReset = (): void => {
    resetAuthState('/login');
  };

  public render(): React.ReactNode {
    const { hasError } = this.state;
    const { language, children } = this.props;
    const t = translations[language as keyof typeof translations];

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">{t.title}</h2>
          <p className="mb-8 max-w-md">{t.message}</p>
          <Button onClick={this.handleReset}>{t.button}</Button>
        </div>
      );
    }

    return children;
  }
}

export const AuthErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { language } = useTheme();
  return <AuthErrorBoundary language={language}>{children}</AuthErrorBoundary>;
};