import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AccountSettings() {
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
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
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
  const wantsPasswordChange = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);
  const newPasswordHasMinLength = form.newPassword.length >= 6;
  const newPasswordHasUppercase = /[A-Z]/.test(form.newPassword);
  const newPasswordHasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(form.newPassword);
  const confirmationMatches = Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword;
  const passwordRules = [
    { label: "At least 6 characters", isValid: newPasswordHasMinLength },
    { label: "One uppercase letter", isValid: newPasswordHasUppercase },
    { label: "One number or symbol", isValid: newPasswordHasNumberOrSymbol },
    { label: "Confirmation matches", isValid: confirmationMatches },
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
    setSuccessMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (isGoogleAccount) return;

    if (wantsPasswordChange) {
      if (!form.currentPassword) {
        setError("Current password is required to change your password.");
        return;
      }

      if (form.newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }

      if (!newPasswordHasUppercase) {
        setError("New password must contain at least one uppercase letter.");
        return;
      }

      if (!newPasswordHasNumberOrSymbol) {
        setError("New password must contain at least one number or symbol.");
        return;
      }

      if (!confirmationMatches) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
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
      setSuccessMessage(
        wantsPasswordChange
          ? "Profile and password updated successfully."
          : "Account settings saved successfully."
      );
      window.setTimeout(() => setSaved(false), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col h-full pb-24 font-sans">
      {/* Header & Notion Back Navigation */}
      <header className="mb-6 flex flex-col gap-2">
        <Link
          to="/workspace/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <HugeiconsIcon icon="arrow-left" size={14} strokeWidth={2} />
          <span>Back to Settings</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Account & Security
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed mt-1">
              Manage your profile credentials, university email, and workspace authentication password.
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
            <p className="text-xs font-bold text-on-surface">Connected via Google Single Sign-On</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Your name, email, and authentication credentials are provided by Google SSO.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {saved && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-secondary text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="shrink-0" />
          <span>{successMessage || "Account settings saved successfully."}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="cancel-circle" size={18} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs flex flex-col gap-6">
        <div className="flex items-center gap-4 pb-5 border-b border-outline-variant/40">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-2xs">
            {form.avatar ? (
              <img src={form.avatar} alt="Account avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (form.fullName || "U").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-on-surface truncate">{form.fullName || "Student Account"}</p>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">{form.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-semibold text-outline-variant uppercase tracking-wide">
              <span>{isGoogleAccount ? "Google Verified" : "Student Member"}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            id="account-full-name"
            label="Full Name"
            value={form.fullName}
            onChange={(fullName) => updateField("fullName", fullName)}
            placeholder="Your full name"
            disabled={isGoogleAccount}
          />
          <TextField
            id="account-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={() => undefined}
            disabled
            helperText="Email address cannot be changed."
          />
        </div>

        {!isGoogleAccount && (
          <div className="border-t border-outline-variant/40 pt-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Change Password</h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Leave these fields empty if you only want to update your profile name.
              </p>
            </div>
            <TextField
              id="account-current-password"
              name="manual-account-current-secret"
              label="Current Password"
              type="password"
              value={form.currentPassword}
              onChange={(currentPassword) => updateField("currentPassword", currentPassword)}
              placeholder="Enter current password"
              helperText="Required only when changing password."
              autoComplete="new-password"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="account-new-password"
                name="manual-account-new-secret"
                label="New Password"
                type="password"
                value={form.newPassword}
                onChange={(newPassword) => updateField("newPassword", newPassword)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <TextField
                id="account-confirm-password"
                name="manual-account-confirm-secret"
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(confirmPassword) => updateField("confirmPassword", confirmPassword)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            {wantsPasswordChange && (
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-4">
                <p className="text-xs font-bold text-on-surface mb-2">Password Requirements</p>
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
            <span>{loading ? "Saving..." : wantsPasswordChange ? "Update Password" : "Save Changes"}</span>
          </button>
        </footer>
      )}
    </div>
  );
}
