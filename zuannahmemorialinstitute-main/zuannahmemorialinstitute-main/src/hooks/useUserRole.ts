import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "teacher" | "student" | "parent";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: user!.id,
      });

      if (error) {
        console.error("Error fetching role:", error);
        setRole(null);
      } else {
        setRole(data as AppRole | null);
      }
      setLoading(false);
    }

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isParent = role === "parent";

  const canManageStudents = isAdmin || isTeacher;
  const canManageGrades = isAdmin || isTeacher;
  const canManageSubjects = isAdmin;
  const canManageAcademicYears = isAdmin;
  const canManageSettings = isAdmin;
  const canViewReports = isAdmin || isTeacher;
  const canViewGradeSheet = isAdmin || isTeacher || isStudent || isParent;

  return {
    role,
    loading,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    canManageStudents,
    canManageGrades,
    canManageSubjects,
    canManageAcademicYears,
    canManageSettings,
    canViewReports,
    canViewGradeSheet,
  };
}
