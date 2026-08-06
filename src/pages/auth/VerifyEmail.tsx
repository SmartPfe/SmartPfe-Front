import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchApi } from "../../lib/api";

type VerifyEmailLocationState = {
  email?: string;
  devVerificationCode?: string;
  message?: string;
};

function persistSession(data: any) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify({
    _id: data._id,
    fullName: data.fullName,
    email: data.email,
    avatar: data.avatar,
    authProvider: data.authProvider || "email",
    emailVerified: data.emailVerified !== false,
    hasCompletedOnboarding: data.hasCompletedOnboarding,
    role: data.role || "etudiant",
  }));
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as VerifyEmailLocationState;
  const initialEmail = useMemo(
    () => state.email || sessionStorage.getItem("pendingVerificationEmail") || "",
    [state.email]
  );

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(state.message || "Enter the 6-digit code sent to your email.");
  const [devCode, setDevCode] = useState(state.devVerificationCode || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchApi("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });

      sessionStorage.removeItem("pendingVerificationEmail");
      persistSession(data);

      if (data.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      navigate(data.hasCompletedOnboarding ? "/workspace/overview" : "/onboarding/1");
    } catch (err: any) {
      setError(err.message || "Email verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Email is required before resending a code.");
      return;
    }

    setResending(true);
    setError("");

    try {
      const data = await fetchApi("/auth/resend-verification-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (data.alreadyVerified) {
        setMessage(data.message || "This email is already verified. You can log in now.");
        return;
      }

      sessionStorage.setItem("pendingVerificationEmail", data.email || email);
      setMessage(data.message || "A new verification code has been sent.");
      setDevCode(data.devVerificationCode || "");
      setCode("");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sm:p-xl shadow-sm">
      <div className="flex flex-col items-center mb-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Verify your email</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
      </div>

      {devCode && (
        <div className="p-3 mb-4 bg-secondary-container text-on-secondary-container rounded-md text-sm text-center border border-secondary-fixed-dim">
          Development code: <span className="font-bold tracking-widest">{devCode}</span>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-md text-sm text-center border border-error">
          {error}
        </div>
      )}

      <form className="space-y-lg" onSubmit={handleVerify}>
        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              required
              placeholder="student@university.edu"
              className="block w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface" htmlFor="code">Verification code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={handleCodeChange}
            autoComplete="one-time-code"
            required
            placeholder="000000"
            className="block h-14 w-full rounded-md border border-outline-variant bg-surface px-4 text-center text-headline-md font-semibold tracking-[0.35em] text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <div className="mt-lg flex flex-col items-center gap-sm text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-label-md text-label-md text-secondary hover:text-secondary-container transition-colors disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already verified?
          <Link to="/login" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors border-b border-transparent hover:border-secondary ml-1 pb-0.5">Log in</Link>
        </p>
      </div>
    </div>
  );
}
