import { useEffect, useState } from "react";
import { TextField } from "@/components/onboarding/FormControls";
import { fetchApi } from "@/lib/api";

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
    Boolean(form.currentPassword) &&
      newPasswordHasMinLength &&
      newPasswordHasUppercase &&
      newPasswordHasNumberOrSymbol &&
      confirmationMatches;
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

      if (form.newPassword !== form.confirmPassword) {
        setError("Password confirmation does not match.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await fetchApi("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          _id: data._id || currentUser._id,
          fullName: data.fullName,
          email: data.email,
          avatar: data.avatar,
          authProvider: data.authProvider || "email",
        })
      );
      window.dispatchEvent(new Event("user-updated"));
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setSuccessMessage(
        data.passwordChanged
          ? "Password changed successfully. Please use your new password the next time you sign in."
          : "Account settings saved."
      );
      setSaved(true);
      window.setTimeout(() => {
        setSaved(false);
        setSuccessMessage("");
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-3xl">
      <header className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Account</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Account Settings</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage your profile name and password.
        </p>
      </header>

      {isGoogleAccount && (
        <div className="rounded-lg border border-primary-fixed-dim bg-primary-container px-md py-sm text-on-primary-container font-body-md text-body-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-[20px] mt-base">verified_user</span>
          <div>
            <p className="font-semibold">You are connected with Gmail.</p>
            <p className="mt-base">
              Your name, email, password and profile photo are managed by Google. You cannot edit them from this app.
            </p>
          </div>
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-secondary-fixed-dim bg-secondary-container px-md py-sm text-on-secondary-container font-body-md text-body-md">
          {successMessage || "Account settings saved."}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {error}
        </div>
      )}

      <section className="bg-surface border border-outline-variant rounded-lg p-lg flex flex-col gap-lg">
        <div className="flex items-center gap-md pb-lg border-b border-outline-variant">
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
            {form.avatar ? (
              <img src={form.avatar} alt="Account avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (form.fullName || "U").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-headline-sm text-headline-sm text-on-surface truncate">{form.fullName || "User"}</p>
            <p className="font-body-md text-body-md text-on-surface-variant truncate">{form.email}</p>
          </div>
        </div>

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
          helperText="Email cannot be changed from this page."
        />

        {!isGoogleAccount && (
          <div className="border-t border-outline-variant pt-lg flex flex-col gap-lg">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Change Password</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-base">
                Leave these fields empty if you only want to update your name.
              </p>
            </div>
            <TextField
              id="account-current-password"
              name="manual-account-current-secret"
              label="Current Password"
              type="password"
              value={form.currentPassword}
              onChange={(currentPassword) => updateField("currentPassword", currentPassword)}
              placeholder="Enter your current password"
              helperText="Required only when changing your password."
              autoComplete="new-password"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
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
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
                <p className="font-label-md text-label-md text-on-surface mb-sm">Password requirements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-xs font-body-sm text-body-sm ${
                        rule.isValid ? "text-secondary" : "text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {rule.isValid ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {!isGoogleAccount && (
        <footer className="flex justify-end pt-md border-t border-outline-variant">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-lg py-sm rounded-DEFAULT bg-primary text-on-primary font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : wantsPasswordChange ? "Update Password" : "Save Account Settings"}
          </button>
        </footer>
      )}
    </div>
  );
}
