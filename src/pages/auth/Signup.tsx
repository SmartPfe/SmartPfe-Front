import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import HugeiconsIcon from "../../components/ui/HugeiconsIcon";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4
  const [showPassword, setShowPassword] = useState(false);

  // Calculate 4-stage password strength
  useEffect(() => {
    let score = 0;
    if (formData.password.length >= 6) score += 1;
    if (formData.password.length >= 8) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9]|[^A-Za-z0-9]/.test(formData.password)) score += 1;
    
    setPasswordStrength(score);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const data = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      sessionStorage.setItem("pendingVerificationEmail", data.email || formData.email);
      navigate("/verify-email", {
        state: {
          email: data.email || formData.email,
          devVerificationCode: data.devVerificationCode,
        },
      });
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return { text: "Weak", color: "text-error" };
    if (passwordStrength === 2) return { text: "Fair", color: "text-amber-500" };
    if (passwordStrength === 3) return { text: "Good", color: "text-amber-500" };
    return { text: "Strong", color: "text-secondary" };
  };

  const getSegmentColor = (segmentIndex: number) => {
    if (segmentIndex >= passwordStrength) return "bg-surface-container-high";
    if (passwordStrength <= 1) return "bg-error";
    if (passwordStrength <= 3) return "bg-amber-500";
    return "bg-secondary";
  };

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
          <HugeiconsIcon icon="mortarboard-02" size={24} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Create your account</h1>
        <p className="text-xs text-on-surface-variant mt-1">Start architecting your end-of-studies project</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-center gap-2">
          <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="fullName">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="user" size={18} strokeWidth={1.6} />
            </div>
            <input 
              type="text" 
              id="fullName" 
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Alex Smith" 
              required 
              className="block w-full h-11 pl-10 pr-3.5 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="mail" size={18} strokeWidth={1.6} />
            </div>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="alex.smith@university.edu" 
              required 
              className="block w-full h-11 pl-10 pr-3.5 bg-surface border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <HugeiconsIcon icon="lock" size={18} strokeWidth={1.6} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              value={formData.password}
              onChange={handleChange}
              minLength={6} 
              placeholder="••••••••" 
              required 
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
          
          {/* iOS-Style 4-Segment Password Strength Bar */}
          {formData.password.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex gap-1.5 w-full">
                {[0, 1, 2, 3].map((index) => (
                  <div 
                    key={index} 
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getSegmentColor(index)}`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-on-surface-variant">Security rating:</span>
                <span className={`font-semibold ${getStrengthLabel().color}`}>
                  {getStrengthLabel().text}
                </span>
              </div>
            </div>
          )}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <HugeiconsIcon icon="arrow-right" size={16} strokeWidth={2} />
              </>
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

      {/* Footer login & terms */}
      <div className="space-y-3 text-center pt-1">
        <p className="text-xs text-on-surface-variant">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="font-semibold text-primary hover:text-primary/80 transition-colors ml-0.5"
          >
            Log in
          </Link>
        </p>

        <p className="text-[11px] text-on-surface-variant/70 leading-normal">
          By signing up, you agree to our{" "}
          <a href="#" className="underline hover:text-on-surface transition-colors">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-on-surface transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
