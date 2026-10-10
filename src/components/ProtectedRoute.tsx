import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApi } from "@/lib/api";

type Props = {
  children: React.ReactNode;
  requiredRole?: "admin" | "etudiant";
  onboardingOnly?: boolean;
};

export default function ProtectedRoute({
  children,
  requiredRole,
  onboardingOnly = false,
}: Props) {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState<{ role: string; hasCompletedOnboarding: boolean } | null>(null);
  const [failed, setFailed] = useState<"unauthorized" | "unavailable" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const token =
    localStorage.getItem("token");
  useEffect(() => {
    let active = true;
    setProfile(null);
    setFailed(null);
    if (token) fetchApi("/auth/profile").then(user => {
      if (active) { setProfile(user); setVerifiedToken(token); }
    }).catch(error => { if (active) setFailed(error.status === 401 ? "unauthorized" : "unavailable"); });
    return () => { active = false; };
  }, [token, requiredRole, onboardingOnly, attempt]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (failed === "unauthorized") return <Navigate to="/login" replace />;
  if (failed === "unavailable") return <div role="alert" className="p-6 text-on-surface"><p>{t("accessCheckFailed")}</p><button type="button" className="mt-3 text-primary underline" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></div>;
  if (!profile || verifiedToken !== token) return <div role="status" className="p-6 text-on-surface">{t("loading")}</div>;
  if (!["admin", "etudiant"].includes(profile.role)) return <Navigate to="/login" replace />;
  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to={profile.role === "admin" ? "/admin/dashboard" : "/workspace/overview"} replace />;
  }
  if (onboardingOnly && profile.hasCompletedOnboarding) return <Navigate to="/workspace/settings/onboarding" replace />;

  return <>{children}</>;
}
