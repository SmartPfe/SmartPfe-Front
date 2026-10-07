import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';
import enSettings from '@/locales/en/settings.json';
import frSettings from '@/locales/fr/settings.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, settings: enSettings },
    fr: { common: frCommon, settings: frSettings },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (_languages, namespace, key) => {
    if (import.meta.env.DEV) console.warn(`[i18n] Missing translation: ${namespace}:${key}`);
  },
});

export default i18n;
