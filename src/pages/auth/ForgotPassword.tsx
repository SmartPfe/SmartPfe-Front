import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import HugeiconsIcon from "../../components/ui/HugeiconsIcon";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [devResetLink, setDevResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setEmailSent(false);
    setDevResetLink("");

    try {
      const data = await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
      setEmailSent(data.emailSent === true);
      if (data.devResetLink) {
        setDevResetLink(data.devResetLink);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
          <HugeiconsIcon icon="lock-reset" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Reset your password</h1>
        <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">
          Enter your registered email and we'll send you recovery instructions.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary mx-auto flex items-center justify-center">
              <HugeiconsIcon icon="mark-email-read" size={20} strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-on-surface">Check your inbox</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {emailSent
                ? "A reset link has been dispatched. Please check your inbox and spam folder."
                : "If an account exists for this email, reset instructions have been generated."}
            </p>
          </div>

          {devResetLink && (
            <div className="p-3.5 bg-surface-container-low rounded-xl text-xs border border-outline-variant/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-amber-500 tracking-wider">
                <HugeiconsIcon icon="code" size={14} strokeWidth={2} />
                <span>Development Mode Link</span>
              </div>
              <p className="text-on-surface-variant text-[11px]">
                SMTP not active in local environment. Click below to test password reset:
              </p>
              <a
                href={devResetLink}
                className="block break-all font-mono text-[11px] text-primary hover:underline pt-1"
              >
                {devResetLink}
              </a>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full h-11 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low active:scale-[0.99] transition-all cursor-pointer"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                <HugeiconsIcon icon="mail" size={18} strokeWidth={1.6} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                required
                placeholder="student@university.edu"
                className="block w-full h-11 pl-10 pr-3.5 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
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
                  <span>Sending Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </div>
        </form>
      )}

      {!success && (
        <div className="mt-6 text-center pt-1 border-t border-outline-variant/60">
          <p className="text-xs text-on-surface-variant">
            Remembered your password?{" "}
            <Link 
              to="/login" 
              className="font-semibold text-primary hover:text-primary/80 transition-colors ml-0.5"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
