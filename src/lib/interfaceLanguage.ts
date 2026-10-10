export type InterfaceLanguage = 'en' | 'fr';
export const INTERFACE_LANGUAGE_STORAGE_KEY = 'smartpfe:uiLanguage';
export const normalizeInterfaceLanguage = (value: unknown): InterfaceLanguage => value === 'en' ? 'en' : 'fr';

// Project/content language is deliberately absent from this API.
export function initialInterfaceLanguage(user: { _id?: string; uiLanguage?: unknown } | null, deviceLanguage: unknown): InterfaceLanguage {
  return normalizeInterfaceLanguage(user?._id ? user.uiLanguage : deviceLanguage);
}
