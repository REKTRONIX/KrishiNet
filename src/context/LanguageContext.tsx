import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, translations, LANGUAGE_OPTIONS, LanguageOption } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languageOptions: LanguageOption[];
  translateCrop: (crop: string) => string;
  translateLocation: (location: string) => string;
}

const cropNameMap: Record<string, Record<Language, string>> = {
  'Bt Cotton (Bollgard II)': {
    en: 'Bt Cotton (Bollgard II)',
    hi: 'बीटी कपास (बोलगार्ड II)',
    mr: 'बीटी कापूस (बोलगार्ड II)',
  },
  'Bt Cotton': {
    en: 'Bt Cotton',
    hi: 'बीटी कपास',
    mr: 'बीटी कापूस',
  },
  'Soybean (JS-335)': {
    en: 'Soybean (JS-335)',
    hi: 'सोयाबीन (JS-335)',
    mr: 'सोयाबीन (JS-335)',
  },
  'Soybean': {
    en: 'Soybean',
    hi: 'सोयाबीन',
    mr: 'सोयाबीन',
  },
  'Wheat (HD-2967)': {
    en: 'Wheat (HD-2967)',
    hi: 'गेहूं (HD-2967)',
    mr: 'गहू (HD-2967)',
  },
  'Wheat': {
    en: 'Wheat',
    hi: 'गेहूं',
    mr: 'गहू',
  },
  'Sugarcane (Co-86032)': {
    en: 'Sugarcane (Co-86032)',
    hi: 'गन्ना (Co-86032)',
    mr: 'ऊस (Co-86032)',
  },
  'Sugarcane': {
    en: 'Sugarcane',
    hi: 'गन्ना',
    mr: 'ऊस',
  },
};

const locationNameMap: Record<string, Record<Language, string>> = {
  'Wardha, Vidarbha Agro-Climatic Zone': {
    en: 'Wardha, Vidarbha Agro-Climatic Zone',
    hi: 'वर्धा, विदर्भ कृषि-मौसम क्षेत्र',
    mr: 'वर्धा, विदर्भ कृषी-हवामान विभाग',
  },
  'Ludhiana, Central Punjab Plain': {
    en: 'Ludhiana, Central Punjab Plain',
    hi: 'लुधियाना, मध्य पंजाब मैदानी क्षेत्र',
    mr: 'लुधियाना, मध्य पंजाब सुपीक मैदान',
  },
  'Kolhapur, Western Maharashtra Basin': {
    en: 'Kolhapur, Western Maharashtra Basin',
    hi: 'कोल्हापुर, पश्चिमी महाराष्ट्र बेसिन',
    mr: 'कोल्हापूर, पश्चिम महाराष्ट्र खोरे',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'krishinet_agro_lang_pref';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
        return saved;
      }
    } catch {
      // localStorage may not be accessible in some iframe setups
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const translateCrop = (crop: string): string => {
    const match = cropNameMap[crop];
    if (match && match[language]) {
      return match[language];
    }
    // Check partial matches
    for (const key of Object.keys(cropNameMap)) {
      if (crop.toLowerCase().includes(key.toLowerCase())) {
        return cropNameMap[key][language];
      }
    }
    return crop;
  };

  const translateLocation = (loc: string): string => {
    const match = locationNameMap[loc];
    if (match && match[language]) {
      return match[language];
    }
    return loc;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] || translations.en,
    languageOptions: LANGUAGE_OPTIONS,
    translateCrop,
    translateLocation,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
