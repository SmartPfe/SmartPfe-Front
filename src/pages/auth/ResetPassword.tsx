import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchApi } from "../../lib/api";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      navigate("/login", { state: { message: "Password updated. You can sign in now." } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-[420px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sm:p-xl shadow-sm text-center">
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Invalid reset link.</p>
        <Link to="/forgot-password" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sm:p-xl shadow-sm">
      <div className="flex flex-col items-center mb-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">New Password</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[300px]">
          Choose a new password for your account.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-md text-sm text-center border border-error">
          {error}
        </div>
      )}

      <form className="space-y-lg" onSubmit={handleSubmit}>
        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className="block w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      <div className="mt-lg text-center">
        <Link to="/login" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors border-b border-transparent hover:border-secondary pb-0.5">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
