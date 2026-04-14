import { useState } from "react";
import {
  getAcademicYears,
  getActiveYear,
  createAcademicYear,
  getArchiveByYearId,
  getAuditLog,
  formatYearName,
  AcademicYear,
  AcademicYearArchive,
  AuditLogEntry,
} from "@/lib/academicYear";
import { calcStudentAverage, getLetterGrade } from "@/lib/store";
import { useStoreData } from "@/hooks/useStoreData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarPlus,
  Archive,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  BookOpen,
} from "lucide-react";

export default function AcademicYearManagement() {
  const [years, setYears] = useState<AcademicYear[]>(getAcademicYears());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(getAuditLog());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [archiveViewOpen, setArchiveViewOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<AcademicYearArchive | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const activeYear = years.find((y) => y.status === "active") || null;
  const archivedYears = years.filter((y) => y.status === "archived");

  function handleCreate() {
    const name = formatYearName(startYear);
    if (!startDate || !endDate) {
      toast({ title: "Please provide start and end dates", variant: "destructive" });
      return;
    }
    const result = createAcademicYear(name, startDate, endDate);
    if (result.success) {
      toast({ title: `Academic year ${name} created and activated!` });
      setYears(getAcademicYears());
      setAuditLog(getAuditLog());
      setCreateDialogOpen(false);
    } else {
      toast({ title: result.error || "Error creating year", variant: "destructive" });
    }
  }

  function viewArchive(yearId: string) {
    const archive = getArchiveByYearId(yearId);
    setSelectedArchive(archive);
    setArchiveViewOpen(true);
  }

  const { components, bands } = useStoreData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Academic Year Management</h1>
          <p className="text-sm text-muted-foreground">Create, transition, and archive academic years</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAuditOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary text-primary-foreground">
            <CalendarPlus className="w-4 h-4 mr-2" />
            New Academic Year
          </Button>
        </div>
      </div>

      {/* Active Year Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <h2 className="text-lg font-semibold text-foreground">Active Academic Year</h2>
        </div>
        {activeYear ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Year</p>
              <p className="text-xl font-bold text-foreground">{activeYear.name}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
              <p className="text-sm font-medium text-foreground">{activeYear.startDate}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
              <p className="text-sm font-medium text-foreground">{activeYear.endDate}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success text-success-foreground">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-md bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-sm text-foreground">
              No active academic year. Create one to start recording grades.
            </p>
          </div>
        )}
      </div>

      {/* Archived Years */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Archive className="w-6 h-6 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Archived Years ({archivedYears.length})
          </h2>
        </div>
        {archivedYears.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived years yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-3 font-medium text-muted-foreground">Year</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Period</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Archived On</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedYears.map((y) => (
                  <tr key={y.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-3 font-medium text-foreground">{y.name}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {y.startDate} → {y.endDate}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {y.archivedAt ? new Date(y.archivedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <Button size="sm" variant="outline" onClick={() => viewArchive(y.id)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View Records
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Role-Based Access Control</p>
          <p className="text-xs text-muted-foreground">
            Only administrators can create, activate, or archive academic years. All transitions are logged in the audit trail.
            Archived data is read-only and cannot be modified.
          </p>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Academic Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activeYear && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/30">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">
                  The current year <strong>{activeYear.name}</strong> will be archived automatically. All grades, attendance, and records
                  will be backed up and the new year will start fresh.
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Academic Year</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground font-medium">
                  → {formatYearName(startYear)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Create & Activate Year
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Viewer Dialog */}
      <Dialog open={archiveViewOpen} onOpenChange={setArchiveViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Archive: {selectedArchive?.yearName || ""}
              <span className="text-xs font-normal text-muted-foreground ml-2">Read-Only</span>
            </DialogTitle>
          </DialogHeader>
          {selectedArchive && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md bg-muted p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{selectedArchive.students.length}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="rounded-md bg-muted p-3 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {selectedArchive.students.reduce((s, st) => s + st.grades.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Grade Records</p>
                </div>
                <div className="rounded-md bg-muted p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedArchive.archivedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Archived</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-3 font-medium text-muted-foreground">ID</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Name</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Class</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Section</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Subjects</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Average</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArchive.students.map((s) => {
                      const avg = calcStudentAverage(s.grades, components);
                      const letter = getLetterGrade(avg, bands);
                      return (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{s.studentId}</td>
                          <td className="py-2 px-3 font-medium text-foreground">{s.name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{s.classLevel}</td>
                          <td className="py-2 px-3 text-muted-foreground">{s.section}</td>
                          <td className="py-2 px-3 text-muted-foreground">{s.grades.length}</td>
                          <td className="py-2 px-3 font-bold text-foreground">{avg.toFixed(1)}%</td>
                          <td className="py-2 px-3 font-bold text-foreground">{letter}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Log
            </DialogTitle>
          </DialogHeader>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No audit entries yet.</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border border-border/50">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {entry.action}
                      </span>
                      {entry.yearName && (
                        <span className="text-xs text-muted-foreground">{entry.yearName}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-1">{entry.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
