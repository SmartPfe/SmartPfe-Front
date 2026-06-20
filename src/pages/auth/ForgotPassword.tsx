import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "../../lib/api";

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
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
      <div className="flex flex-col items-center mb-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Reset Password</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[300px]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-md text-sm text-center border border-error">
          {error}
        </div>
      )}

      {success ? (
        <div className="space-y-lg">
          <div className="p-4 bg-primary-container text-on-primary-container rounded-md text-sm text-center border border-primary">
            <span className="material-symbols-outlined text-[24px] mb-2 block">mark_email_read</span>
            {emailSent
              ? "A reset link has been sent. Please check your inbox and spam folder."
              : "If an account exists for this email, a reset link has been prepared."}
          </div>

          {devResetLink && (
            <div className="p-4 bg-surface-container-high rounded-md text-sm border border-outline-variant space-y-sm">
              <p className="font-label-md text-label-md text-on-surface">
                Mode développement — l&apos;email n&apos;a pas pu être envoyé (SMTP Brevo non configuré).
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Utilisez ce lien pour réinitialiser votre mot de passe :
              </p>
              <a
                href={devResetLink}
                className="block break-all font-label-md text-label-md text-secondary hover:text-primary transition-colors underline"
              >
                {devResetLink}
              </a>
            </div>
          )}

          <Link
            to="/login"
            className="w-full flex justify-center py-2.5 px-4 border border-outline-variant rounded-md bg-surface text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary focus:ring-offset-surface"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form className="space-y-lg" onSubmit={handleSubmit}>
          <div className="space-y-xs">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
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
                className="block w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
              />
            </div>
          </div>

          <div className="pt-sm">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      )}

      {!success && (
        <div className="mt-lg text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Remember your password?
            <Link to="/login" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors border-b border-transparent hover:border-secondary ml-1 pb-0.5">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
