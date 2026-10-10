import { apiMessage, displayApiMessage, type ApiMessage } from "@/lib/apiMessage";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import CreditDialog from "./CreditDialog";
import { useWorkspaceTour } from "@/components/tour/WorkspaceTour";
import { CREDIT_HISTORY_PATH, transactionLabel, transactionDelta, type CreditRequest, type CreditTransaction } from "@/lib/creditHistory";
import creditCoin from "@/assets/credit-coin.png";
import { useCredits } from "@/context/CreditContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatInterfaceDate, formatInterfaceNumber } from "@/lib/localeFormat";

type PurchasePackage = {
  key: string;
  label: string;
  credits: number;
  price: number;
  currency: string;
};

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  CONFIRMED: "bg-primary/10 text-primary",
  COMPLETED: "bg-secondary/10 text-secondary",
  CANCELLED: "bg-error/10 text-error",
};

const formatDate = (value: string, language: "en" | "fr") =>
  formatInterfaceDate(new Date(value), language, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const creditActionTranslationKeys: Record<string, string> = {
  problem_statement: "creditWallet.actions.problemStatement",
  actors: "creditWallet.actions.actors",
  existing_solutions: "creditWallet.actions.existingSolutions",
  functional_requirements: "creditWallet.actions.functionalRequirements",
  nonfunctional_requirements: "creditWallet.actions.nonFunctionalRequirements",
  product_backlog: "creditWallet.actions.productBacklog",
  uml_preparation: "creditWallet.actions.umlPreparation",
  report_structure: "creditWallet.actions.reportStructure",
  report_section: "creditWallet.actions.reportSection",
  report_polish_light: "creditWallet.actions.quickPolish",
  report_polish_contextual: "creditWallet.actions.contextualReportPolish",
  final_report_compile: "creditWallet.actions.completeReportCompilation",
  presentation_full: "creditWallet.actions.presentationDeck",
  presentation_slide: "creditWallet.actions.presentationSlide",
  pitch_full: "creditWallet.actions.pitchSpeech",
  pitch_slide: "creditWallet.actions.pitchSlide",
  jury_simulation: "creditWallet.actions.jurySimulation",
  jury_qa_session: "creditWallet.actions.juryQaSession",
  jury_qa_included: "creditWallet.actions.includedJuryQaSteps",
  translation: "creditWallet.actions.translation",
};

function getTransactionLabel(item: CreditTransaction, t: (key: string) => string) {
  if (item.reference?.startsWith("credit-request:")) return t("creditWallet.activity.creditPurchase");
  if (item.kind === "welcome") return t("creditWallet.activity.welcomeCredits");
  if (item.kind === "daily_refill") return t("creditWallet.activity.dailyRefill");
  if (item.kind === "admin_adjustment") return item.reason || t("creditWallet.activity.walletAdjustment");
  if (item.kind === "purchase") return t("creditWallet.activity.creditPurchase");
  if (item.kind === "refund") return t("creditWallet.activity.creditRefund");
  if (!item.actionKey) return t("creditWallet.activity.aiActivity");
  const actionKey = item.actionKey ? creditActionTranslationKeys[item.actionKey] : undefined;
  return actionKey ? t(actionKey) : transactionLabel(item);
}

const formatCreditMoney = (price: number, currency: string, language: "en" | "fr") =>
  `${formatInterfaceNumber(price, language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const readCurrentUserId = () => {
  const user = readCurrentUser();
  return String(user._id || user.id || "");
};

export default function CreditWalletButton() {
  const { t, i18n } = useTranslation("controls");
  const language = i18n.resolvedLanguage === "fr" ? "fr" : "en";
  const { wallet, transactions, loading, walletOpenRequest, refresh, loadTransactions } = useCredits();
  const [open, setOpen] = useState(false);
  const { creditStep } = useWorkspaceTour();
  const [modalOpen, setModalOpen] = useState(false);
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [options, setOptions] = useState<{ pricePerCredit: number; currency: string; packages: PurchasePackage[] } | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{ request: CreditRequest; studentEmailSent: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [tourAnchor, setTourAnchor] = useState<{ left: number; top: number; origin: number; maxHeight: number } | null>(null);
  const walletVisible = (open || creditStep) && (!creditStep || tourAnchor !== null);
  useLayoutEffect(() => {
    if (!creditStep) return;
    const measure = () => {
      const bounds = rootRef.current?.querySelector("button")?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(384, window.innerWidth - 32);
      const left = Math.max(16, Math.min(bounds.right - width, window.innerWidth - width - 16));
      const top = bounds.bottom + 12;
      setTourAnchor({ left, top, origin: bounds.left + bounds.width / 2 - left,
        maxHeight: Math.max(120, Math.min(window.innerHeight - top - 16, window.innerWidth < 640 ? window.innerHeight * .42 : window.innerHeight)) });
    };
    measure();
    let resizeTimer = 0;
    const resize = () => { measure(); window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(measure, 400); };
    window.addEventListener("resize", resize);
    return () => { window.clearTimeout(resizeTimer); window.removeEventListener("resize", resize); };
  }, [creditStep]);

  const loadRequests = async () => {
    const userIdAtRequestStart = readCurrentUserId();
    setRequests([]);
    const data = await fetchApi("/credits/requests/my?limit=3");
    if (userIdAtRequestStart !== readCurrentUserId()) return;
    setRequests(data.requests || []);
  };

  const loadPurchaseOptions = async () => {
    const data = await fetchApi("/credits/purchase-options");
    setOptions(data);
  };

  const openRequestModal = () => {
    setOpen(false);
    setModalOpen(true);
    if (!options) loadPurchaseOptions().catch(() => undefined);
  };

  useEffect(() => {
    const openModal = () => { setOpen(false); setModalOpen(true); loadPurchaseOptions().catch(() => undefined); };
    window.addEventListener("open-credit-request", openModal);
    return () => window.removeEventListener("open-credit-request", openModal);
  }, []);

  useEffect(() => {
    if (walletOpenRequest > 0) setOpen(true);
  }, [walletOpenRequest]);

  useEffect(() => {
    if (!walletVisible) return;
    refresh().catch(() => undefined);
    loadTransactions().catch(() => undefined);
    loadRequests().catch(() => undefined);
    loadPurchaseOptions().catch(() => undefined);
    const close = (event: MouseEvent) => {
      if (modalOpen || creditStep) return;
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [walletVisible, creditStep, modalOpen, loadTransactions, refresh]);

  const handleSubmitted = (result: { request: CreditRequest; studentEmailSent: boolean }) => {
    setConfirmation(result);
    setModalOpen(false);
    setOpen(false);
    window.dispatchEvent(new Event("credit-requests-updated"));
    loadRequests().catch(() => undefined);
  };

  const walletPortal = (content: ReactNode) => creditStep ? createPortal(<div inert>{content}</div>, document.body) : content;

  return (
    <div ref={rootRef} className="relative">
      <button
        data-tour="credit-trigger"
        type="button"
        aria-expanded={walletVisible}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 text-xs font-bold text-on-surface shadow-2xs transition hover:bg-amber-400/15"
        title={t("creditWallet.title")}
      >
        <img src={creditCoin} alt={t("creditWallet.creditsAlt")} className="h-5 w-5" />
        <span>{loading && !wallet ? "-" : formatInterfaceNumber(wallet?.total ?? 0, language)}</span>
      </button>

      {creditStep && tourAnchor && walletPortal(<span aria-hidden="true" className="tour-wallet-enter fixed z-50 h-3 w-3 rotate-45 border-l border-t border-outline-variant/80 bg-surface" style={{ left: tourAnchor.left + tourAnchor.origin - 6, top: tourAnchor.top - 6 }} />)}
      {walletVisible && walletPortal(
        <div data-tour="credit-wallet" style={creditStep && tourAnchor ? { left: tourAnchor.left, top: tourAnchor.top, maxHeight: tourAnchor.maxHeight, transformOrigin: `${tourAnchor.origin}px top` } : undefined} className={cn("z-50 w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-outline-variant/80 bg-surface shadow-2xl", creditStep ? "tour-wallet-enter fixed" : "absolute right-0 top-full mt-2 max-h-[calc(100dvh-5rem)]")}>
          <div className="flex items-center justify-between border-b border-outline-variant/60 bg-gradient-to-br from-amber-400/15 to-primary/5 p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{t("creditWallet.availableCredits")}</p>
              <div className="mt-1 flex items-center gap-2">
                <img src={creditCoin} alt="" className="h-8 w-8" />
                <span className="text-2xl font-extrabold text-on-surface">{formatInterfaceNumber(wallet?.total ?? 0, language)}</span>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface/70" aria-label={t("creditWallet.closeWallet")}>
              <HugeiconsIcon icon="close" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">{t("creditWallet.dailyWelcome")}</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{formatInterfaceNumber(wallet?.promotional ?? 0, language)}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">{t("creditWallet.purchased")}</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{formatInterfaceNumber(wallet?.purchased ?? 0, language)}</p>
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={openRequestModal}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-extrabold text-on-primary shadow-xs transition hover:bg-primary/90"
            >
              <HugeiconsIcon icon="coin" size={16} />
              <span>{t("creditWallet.addMoreCredits")}</span>
            </button>
          </div>

          <div className="border-t border-outline-variant/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("creditWallet.latestRequests")}</p>
            <div className="max-h-40 overflow-y-auto">
              {requests.length ? requests.slice(0, 3).map((item) => (
                <Link key={item._id} to={`${CREDIT_HISTORY_PATH}?request=${item._id}`} onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 rounded-lg border-b border-outline-variant/40 px-1 py-2 transition hover:bg-primary/5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-on-surface">{formatInterfaceNumber(item.requestedCredits, language)} {t("creditWallet.creditsUnit")} · {formatInterfaceNumber(item.price, language)} {item.currency}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDate(item.createdAt, language)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[9px] font-extrabold", statusTone[item.status])}>
                    {t(`creditWallet.status.${item.status.toLowerCase()}`)}
                  </span>
                </Link>
              )) : <p className="py-3 text-xs text-on-surface-variant">{t("creditWallet.noRequests")}</p>}
            </div>
          </div>

          <div className="border-t border-outline-variant/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("creditWallet.recentActivity")}</p>
            <div className="max-h-44 overflow-y-auto">
              {transactions.length ? transactions.slice(0, 3).map((item: CreditTransaction) => {
                const delta = transactionDelta(item);
                return (
                  <div key={item._id} className="flex items-center justify-between gap-3 border-b border-outline-variant/40 py-2 last:border-0">
                    <span className="truncate text-xs font-medium capitalize text-on-surface">{getTransactionLabel(item, t)}</span>
                    <span className={`text-xs font-bold ${delta > 0 ? "text-secondary" : delta < 0 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  </div>
                );
              }) : <p className="py-3 text-xs text-on-surface-variant">{t("creditWallet.noActivity")}</p>}
            </div>
          </div>

          <Link to={CREDIT_HISTORY_PATH} onClick={() => setOpen(false)} className="flex items-center justify-between border-t border-outline-variant/60 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5">
            {t("creditWallet.viewFullHistory")} <HugeiconsIcon icon="arrow-right" size={15} />
          </Link>
          <p className="border-t border-outline-variant/60 px-4 py-2.5 text-[10px] leading-relaxed text-on-surface-variant">
            {t("creditWallet.refillNote", { count: wallet?.dailyRefillTarget ?? 20, amount: formatInterfaceNumber(wallet?.dailyRefillTarget ?? 20, language) })}
          </p>
        </div>
      )}

      {modalOpen && (
        <CreditRequestModal
          options={options}
          submitting={requestLoading}
          setSubmitting={setRequestLoading}
          onClose={() => setModalOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}
      {confirmation && (
        <CreditDialog titleId="credit-success-title" onClose={() => setConfirmation(null)}>
          <div className="overflow-y-auto p-6 text-center sm:p-8">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-secondary/25 bg-secondary/10 text-secondary">
              <HugeiconsIcon icon="checkmark-circle-02" size={34} />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-secondary">{t("creditWallet.requestReceived")}</p>
            <h2 id="credit-success-title" className="mt-2 text-2xl font-extrabold text-on-surface">{t("creditWallet.allSet")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t("creditWallet.requestSubmitted")}</p>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t("creditWallet.paymentVerified")}</p>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left">
              <span className="flex items-center gap-2 text-sm font-bold text-on-surface"><img src={creditCoin} alt="" className="h-6 w-6" />{formatInterfaceNumber(confirmation.request.requestedCredits, language)} {t("creditWallet.creditsUnit")}</span>
              <span className="text-sm font-bold text-on-surface">{formatCreditMoney(confirmation.request.price, confirmation.request.currency, language)}</span>
            </div>
            <p className={cn("mt-4 text-xs leading-relaxed", confirmation.studentEmailSent ? "text-on-surface-variant" : "text-amber-700 dark:text-amber-300")}>
              {confirmation.studentEmailSent ? t("creditWallet.receiptSent") : t("creditWallet.receiptNotSent")}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setConfirmation(null)} className="h-11 flex-1 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container">{t("creditWallet.gotIt")}</button>
              <Link to={`${CREDIT_HISTORY_PATH}?request=${confirmation.request._id}`} onClick={() => setConfirmation(null)} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary hover:bg-primary/90">{t("creditWallet.trackRequest")}</Link>
            </div>
          </div>
        </CreditDialog>
      )}
    </div>
  );
}

