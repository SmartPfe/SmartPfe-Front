import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "../../lib/api";
import GoogleLoginButton from "../../components/GoogleLoginButton";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(""); // Clear error when typing
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
        hasCompletedOnboarding: data.hasCompletedOnboarding,
      }));

      if (data.hasCompletedOnboarding) {
        navigate("/workspace/overview");
      } else {
        navigate("/onboarding/1");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
      <div className="flex flex-col items-center mb-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Welcome Back</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">PFE Guidance Platform</p>
        <p className="font-label-md text-label-md text-outline mt-1 uppercase tracking-wider">Academic Year 2023-24</p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-md text-sm text-center border border-error">
          {error}
        </div>
      )}

      <form className="space-y-lg" onSubmit={handleSubmit}>
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
              value={formData.email}
              onChange={handleChange}
              autoComplete="email" 
              required 
              placeholder="student@university.edu"
              className="block w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-xs">
          <div className="flex items-center justify-between">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="font-label-md text-label-md text-secondary hover:text-secondary-container transition-colors">Forgot password?</Link> 

           </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
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
              className="block w-full pl-10 pr-10 py-2 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-sm">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant"></div>
        </div>
        <div className="relative bg-surface-container-lowest px-3 text-sm text-outline font-medium uppercase tracking-wider">
          or
        </div>
      </div>

      <div className="mb-4">
        <GoogleLoginButton onError={setError} onLoading={setLoading} />
      </div>

      <div className="mt-lg text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Don't have an account? 
          <Link to="/signup" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors border-b border-transparent hover:border-secondary ml-1 pb-0.5">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
