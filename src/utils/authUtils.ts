import { User } from '../types/auth';

interface ErrorLogData {
  error: string;
  stack?: string;
  componentStack?: string;
  location: string;
  timestamp: string;
  userId?: string;
}

export const AUTH_STORAGE_KEYS = {
  USER_AUTHENTICATED: 'user_authenticated',
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences'
} as const;

export const clearAuthStorage = (): void => {
  Object.values(AUTH_STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch (error) {
      console.warn(`Error clearing ${key}:`, error);
    }
  });
};

export const resetAuthState = (redirectPath: string = '/login'): void => {
  clearAuthStorage();
  window.location.href = redirectPath;
};

export const logAuthError = (
  error: Error, 
  componentStack?: string,
  user?: User | null
): void => {
  const errorData: ErrorLogData = {
    error: error.message,
    stack: error.stack,
    componentStack,
    location: window.location.href,
    timestamp: new Date().toISOString(),
    userId: user?.id
  };

  if (import.meta.env.DEV) {
    console.error('Auth Error:', errorData);
    return;
  }

  // TODO: Implement production error logging
  // sendErrorToLoggingService(errorData);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};