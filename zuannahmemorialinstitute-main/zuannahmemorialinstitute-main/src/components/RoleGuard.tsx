import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  children: ReactNode;
  allowed: Array<"admin" | "teacher" | "student" | "parent">;
  fallback?: string;
}

export default function RoleGuard({ children, allowed, fallback = "/" }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
