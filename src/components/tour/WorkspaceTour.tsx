import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

const TourContext = createContext({ startTour: () => {}, creditStep: false });
export const useWorkspaceTour = () => useContext(TourContext);
const steps = [
  { key: "overview", target: "overview", icon: "dashboard" },
  { key: "sections", target: "sections", icon: "list-ordered" },
  { key: "ai", target: "ai", icon: "lightbulb" },
  { key: "credits", target: "credit-wallet", icon: "wallet-02" },
  { key: "settings", target: "settings", icon: "settings-02" },
];
type Rect = { x: number; y: number; width: number; height: number };

export function tourCardPosition(rect: Rect | null, width: number, height: number, cardHeight: number) {
  const cardWidth = Math.min(360, width - 32);
  const clamp = (value: number, maximum: number) => Math.max(16, Math.min(value, Math.max(16, maximum)));
  if (!rect) return { left: (width - cardWidth) / 2, top: clamp((height - cardHeight) / 2, height - cardHeight - 16), width: cardWidth };
  // Mobile uses a bottom card; desktop places it alongside the highlighted area when possible.
  let left = rect.x + rect.width + 20;
  let top = rect.y;
  if (width < 640) {
    left = 16;
    top = rect.y + rect.height + cardHeight + 36 < height ? rect.y + rect.height + 20 : height - cardHeight - 16;
  } else if (left + cardWidth > width - 16) {
    if (rect.x - cardWidth - 20 >= 16) left = rect.x - cardWidth - 20;
    else { left = rect.x; top = rect.y + rect.height + 20; }
    if (top + cardHeight > height - 16) top = rect.y - cardHeight - 20;
  }
  return { left: clamp(left, width - cardWidth - 16), top: clamp(top, height - cardHeight - 16), width: cardWidth };
}

