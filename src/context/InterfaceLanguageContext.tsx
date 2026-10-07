import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { API_BASE_URL } from '@/lib/api';
import { initialInterfaceLanguage, INTERFACE_LANGUAGE_STORAGE_KEY, normalizeInterfaceLanguage, type InterfaceLanguage } from '@/lib/interfaceLanguage';

function readSession() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user, identity: token && user?._id ? `${user._id}:${token}` : '' };
  } catch {
    return { token: null, user: null, identity: '' };
  }
}

function readDeviceLanguage() {
  try { return localStorage.getItem(INTERFACE_LANGUAGE_STORAGE_KEY); }
  catch { return null; }
}

type LanguageContext = {
  uiLanguage: InterfaceLanguage;
  setUiLanguage: (language: InterfaceLanguage) => Promise<void>;
  isSaving: boolean;
  error: boolean;
};
const Context = createContext<LanguageContext | null>(null);

export function InterfaceLanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [uiLanguage, setLanguage] = useState<InterfaceLanguage>(() => {
    const session = readSession();
    return initialInterfaceLanguage(session.identity ? session.user : null, readDeviceLanguage());
  });
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const identity = useRef<string | null>(null);
  const revision = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    void i18n.changeLanguage(uiLanguage);
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const syncSession = useCallback(() => {
    const session = readSession();
    if (identity.current === session.identity) return;
    identity.current = session.identity;
    const currentRevision = ++revision.current;
    setSaving(false);
    saving.current = false;
    setError(false);
    setLanguage(initialInterfaceLanguage(session.identity ? session.user : null, readDeviceLanguage()));
    if (!session.identity) return;
    // A separate preference read never enters project or generation state.
    void fetch(`${API_BASE_URL}/auth/preferences`, {
      headers: { Authorization: `Bearer ${session.token}` },
    }).then(async response => {
      if (!response.ok) return;
      const preference = await response.json();
      if (revision.current !== currentRevision || readSession().identity !== session.identity) return;
      const language = normalizeInterfaceLanguage(preference.uiLanguage);
      const latest = readSession();
      localStorage.setItem('user', JSON.stringify({ ...latest.user, uiLanguage: language }));
      setLanguage(language);
    }).catch(() => { /* Keep cached preference; do not disturb authentication. */ });
  }, []);

  useEffect(() => {
    syncSession();
    const syncStoredPreference = (event: StorageEvent) => {
      if (event.key !== null && !['user', 'token', INTERFACE_LANGUAGE_STORAGE_KEY].includes(event.key)) return;
      const session = readSession();
      if (identity.current !== session.identity) { syncSession(); return; }
      // A current in-tab save takes precedence over another tab's cached value.
      if (saving.current) return;
      ++revision.current;
      setLanguage(initialInterfaceLanguage(session.identity ? session.user : null, readDeviceLanguage()));
    };
    window.addEventListener('user-updated', syncSession);
    window.addEventListener('storage', syncStoredPreference);
    return () => {
      window.removeEventListener('user-updated', syncSession);
      window.removeEventListener('storage', syncStoredPreference);
    };
  }, [syncSession, location.pathname]);

  const setUiLanguage = useCallback(async (language: InterfaceLanguage) => {
    if (language !== 'en' && language !== 'fr') return;
    const session = readSession();
    const currentRevision = ++revision.current;
    const previousLanguage = uiLanguage;
    setLanguage(language);
    setError(false);
    if (!session.identity) {
      try { localStorage.setItem(INTERFACE_LANGUAGE_STORAGE_KEY, language); }
      catch { setLanguage(previousLanguage); setError(true); }
      return;
    }
    setSaving(true);
    saving.current = true;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/preferences`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uiLanguage: language }),
      });
      if (!response.ok) throw new Error('Preference save failed');
      if (revision.current !== currentRevision || readSession().identity !== session.identity) return;
      const latest = readSession();
      localStorage.setItem('user', JSON.stringify({ ...latest.user, uiLanguage: language }));
      localStorage.setItem(INTERFACE_LANGUAGE_STORAGE_KEY, language);
      window.dispatchEvent(new Event('user-updated'));
    } catch {
      if (revision.current === currentRevision && readSession().identity === session.identity) {
        setLanguage(previousLanguage);
        setError(true);
      }
    } finally {
      if (revision.current === currentRevision) {
        saving.current = false;
        setSaving(false);
      }
    }
  }, [uiLanguage]);

  return <Context.Provider value={{ uiLanguage, setUiLanguage, isSaving, error }}>{children}</Context.Provider>;
}

export function useInterfaceLanguage() {
  const context = useContext(Context);
  if (!context) throw new Error('InterfaceLanguageProvider is required');
  return context;
}
