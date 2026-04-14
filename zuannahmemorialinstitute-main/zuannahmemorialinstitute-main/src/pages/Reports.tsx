import { useState, useMemo } from "react";
import { calcStudentAverage, calcRowPercentage, getLetterGrade, CLASS_LEVELS, GradeBand } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Eye, Download } from "lucide-react";
import { exportClassReportPDF } from "@/lib/pdfExport";
import { useStoreData } from "@/hooks/useStoreData";

export default function Reports() {
  const { students, components, bands, loading } = useStoreData();
  const [tab, setTab] = useState<"class" | "subject" | "byGrade">("class");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const ranked = useMemo(
    () =>
      students
        .map((s) => ({ ...s, avg: calcStudentAverage(s.grades, components) }))
        .sort((a, b) => b.avg - a.avg),
    [students, components]
  );

  const filteredByLevel = useMemo(
    () => (selectedLevel === "all" ? ranked : ranked.filter((s) => s.classLevel === selectedLevel)),
    [ranked, selectedLevel]
  );

  const availableLevels = useMemo(
    () => CLASS_LEVELS.filter((level) => students.some((s) => s.classLevel === level)),
    [students]
  );

  const subjectMap: Record<string, { total: number; count: number }> = {};
  students.forEach((s) =>
    s.grades.forEach((g) => {
      if (!subjectMap[g.subject]) subjectMap[g.subject] = { total: 0, count: 0 };
      subjectMap[g.subject].total += calcRowPercentage(g, components);
      subjectMap[g.subject].count += 1;
    })
  );
  const subjectReport = Object.entries(subjectMap)
    .map(([name, d]) => ({ name, avg: d.total / d.count }))
    .sort((a, b) => b.avg - a.avg);

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
        <h2 className="text-2xl font-display font-bold">Reports</h2>
        <Button onClick={() => exportClassReportPDF(students, components, bands)} className="gap-2">
          <Download className="w-4 h-4" /> Export Class Report PDF
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "class" ? "default" : "outline"} size="sm" onClick={() => setTab("class")}>All Students</Button>
        <Button variant={tab === "byGrade" ? "default" : "outline"} size="sm" onClick={() => setTab("byGrade")}>By Grade Level</Button>
        <Button variant={tab === "subject" ? "default" : "outline"} size="sm" onClick={() => setTab("subject")}>Subject Report</Button>
      </div>

      {tab === "class" && <RankedTable students={ranked} bands={bands} />}

      {tab === "byGrade" && (
        <div className="space-y-4">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Grade Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grade Levels</SelectItem>
              {availableLevels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLevel !== "all" && (
            <div className="flex items-center gap-4 bg-gold-light rounded-lg px-4 py-3 text-sm">
              <span className="font-semibold">{selectedLevel}</span>
              <span>Students: {filteredByLevel.length}</span>
              <span>Avg: {filteredByLevel.length ? (filteredByLevel.reduce((s, r) => s + r.avg, 0) / filteredByLevel.length).toFixed(1) : 0}%</span>
              <span>Passing (≥85%): {filteredByLevel.filter((s) => s.avg >= 85).length}</span>
            </div>
          )}
          <RankedTable students={filteredByLevel} bands={bands} showClass={selectedLevel === "all"} />
        </div>
      )}

      {tab === "subject" && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="gold-header text-left">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Class Average (%)</th>
                <th className="px-4 py-3 text-center">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjectReport.map((s) => (
                <tr key={s.name} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-center font-bold">{s.avg.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center">{subjectMap[s.name].count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankedTable({
  students,
  bands,
  showClass = true,
}: {
  students: Array<{ id: string; studentId: string; name: string; classLevel?: string; section: string; avg: number }>;
  bands: GradeBand[];
  showClass?: boolean;
}) {
  if (students.length === 0) {
    return <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border">No students found for this grade level.</div>;
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="gold-header text-left">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Student ID</th>
            <th className="px-4 py-3">Name</th>
            {showClass && <th className="px-4 py-3">Class</th>}
            <th className="px-4 py-3">Section</th>
            <th className="px-4 py-3 text-center">Average (%)</th>
            <th className="px-4 py-3 text-center">Grade</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((s, i) => (
            <tr key={s.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-bold text-gold">#{i + 1}</td>
              <td className="px-4 py-3 font-mono">{s.studentId}</td>
              <td className="px-4 py-3 font-medium">{s.name}</td>
              {showClass && <td className="px-4 py-3">{s.classLevel || "—"}</td>}
              <td className="px-4 py-3">{s.section}</td>
              <td className="px-4 py-3 text-center font-bold">{s.avg.toFixed(1)}%</td>
              <td className="px-4 py-3 text-center font-bold text-gold">{getLetterGrade(s.avg, bands)}</td>
              <td className="px-4 py-3">
                <Link to={`/grade-sheet/${s.id}`}>
                  <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
