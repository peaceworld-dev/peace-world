import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, LANGUAGES } from "./translations";

const STORAGE_KEY = "peace_world_language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => any;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    } else {
      // Try to guess from browser language
      const browserLang = navigator.language?.slice(0, 2);
      if (browserLang && translations[browserLang as Language]) {
        setLanguageState(browserLang as Language);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  const t = (path: string): any => {
    const value = getByPath(translations[language], path);
    if (value !== undefined) return value;
    // Fallback to Portuguese if a key is missing in the selected language
    const fallback = getByPath(translations.pt, path);
    return fallback !== undefined ? fallback : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
