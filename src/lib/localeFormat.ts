import type { InterfaceLanguage } from './interfaceLanguage';

const locale = (language: InterfaceLanguage) => language === 'fr' ? 'fr-FR' : 'en-GB';
export const formatInterfaceNumber = (value: number, language: InterfaceLanguage, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(locale(language), options).format(value);
export const formatInterfaceDate = (value: Date | number, language: InterfaceLanguage, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale(language), options).format(value);
export const formatInterfaceRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit, language: InterfaceLanguage) =>
  new Intl.RelativeTimeFormat(locale(language), { numeric: 'auto' }).format(value, unit);
