import { useState } from "react";
import { Student, CLASS_LEVELS } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Lock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useStoreData } from "@/hooks/useStoreData";

export default function Students() {
  const { students, saveStudent, deleteStudent, addStudent, generateStudentId, loading } = useStoreData();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const { toast } = useToast();

  const filtered = students.filter(
    (s) =>
      (classFilter === "all" || s.classLevel === classFilter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.section.toLowerCase().includes(search.toLowerCase()) ||
        (s.classLevel || "").toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.includes(search))
  );

  async function handleSave(data: Partial<Student>) {
    if (editing) {
      const updated = { ...editing, ...data };
      await saveStudent(updated);
      toast({ title: "Student updated" });
    } else {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        studentId: generateStudentId(),
        name: data.name || "",
        classLevel: data.classLevel || "1st Grade",
        section: data.section || "",
        semester: data.semester || "Spring 2024",
        parentContact: data.parentContact || "",
        grades: [],
        locked: false,
      };
      await addStudent(newStudent);
      toast({ title: "Student added" });
    }
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await deleteStudent(id);
    toast({ title: "Student deleted", variant: "destructive" });
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Student Management</h2>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, ID, section…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASS_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="gold-header text-left">
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-mono">{s.studentId}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.classLevel || "—"}</td>
                <td className="px-4 py-3">{s.section}</td>
                <td className="px-4 py-3">{s.semester}</td>
                <td className="px-4 py-3">
                  {s.locked ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Locked</span>
                  ) : (
                    <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-1">
                  <Link to={`/grade-sheet/${s.id}`}>
                    <Button variant="ghost" size="icon" title="View Grade Sheet"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={handleSave} student={editing} />
    </div>
  );
}

function StudentDialog({ open, onClose, onSave, student }: { open: boolean; onClose: () => void; onSave: (d: Partial<Student>) => void; student: Student | null }) {
  const [name, setName] = useState(student?.name || "");
  const [classLevel, setClassLevel] = useState(student?.classLevel || "1st Grade");
  const [section, setSection] = useState(student?.section || "");
  const [semester, setSemester] = useState(student?.semester || "Spring 2024");
  const [contact, setContact] = useState(student?.parentContact || "");

  useState(() => {
    setName(student?.name || "");
    setClassLevel(student?.classLevel || "1st Grade");
    setSection(student?.section || "");
    setSemester(student?.semester || "Spring 2024");
    setContact(student?.parentContact || "");
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{student ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={classLevel} onValueChange={setClassLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select Class Level" />
            </SelectTrigger>
            <SelectContent>
              {CLASS_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Section (e.g. A, B, C)" value={section} onChange={(e) => setSection(e.target.value)} />
          <Input placeholder="Semester (e.g. Spring 2024)" value={semester} onChange={(e) => setSemester(e.target.value)} />
          <Input placeholder="Parent Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Button className="w-full" onClick={() => onSave({ name, classLevel, section, semester, parentContact: contact })}>
            {student ? "Update" : "Add"} Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
