import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'de';
export type LayoutMode = 'sidebar' | 'navbar';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  layoutMode: LayoutMode;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  changeLanguage: (lang: Language) => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('app_language');
    return (stored === 'en' || stored === 'de') ? stored : 'en';
  });
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem('app_layout_mode');
    return (stored === 'sidebar' || stored === 'navbar') ? stored : 'sidebar';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'de' : 'en';
      localStorage.setItem('app_language', next);
      return next;
    });
  };

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem('app_layout_mode', mode);
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  return (
    <ThemeContext.Provider value={{ theme, language, layoutMode, toggleTheme, toggleLanguage, changeLanguage, setLayoutMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
