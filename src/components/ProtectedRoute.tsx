import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  requiredRole?: "admin" | "etudiant";
};

export default function ProtectedRoute({
  children,
  requiredRole,
}: Props) {

  const token =
    localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/workspace/overview"} replace />;
  }

  return <>{children}</>;
}
