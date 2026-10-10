import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, Check } from 'lucide-react';
import { useInterfaceLanguage } from '@/context/InterfaceLanguageContext';
import { cn } from '@/lib/utils';

export interface LanguageSelectorProps {
  variant?: 'card' | 'compact' | 'minimal' | 'menu';
  compact?: boolean;
  inverse?: boolean;
  className?: string;
  description?: string;
}

export default function LanguageSelector({
  variant,
  compact = false,
  inverse = false,
  className,
  description,
}: LanguageSelectorProps) {
  const { t } = useTranslation<'common'>('common');
  const { uiLanguage, setUiLanguage, isSaving, error } = useInterfaceLanguage();
  const id = useId();

  // Determine effective variant: if variant is explicitly provided use it; otherwise if compact, default to 'menu'
  const resolvedVariant = variant || (compact ? 'menu' : 'card');

  // Minimal variant: Ultra-clean segmented pill [ EN | FR ] for headers / navbars
  if (resolvedVariant === 'minimal') {
    return (
      <div
        role="group"
        aria-label={t('language')}
        className={cn(
          'inline-flex items-center rounded-lg border p-0.5 text-xs font-semibold',
          inverse
            ? 'border-white/15 bg-white/5'
            : 'border-outline-variant/60 bg-surface-container-low',
          className
        )}
      >
        {(['en', 'fr'] as const).map(language => (
          <button
            key={language}
            type="button"
            aria-pressed={uiLanguage === language}
            disabled={isSaving}
            onClick={(e) => {
              e.stopPropagation();
              void setUiLanguage(language);
            }}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:opacity-60',
              uiLanguage === language
                ? inverse
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'bg-surface text-primary shadow-2xs font-bold'
                : inverse
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            )}
          >
            {language.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Menu variant: Clean dropdown row matching standard profile menu items
  if (resolvedVariant === 'menu') {
    return (
      <div className={cn('w-full flex items-center justify-between px-3.5 py-2 text-xs text-on-surface transition-colors', className)}>
        <div className="flex items-center gap-2.5">
          <Globe2 size={15} className="text-on-surface-variant shrink-0" />
          <span className="font-medium text-on-surface">{t('language')}</span>
        </div>
        <div
          role="group"
          aria-label={t('language')}
          className="inline-flex items-center rounded-md border border-outline-variant/60 bg-surface-container-low p-0.5"
        >
          {(['en', 'fr'] as const).map(language => (
            <button
              key={language}
              type="button"
              aria-pressed={uiLanguage === language}
              disabled={isSaving}
              onClick={(e) => {
                e.stopPropagation();
                void setUiLanguage(language);
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:opacity-60',
                uiLanguage === language
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Card variant (default for Settings pages)
  return (
    <section className={cn('rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', inverse ? 'bg-white/10 text-slate-300' : 'border border-primary/20 bg-primary/10 text-primary')}>
            <Globe2 size={18} />
          </span>
          <div>
            <h2 id={id} className={cn('text-sm font-semibold', inverse ? 'text-slate-300' : 'text-on-surface')}>{t('interfaceLanguage')}</h2>
            <p id={`${id}-help`} className="mt-1 max-w-md text-xs leading-relaxed text-on-surface-variant">{description ?? t('languageHelp')}</p>
          </div>
        </div>
        <div role="group" aria-labelledby={id} aria-describedby={`${id}-help`} className={cn('inline-flex self-start rounded-lg border p-1 sm:self-auto', inverse ? 'border-white/15 bg-white/5' : 'border-outline-variant/70 bg-surface-container-low')}>
          {(['en', 'fr'] as const).map(language => (
            <button
              key={language}
              type="button"
              aria-pressed={uiLanguage === language}
              disabled={isSaving}
              onClick={() => void setUiLanguage(language)}
              className={cn(
                'inline-flex items-center rounded-md px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60',
                uiLanguage === language
                  ? (inverse ? 'bg-white text-slate-900 shadow-sm font-bold' : 'bg-surface-container-lowest text-primary shadow-sm font-bold')
                  : (inverse ? 'text-slate-300 hover:bg-white/10' : 'text-on-surface-variant hover:bg-surface-container')
              )}
            >
              {language === 'en' ? 'English' : 'Français'}
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
