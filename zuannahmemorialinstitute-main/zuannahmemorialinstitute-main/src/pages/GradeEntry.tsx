import { useState, useMemo } from "react";
import { calcRowPercentage, calcStudentAverage, getGradeColor, getLetterGrade, SubjectGrade, CLASS_LEVELS, GradeComponent } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Save, Lock, Search, User, GraduationCap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStoreData } from "@/hooks/useStoreData";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

export default function GradeEntry() {
  const { students, components, bands, saveStudent, getSubjectsForClass, loading, setStudents, subjectsConfig } = useStoreData();
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const [selectedId, setSelectedId] = useState<string>("");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Determine which subjects this teacher is assigned to
  const teacherSubjects = useMemo(() => {
    if (isAdmin) return null; // admin sees everything
    if (!isTeacher || !user) return [];
    return subjectsConfig
      .filter((s) => s.teacherUserId === user.id)
      .map((s) => s.name);
  }, [isAdmin, isTeacher, user, subjectsConfig]);

  // Determine which class levels this teacher is assigned to
  const teacherClassLevels = useMemo(() => {
    if (isAdmin) return null;
    if (!isTeacher || !user) return [];
    const levels = new Set<string>();
    subjectsConfig
      .filter((s) => s.teacherUserId === user.id)
      .forEach((s) => s.classLevels.forEach((l) => levels.add(l)));
    return Array.from(levels);
  }, [isAdmin, isTeacher, user, subjectsConfig]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = classFilter === "all" || s.classLevel === classFilter;
      const matchesSearch =
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.includes(searchTerm);
      // Teachers can only see students in their assigned class levels
      const matchesTeacher = !teacherClassLevels || teacherClassLevels.includes(s.classLevel);
      return matchesClass && matchesSearch && matchesTeacher;
    });
  }, [students, classFilter, searchTerm, teacherClassLevels]);

  const student = students.find((s) => s.id === selectedId);
  const overallAvg = student ? calcStudentAverage(student.grades, components) : 0;
  const letterGrade = student ? getLetterGrade(overallAvg, bands) : "";

  function updateGrade(gradeId: string, field: string, value: string | number) {
    if (!student) return;
    const updated = students.map((s) => {
      if (s.id !== selectedId) return s;
      return {
        ...s,
        grades: s.grades.map((g) => {
          if (g.id !== gradeId) return g;
          if (field === "date" || field === "subject") {
            return { ...g, [field]: value };
          }
          return { ...g, scores: { ...g.scores, [field]: Number(value) } };
        }),
      };
    });
    setStudents(updated);
  }

  function addSubjectGrade(subject: string, date: string, scores: Record<string, number>) {
    if (!student) return;
    const newGrade: SubjectGrade = {
      id: crypto.randomUUID(),
      date,
      subject,
      scores,
    };
    const updatedStudent = { ...student, grades: [...student.grades, newGrade] };
    setStudents(students.map((s) => (s.id === selectedId ? updatedStudent : s)));
    saveStudent(updatedStudent);
    toast({ title: `Grade added for ${subject}` });
  }

  function addEmptyRow() {
    if (!student) return;
    const emptyScores: Record<string, number> = {};
    components.forEach((c) => (emptyScores[c.id] = 0));
    const newGrade: SubjectGrade = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      subject: "",
      scores: emptyScores,
    };
    const updatedStudent = { ...student, grades: [...student.grades, newGrade] };
    setStudents(students.map((s) => (s.id === selectedId ? updatedStudent : s)));
  }

  function removeRow(gradeId: string) {
    if (!student) return;
    const updatedStudent = { ...student, grades: student.grades.filter((g) => g.id !== gradeId) };
    setStudents(students.map((s) => (s.id === selectedId ? updatedStudent : s)));
  }

  async function handleSave() {
    const current = students.find((s) => s.id === selectedId);
    if (current) {
      await saveStudent(current);
      toast({ title: "Grades saved successfully!" });
    }
  }

  async function toggleLock() {
    if (!student) return;
    const updatedStudent = { ...student, locked: !student.locked };
    setStudents(students.map((s) => (s.id === selectedId ? updatedStudent : s)));
    await saveStudent(updatedStudent);
    toast({ title: student.locked ? "Grades unlocked" : "Grades locked" });
  }

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">Grade Entry</h2>

      {isTeacher && teacherSubjects && teacherSubjects.length > 0 && (
        <div className="bg-primary/10 text-primary px-4 py-2 rounded text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          You can only enter grades for your assigned subjects: <strong>{teacherSubjects.join(", ")}</strong>
        </div>
      )}

      {isTeacher && teacherSubjects && teacherSubjects.length === 0 && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          You have no subjects assigned. Contact an administrator to get subjects assigned to your account.
        </div>
      )}

      <div className="bg-card rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Select Student</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {(teacherClassLevels || CLASS_LEVELS).map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search student name or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Choose a student…" />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.studentId} — {s.name} ({s.classLevel || "N/A"})
                </SelectItem>
              ))}
              {filteredStudents.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No students found</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {student && (
        <>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-light flex items-center justify-center">
                  <User className="w-6 h-6 text-gold-dark" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{student.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono">{student.studentId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {student.classLevel || "N/A"}</span>
                    <span>•</span>
                    <span>Section {student.section}</span>
                    <span>•</span>
                    <span>{student.semester}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Overall Average</p>
                  <p className="text-2xl font-display font-bold text-gold">{overallAvg.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="text-2xl font-display font-bold text-gold">{letterGrade}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Subjects</p>
                  <p className="text-2xl font-display font-bold">{student.grades.length}</p>
                </div>

                <div className="flex flex-col gap-1 ml-4">
                  <Button variant="outline" size="sm" onClick={toggleLock} className="gap-1">
                    <Lock className="w-3 h-3" /> {student.locked ? "Unlock" : "Lock"}
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Save className="w-3 h-3" /> Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gold-light rounded-lg p-3 text-sm flex flex-wrap gap-4">
            <span className="font-semibold">Grade Components:</span>
            {components.map((c) => (
              <span key={c.id}>{c.label}: {c.maxPoints}pts</span>
            ))}
          </div>

          {student.locked && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded text-sm">
              ⚠ Grades are locked. Unlock to make changes.
            </div>
          )}

          <div className="bg-card rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="gold-header text-left">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Subject</th>
                  {components.map((c) => (
                    <th key={c.id} className="px-3 py-2 text-center">{c.label}<br /><span className="text-xs font-normal">/{c.maxPoints}</span></th>
                  ))}
                  <th className="px-3 py-2 text-center">Average (%)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {student.grades.map((g) => {
                  const avg = calcRowPercentage(g, components);
                  const isSubjectRestricted = teacherSubjects !== null && !teacherSubjects.includes(g.subject);
                  const isDisabled = student.locked || isSubjectRestricted;
                  return (
                    <tr key={g.id} className={`${getGradeColor(avg)} ${isSubjectRestricted ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2">
                        <Input type="date" value={g.date} disabled={isDisabled} onChange={(e) => updateGrade(g.id, "date", e.target.value)} className="w-32 h-8 text-xs" />
                      </td>
                      <td className="px-3 py-2">
                        <Input value={g.subject} disabled={isDisabled} onChange={(e) => updateGrade(g.id, "subject", e.target.value)} className="w-36 h-8 text-xs" />
                      </td>
                      {components.map((c) => (
                        <td key={c.id} className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={c.maxPoints}
                            value={g.scores[c.id] || 0}
                            disabled={isDisabled}
                            onChange={(e) => updateGrade(g.id, c.id, Number(e.target.value))}
                            className="w-14 h-8 text-xs text-center mx-auto"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold text-gold-dark">{avg.toFixed(1)}%</td>
                      <td className="px-3 py-2">
                        {!isDisabled && (
                          <Button variant="ghost" size="icon" onClick={() => removeRow(g.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {student.grades.length === 0 && (
                  <tr>
                    <td colSpan={3 + components.length} className="text-center py-8 text-muted-foreground">
                      No grades entered yet. Click "Add Subject Grade" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!student.locked && (
            <div className="flex gap-2">
              <Button onClick={() => setAddDialogOpen(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Add Subject Grade
              </Button>
              <Button variant="outline" size="sm" onClick={addEmptyRow} className="gap-1">
                <Plus className="w-3 h-3" /> Quick Add Row
              </Button>
            </div>
          )}
        </>
      )}

      {!student && (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-display text-lg">Select a student to enter grades</p>
          <p className="text-sm mt-1">Use the filters above to find and select a student</p>
        </div>
      )}

      <AddSubjectDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={addSubjectGrade}
        components={components}
        existingSubjects={student?.grades.map((g) => g.subject) || []}
        classLevel={student?.classLevel || ""}
        getSubjectsForClass={getSubjectsForClass}
        teacherSubjects={teacherSubjects}
      />
    </div>
  );
}

function AddSubjectDialog({
  open,
  onClose,
  onAdd,
  components,
  existingSubjects,
  classLevel,
  getSubjectsForClass,
  teacherSubjects,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (subject: string, date: string, scores: Record<string, number>) => void;
  components: GradeComponent[];
  existingSubjects: string[];
  classLevel: string;
  getSubjectsForClass: (classLevel: string) => string[];
  teacherSubjects: string[] | null;
}) {
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(components.map((c) => [c.id, 0]))
  );

  const totalMax = components.reduce((sum, c) => sum + c.maxPoints, 0);
  const totalScore = components.reduce((sum, c) => sum + (scores[c.id] || 0), 0);
  const avg = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const finalSubject = subject === "__custom" ? customSubject : subject;

  const configuredSubjects = getSubjectsForClass(classLevel);
  // Filter by teacher assignment if applicable
  const filteredByTeacher = teacherSubjects
    ? configuredSubjects.filter((s) => teacherSubjects.includes(s))
    : configuredSubjects;
  const availableSubjects = filteredByTeacher.filter((s) => !existingSubjects.includes(s));

  function handleSubmit() {
    if (!finalSubject.trim()) return;
    onAdd(finalSubject, date, scores);
    setSubject("");
    setCustomSubject("");
    setScores(Object.fromEntries(components.map((c) => [c.id, 0])));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Add Subject Grade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject…" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
                <SelectItem value="__custom">✏️ Custom Subject…</SelectItem>
              </SelectContent>
            </Select>
            {subject === "__custom" && (
              <Input placeholder="Enter custom subject name" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scores</label>
            <div className="grid grid-cols-2 gap-3">
              {components.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <label className="text-sm flex-1">{c.label}</label>
                  <Input type="number" min={0} max={c.maxPoints} value={scores[c.id] || 0} onChange={(e) => setScores({ ...scores, [c.id]: Number(e.target.value) })} className="w-16 text-center" />
                  <span className="text-xs text-muted-foreground">/{c.maxPoints}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gold-light rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Calculated Average:</span>
            <span className="text-xl font-display font-bold text-gold-dark">{avg.toFixed(1)}%</span>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={!finalSubject.trim()}>
            Add Grade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
