// ═══════════════════════════════════════════════════════════════════
// Language Context for i18n
// ═══════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { ru } from './locales/ru';
import type { TranslationKeys } from './locales/en';

type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const translations = {
  en,
  ru,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'pressure-test-visualizer-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Load language from localStorage on initialization
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (savedLanguage === 'en' || savedLanguage === 'ru') ? savedLanguage : 'en';
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
