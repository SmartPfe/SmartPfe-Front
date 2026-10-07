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
import enAuth from '@/locales/en/auth.json';
import frAuth from '@/locales/fr/auth.json';
import enOnboarding from '@/locales/en/onboarding.json';
import frOnboarding from '@/locales/fr/onboarding.json';
import enLanding from '@/locales/en/landing.json';
import frLanding from '@/locales/fr/landing.json';
import enDesign from '@/locales/en/design.json';
import frDesign from '@/locales/fr/design.json';
import enPlanning from '@/locales/en/planning.json';
import frPlanning from '@/locales/fr/planning.json';
import enAnalysis from '@/locales/en/analysis.json';
import frAnalysis from '@/locales/fr/analysis.json';
import enOutline from '@/locales/en/outline.json';
import frOutline from '@/locales/fr/outline.json';
import enReport from '@/locales/en/report.json';
import frReport from '@/locales/fr/report.json';
import enDelivery from '@/locales/en/delivery.json';
import frDelivery from '@/locales/fr/delivery.json';
import enJury from '@/locales/en/jury.json';
import frJury from '@/locales/fr/jury.json';

import enCreditHistory from '@/locales/en/creditHistory.json';
import frCreditHistory from '@/locales/fr/creditHistory.json';
import enAdminCredits from '@/locales/en/adminCredits.json';
import frAdminCredits from '@/locales/fr/adminCredits.json';
import enAdminManagement from '@/locales/en/adminManagement.json';
import frAdminManagement from '@/locales/fr/adminManagement.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, settings: enSettings, controls: enControls, shell: enShell, auth: enAuth, onboarding: enOnboarding, landing: enLanding, design: enDesign, planning: enPlanning, analysis: enAnalysis, outline: enOutline, report: enReport, delivery: enDelivery, jury: enJury, creditHistory: enCreditHistory, adminCredits: enAdminCredits, adminManagement: enAdminManagement },
    fr: { common: frCommon, settings: frSettings, controls: frControls, shell: frShell, auth: frAuth, onboarding: frOnboarding, landing: frLanding, design: frDesign, planning: frPlanning, analysis: frAnalysis, outline: frOutline, report: frReport, delivery: frDelivery, jury: frJury, creditHistory: frCreditHistory, adminCredits: frAdminCredits, adminManagement: frAdminManagement },
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
