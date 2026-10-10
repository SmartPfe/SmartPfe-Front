import GoogleLoginButton from "@/components/GoogleLoginButton";
import { passwordPolicyError, MIN_PASSWORD_CHARACTERS, MAX_PASSWORD_BYTES } from "@/lib/passwordPolicy";
import { apiMessage, displayApiMessage, type ApiMessage } from "@/lib/apiMessage";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TextField } from "@/components/onboarding/FormControls";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon, { GoogleIcon } from "@/components/ui/HugeiconsIcon";

type AccountForm = {
  fullName: string;
  email: string;
  avatar: string;
  authProvider: string;
  googleConnected?: boolean;
  googleAccount?: { fullName: string; email: string } | null;
  hasPassword?: boolean;
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
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [showGoogleConnect, setShowGoogleConnect] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [googleLinkError, setGoogleLinkError] = useState<ApiMessage>("");
  const [showGoogleDisconnect, setShowGoogleDisconnect] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [googleDisconnectError, setGoogleDisconnectError] = useState<ApiMessage>("");
  const [signingOut, setSigningOut] = useState(false);

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await fetchApi("/auth/logout-all", { method: "POST" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } catch (error) {
      setError(apiMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

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
      authProvider: user.authProvider || "email",
      googleConnected: user.googleConnected ?? user.authProvider === "google",
      googleAccount: user.googleAccount,
      hasPassword: user.hasPassword,
    }));

    let active = true;
    fetchApi("/auth/profile")
      .then((profile) => {
        if (active) setForm((current) => ({ ...current, ...profile }));
      })
      .catch((error) => {
        if (active) setError(apiMessage(error));
      });
    const clearAutofilledPasswords = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }, 100);

    return () => {
      active = false;
      window.clearTimeout(clearAutofilledPasswords);
    };
  }, []);

  const isGoogleAccount = form.hasPassword === false || (form.hasPassword === undefined && form.authProvider === "google");
  const displayBackLabel =
    backLabel === "Back to Admin Dashboard"
      ? t("account.backToAdmin")
      : backLabel ?? t("account.backToSettings");
  const displayMemberLabel =
    memberLabel === "Administrator"
      ? t("account.administrator")
      : memberLabel ?? t("account.studentMember");
  const wantsPasswordChange = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);
  const newPasswordHasMinLength = [...form.newPassword].length >= MIN_PASSWORD_CHARACTERS;
  const newPasswordFitsStorage = new TextEncoder().encode(form.newPassword).length <= MAX_PASSWORD_BYTES;
  const confirmationMatches = Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword;
  const passwordRules = [
    { label: t("password.minimum"), isValid: newPasswordHasMinLength },
    { label: t("password.maximum"), isValid: newPasswordFitsStorage },
    { label: t("account.confirmationMatches"), isValid: confirmationMatches },
  ];
  const isPasswordFormValid =
    !wantsPasswordChange ||
    (Boolean(form.currentPassword) &&
      newPasswordHasMinLength &&
      newPasswordFitsStorage &&
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

      const passwordError = passwordPolicyError(form.newPassword);
      if (passwordError) {
        setErrorKey(passwordError);
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
      if (response?.token) localStorage.setItem("token", response.token);

      if (response?._id || response?.user) {
        const updatedUser = response.user || response;
        const { token: _token, passwordChanged: _passwordChanged, ...profile } = updatedUser;
        localStorage.setItem("user", JSON.stringify(profile));
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
        wantsPasswordChange ? "account.profileAndPasswordSaved" : "account.saved"
      );
      window.setTimeout(() => setSaved(false), 2400);
    } catch (err) {
      if (err instanceof Error) setError(apiMessage(err));
      else setErrorKey("account.updateFailed");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!disconnectPassword || disconnecting) return;
    setDisconnecting(true);
    setGoogleDisconnectError("");
    try {
      const { token, ...profile } = await fetchApi("/auth/google/disconnect", {
        method: "POST", body: JSON.stringify({ currentPassword: disconnectPassword }),
      });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(profile));
      window.dispatchEvent(new Event("user-updated"));
      setForm((current) => ({ ...current, ...profile }));
      setShowGoogleDisconnect(false);
      setDisconnectPassword("");
      setSaved(true);
      setSuccessMessageKey("account.googleDisconnected");
      window.setTimeout(() => setSaved(false), 4000);
    } catch (error) {
      setGoogleDisconnectError(apiMessage(error));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col font-sans pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link
            to={backTo}
            className="hover:text-primary transition-colors flex items-center gap-1 group"
          >
            <HugeiconsIcon icon="arrow-left" size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{displayBackLabel}</span>
          </Link>
          <span className="text-outline-variant/60">/</span>
          <span className="text-on-surface">{t("account.title")}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/50">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              {t("account.title")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {t("account.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Google Account Notice (for pure Google SSO users) */}
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

      {/* Global Success Notification */}
      {saved && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="shrink-0" />
          <span>{t(successMessageKey || "account.saved")}</span>
        </div>
      )}

      {/* Global Error Notification (Profile & Password only) */}
      {(errorKey || error) && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="cancel-circle" size={18} strokeWidth={2} className="shrink-0" />
          <span>{errorKey ? t(errorKey) : displayApiMessage(error)}</span>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {/* Section 1: Profile & Personal Info */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <HugeiconsIcon icon="user" size={19} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Informations du profil
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Votre identité et coordonnées universitaires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-2xs">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt={t("account.avatarAlt")}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (form.fullName || "U").substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-on-surface truncate">
                {form.fullName || t("account.studentAccount")}
              </p>
              <p className="text-xs text-on-surface-variant truncate mt-0.5">{form.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-surface border border-outline-variant/80 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <span>{isGoogleAccount ? t("account.googleVerified") : displayMemberLabel}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </section>

        {/* Section 2: Password & Authentication */}
        {!isGoogleAccount && (
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
            <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <HugeiconsIcon icon="lock-password" size={19} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  {t("account.changePassword")}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  {t("account.leavePasswordBlank")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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
                  <p className="text-xs font-bold text-on-surface mb-2">
                    {t("account.passwordRequirements")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          rule.isValid ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-on-surface-variant"
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

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={loading ? "cloud-sync" : "cloud-check"}
                    size={16}
                    className={loading ? "animate-spin" : ""}
                    strokeWidth={1.8}
                  />
                  <span>
                    {loading
                      ? t("account.saving")
                      : wantsPasswordChange
                      ? t("account.updatePassword")
                      : t("account.saveChanges")}
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Connected Accounts (Google Linking) */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <HugeiconsIcon icon={GoogleIcon} size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("account.googleTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t(form.googleConnected ? "account.googleLinkedHelp" : "account.googleConnectHelp")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/80 bg-surface p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-surface border border-outline-variant/70 shadow-2xs flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={GoogleIcon} size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">{form.googleConnected && form.googleAccount?.fullName ? form.googleAccount.fullName : "Google"}</span>
                    {form.googleConnected && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t("account.googleLinked")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 break-all">
                    {form.googleConnected
                      ? form.googleAccount?.email || t("account.googleDetailsUnavailable")
                      : t("account.googleNotConnected")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {form.googleConnected ? (
                  <button type="button" onClick={() => { setShowGoogleDisconnect(true); setGoogleDisconnectError(""); }}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-error/30 text-error hover:bg-error/5 text-xs font-bold transition-colors cursor-pointer">
                    {t("account.disconnectGoogle")}
                  </button>
                ) : !isGoogleAccount && !showGoogleConnect ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleConnect(true);
                      setGoogleLinkError("");
                    }}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface shadow-2xs hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <HugeiconsIcon icon={GoogleIcon} size={15} />
                    <span>{t("account.connectGoogle")}</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Inline Google Link Form (Where the connection is, with INLINE errors) */}
            {!form.googleConnected && !isGoogleAccount && showGoogleConnect && (
              <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <HugeiconsIcon icon="lock-password" size={16} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                      {t("account.confirmGooglePassword")}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      {t("account.googlePasswordHelp")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <TextField
                    id="google-link-password"
                    label={t("account.confirmGooglePassword")}
                    type="password"
                    value={linkPassword}
                    onChange={(v) => {
                      setLinkPassword(v);
                      setGoogleLinkError("");
                    }}
                    placeholder={t("account.currentPasswordPlaceholder")}
                    autoComplete="current-password"
                    disabled={connecting}
                  />

                  {/* INLINE ERROR RIGHT AT THE CONNECTION CONTAINER */}
                  {googleLinkError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-error/30 bg-error/10 text-error text-xs font-semibold animate-in fade-in duration-150">
                      <HugeiconsIcon icon="cancel-circle" size={16} className="shrink-0" />
                      <span>{displayApiMessage(googleLinkError)}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="min-h-[44px] flex items-center">
                      {linkPassword ? (
                        <div className="w-full sm:w-auto">
                          <GoogleLoginButton
                            mode="connect"
                            currentPassword={linkPassword}
                            onError={(err) => setGoogleLinkError(err)}
                            onLoading={setConnecting}
                            onConnected={(profile) => {
                              setForm((current) => ({
                                ...current,
                                googleConnected: profile.googleConnected,
                                googleAccount: profile.googleAccount,
                                hasPassword: profile.hasPassword,
                              }));
                              setLinkPassword("");
                              setShowGoogleConnect(false);
                              setGoogleLinkError("");
                              setSaved(false);
                              setSuccessMessageKey("");
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant italic">
                          {t("account.googleEnterPassword")}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={connecting}
                      onClick={() => {
                        setShowGoogleConnect(false);
                        setLinkPassword("");
                        setGoogleLinkError("");
                      }}
                      className="h-9 px-4 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      {t("account.cancelGoogleConnect")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {form.googleConnected && showGoogleDisconnect && (
              <form onSubmit={handleDisconnectGoogle} className="rounded-xl border border-error/20 bg-error/5 p-4 sm:p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{t("account.disconnectGoogle")}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    {t(isGoogleAccount ? "account.googleSetPasswordFirst" : "account.googleDisconnectHelp")}
                  </p>
                </div>
                {!isGoogleAccount && (
                  <TextField id="google-disconnect-password" label={t("account.confirmGooglePassword")} type="password"
                    value={disconnectPassword} onChange={(value) => { setDisconnectPassword(value); setGoogleDisconnectError(""); }}
                    placeholder={t("account.currentPasswordPlaceholder")} autoComplete="current-password" disabled={disconnecting} />
                )}
                {googleDisconnectError && <p role="alert" className="text-xs text-error">{displayApiMessage(googleDisconnectError)}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  {isGoogleAccount ? (
                    <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">{t("account.googleSetPassword")}</Link>
                  ) : (
                    <button type="submit" disabled={disconnecting || !disconnectPassword}
                      className="h-9 px-4 rounded-xl bg-error text-on-error text-xs font-bold disabled:opacity-50 cursor-pointer">
                      {t(disconnecting ? "account.googleDisconnecting" : "account.confirmGoogleDisconnect")}
                    </button>
                  )}
                  <button type="button" disabled={disconnecting} onClick={() => { setShowGoogleDisconnect(false); setDisconnectPassword(""); setGoogleDisconnectError(""); }}
                    className="h-9 px-4 rounded-xl border border-outline-variant/80 text-xs font-semibold text-on-surface cursor-pointer">
                    {t("account.cancelGoogleConnect")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Section 4: Active Sessions */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <HugeiconsIcon icon="logout-01" size={19} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("account.sessionsTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t("account.sessionsHelp")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/80 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center shrink-0 text-on-surface-variant">
                <HugeiconsIcon icon="computer" size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-on-surface">
                  Tous les appareils et navigateurs
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Déconnecte instantanément toutes les sessions actives sur tous vos appareils.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={signingOut || loading}
              onClick={signOutEverywhere}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-error/30 bg-error/5 hover:bg-error/15 text-error text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <HugeiconsIcon
                icon={signingOut ? "cloud-sync" : "logout-01"}
                size={15}
                className={signingOut ? "animate-spin" : ""}
                strokeWidth={1.8}
              />
              <span>{signingOut ? t("account.saving") : t("account.signOutEverywhere")}</span>
            </button>
          </div>
        </section>

        {/* Children (e.g., Admin Settings) */}
        {children}
      </div>
    </div>
  );
}