export default function WorkspaceTourProvider({ children, sidebarOpen, setSidebarOpen }: {
  children: ReactNode; sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation("shell");
  const location = useLocation();
  const navigate = useNavigate();
  const [startRequested, setStartRequested] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [creditPanelReady, setCreditPanelReady] = useState(false);
  useEffect(() => {
    setCreditPanelReady(false);
    if (index !== 3) return;
    const timer = window.setTimeout(() => setCreditPanelReady(true), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [index]);
  const [rect, setRect] = useState<Rect | null>(null);
  const [creditSourceRect, setCreditSourceRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [cardHeight, setCardHeight] = useState(320);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const originalSidebar = useRef(sidebarOpen);
  const originalFocus = useRef<HTMLElement | null>(null);
  const autoStarted = useRef(false);
  const maskId = useId().replace(/:/g, "");
  const [accountId] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")._id as string | undefined; } catch { return undefined; }
  });
  const cacheKey = accountId ? `smartpfe:workspace-tour:v1:${accountId}` : null;
  const active = index !== null;

  useEffect(() => {
    if (!active) return;
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [active]);

  const startTour = () => {
    if (active || startRequested) return;
    originalSidebar.current = sidebarOpen;
    originalFocus.current = document.activeElement as HTMLElement;
    if (location.pathname !== "/workspace/overview") {
      setStartRequested(true);
      navigate("/workspace/overview");
    } else setIndex(-1);
  };
  useEffect(() => {
    if (startRequested && location.pathname === "/workspace/overview") {
      setStartRequested(false);
      setIndex(-1);
    }
  }, [startRequested, location.pathname]);
  const finish = (status: "completed" | "skipped") => {
    setIndex(null);
    setPending(false);
    setSidebarOpen(originalSidebar.current);
    // Local fallback prevents repeats if the save fails; retry against the account on the next visit.
    try { if (cacheKey) localStorage.setItem(cacheKey, status); } catch { /* Server persistence still works when local storage is unavailable. */ }
    void fetchApi("/auth/workspace-tour", { method: "PUT", body: JSON.stringify({ status }) }).catch(() => {});
  };

  useEffect(() => {
    let current = true;
    void fetchApi("/auth/workspace-tour").then((result) => {
      if (!current) return;
      let cached: string | null = null;
      try { cached = cacheKey ? localStorage.getItem(cacheKey) : null; } catch { /* Use the server account preference. */ }
      if (cached === "completed" || cached === "skipped") {
        if (result.status === "pending") void fetchApi("/auth/workspace-tour", { method: "PUT", body: JSON.stringify({ status: cached }) }).catch(() => {});
        return;
      }
      setPending(result.eligible === true && result.status === "pending");
    }).catch(() => {});
    return () => { current = false; };
  }, [cacheKey]);

  useEffect(() => {
    if (pending && location.pathname === "/workspace/overview" && !autoStarted.current) {
      autoStarted.current = true;
      startTour();
    }
  }, [pending, location.pathname]);

  // Replay starts on overview; the tour itself never edits project content. Restore focus and scrolling on exit.
  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>("[data-tour-root]");
    const previousInert = root?.inert;
    if (root) root.inert = true;
    const scrollable = [...document.querySelectorAll<HTMLElement>("[data-tour-scroll]")].map(el => ({ el, top: el.scrollTop }));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); finish("skipped"); }
      if (event.key !== "Tab" || !card.current) return;
      const buttons = [...card.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !card.current.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      if (root) root.inert = previousInert || false;
      scrollable.forEach(({ el, top }) => { el.scrollTop = top; });
      const focusTarget = originalFocus.current?.isConnected ? originalFocus.current : document.querySelector<HTMLElement>("[data-tour-help]");
      focusTarget?.focus({ preventScroll: true });
    };
  }, [active]);

  useEffect(() => {
    if (index === 1) setSidebarOpen(true);
    else if (index !== null) setSidebarOpen(window.innerWidth >= 768 ? originalSidebar.current : false);
  }, [index, viewport.width]);

  useLayoutEffect(() => {
    if (!active) return;
    heading.current?.focus({ preventScroll: true });
    const measureCard = () => setCardHeight(card.current?.getBoundingClientRect().height || 320);
    measureCard();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureCard);
    if (card.current) observer?.observe(card.current);
    return () => observer?.disconnect();
  }, [index, t]);

  useEffect(() => {
    if (index === null || index < 0) { setRect(null); return; }
    let target: HTMLElement | null = null;
    let frame = 0;
    let observedTarget: HTMLElement | null = null;
    let sizeObserver: ResizeObserver | null = null;
    const measure = () => {
      const width = window.innerWidth; const height = window.innerHeight;
      setViewport(previous => previous.width === width && previous.height === height ? previous : { width, height });
      // The wallet mounts in a portal after its anchor is measured. Keep the
      // credit button highlighted until a positioned panel actually exists.
      const wallet = index === 3 && creditPanelReady ? document.querySelector<HTMLElement>('[data-tour="credit-wallet"]') : null;
      const positionedWallet = wallet && Number.isFinite(parseFloat(wallet.style.left)) && Number.isFinite(parseFloat(wallet.style.top)) ? wallet : null;
      target = index === 3
        ? positionedWallet || document.querySelector<HTMLElement>('[data-tour="credit-trigger"]')
        : document.querySelector<HTMLElement>(`[data-tour="${steps[index].target}"]`) || document.querySelector<HTMLElement>('[data-tour="content"]');
      if (target && target !== observedTarget && sizeObserver) { sizeObserver.disconnect(); sizeObserver.observe(target); observedTarget = target; }
      let bounds = target?.getBoundingClientRect();
      if (positionedWallet && bounds && target) {
        bounds = new window.DOMRect(parseFloat(target.style.left), parseFloat(target.style.top), target.offsetWidth, target.offsetHeight);
        const trigger = document.querySelector<HTMLElement>('[data-tour="credit-trigger"]')?.getBoundingClientRect();
        if (trigger) {
          const source = { x: trigger.left - 4, y: trigger.top - 4, width: trigger.width + 8, height: trigger.height + 8 };
          setCreditSourceRect(previous => previous && Object.keys(source).every(key => previous[key as keyof Rect] === source[key as keyof Rect]) ? previous : source);
        }
      }
      if (!bounds || bounds.width === 0 || bounds.right <= 0) { setRect(null); return; }
      const x = Math.max(8, bounds.left - 6); const y = Math.max(8, bounds.top - 6);
      const next = { x, y, width: Math.max(0, Math.min(width - 8, bounds.right + 6) - x), height: Math.max(0, Math.min(height - 8, bounds.bottom + 6) - y) };
      setRect(previous => previous && Object.keys(next).every(key => previous[key as keyof Rect] === next[key as keyof Rect]) ? previous : next);
    };
    const update = () => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(measure); };
    // Wait for the mobile sidebar's transition, and for project cards to load.
    measure();
    const timer = window.setTimeout(() => {
      target?.scrollIntoView?.({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      measure();
    }, 350);
    const mutation = new MutationObserver(records => {
      if (records.some(record => !(record.target instanceof window.Element) || !record.target.closest("[data-workspace-tour]"))) update();
    });
    // Include the wallet portal, which sits outside the inert workspace root.
    mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "data-tour"] });
    sizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (target) sizeObserver?.observe(target);
    let resizeTimer = 0;
    const resize = () => { update(); window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(update, 400); };
    window.addEventListener("resize", resize);
    document.addEventListener("scroll", update, true);
    return () => { clearTimeout(timer); window.cancelAnimationFrame(frame); mutation.disconnect(); sizeObserver?.disconnect(); window.clearTimeout(resizeTimer); window.removeEventListener("resize", resize); document.removeEventListener("scroll", update, true); };
  }, [index, creditPanelReady, location.pathname]);

  const step = index !== null && index >= 0 ? steps[index] : null;
  const position = tourCardPosition(step ? rect : null, viewport.width, viewport.height, cardHeight);
  return <TourContext.Provider value={{ startTour, creditStep: step?.key === "credits" && creditPanelReady }}>
    {children}
    {active && createPortal(
      <div className="fixed inset-0 z-[100] isolate overscroll-contain" data-workspace-tour>
        <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {step && rect && <rect {...rect} className="tour-spotlight" rx="16" fill="black" />}
              {step?.key === "credits" && creditPanelReady && creditSourceRect && (
                <rect {...creditSourceRect} className="tour-spotlight" rx="16" fill="black" />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgb(2 6 23 / 0.68)" mask={`url(#${maskId})`} />
          {step && rect && (
            <>
              <rect {...rect} className="tour-spotlight" rx="16" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeOpacity="0.22" />
              <rect {...rect} className="tour-spotlight" rx="16" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.9" />
            </>
          )}
          {step?.key === "credits" && creditPanelReady && creditSourceRect && (
            <>
              <rect {...creditSourceRect} rx="16" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeOpacity="0.22" />
              <rect {...creditSourceRect} rx="16" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.9" />
            </>
          )}
        </svg>
        <div
          ref={card}
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-tour-title"
          aria-describedby="workspace-tour-description"
          style={position}
          className="tour-card absolute max-h-[calc(100dvh-32px)] overflow-hidden rounded-2xl border border-outline-variant/70 dark:border-white/10 bg-surface/98 dark:bg-surface-container-lowest/98 text-on-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)] font-sans flex flex-col"
        >
          {step && (
            <div className="h-1 w-full bg-surface-container-high/50 shrink-0">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${((index! + 1) / steps.length) * 100}%` }}
              />
            </div>
          )}
          {!step ? (
            <div key="welcome" className="tour-step-content p-5 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                    <HugeiconsIcon icon="lightbulb" size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                      {t("tour.eyebrow")}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-on-surface-variant">
                      <HugeiconsIcon icon="time-02" size={13} className="text-primary/80 shrink-0" />
                      <span>{t("tour.duration")}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => finish("skipped")}
                  aria-label={t("tour.close")}
                  className="h-8 w-8 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <HugeiconsIcon icon="close" size={16} />
                </button>
              </div>

              <div className="mt-4">
                <h2
                  ref={heading}
                  tabIndex={-1}
                  id="workspace-tour-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-on-surface outline-none leading-snug"
                >
                  {t("tour.welcomeTitle")}
                </h2>
                <p
                  id="workspace-tour-description"
                  className="mt-2.5 text-sm leading-relaxed text-on-surface-variant"
                >
                  {t("tour.welcomeDescription")}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-surface-container-low/80 border border-outline-variant/60 px-3.5 py-2.5 text-xs text-on-surface-variant flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <HugeiconsIcon icon="information-circle" size={13} />
                </span>
                <span>{t("tour.replayHint")}</span>
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={() => finish("skipped")}
                  className="text-xs font-medium text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("tour.skip")}
                </button>
                <button
                  type="button"
                  onClick={() => setIndex(index! + 1)}
                  className="h-9 px-4.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t("tour.start")}
                </button>
              </div>
            </div>
          ) : (
            <div key={index} className="tour-step-content p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-2xs">
                    <HugeiconsIcon icon={step.icon || "lightbulb"} size={16} strokeWidth={1.75} />
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/8 border border-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary tracking-wide uppercase">
                    {t("tour.progress", { current: index! + 1, total: steps.length })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => finish("skipped")}
                  aria-label={t("tour.close")}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <HugeiconsIcon icon="close" size={15} />
                </button>
              </div>

              <div className="mt-3.5">
                <h2
                  ref={heading}
                  tabIndex={-1}
                  id="workspace-tour-title"
                  className="text-base sm:text-lg font-bold tracking-tight text-on-surface outline-none leading-snug"
                >
                  {t(`tour.steps.${step.key}.title`)}
                </h2>
                <p
                  id="workspace-tour-description"
                  className="mt-2 text-sm leading-relaxed text-on-surface-variant"
                >
                  {t(`tour.steps.${step.key}.description`)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-5" aria-hidden="true">
                {steps.map((item, i) => (
                  <span
                    key={item.key}
                    className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                      i === index
                        ? "w-6 bg-primary"
                        : i < index!
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-outline-variant dark:bg-white/15"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={() => finish("skipped")}
                  className="text-xs font-medium text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("tour.skip")}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIndex(index! - 1)}
                    className="h-8.5 px-3 rounded-xl border border-outline-variant/80 bg-surface dark:bg-surface-container hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {t("tour.back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => (index === steps.length - 1 ? finish("completed") : setIndex(index! + 1))}
                    className="h-8.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/20 cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {t(index === steps.length - 1 ? "tour.finish" : "tour.next")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    )}
  </TourContext.Provider>;
}
