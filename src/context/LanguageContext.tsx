import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Language {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: 'hr', label: 'Croatian', flag: '🇭🇷', nativeName: 'Hrvatski' },
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'de', label: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'fr', label: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'it', label: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
];

const STORAGE_KEY = 'scrollpedia_language';

interface LanguageContextValue {
  lang: string;
  language: Language;
  setLang: (code: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'hr',
  language: LANGUAGES[0],
  setLang: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('hr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && LANGUAGES.find((l) => l.code === saved)) setLangState(saved);
    });
  }, []);

  async function setLang(code: string) {
    setLangState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }

  const language = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, language, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
