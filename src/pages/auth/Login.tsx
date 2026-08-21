import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import HugeiconsIcon from "../../components/ui/HugeiconsIcon";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const locationMessage = (location.state as any)?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // Save token to localStorage
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

      if (data.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      if (data.hasCompletedOnboarding) {
        navigate("/workspace/overview");
      } else {
        navigate("/onboarding/1");
      }
    } catch (err: any) {
      if (err.requiresEmailVerification) {
        const email = err.email || formData.email;
        sessionStorage.setItem("pendingVerificationEmail", email);
        navigate("/verify-email", {
          state: {
            email,
            devVerificationCode: err.devVerificationCode,
            message: err.message,
          },
        });
        return;
      }

      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
          <HugeiconsIcon icon="mortarboard-02" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Welcome back</h1>
        <p className="text-xs text-on-surface-variant mt-1">Sign in to your SmartPFE workspace</p>
      </div>

      {locationMessage && !error && (
        <div className="p-3 mb-4 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="checkmark-circle-02" size={16} strokeWidth={2} className="shrink-0" />
          <span>{locationMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
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
              value={formData.email}
              onChange={handleChange}
              autoComplete="email" 
              required 
              placeholder="student@university.edu"
              className="block w-full h-11 pl-10 pr-3.5 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-on-surface" htmlFor="password">
              Password
            </label>
            <Link 
              to="/forgot-password" 
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link> 
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="lock" size={18} strokeWidth={1.6} />
            </div>
            <input 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password" 
              required 
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

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/60"></div>
        </div>
        <div className="relative bg-surface-container-lowest px-3 text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
          or continue with
        </div>
      </div>

      {/* Google OAuth */}
      <div className="mb-4">
        <GoogleLoginButton onError={setError} onLoading={setLoading} />
      </div>

      {/* Footer link */}
      <div className="text-center pt-1">
        <p className="text-xs text-on-surface-variant">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="font-semibold text-primary hover:text-primary/80 transition-colors ml-0.5"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
