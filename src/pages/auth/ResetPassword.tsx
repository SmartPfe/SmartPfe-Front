import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import HugeiconsIcon from "../../components/ui/HugeiconsIcon";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      navigate("/login", { state: { message: "Password updated successfully. You can sign in now." } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-error/10 text-error border border-error/20 flex items-center justify-center mx-auto shadow-2xs">
          <HugeiconsIcon icon="alert-circle" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-on-surface">Invalid Reset Link</h1>
        <p className="text-xs text-on-surface-variant max-w-[280px] mx-auto">
          This password reset token is missing or has expired. Please generate a new link.
        </p>
        <div className="pt-2">
          <Link
            to="/forgot-password"
            className="w-full h-11 flex items-center justify-center rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
          <HugeiconsIcon icon="key" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Set new password</h1>
        <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">
          Choose a new secure password with at least 6 characters.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="lock" size={18} strokeWidth={1.6} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className="block w-full h-11 pl-10 pr-10 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showPassword ? "eye-off" : "eye"} size={18} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="lock" size={18} strokeWidth={1.6} />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className="block w-full h-11 pl-10 pr-10 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showConfirmPassword ? "eye-off" : "eye"} size={18} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center pt-1 border-t border-outline-variant/60">
        <Link 
          to="/login" 
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}
