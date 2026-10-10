import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight, FileText, GraduationCap, Mail, ShieldCheck } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

type LegalSection = { id: string; title: string; paragraphs: string[]; pending?: string };

export default function Legal({ document }: { document: 'terms' | 'privacy' }) {
  const { t, i18n } = useTranslation('legal');
  const sections = t(`${document}.sections`, { returnObjects: true }) as LegalSection[];
  const title = t(`${document}.title`);
  const Icon = document === 'terms' ? FileText : ShieldCheck;
  const scrollContainer = useRef<HTMLDivElement>(null);
  const contentsList = useRef<HTMLOListElement>(null);
  const [activeSection, setActiveSection] = useState('operator');
  const sectionIds = sections.map(section => `${document}-${section.id}`).join(',');

  useEffect(() => {
    const previous = window.document.title;
    window.document.title = `${title} · SmartPFE`;
    return () => { window.document.title = previous; };
  }, [title]);

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;
    const target = window.document.getElementById(window.location.hash.slice(1));
    if (target && container.contains(target)) target.scrollIntoView({ behavior: 'instant' });
    else container.scrollTo(0, 0);
  }, [document]);

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;
    const elements = sectionIds.split(',').map(id => window.document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    let frame = 0;
    const update = () => {
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const offset = mobile ? Math.max(140, (contentsList.current?.closest('nav')?.getBoundingClientRect().height || 0) + 24) : 32;
      const readingLine = container.getBoundingClientRect().top + offset;
      let current = elements[0];
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= readingLine) current = element;
        else break;
      }
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) current = elements.at(-1);
      if (current) setActiveSection(current.id.slice(document.length + 1));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    container.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [document, sectionIds, i18n.resolvedLanguage]);

  useEffect(() => {
    const list = contentsList.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !link) return;
    const bounds = list.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.left < bounds.left || item.right > bounds.right) list.scrollTo({ left: list.scrollLeft + item.left - bounds.left, behavior: 'instant' });
    // The desktop panel can scroll independently on short screens.
    const panel = list.closest('nav');
    if (panel && window.matchMedia('(min-width: 1024px)').matches) {
      const panelBounds = panel.getBoundingClientRect();
      if (item.top < panelBounds.top || item.bottom > panelBounds.bottom) panel.scrollTop += item.top - panelBounds.top - 16;
    }
  }, [activeSection]);

  return (
    <div ref={scrollContainer} className="h-dvh overflow-y-auto bg-surface text-on-surface" lang={i18n.resolvedLanguage}>
      <a href="#legal-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-on-primary">{title}</a>
      <header className="border-b border-outline-variant/60 bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-on-primary"><GraduationCap size={21} /></span>
            SmartPFE
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary"><ArrowLeft size={14} />{t('home')}</Link>
            <LanguageSelector variant="minimal" />
          </div>
        </div>
      </header>

      <main id="legal-content" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t('eyebrow')}</p>
          <div className="mt-5 flex items-start gap-4">
            <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={24} /></span>
            <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base">{t(`${document}.intro`)}</p></div>
          </div>
          <p id="legal-document-switch" className="mt-7 mb-2 text-xs font-semibold text-on-surface-variant">{t('documents')}</p>
          <nav aria-labelledby="legal-document-switch" className="relative isolate grid w-full max-w-xl grid-cols-2 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-1.5">
            <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1.5 left-1.5 -z-10 w-[calc(50%-0.375rem)] rounded-xl bg-primary shadow-sm transition-transform duration-300 ease-in-out motion-reduce:transition-none ${document === 'privacy' ? 'translate-x-full' : 'translate-x-0'}`} />
            {(['terms', 'privacy'] as const).map(item => (
              <Link key={item} to={`/${item}`} aria-current={document === item ? 'page' : undefined} aria-label={t(`${item}.title`)} className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:px-4 sm:text-sm ${document === item ? 'text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                {item === 'terms' ? <FileText size={17} className="shrink-0" aria-hidden="true" /> : <ShieldCheck size={17} className="shrink-0" aria-hidden="true" />}
                <span className="sm:hidden">{t(`${item}.tab`)}</span><span className="hidden sm:inline">{t(`${item}.title`)}</span>
              </Link>
            ))}
          </nav>
        </div>

        <aside className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5" aria-label={t('draft')}>
          <p className="text-sm font-bold">{t('draft')}</p><p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">{t('draftNotice')}</p>
        </aside>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label={t('contents')} className="sticky top-0 z-10 min-w-0 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('contents')}</h2>
            <ol ref={contentsList} className="flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-1 lg:overflow-visible">{sections.map(section => <li key={section.id} className="shrink-0 lg:shrink"><a href={`#${document}-${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} onClick={event => {
              event.preventDefault();
              const target = window.document.getElementById(`${document}-${section.id}`);
              const heading = window.document.getElementById(`${document}-${section.id}-heading`);
              heading?.focus({ preventScroll: true });
              target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
            }} className={`block rounded-lg px-3 py-2 leading-6 transition-colors focus-visible:outline-2 focus-visible:outline-primary ${activeSection === section.id ? 'bg-primary/10 font-semibold text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}>{section.title}</a></li>)}</ol>
          </nav>
          <article className="min-w-0 space-y-9">
            {sections.map(section => (
              <section key={section.id} id={`${document}-${section.id}`} aria-labelledby={`${document}-${section.id}-heading`} className="scroll-mt-32 border-b border-outline-variant/50 pb-9 last:border-0 lg:scroll-mt-6">
                <h2 id={`${document}-${section.id}-heading`} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">{section.title}</h2>
                <div className="mt-4 space-y-4">{section.paragraphs.map((paragraph, index) => <p key={index} className="break-words text-sm leading-7 text-on-surface-variant">{paragraph}</p>)}</div>
                {section.pending && <div className="mt-5 rounded-lg border-l-2 border-amber-500/60 bg-surface-container-low p-4"><p className="text-xs font-semibold">{t('pending')}</p><p className="mt-2 text-sm leading-6 text-on-surface-variant">{section.pending}</p></div>}
              </section>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <Mail size={21} className="text-primary" /><h2 className="mt-3 text-base font-semibold">{t('contact')}</h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">{t('contactText')} <a href="mailto:contact@9antra.tn" className="inline-flex items-center gap-1 break-all font-semibold text-primary underline underline-offset-4">contact@9antra.tn<ArrowUpRight size={14} /></a></p>
            </div>
          </article>
        </div>
      </main>
      <footer className="mt-4 border-t border-outline-variant/60 px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant"><span>© {new Date().getFullYear()} SmartPFE · Bee Coders</span><div className="flex flex-wrap gap-5"><Link to="/terms" className="hover:text-primary">{t('terms.title')}</Link><Link to="/privacy" className="hover:text-primary">{t('privacy.title')}</Link></div></div>
      </footer>
    </div>
  );
}
