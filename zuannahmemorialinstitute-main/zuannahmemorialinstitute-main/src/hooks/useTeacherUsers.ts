import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeacherUser {
  userId: string;
  email: string;
  fullName: string;
}

export function useTeacherUsers() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      // Get all user_ids with teacher role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (!roleData || roleData.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }

      const teacherUserIds = roleData.map((r) => r.user_id);

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .in("user_id", teacherUserIds);

      // Get emails via edge function or just use profiles
      const result: TeacherUser[] = teacherUserIds.map((uid) => {
        const profile = profiles?.find((p) => p.user_id === uid);
        return {
          userId: uid,
          email: "",
          fullName: profile?.full_name || "Unknown Teacher",
        };
      });

      setTeachers(result);
      setLoading(false);
    }

    fetchTeachers();
  }, []);

  return { teachers, loading };
}