function CreditRequestModal({
  options,
  submitting,
  setSubmitting,
  onClose,
  onSubmitted,
}: {
  options: { pricePerCredit: number; currency: string; packages: PurchasePackage[] } | null;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  onClose: () => void;
  onSubmitted: (result: { request: CreditRequest; studentEmailSent: boolean }) => void;
}) {
  const { t, i18n } = useTranslation("controls");
  const language = i18n.resolvedLanguage === "fr" ? "fr" : "en";
  const user = readCurrentUser();
  const packages = options?.packages || [];
  const [mode, setMode] = useState(packages[0]?.key || "custom");
  const [customCredits, setCustomCredits] = useState(100);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<ApiMessage>("");

  useEffect(() => {
    if (packages.length && mode === "custom") setMode(packages[0].key);
  }, [packages.length]);

  const selectedPackage = packages.find((item) => item.key === mode);
  const isCustom = mode === "custom";
  const requestedCredits = selectedPackage?.credits || Math.max(0, Math.trunc(Number(customCredits) || 0));
  const price = useMemo(() => {
    if (selectedPackage) return selectedPackage.price;
    return Math.round(requestedCredits * (options?.pricePerCredit || 0) * 100) / 100;
  }, [options?.pricePerCredit, requestedCredits, selectedPackage]);
  const currency = selectedPackage?.currency || options?.currency || "TND";

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) {
      setError(t("creditWallet.errors.validPhone"));
      return;
    }
    if (!options) { setError(t("creditWallet.errors.optionsLoading")); return; }
    if (!requestedCredits || requestedCredits <= 0 || requestedCredits > 100000) {
      setError(t("creditWallet.errors.creditRange"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await fetchApi("/credits/requests", {
        method: "POST",
        body: JSON.stringify({
          phone,
          packageKey: isCustom ? "" : mode,
          credits: isCustom ? requestedCredits : undefined,
        }),
      });
      onSubmitted({ request: data.request, studentEmailSent: data.studentEmailSent === true });
    } catch (err) {
      setError(err instanceof Error ? apiMessage(err) : t("creditWallet.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreditDialog titleId="credit-request-title" onClose={onClose} busy={submitting}>
        <header className="flex items-start justify-between gap-3 border-b border-outline-variant/60 bg-surface-container-low/50 p-4">
          <div className="min-w-0">
            <p id="credit-request-title" className="text-sm font-extrabold text-on-surface">{t("creditWallet.addMoreCredits")}</p>
            <p className="text-xs leading-relaxed text-on-surface-variant">{t("creditWallet.requestInstructions")}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50" aria-label={t("creditWallet.closeRequest")}>
            <HugeiconsIcon icon="close" size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs font-semibold text-error">
              <HugeiconsIcon icon="alert-circle" size={15} />
              <span>{displayApiMessage(error)}</span>
            </div>
          )}

          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {t("creditWallet.studentEmail")}
            <input
              value={user.email || ""}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm font-semibold text-on-surface outline-none"
            />
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {t("creditWallet.phoneNumber")} <span className="text-error">*</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+216 00 000 000"
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("creditWallet.purchaseMode")}</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {packages.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    mode === item.key ? "border-primary bg-primary/10 text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  )}
                >
                  <span className="block text-sm font-extrabold">{formatInterfaceNumber(item.credits, language)} {t("creditWallet.creditsUnit")}</span>
                  <span className="mt-1 block text-xs font-semibold text-on-surface-variant">{formatInterfaceNumber(item.price, language)} {item.currency}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  isCustom ? "border-primary bg-primary/10 text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                )}
              >
                <span className="block text-sm font-extrabold">{t("creditWallet.customAmount")}</span>
                <span className="mt-1 block text-xs font-semibold text-on-surface-variant">{formatInterfaceNumber(options?.pricePerCredit ?? 0.05, language)} {currency} / {t("creditWallet.creditUnit")}</span>
              </button>
            </div>
          </section>

          {isCustom && (
            <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {t("creditWallet.desiredCredits")}
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={customCredits}
                onChange={(event) => setCustomCredits(Math.max(0, Math.trunc(Number(event.target.value) || 0)))}
                className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 font-mono text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface-variant">{t("creditWallet.creditsRequested")}</span>
              <span className="font-mono text-lg font-extrabold text-on-surface">{formatInterfaceNumber(requestedCredits, language)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface-variant">{t("creditWallet.estimatedPrice")}</span>
              <span className="font-mono text-lg font-extrabold text-on-surface">{formatInterfaceNumber(price, language)} {currency}</span>
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-outline-variant/60 bg-surface-container-low/40 p-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 sm:w-auto">
            {t("creditWallet.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !options}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-on-primary shadow-xs hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            <span>{submitting ? t("creditWallet.submitting") : t("creditWallet.submitRequest")}</span>
          </button>
        </footer>
    </CreditDialog>
  );
}
