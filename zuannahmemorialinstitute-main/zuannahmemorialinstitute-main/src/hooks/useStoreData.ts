import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GradeComponent, GradeBand, Student, SubjectGrade, SubjectConfig } from "@/lib/store";
import { CLASS_LEVELS } from "@/lib/store";

// Map DB rows to app types
function mapStudentRows(
  studentRows: any[],
  gradeRows: any[]
): Student[] {
  return studentRows.map((s) => ({
    id: s.id,
    studentId: s.student_id,
    name: s.name,
    classLevel: s.class_level,
    section: s.section,
    semester: s.semester,
    parentContact: s.parent_contact || "",
    photo: s.photo || undefined,
    locked: s.locked,
    grades: gradeRows
      .filter((g) => g.student_id === s.id)
      .map((g) => ({
        id: g.id,
        date: g.date,
        subject: g.subject,
        scores: (g.scores || {}) as Record<string, number>,
      })),
  }));
}

function mapComponentRows(rows: any[]): GradeComponent[] {
  return rows
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((r: any) => ({
      id: r.component_id,
      label: r.label,
      maxPoints: r.max_points,
    }));
}

function mapBandRows(rows: any[]): GradeBand[] {
  return rows
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((r: any) => ({
      letter: r.letter,
      min: Number(r.min_val),
      max: Number(r.max_val),
      color: r.color,
    }));
}

function mapSubjectConfigRows(rows: any[]): SubjectConfig[] {
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    classLevels: r.class_levels || [],
    teacher: r.teacher || undefined,
    teacherUserId: r.teacher_user_id || undefined,
  }));
}

export function useStoreData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [bands, setBands] = useState<GradeBand[]>([]);
  const [subjectsConfig, setSubjectsConfig] = useState<SubjectConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [studentsRes, gradesRes, compsRes, bandsRes, subjectsRes] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("subject_grades").select("*"),
      supabase.from("grade_components").select("*"),
      supabase.from("grade_bands").select("*"),
      supabase.from("subjects_config").select("*"),
    ]);

    if (compsRes.data) setComponents(mapComponentRows(compsRes.data));
    if (bandsRes.data) setBands(mapBandRows(bandsRes.data));
    if (subjectsRes.data) setSubjectsConfig(mapSubjectConfigRows(subjectsRes.data));
    if (studentsRes.data && gradesRes.data) {
      setStudents(mapStudentRows(studentsRes.data, gradesRes.data));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Save a single student + grades
  const saveStudent = useCallback(async (student: Student) => {
    await supabase.from("students").upsert({
      id: student.id,
      student_id: student.studentId,
      name: student.name,
      class_level: student.classLevel,
      section: student.section,
      semester: student.semester,
      parent_contact: student.parentContact,
      photo: student.photo || null,
      locked: student.locked,
    });

    // Delete existing grades and re-insert
    await supabase.from("subject_grades").delete().eq("student_id", student.id);
    if (student.grades.length > 0) {
      await supabase.from("subject_grades").insert(
        student.grades.map((g) => ({
          id: g.id,
          student_id: student.id,
          subject: g.subject,
          date: g.date,
          scores: g.scores,
        }))
      );
    }
  }, []);

  const saveAllStudents = useCallback(async (allStudents: Student[]) => {
    for (const s of allStudents) {
      await saveStudent(s);
    }
    setStudents(allStudents);
  }, [saveStudent]);

  const deleteStudent = useCallback(async (id: string) => {
    await supabase.from("students").delete().eq("id", id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addStudent = useCallback(async (student: Student) => {
    const { data } = await supabase.from("students").insert({
      student_id: student.studentId,
      name: student.name,
      class_level: student.classLevel,
      section: student.section,
      semester: student.semester,
      parent_contact: student.parentContact,
      locked: false,
    }).select().single();

    if (data) {
      const newStudent = { ...student, id: data.id };
      setStudents((prev) => [...prev, newStudent]);
      return newStudent;
    }
    return student;
  }, []);

  const saveComponents = useCallback(async (comps: GradeComponent[]) => {
    await supabase.from("grade_components").delete().neq("component_id", "___none___");
    if (comps.length > 0) {
      await supabase.from("grade_components").insert(
        comps.map((c, i) => ({
          component_id: c.id,
          label: c.label,
          max_points: c.maxPoints,
          sort_order: i + 1,
        }))
      );
    }
    setComponents(comps);
  }, []);

  const saveBands = useCallback(async (newBands: GradeBand[]) => {
    await supabase.from("grade_bands").delete().neq("letter", "___none___");
    if (newBands.length > 0) {
      await supabase.from("grade_bands").insert(
        newBands.map((b, i) => ({
          letter: b.letter,
          min_val: b.min,
          max_val: b.max,
          color: b.color,
          sort_order: i + 1,
        }))
      );
    }
    setBands(newBands);
  }, []);

  const saveSubjectsConfig = useCallback(async (configs: SubjectConfig[]) => {
    await supabase.from("subjects_config").delete().neq("name", "___none___");
    if (configs.length > 0) {
      await supabase.from("subjects_config").insert(
        configs.map((c) => ({
          name: c.name,
          class_levels: c.classLevels,
          teacher: c.teacher || null,
          teacher_user_id: c.teacherUserId || null,
        }))
      );
    }
    setSubjectsConfig(configs);
  }, []);

  const getSubjectsForClass = useCallback((classLevel: string): string[] => {
    return subjectsConfig
      .filter((s) => s.classLevels.includes(classLevel))
      .map((s) => s.name);
  }, [subjectsConfig]);

  const generateStudentId = useCallback((): string => {
    const max = students.reduce((m, s) => {
      const num = parseInt(s.studentId.replace("00-", ""), 10);
      return num > m ? num : m;
    }, 0);
    return `00-${String(max + 1).padStart(4, "0")}`;
  }, [students]);

  return {
    students, setStudents,
    components, setComponents,
    bands, setBands,
    subjectsConfig, setSubjectsConfig,
    loading,
    refetch: fetchAll,
    saveStudent,
    saveAllStudents,
    deleteStudent,
    addStudent,
    saveComponents,
    saveBands,
    saveSubjectsConfig,
    getSubjectsForClass,
    generateStudentId,
  };
}
