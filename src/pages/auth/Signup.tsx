import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import GoogleLoginButton from "../../components/GoogleLoginButton";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 6) strength += 25;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password) || /[^A-Za-z0-9]/.test(formData.password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const getStrengthColor = () => {
    if (passwordStrength < 50) return "bg-error";
    if (passwordStrength < 100) return "bg-[warning]"; // Using a yellow-ish color, can fallback to secondary
    return "bg-[#34A853]"; // Green
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(""); // clear error when typing
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

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ fullName: data.fullName, email: data.email, avatar: data.avatar, hasCompletedOnboarding: data.hasCompletedOnboarding }));

      if (data.hasCompletedOnboarding) {
        navigate("/workspace/overview");
      } else {
        navigate("/onboarding/1");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-lg relative overflow-hidden">
      <header className="flex flex-col items-center text-center gap-xs mt-sm">
        <div className="w-12 h-12 bg-primary-container text-on-primary rounded-lg flex items-center justify-center mb-xs">
          <span className="material-symbols-outlined text-[28px]">school</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface">Create your Workspace</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Join your academic journey and start building your PFE project.</p>
        <div className="mt-xs pt-xs border-t border-outline-variant w-full max-w-[200px] flex justify-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">PFE Guidance · Academic Year 2023-24</span>
        </div>
      </header>
      
      {error && (
        <div className="p-3 bg-error-container text-on-error-container rounded-md text-sm text-center border border-error">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-md mt-sm" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">Full Name</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">person</span>
            <input 
              type="text" 
              id="fullName" 
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe" 
              required 
              className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">University Email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="jane.doe@university.edu" 
              required 
              className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">lock</span>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange}
              minLength={6} 
              placeholder="••••••••" 
              required 
              className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" 
            />
          </div>
          
          {/* Password Strength Progress Bar */}
          {formData.password.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-label-sm text-xs text-on-surface-variant">Password strength:</span>
                <span className="font-label-sm text-xs font-medium" style={{ color: passwordStrength < 50 ? '#BA1A1A' : passwordStrength < 100 ? '#F9A825' : '#34A853' }}>
                  {passwordStrength < 50 ? "Weak" : passwordStrength < 100 ? "Medium" : "Strong"}
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ease-out`}
                  style={{ 
                    width: `${passwordStrength}%`,
                    backgroundColor: passwordStrength < 50 ? '#BA1A1A' : passwordStrength < 100 ? '#F9A825' : '#34A853'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-sm flex flex-col gap-md">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-primary text-on-primary rounded-lg font-body-md text-body-md font-medium hover:bg-on-surface-variant transition-colors flex items-center justify-center gap-xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
          <div className="text-center font-body-md text-body-md text-on-surface-variant">
            Already have an account? 
            <Link to="/login" className="text-primary hover:text-secondary font-medium transition-colors border-b border-transparent hover:border-secondary ml-1">Log in</Link>
          </div>
        </div>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant"></div>
        </div>
        <div className="relative bg-surface-container-lowest px-3 text-sm text-outline font-medium uppercase tracking-wider">
          or
        </div>
      </div>

      <div className="mb-2">
        <GoogleLoginButton onError={setError} onLoading={setLoading} />
      </div>

      <footer className="mt-md pt-md border-t border-surface-container text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
          By signing up, you agree to our 
          <a href="#" className="text-on-surface hover:text-primary underline transition-colors mx-1">Terms of Service</a> 
          and 
          <a href="#" className="text-on-surface hover:text-primary underline transition-colors ml-1">Privacy Policy</a>.
        </p>
      </footer>
    </div>
  );
}
