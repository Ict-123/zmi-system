import { useParams, Link } from "react-router-dom";
import { calcRowPercentage, calcRowTotal, calcMaxTotal, calcStudentAverage, getLetterGrade, GradeComponent, SubjectGrade } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { exportStudentPDF } from "@/lib/pdfExport";
import zuannahLogo from "@/assets/zuannah_logo.jpeg";
import { useStoreData } from "@/hooks/useStoreData";

export default function GradeSheet() {
  const { id } = useParams<{ id: string }>();
  const { students, components, bands, loading } = useStoreData();
  const student = students.find((s) => s.id === id);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!student) {
    return <div className="p-8 text-center text-muted-foreground">Student not found.</div>;
  }

  const overallAvg = calcStudentAverage(student.grades, components);
  const letterGrade = getLetterGrade(overallAvg, bands);
  const maxTotal = calcMaxTotal(components);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <Link to="/students"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h2 className="text-2xl font-display font-bold">Student Report Card</h2>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportStudentPDF(student, components, bands)}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grade-sheet-print bg-white border-[3px] border-[hsl(var(--brown))] rounded-lg max-w-[700px] mx-auto shadow-lg">
        <div className="border-[2px] border-[hsl(var(--primary))] m-2 p-6">
          <div className="flex items-center gap-4 mb-2">
            <img src={zuannahLogo} alt="ZMI Logo" className="w-20 h-20 rounded-full object-contain" />
            <div>
              <h1 className="text-2xl font-display font-bold text-[hsl(var(--brown))]">Zuannah Memorial Institute</h1>
              <p className="text-sm text-muted-foreground">Monrovia, Liberia</p>
            </div>
          </div>
          <div className="border-b-2 border-[hsl(var(--primary))] mb-4" />

          <h2 className="text-center text-xl font-display font-bold text-[hsl(var(--brown))] underline mb-4">STUDENT REPORT CARD</h2>

          <div className="space-y-2 mb-4 text-sm">
            <InfoLine label="Name" value={student.name} />
            <div className="grid grid-cols-2 gap-4">
              <InfoLine label="Student ID" value={student.studentId} />
              <InfoLine label="Grade/Class" value={student.classLevel || "—"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoLine label="Academic Year" value={student.semester} />
              <InfoLine label="Section" value={student.section} />
            </div>
          </div>

          <h3 className="text-center font-display font-bold text-[hsl(var(--brown))] mb-2 text-base">SUBJECTS</h3>

          <table className="w-full text-sm border-collapse border border-[hsl(var(--brown))] mb-4">
            <thead>
              <tr className="bg-[hsl(var(--primary))] text-primary-foreground text-xs">
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-left w-[30%]">SUBJECTS</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-center">MIDTERM</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-center">FINAL EXAM</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-center">TOTAL</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-center">AVERAGE</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-2 text-center">GRADE</th>
              </tr>
            </thead>
            <tbody>
              {student.grades.map((g) => {
                const total = calcRowTotal(g, components);
                const avg = calcRowPercentage(g, components);
                const grade = getLetterGrade(avg, bands);
                return (
                  <tr key={g.id}>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 font-medium">{g.subject}</td>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 text-center">
                      {getMidtermScore(g, components)}
                    </td>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 text-center">
                      {getFinalExamScore(g, components)}
                    </td>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 text-center font-semibold">{total}</td>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 text-center">{avg.toFixed(1)}%</td>
                    <td className="border border-[hsl(var(--brown))] px-2 py-2 text-center font-bold">{grade}</td>
                  </tr>
                );
              })}
              {Array.from({ length: Math.max(0, 8 - student.grades.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                  <td className="border border-[hsl(var(--brown))] px-2 py-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-xs font-semibold text-[hsl(var(--brown))] mb-4">
            GRADE SCALE: {bands.map((b, i) => (
              <span key={b.letter}>
                {b.letter} = {b.min} – {b.max}%{i < bands.length - 1 ? ",  " : ""}
              </span>
            ))}
          </div>

          <div className="border-t border-[hsl(var(--brown))] pt-3 space-y-4 text-sm">
            <div className="flex items-center gap-6 justify-center bg-[hsl(var(--gold-light))] rounded p-3">
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Overall Average</span>
                <span className="text-2xl font-display font-bold text-[hsl(var(--primary))]">{overallAvg.toFixed(1)}%</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Final Grade</span>
                <span className="text-2xl font-display font-bold text-[hsl(var(--primary))]">{letterGrade}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Max Points</span>
                <span className="text-lg font-semibold">{maxTotal}</span>
              </div>
            </div>

            <div className="space-y-3">
              <RemarkLine label="CLASS TEACHER'S REMARKS" />
              <RemarkLine label="PRINCIPAL'S REMARKS" />
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <SignatureLine label="Class Teacher" />
              <SignatureLine label="Principal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMidtermScore(g: SubjectGrade, components: GradeComponent[]): number {
  const mid = Math.ceil(components.length / 2);
  return components.slice(0, mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
}

function getFinalExamScore(g: SubjectGrade, components: GradeComponent[]): number {
  const mid = Math.ceil(components.length / 2);
  return components.slice(mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-muted-foreground font-medium whitespace-nowrap">{label}:</span>
      <span className="font-semibold border-b border-[hsl(var(--brown))] flex-1 pb-0.5">{value}</span>
    </div>
  );
}

function RemarkLine({ label }: { label: string }) {
  return (
    <div>
      <span className="font-bold text-xs text-[hsl(var(--brown))]">{label}:</span>
      <div className="border-b border-[hsl(var(--brown))] mt-1 h-5" />
      <div className="border-b border-[hsl(var(--brown))] mt-1 h-5" />
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="border-b border-[hsl(var(--brown))] mt-4 w-full" />
    </div>
  );
}
