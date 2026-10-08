import i18n from './i18n';

export type ApiMessage = string | { message: string; messageKey: string; messageParams?: Record<string, string | number | boolean> };

const reservedOptions = new Set(['lng', 'lngs', 'ns', 'defaultValue', 'context', 'returnObjects', 'returnDetails', 'keySeparator', 'nsSeparator', 'postProcess', 'interpolation']);
const knownKey = (key: string) => !key.includes(':') && i18n.exists(key, { ns: 'server' });

// Only server-declared keys present in our shipped dictionary are interpreted.
export function apiMessage(value: unknown): ApiMessage {
  if (typeof value === 'string') return value;
  const data = value as Record<string, unknown> | null;
  const message = typeof data?.rawMessage === 'string' ? data.rawMessage : typeof data?.message === 'string' ? data.message : '';
  if (typeof data?.messageKey !== 'string' || !knownKey(data.messageKey)) return message;
  const params = data.messageParams;
  return { message, messageKey: data.messageKey, messageParams: params && typeof params === 'object' && !Array.isArray(params)
    ? Object.fromEntries(Object.entries(params).filter(([key, v]) => !reservedOptions.has(key) && ['string', 'number', 'boolean'].includes(typeof v))) as Record<string, string | number | boolean> : undefined };
}

export function displayApiMessage(value: ApiMessage): string {
  if (typeof value === 'string') return value;
  return knownKey(value.messageKey)
    ? String(i18n.t(value.messageKey, { ...value.messageParams, ns: 'server', lng: i18n.resolvedLanguage === 'fr' ? 'fr' : 'en' })) : value.message;
}
