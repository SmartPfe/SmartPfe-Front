import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, Check } from 'lucide-react';
import { useInterfaceLanguage } from '@/context/InterfaceLanguageContext';
import { cn } from '@/lib/utils';

export default function LanguageSelector({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const { t } = useTranslation<'common'>('common');
  const { uiLanguage, setUiLanguage, isSaving, error } = useInterfaceLanguage();
  const id = useId();
  return (
    <section className={compact ? 'inline-flex flex-col gap-2' : 'rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5'}>
      <div className={compact ? 'flex flex-wrap items-center gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
        <div className="flex items-center gap-3">
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', inverse ? 'bg-white/10 text-slate-300' : 'border border-primary/20 bg-primary/10 text-primary')}><Globe2 size={18} /></span>
          <div>
            <h2 id={id} className={cn('text-sm font-semibold', inverse ? 'text-slate-300' : 'text-on-surface')}>{t('interfaceLanguage')}</h2>
            {!compact && <p id={`${id}-help`} className="mt-1 max-w-md text-xs leading-relaxed text-on-surface-variant">{t('languageHelp')}</p>}
          </div>
        </div>
        <div role="group" aria-labelledby={id} aria-describedby={compact ? undefined : `${id}-help`} className={cn('inline-flex self-start rounded-lg border p-1 sm:self-auto', inverse ? 'border-white/15 bg-white/5' : 'border-outline-variant/70 bg-surface-container-low')}>
          {(['en', 'fr'] as const).map(language => (
            <button key={language} type="button" aria-pressed={uiLanguage === language} disabled={isSaving} onClick={() => void setUiLanguage(language)}
              className={cn('inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60',
                uiLanguage === language ? (inverse ? 'bg-white text-slate-900 shadow-sm' : 'bg-surface-container-lowest text-primary shadow-sm') : (inverse ? 'text-slate-300 hover:bg-white/10' : 'text-on-surface-variant hover:bg-surface-container'))}>
              {language === 'en' ? 'English' : 'Français'}
              {uiLanguage === language && <Check size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="text-xs">
        {isSaving && <p className="sr-only">{t('saving')}</p>}
        {error && <p role="alert" className="mt-2 text-red-600">{t('saveFailed')}</p>}
      </div>
    </section>
  );
}
