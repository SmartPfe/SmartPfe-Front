import React, { useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchApi } from "../../lib/api";
import HugeiconsIcon from "../../components/ui/HugeiconsIcon";

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
    uiLanguage: data.uiLanguage || "en",
  }));
}

export default function VerifyEmail() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as VerifyEmailLocationState;
  const initialEmail = useMemo(
    () => state.email || sessionStorage.getItem("pendingVerificationEmail") || "",
    [state.email]
  );

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [message, setMessage] = useState(state.message || "");
  const [messageKey, setMessageKey] = useState("");
  const [devCode, setDevCode] = useState(state.devVerificationCode || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    setError("");
    setErrorKey("");
    // Allow only numeric input
    const cleaned = value.replace(/\D/g, "");
    
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Handle single digit input
    if (cleaned.length === 1) {
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      setDigits(newDigits);

      // Auto-advance to next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Handle paste of multiple digits
      const pastedDigits = cleaned.slice(0, 6).split("");
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      
      const nextFocus = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    pasted.split("").forEach((char, idx) => {
      newDigits[idx] = char;
    });
    setDigits(newDigits);

    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrorKey("verify.emailRequired");
      return;
    }

    if (code.length !== 6) {
      setErrorKey("verify.completeCodeRequired");
      return;
    }

    setLoading(true);
    setError("");
    setErrorKey("");

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
      if (err.message) setError(err.message);
      else setErrorKey("verify.verificationFailed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorKey("verify.resendEmailRequired");
      return;
    }

    setResending(true);
    setError("");
    setErrorKey("");

    try {
      const data = await fetchApi("/auth/resend-verification-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (data.alreadyVerified) {
        if (data.message) {
          setMessage(data.message);
          setMessageKey("");
        }
        else {
          setMessage("");
          setMessageKey("verify.alreadyVerified");
        }
        return;
      }

      sessionStorage.setItem("pendingVerificationEmail", data.email || email);
      if (data.message) {
        setMessage(data.message);
        setMessageKey("");
      } else {
        setMessage("");
        setMessageKey("verify.codeSent");
      }
      setDevCode(data.devVerificationCode || "");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err.message) setError(err.message);
      else setErrorKey("verify.resendFailed");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
          <HugeiconsIcon icon="mark-email-read" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("verify.title")}</h1>
        <p className="text-xs text-on-surface-variant mt-1 max-w-[300px]">
          {email ? (
            <>
              {t("verify.instructionsWithEmail", { email })}
            </>
          ) : (
            t("verify.instructions")
          )}
        </p>
      </div>

      {devCode && (
        <div className="p-3 mb-4 bg-surface-container-low border border-primary/20 rounded-xl text-xs flex items-center justify-between">
          <span className="text-on-surface-variant font-medium">{t("verify.devCode")}</span>
          <button 
            type="button"
            onClick={() => {
              const pasted = devCode.slice(0, 6).split("");
              const newDigits = [...digits];
              pasted.forEach((d, i) => { newDigits[i] = d; });
              setDigits(newDigits);
            }}
            className="font-mono font-bold tracking-widest text-primary hover:underline cursor-pointer"
            title={t("verify.clickToFill")}
          >
            {devCode}
          </button>
        </div>
      )}

      {(messageKey || message) && !error && !errorKey && (
        <div className="p-3 mb-4 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="checkmark-circle-02" size={16} strokeWidth={2} className="shrink-0" />
          <span>{messageKey ? t(messageKey) : message}</span>
        </div>
      )}

      {(errorKey || error) && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={2} className="shrink-0" />
          <span>{errorKey ? t(errorKey) : error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleVerify}>
        {!initialEmail && (
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="email">
              {t("verify.email")}
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
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setErrorKey("");
                }}
                autoComplete="email"
                required
                placeholder={t("verify.emailPlaceholder")}
                className="block w-full h-11 pl-10 pr-3.5 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* 6-Digit Segmented OTP Input */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2.5 text-center">
            {t("verify.verificationCode")}
          </label>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                aria-label={t("verify.digitLabel", { number: idx + 1 })}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoFocus={idx === 0}
                className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-surface border border-outline-variant/80 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>{t("verify.verifying")}</span>
              </>
            ) : (
              <span>{t("verify.verifyEmail")}</span>
            )}
          </button>
        </div>
      </form>

      {/* Resend and Login */}
      <div className="mt-6 flex flex-col items-center gap-3 text-center pt-2 border-t border-outline-variant/60">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {resending ? t("verify.resending") : t("verify.resendPrompt")}
        </button>

        <p className="text-xs text-on-surface-variant">
          {t("verify.alreadyVerifiedQuestion")}{" "}
          <Link 
            to="/login" 
            className="font-semibold text-primary hover:text-primary/80 transition-colors ml-0.5"
          >
            {t("verify.logIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
