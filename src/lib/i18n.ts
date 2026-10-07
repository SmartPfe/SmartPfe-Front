import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';
import enSettings from '@/locales/en/settings.json';
import frSettings from '@/locales/fr/settings.json';
import enControls from '@/locales/en/controls.json';
import frControls from '@/locales/fr/controls.json';
import enShell from '@/locales/en/shell.json';
import frShell from '@/locales/fr/shell.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, settings: enSettings, controls: enControls, shell: enShell },
    fr: { common: frCommon, settings: frSettings, controls: frControls, shell: frShell },
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
