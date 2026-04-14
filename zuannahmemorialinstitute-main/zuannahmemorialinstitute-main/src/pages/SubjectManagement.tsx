import { useState, useEffect } from "react";
import { SubjectConfig, CLASS_LEVELS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStoreData } from "@/hooks/useStoreData";
import { useTeacherUsers, TeacherUser } from "@/hooks/useTeacherUsers";

export default function SubjectManagement() {
  const { subjectsConfig, saveSubjectsConfig, loading } = useStoreData();
  const { teachers } = useTeacherUsers();
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) setSubjects(subjectsConfig);
  }, [loading, subjectsConfig]);

  const filtered = subjects.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.teacher || "").toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === "all" || s.classLevels.includes(filterLevel);
    return matchesSearch && matchesLevel;
  });

  async function handleSave(data: Omit<SubjectConfig, "id">) {
    let updated: SubjectConfig[];
    if (editing) {
      updated = subjects.map((s) => (s.id === editing.id ? { ...s, ...data } : s));
    } else {
      updated = [...subjects, { id: crypto.randomUUID(), ...data }];
    }
    setSubjects(updated);
    await saveSubjectsConfig(updated);
    setDialogOpen(false);
    setEditing(null);
    toast({ title: editing ? "Subject updated" : "Subject added" });
  }

  async function handleDelete(id: string) {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    await saveSubjectsConfig(updated);
    toast({ title: "Subject deleted", variant: "destructive" });
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
        <h2 className="text-2xl font-display font-bold">Subject Management</h2>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search subjects…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Classes</option>
          {CLASS_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="gold-header text-left">
              <th className="px-4 py-3">Subject Name</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Class Levels</th>
              <th className="px-4 py-3 text-center">Classes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gold" />
                  {s.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.teacher || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.classLevels.length === CLASS_LEVELS.length ? (
                      <span className="text-xs bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full font-medium">All Classes</span>
                    ) : (
                      s.classLevels.slice(0, 4).map((level) => (
                        <span key={level} className="text-xs bg-muted px-2 py-0.5 rounded-full">{level}</span>
                      ))
                    )}
                    {s.classLevels.length > 4 && s.classLevels.length < CLASS_LEVELS.length && (
                      <span className="text-xs text-muted-foreground">+{s.classLevels.length - 4} more</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono">{s.classLevels.length}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No subjects found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-gold-light rounded-lg p-4 text-sm">
        <span className="font-semibold">Total Subjects: {subjects.length}</span>
        <span className="ml-4">Showing: {filtered.length}</span>
      </div>

      <SubjectDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={handleSave}
        subject={editing}
        teachers={teachers}
      />
    </div>
  );
}

function SubjectDialog({
  open,
  onClose,
  onSave,
  subject,
  teachers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<SubjectConfig, "id">) => void;
  subject: SubjectConfig | null;
  teachers: TeacherUser[];
}) {
  const [name, setName] = useState(subject?.name || "");
  const [teacher, setTeacher] = useState(subject?.teacher || "");
  const [teacherUserId, setTeacherUserId] = useState(subject?.teacherUserId || "");
  const [selectedLevels, setSelectedLevels] = useState<string[]>(subject?.classLevels || [...CLASS_LEVELS]);

  useState(() => {
    setName(subject?.name || "");
    setTeacher(subject?.teacher || "");
    setTeacherUserId(subject?.teacherUserId || "");
    setSelectedLevels(subject?.classLevels || [...CLASS_LEVELS]);
  });

  function toggleLevel(level: string) {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }

  function selectAll() {
    setSelectedLevels([...CLASS_LEVELS]);
  }

  function selectNone() {
    setSelectedLevels([]);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Name</label>
            <Input placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned Teacher (optional)</label>
            <Select
              value={teacherUserId || "__none"}
              onValueChange={(val) => {
                if (val === "__none") {
                  setTeacherUserId("");
                  setTeacher("");
                } else {
                  setTeacherUserId(val);
                  const t = teachers.find((t) => t.userId === val);
                  setTeacher(t?.fullName || "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No teacher assigned</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.userId} value={t.userId}>
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Available for Class Levels</label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={selectAll}>All</Button>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={selectNone}>None</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {CLASS_LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                  <Checkbox
                    checked={selectedLevels.includes(level)}
                    onCheckedChange={() => toggleLevel(level)}
                  />
                  {level}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedLevels.length} class level(s) selected</p>
          </div>

          <Button
            className="w-full"
            onClick={() => onSave({ name, teacher: teacher || undefined, teacherUserId: teacherUserId || undefined, classLevels: selectedLevels })}
            disabled={!name.trim() || selectedLevels.length === 0}
          >
            {subject ? "Update" : "Add"} Subject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
