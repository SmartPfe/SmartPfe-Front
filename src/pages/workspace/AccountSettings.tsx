import { apiMessage, displayApiMessage, type ApiMessage } from "@/lib/apiMessage";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TextField } from "@/components/onboarding/FormControls";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon, { GoogleIcon } from "@/components/ui/HugeiconsIcon";

type AccountForm = {
  fullName: string;
  email: string;
  avatar: string;
  authProvider: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function AccountSettings({
  backTo = "/workspace/settings",
  backLabel,
  memberLabel,
  children,
}: {
  backTo?: string;
  backLabel?: string;
  memberLabel?: string;
  children?: ReactNode;
} = {}) {
  const { t } = useTranslation("auth");
  const [form, setForm] = useState<AccountForm>({
    fullName: "",
    email: "",
    avatar: "",
    authProvider: "email",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saved, setSaved] = useState(false);
  const [successMessageKey, setSuccessMessageKey] = useState("");
  const [error, setError] = useState<ApiMessage>("");
  const [errorKey, setErrorKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setForm((current) => ({
      ...current,
      fullName: user.fullName || "",
      email: user.email || "",
      avatar: user.avatar || "",
      authProvider: user.authProvider || (user.avatar?.includes("googleusercontent.com") ? "google" : "email"),
    }));

    const clearAutofilledPasswords = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }, 100);

    return () => window.clearTimeout(clearAutofilledPasswords);
  }, []);

  const isGoogleAccount = form.authProvider === "google";
  const displayBackLabel = backLabel === "Back to Admin Dashboard"
    ? t("account.backToAdmin")
    : backLabel ?? t("account.backToSettings");
  const displayMemberLabel = memberLabel === "Administrator"
    ? t("account.administrator")
    : memberLabel ?? t("account.studentMember");
  const wantsPasswordChange = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);
  const newPasswordHasMinLength = form.newPassword.length >= 6;
  const newPasswordHasUppercase = /[A-Z]/.test(form.newPassword);
  const newPasswordHasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(form.newPassword);
  const confirmationMatches = Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword;
  const passwordRules = [
    { label: t("account.atLeast6Characters"), isValid: newPasswordHasMinLength },
    { label: t("account.uppercaseLetter"), isValid: newPasswordHasUppercase },
    { label: t("account.numberOrSymbol"), isValid: newPasswordHasNumberOrSymbol },
    { label: t("account.confirmationMatches"), isValid: confirmationMatches },
  ];
  const isPasswordFormValid =
    !wantsPasswordChange ||
    (Boolean(form.currentPassword) &&
      newPasswordHasMinLength &&
      newPasswordHasUppercase &&
      newPasswordHasNumberOrSymbol &&
      confirmationMatches);
  const canSave = !loading && isPasswordFormValid;

  const updateField = (field: keyof AccountForm, value: string) => {
    setError("");
    setErrorKey("");
    setSuccessMessageKey("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (isGoogleAccount) return;

    if (wantsPasswordChange) {
      if (!form.currentPassword) {
        setErrorKey("account.currentPasswordRequired");
        return;
      }

      if (form.newPassword.length < 6) {
        setErrorKey("account.newPasswordTooShort");
        return;
      }

      if (!newPasswordHasUppercase) {
        setErrorKey("account.uppercaseRequired");
        return;
      }

      if (!newPasswordHasNumberOrSymbol) {
        setErrorKey("account.numberOrSymbolRequired");
        return;
      }

      if (!confirmationMatches) {
        setErrorKey("account.passwordMismatch");
        return;
      }
    }

    setLoading(true);
    setError("");
    setErrorKey("");
    setSuccessMessageKey("");
    setSaved(false);

    try {
      const payload: { fullName?: string; currentPassword?: string; newPassword?: string } = {
        fullName: form.fullName,
      };

      if (wantsPasswordChange) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const response = await fetchApi("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        window.dispatchEvent(new Event("user-updated"));
      }

      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSaved(true);
      setSuccessMessageKey(
        wantsPasswordChange
          ? "account.profileAndPasswordSaved"
          : "account.saved"
      );
      window.setTimeout(() => setSaved(false), 2400);
    } catch (err) {
      if (err instanceof Error) setError(apiMessage(err));
      else setErrorKey("account.updateFailed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col h-full pb-24 font-sans">
      {/* Header & Notion Back Navigation */}
      <header className="mb-6 flex flex-col gap-2">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <HugeiconsIcon icon="arrow-left" size={14} strokeWidth={2} />
          <span>{displayBackLabel}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              {t("account.title")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed mt-1">
              {t("account.description")}
            </p>
          </div>
        </div>
      </header>

      {/* Google Account Notice */}
      {isGoogleAccount && (
        <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-low/60 p-4 text-on-surface flex items-start gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-surface border border-outline-variant/80 flex items-center justify-center shrink-0 shadow-2xs">
            <HugeiconsIcon icon={GoogleIcon} size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">{t("account.googleConnected")}</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {t("account.googleCredentialsProvided")}
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {saved && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-secondary text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="shrink-0" />
          <span>{t(successMessageKey || "account.saved")}</span>
        </div>
      )}

      {/* Error Notification */}
      {(errorKey || error) && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="cancel-circle" size={18} strokeWidth={2} className="shrink-0" />
          <span>{errorKey ? t(errorKey) : displayApiMessage(error)}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs flex flex-col gap-6">
        <div className="flex items-center gap-4 pb-5 border-b border-outline-variant/40">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-2xs">
            {form.avatar ? (
              <img src={form.avatar} alt={t("account.avatarAlt")} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (form.fullName || "U").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-on-surface truncate">{form.fullName || t("account.studentAccount")}</p>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">{form.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-semibold text-outline-variant uppercase tracking-wide">
              <span>{isGoogleAccount ? t("account.googleVerified") : displayMemberLabel}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            id="account-full-name"
            label={t("account.fullName")}
            value={form.fullName}
            onChange={(fullName) => updateField("fullName", fullName)}
            placeholder={t("account.fullNamePlaceholder")}
            disabled={isGoogleAccount}
          />
          <TextField
            id="account-email"
            label={t("account.email")}
            type="email"
            value={form.email}
            onChange={() => undefined}
            disabled
            helperText={t("account.emailUnchangeable")}
          />
        </div>

        {!isGoogleAccount && (
          <div className="border-t border-outline-variant/40 pt-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-on-surface">{t("account.changePassword")}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t("account.leavePasswordBlank")}
              </p>
            </div>
            <TextField
              id="account-current-password"
              name="manual-account-current-secret"
              label={t("account.currentPassword")}
              type="password"
              value={form.currentPassword}
              onChange={(currentPassword) => updateField("currentPassword", currentPassword)}
              placeholder={t("account.currentPasswordPlaceholder")}
              helperText={t("account.currentPasswordHelp")}
              autoComplete="new-password"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="account-new-password"
                name="manual-account-new-secret"
                label={t("account.newPassword")}
                type="password"
                value={form.newPassword}
                onChange={(newPassword) => updateField("newPassword", newPassword)}
                placeholder={t("account.newPasswordPlaceholder")}
                autoComplete="new-password"
              />
              <TextField
                id="account-confirm-password"
                name="manual-account-confirm-secret"
                label={t("account.confirmPassword")}
                type="password"
                value={form.confirmPassword}
                onChange={(confirmPassword) => updateField("confirmPassword", confirmPassword)}
                placeholder={t("account.confirmPasswordPlaceholder")}
                autoComplete="new-password"
              />
            </div>

            {wantsPasswordChange && (
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-4">
                <p className="text-xs font-bold text-on-surface mb-2">{t("account.passwordRequirements")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        rule.isValid ? "text-secondary font-semibold" : "text-on-surface-variant"
                      }`}
                    >
                      <HugeiconsIcon 
                        icon={rule.isValid ? "checkmark-circle-02" : "time-02"} 
                        size={14} 
                        strokeWidth={2}
                      />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Save Action Footer */}
      {!isGoogleAccount && (
        <footer className="flex justify-end pt-5 mt-5 border-t border-outline-variant/60">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <HugeiconsIcon icon={loading ? "cloud-sync" : "cloud-check"} size={16} className={loading ? "animate-spin" : ""} strokeWidth={1.8} />
            <span>{loading ? t("account.saving") : wantsPasswordChange ? t("account.updatePassword") : t("account.saveChanges")}</span>
          </button>
        </footer>
      )}
      {children}
    </div>
  );
}
